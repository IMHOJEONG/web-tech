# 2026-05-05 홈 히어로 프리뷰

## 요약

- `apps/docs` 메인 hero에서 `react-flow` 기반 다이어그램을 제거
- 홈 첫 화면에 더 직접적인 주제 preview 카드 UI를 도입
- preview 카드를 기존 허브 라우트와 연결
- 관련 미사용 `react-flow`/flow helper 파일을 정리

## 변경 내용

- `apps/docs/widgets/home-hero/ui/hero-section.tsx`
- `apps/docs/shared/message/ko.json`
- `apps/docs/shared/message/en.json`
- `docs/todo/platform-improvement-todo.md`
- `docs/worklog/2026-05-05-home-hero-preview.md`

## 메모

- 기존 `react-flow`는 사용처가 home hero 한 곳뿐이었고, 정보 전달보다는 장식 성격이 강했다.
- 메인 페이지는 시각적 복잡성보다 "이 사이트가 무엇을 다루는지"를 빠르게 이해시키는 편이 더 중요하다고 판단했다.
- 대체 UI는 기술 문서 사이트의 성격을 유지하면서도 카테고리/주제 인지가 더 빠르게 일어나도록 설계했다.
- 카드 클릭은 현재 앱 구조에 맞춰 `/web`, `/mobile`, `/category`로 연결해 홈 hero와 실제 탐색 흐름이 이어지도록 했다.

## 열린 질문

- home hero 카드가 향후 실제 추천 문서 preview까지 포함해야 하는지
- hero 아래 본문 구성이 추가될 경우 지금의 카드형 preview를 유지할지 더 작게 축소할지

## 다음 단계

- `apps/docs/components/react-flow` 제거 후 남는 미사용 import/스타일이 없는지 추가 점검
- 필요하면 preview 카드와 실제 대표 문서를 1:1로 연결하는 방향 검토
