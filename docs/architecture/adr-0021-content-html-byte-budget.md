# ADR-0021: 상세 HTML의 비절단 응답 제한

## 상태와 범위

- 상태: 적용 중
- 대상: docs-content-contract, docs-backend 상세 HTML, docs 원격 상세 소비자
- 결정일: 2026-10-26
- 최종 검토: 2026-10-26
- 로컬 구현·검증 범위다. 원격 CI·실제 NAS corpus·배포는 별도로 확인한다.

## 배경

[ADR-0020](adr-0020-content-posts-byte-budget.md)은 목록만 제한했다. 별도 HTML 응답은 시간 내에 도착하면 크기와 관계없이 normalize/sanitize 경로로 들어갔다. Markdown이 작더라도 코드의 `<`, `>`, `&` escape나 표 마크업이 최종 HTML을 늘린다. 목록 상한을 상세 정책으로 묵시적으로 재사용하지 않는다.

## 결정

목록과 독립된 `CONTENT_HTML_WARN_BYTES`·`CONTENT_HTML_MAX_BYTES`를 두고 초기 값은512KiB·1MiB로 정한다. 압축 전 UTF-8의 전체 HTML 응답으로, doctype·html/body/article wrapper·escape된 코드·표 마크업을 포함한다. 원문 글자 수·Markdown 파일 크기·gzip 크기 기준이 아니며 외부 이미지/영상 파일 bytes는 포함하지 않는다. 정확히 경고 값은 정상, 경고 초과~상한까지 전체 본문과 생산자 경고, 상한 초과는503이다.

생산자는 실제 HTML 렌더링 뒤에 계산하고 수치 event·bytes·limitBytes만 기록한다. 소비자는 기존 공통 스트림 reader에 HTML 상한을 전달해 normalize/sanitize 전에 검사한다. Content-Length 누락/오류/과소 기재도 실제 누적 바이트로 막고, 압축 헤더는 해제 후 청크 크기와 구분한다. 기존 전체 deadline·retry0·캐시 태그/TTL·인증 규칙은 유지한다.

본문을 잘라 성공으로 내보내지 않는다. `too-large`는 빈 본문으로 바꾸지 않고 상세 로더까지 전달해 기존 로컬 사본 fallback을 사용한다. 로컬 사본이 없는 알려진 원격 글은 오류이며 없는 글404로 위장하지 않는다. 실제로 존재하지 않는 route는 기존404/null 경계를 유지한다. 새로운 자동 재시도·클라이언트 오류 UI는 추가하지 않는다.

이관용 목록의 inline body는 목록 전체1MiB 제한의 보호를 이미 받는다. 새 HTML 스트림 제한은 `/posts/...` 응답에 적용하며 inline 우선순위·구형 payload 호환을 바꾸지 않는다. normalize/sanitize·하이라이팅이 생성한 후속 DOM/마크업 크기를 원격 응답 byte budget으로 다시 계산하지 않는다.

## 대안과 영향

- Markdown 파일 크기만 제한: escape·표 마크업 증가를 놓치므로 최종 응답 기준을 택한다. 원문 선제 제한은 별도 방어다.
- 큰 본문 절단: 코드·표·HTML 구조·TOC/링크를 깨뜨릴 수 있어 제외한다.
- 목록 상수 재사용: 지금 값이 같아도 이후 상세/목록 요구가 달라질 수 있어 분리한다.
- 더 큰 상한 또는 무제한: 긴 글은 쉽게 허용하지만 정규화·파싱 비용의 예측이 어려워 우선 경고·거절 경계를 둔다.

수치는 초기 보호 기준이며 NAS 처리 능력·Next 캐시 적중·메모리 OOM 방지·브라우저 성능 SLO를 보장하지 않는다. 긴 코드/표와 정확한 상한의 반환 여부는 검사하지만 실제 운영 문서 분포는 아직 재지 않았다. backend 원문 읽기·파싱·렌더링은 제한 이전에 발생한다. 이미 할당된 청크·Next 내부 buffering·로컬 MDX 렌더 비용·외부 미디어·공개 검색 결과의 별도 제한도 이 결정의 대상이 아니다.

## 관련 문서

- [상세 API 계약](blog-content-api-contract.md#상세-html-응답-크기-제한)
- [검증 보고서](../verification/content/2026-10-26-html-response-budget.md)
- [작업 기록](../worklog/2026-10/2026-10-26-html-response-budget.md)
