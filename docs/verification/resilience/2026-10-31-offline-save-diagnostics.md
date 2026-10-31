# 오프라인 저장 운영 대조와 실패 단계 검증

## 대상과 조건

- 검증일: 2026-10-31 KST. 기준 main `92e424dcff16bc159421b2bcf0fae4b2c295175b`, 수정 브랜치 `codex/docs-offline-save-diagnostics-20261031`의 미커밋 작업 트리.
- [KAN-57](https://web-tech-service.atlassian.net/browse/KAN-57): 운영 Brotli 글 저장 실패 신고. 사용 환경은 Chrome 일반 창이다.
- 운영 대상: `https://heap-forge.app/ko/docs/category/be/node-js/node-brotli-runtime-security`. Event Loop 공개 글도 대조했다.
- 운영 검사는 사용자의 기존 프로필을 열지 않는 Chrome/Chromium 격리 환경, 390px·1440px에서 수행했다. 최종 원인 대조는 임시 디렉터리의 새 Chrome persistent profile을 일반 모드로 실행했다. 기존 저장본·사이트 권한·Worker를 일괄 삭제하거나 운영 서버에 장애를 주입하지 않았다.
- 로컬: Node 24.22.1·pnpm 12.14.0·Next 16.4.3, loopback production 서버, 원격 콘텐츠 조회 비활성. 변경한 Worker와 브라우저 소스는 아직 운영 미배포다.

## 재현 방법

저장소 루트에서 의존성을 설치하고 공용 UI를 먼저 빌드한다. 새 worktree에서 UI dist가 없는 첫 라이브러리 검사는 모듈 누락으로 실패했다. 공용 UI build 후 재검사했으며 검사 제외나 타입 완화로 해결하지 않았다.

```sh
pnpm install --frozen-lockfile
pnpm --filter @web-tech/ui build
pnpm --filter docs test:lib
pnpm --filter docs lint
pnpm --filter docs typecheck

BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false BLOG_CONTENT_API_BASE_URL= \
  BLOG_CONTENT_API_BASE_URL_PUBLIC= BLOG_CONTENT_API_BASE_URL_INTERNAL= \
  pnpm --filter docs build
NODE_ENV=production pnpm --filter docs test:offline --reporter=list
```

- 집중 단위 검사: `node --experimental-strip-types --test apps/docs/lib/offline-client.test.ts apps/docs/lib/offline-worker.test.ts apps/docs/lib/push-service-worker.test.ts`.
- 운영의 직접 진입과 Feed 카드 진입을 구분했다. `/ko/feed`에서 실제 카드 Link로 Brotli 글에 이동하고 본문 로딩 완료를 기다린 뒤 저장했다. `performance.timeOrigin` 불변으로 같은 document 이동임을 확인하고 Worker의 client pathname·안전한 오류 코드만 읽었다. 실패 후 **같은 탭을 새로고침하고 다시 저장**하는 대조를 수행했다. 저장소·권한·Worker 삭제나 서버 소스 교체는 하지 않았다.
- `offline-reading.spec.ts`는 신고 글의 직접/카드 진입 저장·완전 오프라인 읽기, 현재 글 listener 없는 Feed의 위조 요청 거부, 합성 대기 Worker, 등록 거부, 용량/접근 거부, 응답 없음, 쓰기 후 확인 실패를 검사한다. 장애 주입은 격리된 로컬 브라우저/Worker에만 한다.

## 결과와 증거

| 구분                      | 실제 결과                                                                                                                                       | 판단                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 운영 Brotli 직접 진입     | Chrome/Chromium 두 폭에서 저장 성공                                                                                                             | 이것만으로 실제 사용자 동선을 검증하지 못했던 초기 대조.                |
| 운영 Feed→Brotli 진입     | Chrome 일반 모드 새 persistent profile의 두 폭 모두 `source` 거절. 주소창은 상세, Worker client pathname은 `/ko/feed`, 글 cache는 생성되지 않음 | 실제 신고 문구와 같은 운영 실패를 재현. 출처 주소 검증에서 거절됨.      |
| 같은 탭 새로고침 대조     | 두 폭 모두 새로고침 뒤 저장 성공·글 cache 생성                                                                                                  | 권한·저장소를 지우거나 바꾸지 않고 최초 문서 주소만 달라졌을 때 성공.   |
| 운영 Event Loop 직접 진입 | 새 Chromium 두 폭에서 저장 성공                                                                                                                 | 특정 글 자체만의 장애라고 단정하지 않는 대조.                           |
| 기존 Worker 선택 순서     | active가 있어도 waiting을 먼저 선택. 대기 업데이트가 redundant가 되면 정상 active까지 거부                                                      | 별도 잠재 결함을 active 우선으로 수정. 신고의 SPA 주소 결함과 구분.     |
| 최종 라이브러리           | 346개 통과                                                                                                                                      | 집중 오프라인·푸시 단위 19개는 포함 관계이므로 합산하지 않음.           |
| 최종 production 오프라인  | 62개 통과, skip·실패 0                                                                                                                          | desktop/mobile 각 31개. 실제 카드 이동·위조 Feed 요청 거부와 진단 포함. |
| 빌드·타입·lint            | 성공, static page 33개 생성                                                                                                                     | 기존 published 글 2개의 스타일 경고 유지. 글 본문은 수정하지 않음.      |

원인은 Worker의 `Client.url`을 현재 주소로 간주한 점이다. 이 속성은 SPA 내 이동에서 갱신되지 않을 수 있다. [MDN 설명](https://developer.mozilla.org/en-US/docs/Web/API/Client/url) 및 [명세의 creation URL](https://w3c.github.io/ServiceWorker/v1/#client-url)과 실제 대조가 일치한다. 초기의 ‘새 프로필이면 성공’ 관측은 직접 URL 진입 조건에만 해당했다. 이후 카드 진입 대조로 원인을 좁혔으며 기존 관측을 실패 재현으로 바꾸어 적지 않는다.

수정은 출처 검증을 삭제하지 않고 browser 발신 client에 전용 port로 현재 공개 글을 확인한다. listener 없는 실제 Feed의 위조 저장 요청도 거절한다. 결정과 신뢰 경계는 [ADR-0026](../../architecture/adr-0026-offline-spa-article-context.md)에 둔다. 최초 진단 묶음 344개/58개 통과 후 SPA·listener 회귀를 추가해 최종 346개/62개로 재검사했으며 합산하지 않는다.

기준 main과 수정 함수에 같은 active+waiting 조건을 넣은 별도 로컬 대조는 각각 `rejected-usable-active-registration`과 `active-registration-returned`를 관측했다. 과거 소스 실행용 임시 harness·운영 캡처·원시 응답은 공개하지 않는다. 현재 코드의 재현 가능한 회귀는 `offline-client.test.ts`의 active Worker 테스트다.

첫 저장소 오류 회귀는 ‘실패 응답이면 저장본은 항상 그대로’라는 잘못된 가정 때문에 실패했다. 실제로 쓰기는 끝났어도 뒤따르는 목록 조회가 실패할 수 있었다. 이를 `storage-confirmation`으로 분리하고 저장 결과 불확실 안내 및 실제 저장본 갱신 여부를 검사했다. 공간 부족/쓰기 거부로 쓰기 전 실패하는 경우에는 이전 저장본 불변 검사를 유지했다.

## 한계와 후속 작업

- 운영 Chrome에서 실제 카드 이동의 `source` 거절은 재현했지만, 사용자 기존 프로필 내부의 다른 권한·확장 상태까지 조사한 것은 아니다. 수정 후 같은 사용자 탭의 운영 검증은 배포 이후에 수행한다.
- 공개·커밋·푸시·PR·운영 배포는 아직 하지 않았다. 배포 후 같은 기존 프로필에서 **오류 자세히**의 코드·단계를 확인하는 절차가 필요하다.
- 원시 예외·본문·URL query·토큰·프로필을 수집하지 않고 UI에 allowlist 코드·단계만 노출한다. 브라우저 내부 실패를 Vercel Runtime Logs에서 직접 볼 수 있는 서버 수집 API는 추가하지 않았다.
- 알림 권한 요청·Worker URL/scope 변경·자동 저장 재시도·캐시 일괄 삭제는 하지 않았다. 기존 공개 경로/발신 client 검증과 저장본 보존을 유지했다.
- 실기기·Safari·실제 확장 프로그램 조합과 사용자 기존 데이터 상태는 미검증이다. 별도 원본 artifact 링크는 없으며 원시 자료는 비공개 로컬에만 보관한다.

## 관련 문서

- [저장·보안 경계 ADR-0015](../../architecture/adr-0015-explicit-offline-article-snapshots.md)
- [SPA 현재 문서 확인 ADR-0026](../../architecture/adr-0026-offline-spa-article-context.md)
- [오프라인 운영 절차와 코드별 조치](../../runbooks/docs-offline-reading.md)
- [작업 기록](../../worklog/2026-10/2026-10-31-offline-save-diagnostics.md)
