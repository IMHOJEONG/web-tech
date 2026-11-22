# Feed 요청 취소 신호 전달 검증

## 대상과 조건

2026-11-22 KST, `f05f7f5f`와 기존 작업 트리를 기준으로 Feed의 React Query 취소 신호를 실제 fetch까지 연결했다. 시작 시 client.ts에 있던 `AbortSignal.timeout(8_000)` 미커밋 변경을 보존하고 그 위에 적용했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

`queryFn → searchFeed → getJson`에 선택적 signal을 전달한다. getJson은 호출자 신호와 8초 제한을 `AbortSignal.any()`로 결합한다. 먼저 발생한 호출자 취소의 이유는 그대로 전달하고, timeout·HTTP·파싱의 기존 ApiError 분류는 유지한다. 네트워크 오류의 cause를 보존해 원래 이유도 확인할 수 있게 했다. 다른 화면의 queryFn에는 취소 입력을 추가하지 않았다.

Modern Web Guidance의 js·deprioritize-background-fetches와 공식 TanStack Query 취소 설명을 확인했다. 화면에 필요한 검색 요청의 우선순위는 낮추지 않았다. AbortSignal.any는 확인한 MDN 기준 2024-03부터 Baseline Widely available이며 기본 지원 정책에 따라 별도 polyfill을 추가하지 않았다.

## 재현 방법

1. 제품 타입·변경 파일 린트·기존 테스트를 실행한다.

   ```sh
   pnpm --filter vuln-radar typecheck
   pnpm --filter vuln-radar exec eslint src/shared/api/client.ts src/shared/api/radar.ts src/pages/feed/ui/feed-page.tsx --max-warnings 0
   pnpm --filter vuln-radar test:lib
   ```

2. 실제 getJson과 Zod를 번들하는 재현 스크립트를 실행한다. Playwright 브라우저가 설치되어 있어야 한다. 선택적 출력 인자를 생략하면 요약만 출력한다.

   ```sh
   node scripts/verify-vuln-radar-request-cancellation.mjs /tmp/feed-cancellation-api.json
   ```

   루프백 합성 HTTP 서버에서 세 엔진 각각 정상 요청·사전 취소·헤더/본문 대기 중 취소·사용자 정의 이유·8초 헤더/본문 timeout·503·스키마·JSON·연결 실패를 확인한다. 헤더와 본문 timeout은 각각 독립 context에서 병렬 실행하며 제품 상수를 단축하지 않는다.

3. 실제 앱의 프로덕션 빌드를 실행한다.

   ```sh
   pnpm --filter vuln-radar exec vp build --outDir /tmp/web-tech-feed-cancellation/dist
   ```

4. 변경 전 세 소스의 bytes를 저장소 밖에 보존하고 Vite의 임시 load hook으로 기준 빌드에만 주입한다. 작업 트리 파일은 되돌리지 않는다. 기준/수정 모두 앱 디렉터리·같은 설정·같은 공개 환경값으로 빌드한다. 두 CSS의 SHA-256 일치를 확인한다.
5. 두 실제 빌드를 루프백 정적 서버로 제공하고 API만 합성 26건·2페이지로 처리한다. Chromium·Firefox·WebKit × 390·1280px × 기준/수정의 12조건에서 다음을 비교한다.
   - 응답을 보류한 검색의 교체와 늦은 응답의 현재 결과 덮어쓰기 방지.
   - 보류 중 개요 링크의 키보드 이동·뒤로 가기와 미완료 요청의 재방문.
   - 완료된 캐시의 30초 이내 재방문과 503의 기존 1회 재시도.
   - 검색 갱신 안내, 보류 중 우선순위 변경과 페이지 1 정규화.

브라우저 전송 중단은 클라이언트 오류만으로 판정하지 않고 서버 응답의 close 이벤트와 writableEnded 상태를 함께 관측했다. 서버에서 이미 시작한 작업의 중단·롤백을 확인한 결과는 아니다.

## 결과와 증거

### API 취소와 오류 계약

