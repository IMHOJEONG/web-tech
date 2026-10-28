# 상세 HTML의 독립 byte budget

## Summary

[KAN-29](https://web-tech-service.atlassian.net/browse/KAN-29)의 다음 승인으로 상세 HTML 응답에 크기 제한을 추가했다. [Confluence 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817)의 같은 과제를 갱신하고 기존 검색 브랜치·목록 제한·E2E·NAS/H1/primary 미커밋은 보존한다. 커밋·푸시·배포는 하지 않는다.

## Changed

- `CONTENT_HTML_WARN_BYTES`·`CONTENT_HTML_MAX_BYTES`를 목록과 독립적으로 정의했다. 초기 값512KiB/1MiB, 최종 HTML UTF-8 응답 기준이다.
- Nest는 렌더 결과를 계산해 수치 경고 또는503을 반환한다. 프론트는 기존 스트림 reader로 normalize 전에 제한하고 `too-large`를 기존 상세 원본 선택 경계까지 전달한다.
- 로컬 사본은 fallback, 원격 전용 글은 오류다. 본문 절단·가짜404·새 retry·UI·TTL/태그/웹훅·의존성 변경은 없다.
- [ADR-0021](../../architecture/adr-0021-content-html-byte-budget.md)과 기존 API 계약·TODO에 별도 상세 결정을 연결했다. 목록 ADR-0020을 대체하지 않는다.

## Notes

실제 escape가 원문보다 큰 HTML을 만드는 경우의 정확한 경계·긴 코드/1000행 표·상세만 초과할 때 목록/검색 유지·인증/실제404·local fallback/원격전용 오류·수치 로그를 검사했다. 공유28·backend31+45·docs307·저장소153개와 타입·lint·build가 통과했다. 최종 production162개도98.9초·retry/skip/flaky0으로 통과했고 리스너는 종료됐다. [보고서](../../verification/content/2026-10-26-html-response-budget.md)에 명령·JSON 재검사·최종 production 결과와 소스8blob 증거를 연결한다. 운영 비밀값·인증 헤더·실제 문서를 기록하지 않는다.

읽기 전용 문서 delta·명시 파일 Prettier·diff 검사를 통과했고 인덱스는 비어 있다. 기존 목록/동선 회귀와 NAS/H1/primary 미커밋 hash를 대조해 보존했다. KAN-29 댓글10018의3열 표와 Confluence v148을 갱신하고 전체 본문 일치·이전 내용 보존을 재조회했다. 첫 Jira 조회는 연결 도구 오류로 쓰기 전에 중단돼 재조회 후 같은 댓글을 갱신했으며 중복 댓글은 만들지 않았다. 이슈 전체는 검토 중으로 유지한다.

## Open Questions

실제 NAS 문서 용량·동시부하·원문 읽기/렌더링 선제 제한·후속 DOM 비용·외부 미디어·공개 검색 결과의 별도 상한은 남는다. 수치만 올리거나 메모리 안전을 보장하는 정책으로 해석하지 않는다.

## Next

로컬·원격 CI·실제 NAS/Vercel 적용을 구분해 기록한다. 사용자 승인 전 커밋·푸시·PR·운영 작업은 하지 않는다. 기존 보류 운영 작업도 유지한다.

## 후속 커밋·푸시 승인

사용자가 앞선 검색·목록 제한과 이번 HTML 후속을 포함한 커밋·푸시를 승인했다. 공통 스트림과 양쪽 endpoint의 제한·회귀를 `fed29195b977bce92bc77a590c162f42caf17fd4`에 묶고 검색 게시/이동 E2E는 `bad63bdad9572e6897e055f643cf24759c5f4ee7`로 분리했다. 정책/검증은 별도 커밋이며 기존 NAS/H1·primary 변경과 NAS artifact는 제외한다. 각 코드 커밋의 포맷·문서 delta·commitlint 훅이 통과했다. 검증 때의8개 소스 blob과 최종 tree를 대조하고 기존 목차의 NAS 변경은 작업 트리에만 남긴다. PR 생성·병합·운영 배포·웹훅은 하지 않으며 실제 push head·연결 기록은 원격 조회로 확인한다.
