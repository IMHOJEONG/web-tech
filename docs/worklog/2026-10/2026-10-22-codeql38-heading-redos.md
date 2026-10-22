# 공용 본문 제목 검사의 CodeQL High #38 보완

## Summary

[KAN-30](https://web-tech-service.atlassian.net/browse/KAN-30)의 High #38을 조사하고
main `16cc398`에서 `codex/security-codeql38-heading-scan`을 분리했다.
기존 미커밋 canonical 분류 worklog는 다른 작업 트리에 두고 수정·stash·커밋하지 않았다.

## Changed

- 공용 `body-style.ts`의 모호한 제목 정규식을 고정 접두부·trim·줄 구분자 검사로 분리했다.
- 제목·Unicode 공백 판정 18개와 긴 실패 입력 6개·정상 입력 2개의 격리 회귀를 추가했다.
  타임아웃은 child process를 종료하므로 동기 정규식이 테스트 러너까지 멈추지 않게 한다.
- [검증 보고서](../../verification/security/2026-10-22-codeql38-heading-redos.md)에
  원인·실행 명령·수정 전 실패·수정 후 통과·입력 경계·한계를 기록했다.
- 공개 API·게시 규칙·인증·실패/경고 문구·입력 길이 정책은 유지한다. 내부 보안 보완으로 새 ADR은 만들지 않았다.

## Notes

기준 정규식은 긴 공백과 내부 줄 구분자/접미부에서 반복 소비 구간을 재탐색했다.
수정 전 10초 제한 종료를 재현했고 수정 후 같은 격리 검사는 약 66ms에 끝났다.
공용 계약 22개·소비 앱 회귀와 기준 코드의 99,999개 유한 입력 대조를 통과했다.
docs 라이브러리 285개·docs Production build와 Nest build도 통과했다.
보안 수정·회귀 커밋은 `1ab8053a5727e75ce56885536ab0a3237d3bccd9`다.
측정 환경·전체 결과·기존 placeholder 경고·최초 loopback 권한 실패와 build 정지는 검증 보고서에서 구분한다.

승인된 별도 보안 이슈를 생성했으며 기존 KAN-29의 분류·본문 검색·byte budget 작업과 섞지 않는다.
실제 토큰/DB 변경·main 병합·NAS 운영 이미지 교체는 하지 않는다.
원격 PR·검사 링크는 push 이후 존재하는 SHA를 기준으로 Jira·Confluence에 연결한다.

## Open Questions

- main 경고 해소와 NAS 운영 반영은 PR 병합·이미지 교체 후 별도 검증이 필요하다.
- 모든 정규식·전체 본문 처리의 비용 상한을 이번 수정만으로 보장하지 않는다.

## Next

- 보안 수정·회귀와 문서를 독립 커밋해 push하고 main 대상 PR을 준비한다.
- 같은 head의 CI·CodeQL 결과와 보존 검사를 Jira·Confluence에 기록하고 재조회한다.
