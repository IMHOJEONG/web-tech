# 스트림 종료 주체와 선행 오류 재조사

## Summary

기존 close·이동 시각의 상관관계만으로 원인을 단정하지 않도록 소켓 종료 방향과 upstream 결과를 재조사했다. 로컬 재현은 상대편 종료가 먼저였지만 같은 오류가 서버 강제 종료에서도 발생했다. [결과와 한계](../../verification/cache/2026-10-18-stream-termination-investigation.md#종료-주체와-선행-오류-재조사)를 기존 보고서에 연결했다.

## Changed

- 테스트 preload에 고정 합성 경로의 소켓·응답 end/destroy/finish/close, warning/error, Undici 진단 채널과 runtime UUID 연결을 추가했다. fetch 인자나 운영 앱은 변경하지 않았다.
- `request-cause-next.spec.ts`에서 완료, 직접 URL 중단, 서버 강제 종료와 실제 upstream 503을 대조한다. 제어 헤더와 합성 오류 endpoint는 loopback 테스트 전용이다.
- 재현 runbook·테스트 목록·정제 artifact 목차를 갱신했다. 기존 TCP 초안은 수정하지 않았다.

## Notes

원래 게시 검사 4개, 대조 8개와 전체 production 148개가 통과했다. 첫 계측은 9건, 최종 계측은 8건이었고 상대편 종료가 먼저인 순서를 확인했다. 라우터 상태 없는 합성 RSC와 헤더가 아직 오지 않는 HTML을 사용한 초기 대조 실패도 보고서에 보존했다. 테스트 계측의 ESLint와 docs 타입 검사를 통과했으며 전체 실행의 스트림 로그 18회는 의도적 대조와 함께 그대로 남겼다. 원본 로그 해시와 정제 trace는 [증거](../../verification/artifacts/2026-10-18-stream-cause-reinvestigation.json)에 있다.

문서 delta 검사·변경 파일 Prettier·`git diff --check`가 통과했다. 기존 TCP 초안과 연결 파일 등 23개 경로는 이번 목차 항목을 제외하고 해시가 동일했다.

## Open Questions

과거 CI 8건의 소켓 증거는 없어 개별 unknown을 유지한다. 운영 환경의 연결 종료·로그 유실·공유 fetch 소유권은 이번 로컬 계측으로 해결되지 않았으며 ADR-0008의 제안 상태도 그대로다. 구조·공개 계약 변경이 아니므로 새 ADR은 만들지 않았다.

## Next

원인 계측·대조는 `9a39901`, 이동 검사 정리는 `b37adeb`로 분리했다. 조사 문서를 별도 커밋해 `feature/docs`에 함께 푸시하고 해당 SHA의 CI를 확인한다. TCP 초안은 제외하며, 운영 prefetch 비활성화·오류 필터링과 수동 배포 설정 변경은 하지 않는다. CI에서 재발 시 같은 SHA의 진단 재실행 및 정제 artifact 보관을 검토한다.
