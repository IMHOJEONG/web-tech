# 원격 검색 목록의 byte budget과 대규모 비용

## Summary

[KAN-29](https://web-tech-service.atlassian.net/browse/KAN-29)의 응답 크기 경계를 보완했다. [Confluence 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817)의 같은 과제를 갱신하며 기존 검색 브랜치·이전 캐시/동선 E2E·NAS/H1/primary 미커밋을 보존한다. 커밋·푸시·배포는 이번 범위가 아니다.

## Changed

- 공유 계약의 UTF-8 목록 JSON 경고512KiB·상한1MiB를 생산자 직렬화/소비자 스트림에 적용했다.
- 초과 목록은 전체 거절·503/too-large·기존 local fallback이며 일부 문서/본문을 자르지 않는다. Content-Length와 압축 헤더만으로 판단하지 않고 실제 누적 바이트를 검사한다.
- [ADR-0020](../../architecture/adr-0020-content-posts-byte-budget.md)과 기존 API 계약·TODO를 갱신했다. 새 의존성·lockfile·공통 빌드/CI 설정·캐시 TTL/웹훅은 변경하지 않았다.
- 실제 gzip 해제·UTF-8 split·경계·cancel·HTTP 인증/응답·local fallback·1000문서 끝 키워드 검사를 추가했다. TypeScript 측정 도구는 합성9조건을 실제 스키마/어댑터/순위 함수로 측정한다.

## Notes

공유28·backend26+42·docs301·저장소153·production E2E162개가 통과했다. build·타입·관련 lint도 통과했다. [검증 보고서](../../verification/performance/2026-10-26-search-payload-budget.md)에 명령·소스blob·최종 측정·초기 fixture 타입/closed stream/lint 실패와 수정 근거를 연결한다. 초기 결과를 숨기거나 timeout/retry·규칙을 완화하지 않았다. 운영값·인증 헤더·실제 콘텐츠를 artifact에 저장하지 않았다.

명시 파일 Prettier·읽기 전용 문서 delta·diff 검사가 통과했다. 소스11blob과 기존 E2E3파일·NAS/H1/primary 미커밋 hash를 대조했고 인덱스는 비어 있다. KAN-29 댓글10018의3열 표와 Confluence v146을 갱신해 전체 본문 일치·이전 내용 보존을 재조회했다. 기존 이슈는 검토 중이며 로컬 구현/측정과 원격 CI·운영 배포를 구분한다.

## Open Questions

실제 NAS corpus 용량·운영 경고와 CPU/RAM·동시 부하·상세 HTML/공개 검색 결과의 별도 budget은 남는다. backend 원문 읽기/Markdown 파싱 비용과 Next 내부 buffering까지 막는 guard로 해석하지 않는다. 경고 구간에 도달하면 별도 검색 인덱스/페이지 단위 API 계약을 검토한다.

## Next

로컬 변경·원격 CI·운영 검증을 구분해 기록한다. 별도 승인 전 커밋/푸시/PR·배포·실제 NAS/API/웹훅 작업은 하지 않는다. 기존 보류 운영 과제는 유지한다.

## 후속 커밋·푸시 승인

후속 사용자 승인으로 목록/상세가 공유하는 스트림 guard·양쪽 응답 제한·회귀/측정 도구를 `fed29195b977bce92bc77a590c162f42caf17fd4`로 묶었다. 앞선 검색 E2E는 `bad63bdad9572e6897e055f643cf24759c5f4ee7`로 분리했고 정책·검증은 별도 문서 커밋으로 연결한다. 원래 목록 측정 소스와 나중에 HTML 정책이 추가된 shared/controller/API3파일의 시점을 혼동하지 않으며 최종 구현은 HTML artifact의8개 blob과 대조한다. 포맷·문서 delta·commitlint 훅 통과, 기존 NAS/H1·primary 미커밋 보존, 실제 원격 head·기록은 push 후 재조회한다. 이번 승인은 PR·운영 배포를 포함하지 않는다.
