# 2026-05-11 코드 블록 대비 수정

## 요약

- docs 앱의 코드 블록 대비 문제를 수정했다. 핵심은 어두운 코드 표면에서 잘못 쓰이던 전경색 토큰을 바로잡는 것이었다.
- 기존에는 `var(--hf-bg-deep)` 위에 텍스트 색으로 `var(--inverse-surface)`를 쓰고 있었고, 이 때문에 light mode에서 거의 검은 배경 위에 거의 검은 글자가 보이는 상태가 되었다.
- 코드 표면의 글자색을 `var(--inverse-on-surface)`로 바꿔 읽기 가능한 대비를 확보했다.

## 파일

- `apps/docs/app/css/mdx.css`
- `packages/tailwind-config/shared-styles.css`
