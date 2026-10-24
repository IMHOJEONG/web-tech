# PR #59 기준선 재현성과 설계 상태 보완

## Summary

[KAN-34](https://web-tech-service.atlassian.net/browse/KAN-34)의 [PR #59](https://github.com/IMHOJEONG/web-tech/pull/59) 리뷰 4건을 보완한다. 검증 도구의 HEAD 자기 비교 3곳은 공통 기준선 처리로 수정하고, 설계 문서는 실제 PR 상태·미병합·배포 보류를 구분한다.

## Changed

- 세 CLI가 `--base <commit-or-ref>`를 필수로 받고 시작 시 한 번 SHA로 확정한다. 잘못된 입력·없는 ref·commit이 아닌 ref는 side effect 전에 거부하며 HEAD나 원격 ref로 자동 대체하지 않는다.
- 공통 helper로 고정 SHA의 파일 조회·트리 열거·manifest 복사와 도구/app script 비교를 공유한다. 보고서의 baseline 식별자도 같은 SHA다.
- 실제 임시 Git 저장소에서 커밋 후 변경·이동한 기준 브랜치·baseline에서만 존재하는 파일·입력 실패를 검사하는 회귀 9개를 추가했다. 기존 `test:repo`와 별도 타입 검사 범위에 포함한다.
- 선행 리뷰 점검 문서는 `821b398`로 분리했다. 구현·회귀와 설계/재현 문서·증거도 작업별로 커밋한다.

## Notes

Node 24.12.0·pnpm 12.14.0에서 새 회귀 9개, 저장소 총 129개, 검증 도구 타입, peer 0건을 확인했다. 명시한 원래 main `16c51e9911f041b125a445b3939966986426a0b4`로 분석기·소비자 대조·loopback CLI를 재실행했다. 원본 lockfile 그래프와 해시는 동일했고 Babel 대조도 재현했다.

첫 CLI 검사는 기능 8개 통과 후 임시 Node compile-cache 삭제의 `ENOTEMPTY`로 종료 1이었다. 실패 JSON은 보존했다. 동일 명령 재실행은 기능 8개·cleanupErrors 빈 배열·종료 0이며, 첫 실행이 만든 잔여 임시 폴더만 정리했다. 삭제 오류를 숨기거나 운영 파일을 제거하지 않았다. 자세한 실행 명령과 증거는 [후속 검증](../../verification/integration/2026-10-24-pr59-baseline-fixes.md)에 연결한다.

## Open Questions

현재 원격 CI·CodeQL은 수정 전 head `096aad7`의 성공 기록이다. 후속 push 뒤 새 head를 다시 확인해야 한다. 기존 audit 13건은 [KAN-35](https://web-tech-service.atlassian.net/browse/KAN-35)에서 별도 미조치 상태로 유지한다. 임시 compile-cache 정리 경합의 영구 개선은 이번 기준선 수정과 별개다.

## Next

승인된 작업별 커밋·push 후 같은 head의 CI·CodeQL을 확인하고 수정 근거로 리뷰 스레드를 갱신한다. main 병합·Railway 배포·실제 수집·운영 DB·토큰 변경은 하지 않으며 [KAN-32](https://web-tech-service.atlassian.net/browse/KAN-32)의 보류 조건을 유지한다.
