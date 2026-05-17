# 2026-05-18 Tailwind canonical class 정리 2차

## 요약

- `suggestCanonicalClasses`가 지적하는 exact built-in 대응값을 한 번 더 정리했다.
- `min-h-[32rem]`, `min-h-[26rem]`, `min-h-[3rem]`, `text-[0.75rem]` 같은 값은
  built-in scale로 치환했다.
- 반대로 tracking, gradient, shell offset, custom typography처럼 의도가 있는
  arbitrary 값은 그대로 유지했다.

## 반영 예시

- `min-h-[32rem]` -> `min-h-128`
- `min-h-[26rem]` -> `min-h-104`
- `min-h-[3rem]` -> `min-h-12`
- `text-[0.75rem]` -> `text-xs`
- `text-[1.25rem]` -> `text-xl`
- `text-[1.5rem]` -> `text-2xl`
- `max-w-[16rem]` -> `max-w-64`
- `rounded-[0.25rem]` -> `rounded-sm`

## 메모

- 이번 정리는 “모든 arbitrary value 제거”가 아니라 “Tailwind built-in과 정확히 같은
  값을 canonical utility로 치환”하는 기준을 따랐다.
