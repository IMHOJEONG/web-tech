# Docs Index Browse Controls

## 배경

`/docs`는 `/feed`처럼 글을 발견하게 만드는 화면보다, 필요한 문서를 빠르게 찾는 인덱스 화면에 가까워야 한다. 기존 1차 개선으로 compact search panel, 추천 키워드, 섹션 요약, row형 문서 카드, 페이지네이션은 반영되어 있었다.

남은 개선점은 전체 문서 목록을 더 빠르게 좁힐 수 있는 탐색 조건이다.

## 적용

- `/docs` 기본 인덱스에 `section`, `source`, `sort` 기반 browse controls를 추가했다.
- 필터 상태는 query string으로 유지한다.
  - 예: `/docs?section=web`
  - 예: `/docs?source=local`
  - 예: `/docs?sort=title`
  - 예: `/docs?section=web&source=local&sort=title`
- 검색 결과는 당장 정렬을 덮어쓰지 않는다. `/docs?q=...`는 관련도 순서가 더 중요하기 때문이다.
- `SearchData`에 `contentSource`를 포함해 local/remote 문서 출처를 UI에서 구분할 수 있게 했다.
- 문서 카드에 출처, 읽기 시간, topic label, tags를 보조 메타로 노출했다.
- 필터 결과가 0개일 때 전용 empty state를 보여주고 전체 문서로 돌아갈 수 있게 했다.
- production route check 기본 목록에 대표 필터 URL을 추가했다.
- 검색 결과 화면에도 `section/source` 필터를 적용했다.
  - 예: `/docs?q=react&section=web`
  - 예: `/docs?q=react&source=local`
  - 검색 결과에서는 `sort`를 숨기고 관련도 순서를 유지한다.

## 다음 단계

- 페이지네이션과 필터 조합의 모바일 터치 영역을 실제 기기에서 점검한다.
