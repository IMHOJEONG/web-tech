# ADR-0029: Feed 전체 검색과 표본 조회 분리

## 상태와 범위

- 상태: 적용 중
- 대상: vuln-radar 프론트·백엔드의 로컬 구현. 운영 미배포.
- 결정일: 2026-11-10
- 최종 검토: 2026-11-10
- 추적: [KAN-67](https://web-tech-service.atlassian.net/browse/KAN-67).

## 배경

기존 Feed 필터는 우선순위 상위 25개만 검색했다. 사용자는 검색 결과가 전체 DB를 대상으로 한다고 오해할 수 있었다. Overview 표본과 전체 DB 집계를 분리한 계약은 유지하면서 탐색 경로만 전체 검색으로 확장해야 한다.

## 결정

- 인증된 `GET /api/feed/search`를 별도 추가한다. 기존 `GET /api/feed`의 25개 표본·Overview 캐시는 유지한다.
- `q`는 120자 이하의 literal substring이며 CVE ID·제목·설명·watchlist matchedValue를 대소문자 구분 없이 검색한다. `kev`라는 검색어는 확인된 KEV도 포함한다. 파생 reliability 문구는 검색 대상이 아니다. `%`, `_`, 역슬래시는 LIKE wildcard로 확장하지 않는다.
- priority(all/P0~P3), severity(all/critical/high/medium/low), kev(all/kev)는 AND 필터다. 알 수 없는 API 값·중복 배열·범위 밖 정수는 400이다.
- page 기본 1·최대 10,000, pageSize 기본 25·최대 100. total·totalPages는 필터 적용 후 전체 개수다. 범위를 벗어난 유효 page는 마지막 페이지로 보정하며 빈 결과는 page 1·totalPages 0이다.
- count와 페이지 조회는 같은 RepeatableRead transaction이다. 정렬은 lastModifiedAt 내림차순·고유 cveId 오름차순으로 동률을 해소한다. 요청 사이 수집이 일어나면 offset 페이지 경계가 달라질 수 있다.
- 연결된 빈 DB·검색 미일치는 database 출처의 빈 배열이다. DB 미연결은 503이며 검색에 mock을 넣지 않는다. 일반 쿼리 오류도 정상 0으로 바꾸지 않는다.
- 프론트는 URL의 q/priority/severity/kev/page를 라우터 상태로 사용한다. 필터 변경은 page 1로 돌아가고 검색어만 300ms debounce한다. 검색 조건별 Query key를 분리하며 기존 다른 조건의 placeholder 항목·개수는 로딩 중 숨긴다.
- 요약 카드 수치는 현재 페이지 범위이며 전체 결과 수는 pagination.total로 구분한다. 재조회 실패에서는 같은 조건의 캐시·경고·재시도를 유지한다.

## 대안과 영향

클라이언트에 전체 DB를 전송하면 네트워크·메모리 비용과 브라우저별 계산이 증가한다. 기존 /feed 응답을 곧바로 바꾸면 Overview 표본 및 구형 소비자와 결합되므로 별도 검색 endpoint를 선택했다. backend를 먼저 배포한 뒤 frontend를 배포해야 하며, 구버전 API의 404를 성공이나 빈 결과로 위장하지 않는다.

offset은 직접 페이지 이동이 쉽지만 깊은 페이지와 substring 검색에는 비용이 있다. 실측 후 정렬 복합 인덱스·trigram 또는 cursor를 검토한다. 이번에 운영 DB 스키마·인덱스·수집 설정은 변경하지 않는다.

## 관련 문서

- [전체 집계 계약](vuln-radar-overview-statistics.md)
- [패널 장애 격리](adr-0017-vuln-radar-panel-failure-isolation.md)
- [검증](../verification/integration/2026-11-10-vuln-radar-feed-search.md)
- [작업 기록](../worklog/2026-11/2026-11-10-vuln-radar-feed-search.md)
