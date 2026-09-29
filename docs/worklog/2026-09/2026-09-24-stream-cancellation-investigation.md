# E2E 수정 푸시와 스트림 조기 종료 조사

## Summary

오래된 E2E 기대값 수정을 `1c7bac5`로 커밋하고 `origin/feature/docs`에 푸시했다. 별도로 게시 갱신 테스트의 스트림 조기 종료 로그를 세 조건으로 비교했다.

## Changed

- [검증 보고서](../../verification/cache/2026-09-24-stream-cancellation.md)와 인증 정보 없는 측정 artifact를 추가했다.
- 기존 진단 옵션을 사용했으며 앱 코드, prefetch 정책, 서버 로깅은 변경하지 않았다.
- 기존 Better Stack·Obsidian 미커밋 변경을 보존했다. 조사 문서는 기대값 수정 커밋 이후의 별도 미커밋 변경이다.

## Notes

prefetch 전달·로컬 대체·재전달에서 오류는 2·0·2회였다. 세 실행 모두 게시 갱신 검사를 통과했고 실제 document 요청은 각각 21개 완료·0개 실패였다. 근거와 해석의 한계는 보고서를 따른다.

원격 [CI](https://github.com/IMHOJEONG/web-tech/actions/runs/35965949474)의 Commit Messages·Lint·Typecheck·Test와 [문서 검사](https://github.com/IMHOJEONG/web-tech/actions/runs/35965949467)가 모두 성공했다. CI production article 단계도 44개 통과(1.2분)했으며 스트림 조기 종료 로그는 8회 남았다. 따라서 테스트 기대값 실패 해결과 서버 로그 소멸을 구분한다.

`git ls-remote`로 원격 브랜치의 `1c7bac56a690233d320b1e4a2dc83627b277b3ba` 일치를 확인했다. Vercel은 같은 커밋의 블로그 배포 성공을 보고했다. 운영 화면·NAS 실연동을 이번 대조 실험이 검증한 것은 아니다.

## Open Questions

운영의 동일 메시지는 요청별 추가 증거 없이 같은 원인으로 확정하지 않는다. 문서 실패나 지속 timeout이 동반되면 별도 조사한다.

## Next

운영 비용이나 사용자 영향이 관측될 때만 특정 링크의 prefetch 정책을 비교하며, 로그를 전역적으로 숨기지 않는다. 후속 조사 문서는 아직 커밋·push하지 않았다.
