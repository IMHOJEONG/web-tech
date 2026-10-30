# 스켈레톤 검사와 hydration의 DOM 소유권 충돌

## 대상과 조건

- 2026-10-27 KST, PR #66 head `5e230da7ac6f6493fe0a5c0684ab61dd2ebc14d7` 기반으로 검증 당시 로컬 미커밋 수정을 검사했다.
- Node.js 24.12.0·pnpm 12.14.0·Next.js 16.4.3·Playwright 1.62.1 Chromium, 원격 콘텐츠 인덱스를 끈 loopback 개발 서버.
- 모바일 390×844 ko·태블릿 768×1024 en·데스크톱 1280×800 ko와 두 테마. 복합 검색 조건은 기존처럼 320px다.
- [KAN-39](https://web-tech-service.atlassian.net/browse/KAN-39), [PR #66](https://github.com/IMHOJEONG/web-tech/pull/66)의 재시도 7건을 조사했다. 이전 CI 성공과 flaky 기록은 보존한다.

## 재현 방법

저장소 루트에서 실행한다. `CI=1`로 서버 재사용을 금지하고 `--retries=0`을 명시한다. 3047 포트가 비어 있어야 한다.

```sh
CI=1 DOCS_E2E_PORT=3047 mise exec -- pnpm --filter docs exec playwright test page-skeletons.spec.ts --grep 'light /(feed|web|mobile|ui-ux):|dark /feed:' --retries=0 --repeat-each=3 --workers=3 --reporter=json > /tmp/skeleton-before.json
CI=1 DOCS_E2E_PORT=3047 mise exec -- pnpm --filter docs exec playwright test frozen-skeleton.spec.ts page-skeletons.spec.ts --retries=0 --repeat-each=3 --workers=3 --reporter=json > /tmp/skeleton-after.json
mise exec -- pnpm --filter docs exec tsc --noEmit
mise exec -- pnpm --filter docs exec tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --skipLibCheck --types node --erasableSyntaxOnly scripts/diagnose-skeleton-hydration.mts
mise exec -- pnpm test:repo
mise exec -- pnpm --filter docs exec eslint e2e/helpers/frozen-skeleton.ts e2e/page-skeletons.spec.ts e2e/frozen-skeleton.spec.ts scripts/diagnose-skeleton-hydration.mts --max-warnings 0
```

첫 명령은 수정 전 head의 기준선이다. 브라우저 명령끼리, 또는 dev:e2e가 공용 UI dist를 다시 만드는 동안 타입 검사를 겹치지 않는다.

원인 진단은 별도 로컬 서버가 필요하다. 검사를 마친 뒤 첫 터미널에서 다음 서버를 시작한다.

```sh
env BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false BLOG_CONTENT_API_BASE_URL= BLOG_CONTENT_API_BASE_URL_INTERNAL= BLOG_CONTENT_API_BASE_URL_PUBLIC= DOCS_E2E_PORT=3047 mise exec -- pnpm --filter docs dev:e2e
```

다른 터미널에서 실행한다. **이전 테스트의 잘못된 DOM 변경을 의도적으로 재현**하므로 hydration 오류 관측이 기대 결과다. 운영 코드에 오류를 넣는 기능이 아니다.

```sh
DOCS_E2E_PORT=3047 mise exec -- pnpm --filter docs exec node --experimental-strip-types scripts/diagnose-skeleton-hydration.mts
```

## 결과와 증거

### 원격 최초 실패

[CI 40428722970](https://github.com/IMHOJEONG/web-tech/actions/runs/40428722970)에서 다음을 확인했다. 7건 중 좌표 허용 오차 초과는 없었다.

| 프로젝트 | 화면·테마     | 실패                             |
| -------- | ------------- | -------------------------------- |
| 모바일   | light /feed   | 애니메이션 0 기대, 48 관측       |
| 모바일   | light /mobile | aria-busy 검사 대상이 없어짐     |
| 태블릿   | light /feed   | geometry 대상이 없어져 30초 종료 |
| 태블릿   | dark /feed    | 카드 앵커가 없어져 30초 종료     |
| 데스크톱 | light /web    | 애니메이션 0 기대, 42 관측       |
| 데스크톱 | light /mobile | 상태 안내 1개 기대, 0개 관측     |
| 데스크톱 | light /ui-ux  | geometry 대상이 없어져 30초 종료 |

### 원인과 직접 재현

기존 검사는 서버 골격을 완성 페이지의 `main.replaceWith(...)`로 넣었다. 그러나 문서는 여전히 React가 소유한다. 콘텐츠 표시·테마·폰트 준비가 끝났다는 사실은 모든 hydration이 끝났다는 신호가 아니다. 뒤늦은 hydration이 예상한 트리를 복구하면 테스트가 넣은 노드가 분리되고 locator가 대상을 잃는다.

진단은 외부 JavaScript만 보류한 뒤 서버 콘텐츠가 표시되면 이전처럼 골격을 끼우고 JavaScript를 해제한다. 실제 hydration 후 다음 값을 두 번 동일하게 관측했다.

```json
{
  "before": { "connected": true, "children": 48, "animations": 0 },
  "after": {
    "connected": false,
    "children": 48,
    "animations": 48,
    "computedAnimationNames": [""]
  },
  "hydrationErrorObserved": true
}
```

분리된 노드의 animationName은 빈 문자열이었다. 이전의 `!== 'none'` 비교가 모든 자식을 애니메이션으로 세었으므로 48은 실제 모션 수가 아니었다. 당시 CI의 제거 순간을 프레임별로 관측한 것은 아니지만, 같은 코드의 제거·빈 스타일·48개 오판을 실제 hydration으로 재현했다. 다섯 locator 실패도 같은 DOM 소유권 위험을 공유한다.

### 수정과 검증

- 실제 완성 페이지는 그대로 확인하고 복사본에서만 서버 골격을 조합한다. 스크립트를 제거하고 JavaScript 비활성 BrowserContext에 같은 URL·화면·터치 조건·테마·CSS·폰트로 표시한다.
- 분리된 노드의 측정은 명시적으로 거절한다. 기존 1px/2px 조건·모션 0·넘침·상태 안내·타임아웃·재시도 설정은 유지한다. 고정 sleep이나 CSS 덮어쓰기는 넣지 않았다.
- 원래 페이지 재로드 후 격리 골격 보존, 모션 허용 시 실제 pulse 감지, 12px 이동 감지, 분리된 노드 거절을 신규 회귀로 검사한다. 수치 assertion 전에 geometry 증거도 첨부한다.

| 검사                                 | 결과                                                 |
| ------------------------------------ | ---------------------------------------------------- |
| 수정 전 전용 서버 반복               | 45 통과, 재시도0. 간헐적 문제의 부재를 의미하지 않음 |
| 초기 격리 방식 전체                  | 69 통과, 재시도0                                     |
| 신규 회귀 포함 75개 × 3회            | 225 통과, 실패0·제외0·flaky0·재시도0                 |
| 앱 타입·진단 MTS 타입·변경 파일 lint | 통과                                                 |
| 저장소 회귀                          | 156 통과                                             |

[집계 artifact](../artifacts/2026-10-27-skeleton-hydration-isolation.json)에 조건과 결과를 보관한다. 초기 서버 재사용 실행은 서버 종료로 11통과/34실패였으며 연결 초기화·거절·탐색 실패가 섞였다. 이를 hydration 재현이나 제품 실패 증거로 쓰지 않고 독립 서버로 다시 실행했다. 최초 타입 검사도 UI dist 생성과 겹친 모듈 누락이었으며 생성 완료 후 같은 명령은 통과했다. 제품 코드나 검사 기준을 바꿔 숨기지 않았다.

### 보관한 원본 보고서

집계와 별도로 당시 Playwright JSON reporter가 출력한 전체 보고서를 다음 상대 링크로 보관한다. 테스트를 다시 실행하거나 집계값으로 개별 결과를 만들어 채운 파일이 아니다.

| 실행 단계               | 원본 보고서의 정제본                                                                         | 개별 결과 | 인라인 측정 첨부 |
| ----------------------- | -------------------------------------------------------------------------------------------- | --------- | ---------------- |
| 수정 전 전용 서버 반복  | [baseline JSON](../artifacts/2026-10-27-skeleton-before.playwright.json)                     | 45        | 45               |
| 초기 격리 구현          | [initial isolation JSON](../artifacts/2026-10-27-skeleton-initial-isolation.playwright.json) | 69        | 66               |
| 최종 격리 구현 3회 반복 | [repeated isolation JSON](../artifacts/2026-10-27-skeleton-repeat-isolation.playwright.json) | 225       | 198              |

절대 checkout 경로만 `<workspace>`, Node 실행 파일의 개인 홈 경로만 `<home>`으로 치환했다. 필드·통계·개별 결과·시작 시각·소요 시간·오류·재시도 번호와 base64 측정 첨부는 삭제하거나 바꾸지 않았다. 첨부를 디코딩한 내용까지 비밀정보·인증 헤더·이메일·내부 IP·개인 경로를 검사했다. 원본은 그대로 두고 정제본도 각각 1MiB 미만으로 유지했다.

[출처·무결성 기록](../artifacts/2026-10-27-skeleton-playwright-report-provenance.json)에는 원본 파일명·SHA-256, 정제본 SHA-256·크기, 결과와 첨부 수 및 치환 범위를 기록한다. 원본과 정제본의 모든 개별 결과·첨부가 동일한지 검사했다. 원본 경로 대신 파일명만 기록하며 이 해시는 출처 추적용이지 외부 서명이나 공증은 아니다.

위 세 JSON은 로컬 성공 실행의 원본이다. 원격 최초 실패 7건은 [모바일 job](https://github.com/IMHOJEONG/web-tech/actions/runs/40428722970/job/121940898877), [태블릿 job](https://github.com/IMHOJEONG/web-tech/actions/runs/40428722970/job/121940898821), [데스크톱 job](https://github.com/IMHOJEONG/web-tech/actions/runs/40428722970/job/121940898695)의 당시 로그로 확인한다. 서버 재사용 중단 실행은 별도 원본 JSON을 보관하지 못했으므로 11통과/34실패의 전체 보고서를 사후 생성하지 않았다. 인라인 JSON 첨부 외 스크린샷·trace가 이 세 파일에 포함됐다는 의미도 아니다.

## 한계와 후속 작업

- 위 표는 커밋 전 로컬 검증 당시 기록이다. 이후 수정 커밋 `2c5227e`의 [원격 CI](https://github.com/IMHOJEONG/web-tech/actions/runs/40438309042)에서는 반응형 모바일130·태블릿116·데스크톱124개가 최초 실패·재시도·flaky0으로 통과했다. 로컬 원본을 원격 보고서처럼 표시하지 않는다.
- 정적 골격 표현 검사이지 실제 느린 네트워크의 로딩 노출 시간·hydration 전환·운영 CLS·Safari/Firefox·실기기 검증이 아니다.
- 앱 런타임·CSS·스켈레톤 UI·공통 패키지 빌드 정책은 변경하지 않았다.
- ADR-0003·0005와 로딩 UX 정책의 기존 결정을 유지하는 테스트 수정이므로 새 ADR은 추가하지 않았다.

## 관련 문서

- [로딩 UX 정책](../../architecture/docs-loading-ux-policy.md)
- [기존 골격 검증](2026-10-19-page-skeletons-local.md)
- [작업 기록](../../worklog/2026-10/2026-10-27-skeleton-hydration-isolation.md)
