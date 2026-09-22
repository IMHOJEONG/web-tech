# 2026-06-12 Shiki GitHub Dark 테마 통일

## 작업 내용

- `apps/docs`의 코드 블록 Shiki 테마를 `github-dark`로 통일했다.
- 기존에는 light 모드에서 `github-light`, dark 모드에서 `github-dark`를 사용하고 있었다.
- 이번 변경으로 light/dark 테마 전환과 관계없이 코드 블록 자체는 동일한 `GitHub Dark` 스타일을 유지한다.

## 변경 이유

- 현재 코드 블록 UI는 일반 문서 본문과 분리된 “개발자 도구” 같은 인상을 주는 편이 더 잘 어울린다.
- light 모드에서도 코드 블록만큼은 어두운 배경과 높은 대비를 유지하는 편이 읽기 경험과 미감 양쪽에서 더 안정적이다.
