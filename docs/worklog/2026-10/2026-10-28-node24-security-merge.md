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

## Open Questions

리뷰 보완 후 최신 head의 원격 검사와 최종 메시지 사전검사가 필요하다. main 병합·이미지 게시와 NAS pull/up 완료는 다르며, NAS 내부 실제 실행 버전은 별도 확인한다.

## Next

문서·정책 회귀를 검증한 뒤 이번 보완만 커밋·푸시한다. 최신 head의 CI·리뷰·미해결 스레드를 재확인하고 동일 메시지 사전검사와 승인된 병합을 수행한다. 이후 main CI·GHCR digest·Vercel/Railway 자동 배포를 확인해 기록한다.
