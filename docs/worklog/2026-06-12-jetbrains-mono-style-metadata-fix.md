# 2026-06-12 JetBrains Mono style metadata 정리

## 작업 내용

- `apps/docs`에서 사용하는 `JetBrains Mono` 로컬 폰트 등록에 `weight`, `style` 메타데이터를 명시했다.
- 기존에는 regular/italic 파일을 함께 등록하면서도 각 파일이 어떤 스타일인지 정보를 주지 않고 있었다.

## 원인

- `next/font/local`에 여러 폰트 파일을 넘길 때 `weight`, `style`을 생략하면 브라우저가 일반 코드 텍스트에도 italic 파일을 선택할 수 있다.
- 그래서 CSS에서 `font-style: normal`을 강하게 걸어도, 실제 glyph 자체가 기울어진 italic 폰트로 보일 수 있었다.

## 변경 기준

- 각 JetBrains Mono 파일에 실제 `weight`와 `style`을 명시
- `normal` 텍스트는 regular 계열 파일을, `italic` 텍스트는 italic 계열 파일을 정확히 매칭
