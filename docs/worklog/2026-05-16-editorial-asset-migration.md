# 2026-05-16 Editorial Asset Migration

## 변경 내용

- `article-detail`과 `ui-ux hub`에 남아 있던 `/figma/article-detail/*` 직접 참조를
  정식 editorial asset 경로로 이관했다.
- 새 경로는 다음처럼 분리했다.
  - `public/editorial/article-detail/*`
  - `public/editorial/uiux-hub/*`
- 공용 상수 파일 `shared/assets/editorial.ts`를 추가해 화면별 fallback 자산을 한 곳에서 관리하도록 정리했다.

## 이유

- Figma export 경로가 화면 코드에 직접 남아 있으면 임시 산출물 의존처럼 보이고,
  자산 책임도 불분명해진다.
- 같은 이미지를 여러 화면이 공유하더라도, 화면 목적에 맞는 semantic path로
  재배치하는 편이 이후 운영과 교체가 더 쉽다.

## 확인 결과

- `apps/docs` 코드 기준 `/figma/article-detail/*` 참조는 제거됐다.
- 남은 `public/figma/*` 파일은 과거 자산 보존용이며, 현재 앱 화면 렌더 경로에서는
  사용하지 않는다.
