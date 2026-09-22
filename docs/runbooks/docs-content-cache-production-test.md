# 로컬 프로덕션 캐시 통합 테스트

검증 원리와 후속 실험은 [독립 실험 노트](../knowledge/content-platform/next-data-cache-integration-lab.md)를 참고한다.

## 목적과 준비 조건

모의 콘텐츠 서버로 로컬 production 캐시와 인증 경계를 검증한다. Node.js 24, 설치한 워크스페이스 의존성과 loopback 포트를 사용할 수 있는 환경이 필요하다. 운영 NAS와 인증값은 사용하지 않는다.

## 실행 순서

Node.js 24와 설치된 워크스페이스 의존성이 필요하다. 저장소 루트에서 실행한다.

```bash
pnpm --filter @web-tech/docs-content-contract build
pnpm --filter @web-tech/ui build
pnpm --filter docs test:cache:prod
```

테스트는 앱을 OS 임시 폴더에 복사해 `next build --webpack`과
`next start --hostname 127.0.0.1 --port <임시 포트>`를 실행한다.
실제 `.env`와 기존 `.next`를 복사하지 않고 콘텐츠 URL을 로컬 가짜 서버로 지정한다.
인증값은 매 실행마다 임시로 생성하며 실제 NAS 또는 운영 웹훅을 호출하지 않는다.
node_modules와 공용 packages는 기존 설치를 참조하므로 실행 중 의존성/공용 빌드를 변경하지 않는다.

## 기대 결과

1. 최초 동적 조회에서 목록과 본문의 원본 HTTP 요청이 발생한다.
2. 반복 조회에서는 원본 요청 수가 증가하지 않는다.
3. 원본을 V2로 변경해도 캐시 만료 전에는 V1이 반환된다.
4. 토큰 누락/불일치는 401이며 캐시를 만료시키지 않는다.
5. 정상 웹훅은 200을 반환하고 원본을 선제 조회하지 않는다.
6. 다음 조회에서 목록과 본문이 모두 V2가 된다.
7. 이후 요청에서는 V2 캐시를 재사용한다.
8. 정책 비교가 끝난 뒤 실제 `/docs/feed/cache-probe` 페이지가 V3 본문을 렌더링한다.
9. 원본 응답을 보류하면 `expire: 0`의 조회가 대기하고, 해제 후 V2를 반환한다.
10. 테스트 전용 POST에서 `max`로 만료하고 원본 응답을 보류해도 기존 V2가 반환된다.
11. 원본 보류 해제 후 목록/본문이 V3로 갱신되고 이후 warm 조회에서는 원본 요청이 늘지 않는다.

`max` POST는 임시 앱의 `/api/cache-probe`에만 존재한다. 운영 웹훅의
`expire: 0` 정책은 변경하지 않는다. 첫 stale 응답은 1500ms 내에 도착해야 하며,
이 제한은 원본 응답을 기다리는지 판별하기 위한 테스트 제한이지 운영 SLA가 아니다.
V3 확인은 최대 100회, 회당 50ms 간격으로 조회하므로 관측용 요청도 발생한다.
측정 시간은 인위적인 원본 보류를 포함하며 두 정책의 일반적인 성능 차이로 해석하지 않는다.

실행 결과는 [정책 비교 기록](../worklog/2026-09/2026-09-13-docs-cache-policy-comparison-test.md)을 참고한다.

테스트 전용 `/api/cache-probe`는 임시 앱에만 생성된다. `connection()`으로
페이지 결과 캐시를 피하면서 실제 `content-api.ts` 함수를 호출한다.
원본 서버의 목록/본문별 카운터와 응답 내용을 함께 비교하므로
`revalidated: true`만 보고 성공 처리하지 않는다.

## 실패 대응과 복구

성공 시 `[PASS]`와 `All checks passed`, 종료 코드 0을 출력한다.
실패 시 최근 빌드/서버 로그와 assertion을 출력하고 종료 코드 1을 반환한다.
Warm read 실패는 요청 옵션 전달 또는 캐시 정책을 먼저 조사한다.
Refresh 실패는 태그 연결과 실제 webhook 배포 코드를 확인한다.

임시 앱과 테스트가 시작한 프로세스는 종료 시 정리한다.
이 검증은 빌드 시간이 필요하며 기존 dev 서버의 빌드 디렉터리를 사용하지 않는다.
TTL은 테스트 도중 자연 만료가 결과를 바꾸지 않도록 3600초로 설정한다.
300초 시간 만료 자체, NAS 장애, Vercel 배포 및 브라우저 Router Cache는 별도 검증 대상이다.

목록·검색·상세의 실제 DOM 갱신은 [브라우저 게시 갱신 테스트](docs-article-rendering-regression.md#게시-후-화면-갱신)로
보완한다. `revalidated: true` 응답뿐 아니라 제목·요약·본문과 검색 결과가 함께
바뀌는지 검사하며 `pnpm --filter docs test:article:prod`에 포함된다.

## 관련 검증

locale 캐시 키 분리는 [독립 재현 가이드](./docs-locale-cache-key-test.md)를 따른다.
`--locale-cache-key`로 기존 언어 경계 검사와 함수 캐시 분리 검사를 함께 실행할 수 있다.

### Cache Components 격리 실험

기본 명령은 기존 모델을 유지한다. 아래 옵션은 임시 앱에만 적용된다.

```bash
# 전체 앱의 전환 호환성 검사 (현재 locale 경계에서 빌드 실패)
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs --cache-components --debug-prerender

# 최소 화면 + 기존 fetch 캐시 + 함수 캐시 (현재 갱신 검증 실패)
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs --cache-components-minimal

# 최소 화면 + 함수 캐시 단독 (검증 통과)
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs --function-cache-only

# 전체 앱 + 임시 instant=false + 함수 캐시 단독 + 언어 교차 검증 (통과)
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs --locale-boundary --debug-prerender
```

실패 모드는 오류를 숨기지 않고 종료 코드 1을 반환한다. CI의 필수 성공 검사로
등록한 것이 아니며, 현재 전환 장애를 재현하기 위한 실험 명령이다.
최소 모드는 실제 앱 UI 검증을 대체하지 않는다.
[전체 결과와 제한](../worklog/2026-09/2026-09-13-docs-cache-components-experiment.md)을 먼저 읽는다.

`--locale-boundary`는 전체 앱의 정적 셸 검증을 임시로 완화한다.
[언어별 응답 검증 결과와 한계](../worklog/2026-09/2026-09-14-docs-cache-locale-boundary-test.md)를 참고한다.
해당 모드의 통과를 정적 셸 최적화나 브라우저 언어 전환 검증 완료로 해석하지 않는다.

[개선 우선순위](../architecture/docs-content-cache-improvement-backlog.md)의
완료 기준을 따라 본문 실패 처리와 요청 제한을 진행한다.
