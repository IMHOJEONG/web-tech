# 콘텐츠와 분리한 docs 코드 점검

## Summary

다른 작업의 콘텐츠 검수와 겹치지 않도록 글 수정, 콘텐츠 검사, 빌드와 서버 실행 없이
docs 앱의 타입·린트·검색 및 라우팅 로직을 점검했다.

## Changed

애플리케이션 코드는 변경하지 않았다. 아래 발견 사항을 후속 수정 대상으로 남긴다.

- 전체 lint는 배포 진단 스크립트 3개에서 경고 46개가 발생해 실패했다.
  `measure-deployed-performance.mjs`, `trace-deployed-rendering.cjs`,
  `verify-deployed-fonts.cjs`의 브라우저/Node 전역 및 CommonJS 환경 선언과
  진단용 환경 변수 허용 범위를 검토해야 한다. lint 기준 자체를 완화할 필요는 없다.
- docs-index의 controls/pagination/summary 테스트 3개 파일은 직접 실행하면 통과하지만
  `test:lib`의 glob과 `tsconfig.node-test.json`의 include에는 없다.
  CI는 `test:lib`를 호출하므로 이 11개 테스트도 정규 실행 범위에 포함할 필요가 있다.

## Notes

2026-09-20 KST, 저장소 루트에서 실행했다.

- `pnpm --filter docs exec tsc --noEmit --incremental false`: 통과.
- `pnpm --filter docs lint`: 경고 46개로 실패(`--max-warnings 0`).
- 아래 선별 테스트: 45개 통과. 실제 네트워크/API·브라우저 검증을 대신하지 않는다.

```sh
pnpm --filter docs exec node --experimental-strip-types --test \
  lib/docs-search-page-state.test.ts lib/search-ranking.test.ts \
  lib/search-api-response.test.ts lib/search-preview.test.ts \
  lib/search-result-contract.test.ts lib/seo.test.ts \
  lib/page-metadata.test.ts lib/get-doc-route.test.ts \
  lib/request-blocklist.test.ts shared/config/locale-path.test.ts \
  widgets/docs-index/model/docs-index-pagination.test.ts \
  widgets/docs-index/model/docs-index-summary.test.ts \
  widgets/docs-index/model/docs-index-controls.test.ts
```

## Open Questions

없음. 아래 후속 작업에서 테스트 범위와 globals 직접 의존성 누락을 보완했다.

## 진단 스크립트 설정 보완

후속 요청으로 `apps/docs/eslint.config.mts`만 수정했다.

- 기존 article-shell과 누락된 fonts/rendering/performance 진단 파일에만 Node·browser 전역을 선언했다.
- 세 CommonJS 파일에만 sourceType과 require 허용을 적용했다. performance의 ESM 형식은 유지했다.
- 파일별로 SHELL_OUTPUT, TRACE_OUTPUT/NO_FONTS, PERF_OUTPUT만 허용했다.
- `pnpm --filter docs lint` 재실행: 경고 0개로 통과. 공통 규칙과 max-warnings 기준은 유지했다.

배포 진단 스크립트 자체를 실행하거나 외부 사이트에 요청하지는 않았다.

## 정규 테스트 편입과 의존성 보완

- `test:lib`와 `tsconfig.node-test.json`에 `widgets/docs-index/model/*.test.ts`를 추가했다.
  필터·정렬 6개, 페이지네이션 3개, 섹션 요약 2개가 정규 검사에 포함된다.
- CI는 이미 `pnpm --filter docs test:lib`를 실행하므로 워크플로는 변경하지 않았다.
- docs devDependencies에 `globals: ^16.5.0`을 선언했다. 공통 ESLint 패키지와 같은
  버전 범위를 사용하며, backend 전용 catalog를 docs에서 참조하지 않는다.
- `pnpm install --offline --ignore-scripts`로 동기화했다. lockfile에는 docs의 globals
  항목 3줄만 추가됐고 다운로드나 설치 스크립트 실행은 없었다.

재검증 결과:

- `pnpm --filter docs test:lib`: Node 테스트 타입 검사 및 142개 테스트 통과.
- `pnpm --filter docs lint`: 경고 없이 통과.
- docs 작업 디렉터리에서 Node로 globals를 직접 import하고 ESLint API의
  `calculateConfigForFile()`을 호출해 설정 로딩 성공을 확인했다. 이전 globals 해석 실패가 해소됐다.

설치는 기존 node_modules와 로컬 store를 활용했으므로 빈 환경에서의 새 설치까지 검증한 것은 아니다.
콘텐츠 원문 및 다른 작업의 검수 문서는 수정하지 않았다.

## Next

모바일 390px 환경에서 기존 가로 넘침·터치 영역 검사 9개가 통과했다.
이어서 필터·정렬 상태 보존, 검색어와 섹션 조건 조합, 기본 제어값을 생략한
페이지 이동을 확인하는 브라우저 회귀 테스트를 추가했다. 로컬 문서가 한 페이지
분량이라 페이지 링크를 직접 누르는 대신, `page=2` 상태에서 필터 변경 시 page가
제거되는 경로를 검증했다. 모바일 Chromium에서 새 테스트 3개가 통과했다.
