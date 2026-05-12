# 2026-05-11 Expressive Code 도입

## 요약

- docs 앱에 남아 있던 직접 `shiki` 사용 경로를 제거했다.
- `Expressive Code` 옵션을 한 곳으로 모아 다음 기준을 통일했다.
  - light/dark 테마 페어
  - 수동 `.dark` 클래스 전환
  - 복사 버튼이 있는 editor/terminal frame
- 두 MDX 평가 경로에 동일한 `rehype-expressive-code` 설정을 적용했다.
  - `/docs/[...slugParts]`
  - `/category/[main]/[sub]/[slug]`
- 기존 범용 `pre/code` 스타일이 `Expressive Code` 블록을 덮어쓰지 않도록 MDX 스타일시트 가드를 추가했다.

## 메모

- 로컬 MDX 문서는 이제 하나의 코드 블록 렌더링 방향을 공유한다.
- 원격 HTML 콘텐츠는 여전히 별도 경로라 `Expressive Code`로 자동 변환되지는 않는다.
- 이번 단계에서는 line number를 전역 강제하지 않았다. 다음 단계에서 code fence meta 기반 opt-in으로 둘지, 별도 규칙으로 넣을지 정하는 편이 더 안정적이라고 판단했다.

## 파일

- `apps/docs/lib/expressive-code-options.js`
- `apps/docs/next.config.mjs`
- `apps/docs/app/docs/[...slugParts]/page.tsx`
- `apps/docs/app/category/[main]/[sub]/[slug]/page.tsx`
- `apps/docs/app/css/mdx.css`
- `apps/docs/package.json`
