# 기존 포맷 경고의 설정·스크립트 선별 정리

## Summary

2026-10-14에 feature/docs HEAD `776f70c`의 작업 트리에서 기존 경고 42개를 다시 분류했다. 미수정 설정·스크립트 10개만 포맷하고 Next.js 자동 생성 파일 1개를 정당한 생성 코드 제외 대상으로 분리해, 경고를 31개로 줄였다. 전체 write·글 수정·증거 데이터 정리는 하지 않았다.

## Changed

포맷만 바꾼 파일:

- `.vscode/settings.json`
- `apps/docs/.prettierrc.yaml`
- `apps/vuln-radar-backend/.prettierrc`
- `commitlint.config.mjs`
- `packages/docs-content-contract/eslint.config.mjs`
- `apps/docs/scripts/fixtures/cache-locale-layout.mjs`
- `apps/docs/scripts/test-utils/assert-locale-boundary.mjs`
- `apps/docs/scripts/validate-content.mjs`
- `scripts/validate-catalog-references.mjs`
- `scripts/validate-catalog-references.test.mjs`

생성 파일의 본문은 변경하지 않았다. `.prettierignore`에 `**/next-env.d.ts`를 추가하고 기존 tooling 회귀 테스트의 생성 파일 목록에 포함했다. 설치된 Next.js의 `dist/docs/01-app/03-api-reference/05-config/02-typescript.md`에서 dev/build/typegen이 이 파일을 갱신하며 수동 수정하지 않도록 안내한 내용을 확인했다. [검사 정책](../../process/documentation-quality-gates.md)에도 반영했다.

## Notes

- JS 7개의 Babel AST에서 위치·raw 표현 등 포맷 관련 메타데이터를 제외한 hash가 전후 동일했다. VS Code JSONC, backend JSON, docs YAML은 파싱한 설정 값을 비교해 동일함을 확인했다. 이는 전체 실행 등가성 증명이 아니며 아래 테스트로 보완했다.
- 선별 작업 전에 기존 미커밋 파일 131개의 hash를 수집했다. 포맷 후 모두 동일했고, 이후 이 기록·정책·목차만 의도적으로 추가 수정했다. 초안·공개 글·다른 세션의 기록·원본 artifact는 포맷하지 않았다.
- `mise exec -- pnpm test:repo`: 37개 통과, 실패·skip 없음.
- `mise exec -- pnpm --filter docs test:content`: 34개 통과. 실제 frontmatter·본문 스타일 검사는 각각 19개 문서 통과. 검증 과정에서 글은 수정하지 않았다.
- `mise exec -- pnpm lint`: 7개 task 모두 통과, 이 중 4개는 Turbo cache hit. 실행 결과를 전체 cold 재검사나 성능 benchmark로 해석하지 않는다.
- 수정 파일의 명시적 `prettier --check`와 `git diff --check` 통과.
- 전체 읽기 전용 `pnpm format:check`: 여전히 실패, 경고 31개. data-wip MDX 13개, CSS/HTML 5개, 공용 UI 생성 템플릿 1개, 미커밋 초안·artifact 12개다. 작성 중인 내용이나 예제·템플릿 출력을 검토하지 않은 채 일괄 포맷하지 않았다.
- 도구·앱 스타일·공개 계약은 유지하므로 새로운 ADR은 작성하지 않았다. [도구 기본 구성](2026-10-14-tooling-baseline-improvements.md), [원격 작업 보존 통합](2026-10-14-docs-remote-session-rebase.md)을 따른다.

## Open Questions

CSS/HTML은 화면·실험 동작을, Handlebars는 실제 생성된 TSX를 확인하며 별도로 정리해야 한다. MDX의 코드 예제·공백과 측정 증거 JSON은 저자가 작성·검증을 마칠 때 선별 처리한다. 남은 경고를 숨기기 위해 authored files를 ignore하지 않는다.

## Next

이번 선별 변경을 검토 후 별도 커밋으로 묶는다. 다음 포맷 단계는 CSS/HTML·템플릿 출력 검증이며, Oxfmt 비교 실험과 원격 CI 확인은 별도다. 이번 작업에서는 커밋·푸시하지 않았다.
