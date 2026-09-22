# 2026-05-10 Remote Image Figcaption Normalization

## 요약

- 원격 HTML 정규화 단계에 `<p><img ...><em>caption</em></p>` 패턴을 semantic한 `figure/figcaption` 마크업으로 승격하는 규칙을 추가했다.
- 이로써 backend에서 별도 HTML 후처리를 하지 않아도, markdown 기반 이미지 캡션을 읽기 좋게 유지할 수 있다.
- docs MDX 스타일시트에도 이에 맞는 `figure`, `figcaption` 스타일을 추가했다.

## 파일

- `apps/docs/lib/content-api-html.ts`
- `apps/docs/app/css/mdx.css`
