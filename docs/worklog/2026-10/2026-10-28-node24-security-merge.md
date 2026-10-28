# Node 24 보안 PR 병합 사전검사와 운영 확인

## Summary

[KAN-43](https://web-tech-service.atlassian.net/browse/KAN-43), [PR #68](https://github.com/IMHOJEONG/web-tech/pull/68). 사용자 승인으로 최종 메시지 사전검사·main 병합·같은 SHA의 CI와 이미지 게시·배포 결과를 확인한다. 기존 필터 미커밋 15파일을 해시로 보존하며 병합 여부와 실제 NAS 교체는 구분한다.

## Changed

최초 사전검사는 CodeRabbit rate-limited NEUTRAL로 중단했다. 규칙을 완화하지 않고 정상 증분 리뷰를 재요청했다. 최신 head 리뷰가 성공했으나 NAS 절차의 이미지 선택값 반영·교체 전 검사 순서에 지적 두 건이 추가돼 먼저 보완했다.

`.env.nas`의 immutable 이미지 설정을 명시하고 셸 변수 우선순위에 따른 구버전 선택을 방지했다. pull/up 뒤에 컨테이너 내부 검사를 배치했다. 정책 테스트에 정상 순서와 이미지 설정 누락·셸 override 미해제·역순 거절을 추가했다. NAS 명령은 실제로 실행하지 않는다.

## Notes

[기존 검증 원본](../../verification/security/2026-10-27-node24-security-patch.md)과 [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817)에 결과를 연결한다. 승인된 squash 도구만 사용하며 직접 병합 우회·main 이력 재작성은 하지 않는다. 새 지적이 발견된 시점에는 아직 미병합이다.

첫 역순 음성 fixture가 앞쪽의 같은 명령만 바꿔 대상 절차를 변형하지 못하는 오류를 검출했다. 커밋을 중단하고 대상 절차까지 실제 역순이 적용되도록 fixture를 보완했다. 기대 예외·명령 순서·운영 기준을 완화하지 않았다.

이후 정책 회귀 13개·저장소 전체 166개가 실패/skip 없이 통과했고 toolchain strict 타입 검사도 통과했다. 기본 샌드박스에서는 기존 HTTP 회귀의 loopback listen이 EPERM으로 차단돼, 승인된 loopback 실행 환경에서 같은 검사를 재실행했다. 이는 실제 NAS 연결이나 테스트 skip이 아니다.

보완 커밋 `05aa729`를 푸시했고 세 리뷰 스레드의 resolved를 재조회했다. 최종 squash 메시지의 전용 commitlint는 0문제·0경고다. 새 CodeRabbit 한도가 다시 적용돼 사용자가 기존 정책 유지·한도 해제까지 병합 보류를 선택했다. 최신 CI에서는 desktop의 설치9분30초·스켈레톤 재시도/수화 경고 이후 시간 제한 취소와 종합 Test 실패가 별도로 관측됐다. 성공/실패·원본 URL은 [검증 원본의 보류 기록](../../verification/security/2026-10-27-node24-security-patch.md#2026-10-28-병합-사전검사-보류)을 따른다. 기존 필터15파일은 계속 해시가 같고 main 병합은 실행하지 않았다.

## Open Questions

후속 승인으로 CodeRabbit SUCCESS·desktop/종합 Test 재실행 성공 후 공식 메시지 사전검사를 거쳐 `e2126a40`으로 병합했다. KST08:25:08의 실제 MERGED를 확인했다. main CI13개·문서·CodeQL·이미지 게시·Vercel/Railway 자동 배포와 공개 GET도 확인했다. [병합 후 검증](../../verification/security/2026-10-27-node24-security-patch.md#2026-10-28-재개와-병합-후-검증)에 같은 SHA·실패/재시도·deployment·digest를 연결한다.

NAS pull/up·내부 실행 버전은 아직 미검증이다. main의 스켈레톤 flaky5건과 gate 없는 rollback 대상의 안전한 수동 검증·문서 명확화도 별도 후속이다. 신규 Minor의 자동 gate 생략은 보안 정책과 충돌해 미반영 사유를 답변·정리했으며 수정 완료로 표시하지 않는다. 기존 필터15파일·보류 artifact는 보존했고 후속 검증 기록은 로컬 미커밋이다.

## Next

NAS에서 새 immutable tag/digest를 선택해 교체·Node/health/content를 확인한다. 이번 작업에서 NAS SSH·수동 배포·DB/자격 증명 변경은 하지 않았다. flaky 안정화와 rollback 문서 보완은 기존 보안 검사 기준을 유지한 별도 작업으로 검토한다. 자동 재개·예약 작업·유료 한도 변경은 설정하지 않았다.

## 2026-10-28 후속 기록 게시 준비

사용자 요청으로 보류 artifact·병합 후 artifact와 이 기록만 최신 main 기반 독립 PR로 분리한다. 선행 영향 조사는 별도 PR이며 스켈레톤 구현은 기존 PR #67을 중복하지 않는다. 원래 세 작업 트리의 수정·미추적 파일은 해시를 대조해 보존한다. 보안 기준을 완화하거나 NAS/DB/토큰을 변경하지 않는다. 남은 운영 검증의 완료 조건은 [TODO](../../todo/todo.md#2026-10-28-잔여-작업-분리)를 따른다.
