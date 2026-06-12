# 2026-06-12 Shiki dark 변수 강제 적용

## 작업 내용

- 코드 블록이 `github-dark` 테마로 보이도록 CSS에서 `--shiki-dark`, `--shiki-dark-bg` 변수를 항상 우선 사용하게 조정했다.

## 배경

- Shiki HTML 출력에는 light/dark 값이 함께 들어가고, 기본 inline style은 light 값으로 남는 경우가 있다.
- 이 상태에서는 테마 설정을 바꿔도 화면에서 여전히 밝은 코드 박스가 보일 수 있다.

## 변경 기준

- `.mdx-wrapper .shiki`는 항상 `--shiki-dark-bg`를 배경으로 사용
- 내부 `span`도 항상 `--shiki-dark` 계열 변수를 우선 사용

## 메모

- `shiki-options.js` 변경만으로 바로 화면이 바뀌지 않을 때는 dev server 재시작이나 캐시 영향도 함께 의심해야 한다.
