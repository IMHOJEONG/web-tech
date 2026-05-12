# 2026-05-11 Expressive Code 직렬화 가능한 옵션 정리

## 요약

- 공용 Expressive Code 설정에서 직렬화할 수 없는 함수형 옵션 `themeCssSelector`를 제거했다.
- 설정 전체를 순수 JavaScript 객체로 유지해서 `@next/mdx`가 안전하게 직렬화할 수 있도록 정리했다.
- docs 테마 토글 흐름도 다음 두 상태를 함께 유지하도록 맞췄다.
  - `html.dark`
  - `html[data-theme]`
- `next.config.mjs`의 MDX 플러그인 선언도 `rehype-expressive-code` 문자열 형태로 바꿔, 옵션 직렬화 과정에서 live function reference가 loader에 전달되지 않게 했다.

이렇게 하면 MDX loader 옵션에 함수를 넘기지 않으면서도, 사이트 테마 전환 흐름은 Expressive Code의 테마 선택 모델과 계속 맞출 수 있다.

## 파일

- `apps/docs/lib/expressive-code-options.js`
- `apps/docs/feature/theme-toggle/theme.store.ts`
- `apps/docs/app/layout.tsx`