세 엔진 각각 12조건, 총 36조건이 통과했다. 기존 두 인자 getJson 호출과 선택적 신호를 넣은 정상 요청 모두 성공했다. 사전 취소는 서버 요청 0건이었다. 헤더·본문 대기 중 호출자 취소는 원래 이유와 동일한 객체로 거부됐으며 ApiError로 바뀌지 않았다. 사용자 정의 Error 이유도 보존됐다.

실제 8초 제한에서 헤더/본문 모두 TimeoutError 신호와 ApiError network 분류를 확인했다. 외부 신호는 취소되지 않았고 원래 fetch·본문 오류는 cause로 보존됐다. 503은 http·status 503, 스키마는 parse, JSON·연결 실패는 기존 network 분류를 유지했다. 미완료 연결이 실제로 일찍 닫혔다.

### Feed 화면과 캐시

| 관측                            | 기준                            | 수정                            |
| ------------------------------- | ------------------------------- | ------------------------------- |
| 검색 교체 시 이전 보류 요청     | 계속 대기                       | 연결 중단                       |
| 개요로 키보드 이동 시 보류 요청 | 계속 대기                       | 연결 중단                       |
| 보류 중 우선순위 변경           | 이전 요청 대기                  | 이전 요청 중단                  |
| 미완료 요청 이탈·재방문         | 이탈 중 완료하면 캐시 사용, 1회 | 취소 후 재방문에서 새 요청, 2회 |
| 완료된 신선한 캐시의 왕복       | 1회                             | 1회                             |
| 첫 503 후 성공                  | 총 2회                          | 총 2회                          |

12조건에서 갱신 안내·키보드 왕복·검색값 복귀·현재 결과 유지·필터와 페이지 정규화가 통과했고 pageerror는 0개였다. 취소한 이전 검색은 재시도하지 않았다. 완료한 결과 캐시는 유지하며, 이탈 시 미완료 응답을 나중에 캐시로 채우던 동작은 취소 후 재요청으로 바뀐다. 이 비용을 의도한 동작 차이로 기록한다.

타입·린트·기존 단위 테스트 36개와 실제 앱 빌드가 통과했다. API 36조건과 단위 36개는 서로 다른 검증이다. [소스 해시·엔진 버전·정제 결과](../artifacts/2026-11-22-feed-request-cancellation.json)

초기 UI harness는 갱신 중에도 이전 카드가 보인다고 가정해 실패했다. 실제 앱은 갱신 시 카드와 요약을 숨기므로 기존 안내 표시를 검증하도록 정정했다. 초기 임시 빌드의 실행 디렉터리 차이로 Tailwind 범위가 달라진 것도 확인해 두 빌드의 앱 cwd와 CSS 해시를 맞춘 뒤 최종 비교했다. 이 준비 실패를 제품 결함으로 집계하지 않는다.

## 한계와 후속 작업

현재 코드·검증 기록은 로컬 미커밋이며 운영 배포·실서비스 API/DB·실기기·실제 Safari 앱의 검증은 수행하지 않았다. 사용자 요청으로 VoiceOver를 생략했고 발화·로터는 미검증이다. 네트워크 중단이 서버 작업 취소를 보장하지 않으며 동기 JSON 파싱·Zod 검증을 선점하지 않는다.

완료된 fetch의 timeout 신호는 나중에도 중단될 수 있다. 응답 성공 뒤 이미 끝난 요청을 다시 취소한 것으로 집계하지 않는다. AbortSignal.any가 나머지 입력 신호의 타이머를 해제하지 않는 점은 기존 timeout 정책과 함께 유지한다. 다른 화면의 취소 신호 연결과 운영 성능 개선량은 별도 범위다.

이번 변경은 기존 Query 생명주기에 선택적 취소 입력을 연결하는 내부 구현이며 공개 HTTP·검색 URL·캐시 시간 설정은 바뀌지 않았다. 새 ADR은 추가하지 않았다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-22-feed-request-cancellation.md)
- [시간 제한과 취소 원리](../../knowledge/infra-tooling/javascript-abort-timeout.md)
- [이전 화면 분리 실험](../performance/2026-11-22-vuln-radar-route-splitting.md)
- [TanStack Query 취소와 캐시 복원](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
- [MDN AbortSignal.any](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static)
