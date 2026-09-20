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

`eslint.config.mts`는 globals를 직접 import하지만 docs의 직접 의존성에는 없다.
현재 pnpm ESLint CLI 실행은 통과하지만, Node에서 ESLint API를 직접 import한 보조 검사는
globals 모듈을 찾지 못했다. 직접 의존성 선언 또는 공통 설정 패키지를 통한 제공은 후속 검토한다.

## 진단 스크립트 설정 보완

후속 요청으로 `apps/docs/eslint.config.mts`만 수정했다.

- 기존 article-shell과 누락된 fonts/rendering/performance 진단 파일에만 Node·browser 전역을 선언했다.
- 세 CommonJS 파일에만 sourceType과 require 허용을 적용했다. performance의 ESM 형식은 유지했다.
- 파일별로 SHELL_OUTPUT, TRACE_OUTPUT/NO_FONTS, PERF_OUTPUT만 허용했다.
- `pnpm --filter docs lint` 재실행: 경고 0개로 통과. 공통 규칙과 max-warnings 기준은 유지했다.

배포 진단 스크립트 자체를 실행하거나 외부 사이트에 요청하지는 않았다.

## Next

docs-index 테스트를 CI에 포함하고 globals 의존성 선언을 검토한다.
