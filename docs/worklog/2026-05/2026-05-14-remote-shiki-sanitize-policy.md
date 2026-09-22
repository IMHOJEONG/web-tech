# 2026-05-14 원격 Shiki sanitize 정책 정리

## 요약

- 원격 문서에서 Shiki 하이라이팅을 살리기 위해 `style` 허용 범위를 일부 열었다.
- 다만 원격 HTML 전체에 `style`을 전부 허용하는 것은 보안과 레이아웃 안정성 측면에서 적절하지 않다고 판단했다.
- 현재 기준은 `pre`, `code`, `span` 정도의 최소 범위만 열어, Shiki token 스타일만 보존하는 쪽이다.

## 이유

- Shiki는 코드 하이라이팅 정보를 `pre`와 내부 `span`의 style로 전달하는 경우가 많다.
- sanitize 과정에서 `style`을 모두 제거하면, backend가 `.shiki` HTML을 제대로 내려줘도 프론트에서 색이 거의 사라진다.
- 반대로 `style`을 광범위하게 허용하면 원격 문서가 화면 레이아웃을 깨뜨릴 수 있다.

## 메모

- 코드 블록의 약한 기울임체는 theme가 특정 token에 준 `font-style: italic`일 가능성이 높다.
- 이것은 버그라기보다 theme 표현의 일부이므로, 값이 있을 때만 쓰고 없을 때는 `inherit`로 fallback 하는 방식이 더 안전하다.
