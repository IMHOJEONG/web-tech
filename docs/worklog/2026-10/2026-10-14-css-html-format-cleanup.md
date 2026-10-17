# CSS·HTML 포맷 정리와 UI 템플릿 검토

## Summary

2026-10-14에 feature/docs HEAD `776f70c`에서 CSS·HTML 5개를 경로별 Prettier 설정으로 포맷했다. 동작·토큰·레이아웃을 바꾸지 않았으며 전체 포맷 경고는 31개에서 26개로 줄었다. [앞선 설정·스크립트 정리](2026-10-14-selective-format-cleanup.md) 및 [원격 작업 보존 기록](2026-10-14-docs-remote-session-rebase.md)과 함께 선별 커밋한다. 다른 세션의 초안·preview·배포 증거는 포함하지 않는다.

## Changed

- `apps/docs/public/experiments/html-in-canvas/index.html`: 긴 gradient·계산식 줄바꿈.
- `apps/vuln-radar/index.html`: HTML 속성 줄바꿈.
- `apps/vuln-radar/src/app/styles/global.css`: 폰트 목록 포맷.
- `docs/examples/critical-rendering-path-lab/assets/styles.css`: 들여쓰기·따옴표 포맷.
- `packages/tailwind-config/shared-styles.css`: 긴 CSS 값 줄바꿈.
- `packages/ui/turbo/generators/templates/component.hbs`는 변경하지 않았다. Prettier가 TSX 템플릿을 Glimmer로 해석해 선언·return을 불규칙하게 재배치한다. 경고를 숨기기 위한 ignore나 새 플러그인은 추가하지 않았다.

## Notes

환경은 Node 24.12.0, pnpm 11.10.0, 설치된 Prettier·Tailwind·Playwright이며 배포 검증은 수행하지 않았다.

재실행 가능한 저장소 명령:

```sh
mise exec -- pnpm test:repo
mise exec -- pnpm test:crp-lab
mise exec -- pnpm test:crp-lab:browser
mise exec -- pnpm --filter vuln-radar build
mise exec -- pnpm --filter docs test:content
mise exec -- pnpm lint
mise exec -- pnpm format:staged:check
mise exec -- pnpm validate:docs --staged
```

- repo 테스트 37개, CRP 타입 검사·서버 테스트 6개와 Chromium 브라우저 테스트 3개 통과.
- 콘텐츠 테스트 34개와 실제 frontmatter·본문 스타일 검사 각각 19개 문서 통과. 린트 7개 task 모두 통과했으며 5개는 Turbo cache hit다. 전체 cold 재검사나 성능 측정 결과는 아니다.
- 공용 UI 빌드와 Vuln Radar Vite 프로덕션 빌드 통과. 기존 Vite의 미래 native config loader 관련 확장자 경고는 남아 있다. 경고를 숨기거나 설정을 변경하지 않았다.
- 임시 비교 검사에서 CSS 3개의 esbuild 정규화 결과, Tailwind를 사용하는 2개의 PostCSS 컴파일 결과와 HTML 2개의 inline JS/CSS 정규화 결과가 전후 동일했다.
- Chromium에서 390·640·1280px, 라이트·다크의 CSS fixture 18조건과 HTML 6조건을 비교했다. 선택 요소의 화면 텍스트·속성·computed style·bounding rect가 모두 동일했다. 이는 전체 실제 앱 화면이나 모든 브라우저의 시각 검증이 아니다.
- 첫 비교 실행은 HTML 요소의 `textContent`에 보이지 않는 style 원문이 포함되어 따옴표 포맷 차이를 장애로 판정했다. 화면 텍스트를 `innerText`로 비교하도록 임시 검사를 수정한 뒤 24조건이 통과했다. 애플리케이션 코드는 이 실패 때문에 변경하지 않았다.
- Canvas는 `drawElementImage`·`requestPaint`를 stub한 전후 2회 실행에서 paint→render·버튼 클릭 후 재그리기·transform·pageerror 없음 조건을 확인했다. 실제 Chromium 실험 API 지원이나 cached paint record 동작 검증으로 해석하지 않는다.
- Handlebars 4.7.9에 검사 전용 pascalCase helper를 등록해 이름 3개로 렌더링했다. 기존/Prettier 후보의 생성 TSX를 esbuild로 비교했을 때 동일했다. 실제 Turbo/Plop의 전체 생성 action·export 갱신을 실행한 것은 아니며, 소스 가독성이 나빠지는 후보는 적용하지 않았다.
- 임시 baseline·비교 스크립트는 `/tmp`에 두고 커밋하지 않는다. 위 비교는 이번 포맷 검증이며 상시 CI 회귀 검사로 추가한 것은 아니다. 작업 시작 시 있던 미커밋 파일 145개는 비교 완료 시 hash가 모두 동일했다. 이후 이 기록과 목차만 추가했다.
- 제품 책임·데이터 흐름·공개 계약은 바뀌지 않아 별도 ADR은 작성하지 않았다. [문서 품질 검사](../../process/documentation-quality-gates.md)를 따른다.

## Open Questions

전체 `pnpm format:check`는 여전히 실패한다. 남은 26개는 data-wip MDX 13개, 작성 중인 초안·증거 12개, TSX Handlebars 템플릿 1개다. 저자 검토가 끝나기 전 콘텐츠나 증거 파일을 일괄 포맷하지 않는다.

## Next

생성기 구조를 개선할 때 TSX-aware 템플릿 포맷 방법과 실제 Turbo 생성 결과·현재 UI export 계약을 함께 검증한다. 이번 요청 범위는 로컬 커밋이며 푸시·원격 CI·배포 확인은 별도다.
