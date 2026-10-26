# ADR-0019: 공개 목록의 검색 텍스트로 원격 본문 검색

## 상태와 범위

- 상태: 적용 중
- 대상: docs-content-contract, docs-backend 목록 API, docs 검색 인덱스
- 결정일: 2026-10-26
- 최종 검토: 2026-10-26
- 로컬 구현·회귀 범위다. 커밋·원격 CI·NAS/Vercel 배포와 실제 게시 갱신은 별도다.

## 배경

원격 metadata의 렌더링용 `content`는 비어 있고, 같은 canonical URL은 원격이 우선한다. 이 때문에 로컬 본문으로 검색되던 글이 원격 목록 활성화 뒤 사라질 수 있었다. 원격 본문 검색을 위해 모든 상세 endpoint를 추가 조회하면 지연·요청 수·장애 의존성이 커진다.

## 결정

기존 인증된 `GET /api/posts`에 선택적 문자열 `searchText`를 추가한다. 현재 NestJS 생산자는 published 상태·metadata·본문 검증을 통과한 문서의 본문에서 이 값을 항상 생성한다. frontmatter 입력 필드가 아니며 작성자가 별도로 관리하지 않는다. 본문이 비면 빈 문자열이다. 기존 MarkdownIt 토큰을 재사용해 표시 텍스트·코드·링크 라벨·이미지 대체 텍스트를 읽고 구문·링크 destination·이미지 경로는 제외한다. NFC·공백 정리를 수행하며 새 패키지나 하이라이터는 도입하지 않는다.

docs의 문서 metadata에는 `searchText`를 별도 보관하고 렌더링용 `content: ''`는 유지한다. 검색 어댑터에서만 `SearchData.content`로 전달한다. 기존 로컬 MDX 인덱스·공통 순위·안전한 발췌·URL·입력 제한은 유지한다. 이는 본문 키워드 검색 경로의 통일이지 MDX와 원격 Markdown 파서 표현 전체의 동일성 보장은 아니다.

같은 URL은 원격 published metadata와 검색 텍스트를 한 묶음으로 선택한다. 오래된 로컬 본문을 섞지 않는다. 구형 API의 누락/null/빈 값은 metadata-only 검색으로 동작한다. 잘못된 타입은 기존 payload 오류 경로로 처리한다. 원격 요청·payload 실패 때는 기존 로컬 인덱스로 대체한다. draft·archived는 검색 텍스트도 제공하지 않는다. 원격 목록에 없는 route의 로컬 published 글은 기존 정책대로 유지한다.

[ADR-0011](adr-0011-local-search-index-cache.md)의 로컬 캐시·원격 fetch 태그·TTL·웹훅을 유지한다. 새 검색 endpoint나 검색어별 병합 캐시, 상세 fan-out, 재시도를 추가하지 않는다. 새 목록 데이터가 프론트에 반영되면 새 검색 텍스트도 함께 사용한다. NAS 파일 변경만으로 Vercel의 기존 캐시가 즉시 바뀐다고 보장하지 않는다.

## 대안과 영향

- metadata-only 검색 명시: 구현은 작지만 본문 검색의 로컬·원격 차이를 유지한다.
- 검색할 때 상세 전체 조회: 본문은 얻지만 문서 수에 비례하는 요청·대기와 부분 장애가 생겨 제외했다.
- 이전 로컬 본문 합성: 검색은 늘지만 현재 원격 글에 없는 내용으로 결과가 나올 수 있어 제외했다.
- 별도 검색 엔진/endpoint: 대규모 corpus에 유리하지만 현재는 동기화·인증·캐시 계약을 늘리지 않는다.

목록 payload와 백엔드 파싱 비용이 커진다. byte budget과 대규모 corpus 측정은 별도 후속 과제다. 원격 변경량이 커지거나 지연·크기가 문제가 되면 별도 검색 인덱스를 재검토한다. 배포는 백엔드 새 이미지 적용, 프론트 배포, 승인된 기존 게시 갱신·화면 검증 순으로 나누며 이번 로컬 작업에서 실행하지 않는다.

## 관련 문서

- [후속 ADR-0020: 비절단 목록 byte budget](adr-0020-content-posts-byte-budget.md)
- [API 계약](blog-content-api-contract.md#본문-검색-텍스트)
- [검색 API와 호환 경계](docs-search-api-contract.md#본문-검색과-원본-선택)
- [검증](../verification/content/2026-10-26-remote-body-search.md)
- [작업 기록](../worklog/2026-10/2026-10-26-remote-body-search.md)
