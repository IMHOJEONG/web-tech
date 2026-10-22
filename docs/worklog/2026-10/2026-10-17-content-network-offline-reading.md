# 콘텐츠 네트워크 실패와 명시적 오프라인 열람

## Summary

원격 장애의 재시도·본문 대기·빈 성공 객체 문제를 분리하고 사용자가 직접 저장한 공개 글만 오프라인에서 읽도록 구현했다. 10-18 요청에 따라 네트워크·오프라인·썸네일·문서를 독립 커밋으로 분리한다. 운영 배포 결과는 이 기록의 검증 범위에 포함하지 않는다.

## Changed

- 원격 응답 reader에 retry 0·전체 스트림 deadline·취소를 적용했다. 상세는 목록과 본문의 같은 예산을 사용하며 빈 본문 대신 로컬 대체 또는 오류를 선택한다.
- 공용 썸네일의 실패를 로컬 대체 이미지로 처리하고 최종 실패 시 추가 요청을 중단한다.
- `feature/offline`에서 저장 UI·DOM 정규화·Worker 메시지를 분리했다. 기존 푸시 Worker URL은 유지하고 작은 정적 reader와 글 캐시만 추가했다.
- [기존 실패 정책](../../architecture/docs-content-api-fail-fast-policy.md)을 갱신하고 [ADR-0015](../../architecture/adr-0015-explicit-offline-article-snapshots.md)·[운영 절차](../../runbooks/docs-offline-reading.md)를 작성했다.
- 네트워크·Worker 단위 검사와 실제 브라우저 회귀 검사를 추가하고 오프라인 브라우저 검사를 별도 CI job에 연결했다.

## Notes

커밋·푸시 범위는 이번 구현·회귀 테스트·운영 문서로 한정한다. 기존 TCP 초안·도식·검증 파일과 동기화 작업 기록은 제외하며, 함께 수정된 목차도 이번 항목만 부분 스테이징한다. 원격 요청 실패는 해당 조회의 자동 재시도를 중단한다는 의미이며, 이후 조회까지 영구 차단하는 circuit breaker는 아니다.

10-18 중단된 빌드의 exit 0을 확인하고 본문 로딩 placeholder 저장·원본 H1 중복 추가를 보완했다. 최종 dev/production 오프라인 각각 18개, 전체 lib 253개, 기존 상세·캐시 production 108개, 푸시 브라우저 11개, 저장소 도구 37개와 docs typecheck·lint를 통과했다. 기존 production suite의 스트림 종료 오류 12회는 원인 미확정으로 남긴다. 상세 범위는 아래 보고서에 기록한다.

사용자가 자동 저장이 아닌 ‘글에서 직접 저장’을 선택했다. 외부 이미지 전체 보관·초안 저장·오프라인 전체 검색·Next 응답 전체 캐싱은 하지 않는다. 초기 브라우저 검사에서 푸시 전용 CSP의 연결 차단을 발견해 같은 출처 연결만 허용하도록 수정했다. 실제 명령·결과·미검증 범위는 [검증 보고서](../../verification/resilience/2026-10-17-content-network-offline.md)에 모은다. 기존 TCP 초안·도식·검증 artifact와 복구 stash는 유지한다.

## Open Questions

Safari·Firefox·실기기와 저장 공간 회수 상황의 운영 재검증이 필요하다. 장기 보관·기기간 동기화는 지원 범위가 아니다.

## Next

배포 후 HTTPS에서 최초 저장·연결 차단·Worker 갱신과 기존 푸시 경계를 확인한다. 운영 검증 전 배포 완료로 상태를 바꾸지 않는다.
