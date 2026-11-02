# 캐시·원격 진단·브라우저·권한 후속 작업

## Summary

2026-11-02 착수한 네 과제를 11-03 KST에 정리했다. 기준 main은
`0cd27ae405b653785fd0bcbe55e507907e53fe59`, 작업 브랜치는 `codex/docs-followups-20261102`다.
로컬 구현·검증과 당시 운영 표본을 구분한다. 최초 검증 시에는 커밋·푸시·배포하지 않았으며,
후속 사용자 승인으로 이번 변경만 작업별 커밋·푸시 및 PR 검증 후 병합·배포를 진행한다.

## Changed

- [KAN-58](https://web-tech-service.atlassian.net/browse/KAN-58): 합성 origin 응답을 보류하고 웹훅과 겹치는 순서를 검사한다. 표시한 loopback 요청의 cache get/set/revalidateTag만 제한적으로 계측한다. 과거 간헐 원인 확정이나 운영 캐시 정책 수정은 아니다.
- [KAN-5](https://web-tech-service.atlassian.net/browse/KAN-5): 원격 요청 오류에 headers/body 단계와 허용된 네트워크 코드만 보존한다. 원본 cause·Request·인증 헤더는 전달하지 않고 재시도·deadline·응답 상한은 유지한다.
- [KAN-6](https://web-tech-service.atlassian.net/browse/KAN-6): 기존 키보드 회귀와 별도 프로필의 운영 Chrome·Playwright Firefox를 점검했다. Safari·실기기·보조공학은 미검증이다.
- [KAN-33](https://web-tech-service.atlassian.net/browse/KAN-33): 현재 승인 요구와 신원을 읽기 전용으로 확인했다. 사용자가 전용 계정 미준비를 확인해 [macOS 준비 절차](../../runbooks/github-app-isolated-macos-account.md)만 작성했다.

## Notes

상세 명령·실패 대조·집계·한계는 [검증 보고서](../../verification/resilience/2026-11-03-docs-sequential-followups.md)에 모았다.
변경 전 36개, 최종 집중 42개, 상세 production 180개, 라이브러리 354개, 기존 키보드 12개가 통과했다.
공개 전 라이브러리 354개와 저장소 회귀 227개를 다시 통과했다. 저장소 검사 최초 2건은
loopback listen EPERM이었으며 같은 전체 검사를 허용 환경에서 재실행했다. 코드·검사 기준은 변경하지 않았다.
전체 요청 계측의 상한 초과와 build 동시 실행의 타입 검사 실패는 조건을 분리한 후 재검증했다.
검사 조건·timeout·retry·skip을 완화하지 않았으며 공개 글·사용자 개발 서버·stash·다른 작업 트리·NAS는 변경하지 않았다.

원시 trace·cache event·브라우저 프로필·운영 로그는 비공개로 보존한다.
최초에는 `.publication-review.json` 해시를 자체 승인하거나 갱신하지 않았다.
11-03 사용자가 진단·테스트 6개와 운영 문서 7개 및 검수 해시 기록의 공개를 명시 승인했다.
원시 자료·계정 준비·토큰 발급·보호 설정 변경은 제외하며 승인된 최종 stage bytes만 기록한다.
중요한 공개 계약이나 컴포넌트 책임 변경이 없어 새 ADR은 만들지 않는다.
기존 PR #75의 정책 설계·충돌 해결·서버 적용은 이 작업에서 대신 수행하지 않았다.

각 Jira의 기존 기록을 보존하면서 3열 표의 후속 결과를 추가하고 재조회했다.
[Confluence 후속 댓글](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817?focusedCommentId=14188545)에 결정과 남은 범위를 연결했다.
페이지 본문과 사용자의 미게시 변경은 수정하지 않았다.

## Open Questions

- 통제한 in-flight 늦은 쓰기는 관측했지만 과거 최초 stale 진입 계기는 미확정이다. 게시 revision 설계가 필요한지 추가 검토한다.
- 과거 deployment 로그 재조회는 실패했다. 최근 1시간 error 0건으로 과거 fetch 실패 2건의 원인이 해소됐다고 선언하지 않는다.
- 실제 사용자 프로필·Safari·실기기·OS IME·VoiceOver/NVDA 검증은 남아 있다.
- 별도 macOS 계정과 사람 전용 키 발급 환경은 사용자 준비 대기다. App 설치·권한의 실제 대조와 승인 거부 동작은 미검증이다.

## Next

승인된 범위만 캐시 순서 진단·안전한 오류 진단·문서로 나누어 커밋한다.
푸시한 리비전의 CI·리뷰와 최종 squash 메시지를 검사한 뒤 main 병합·Git 자동 배포를 확인한다.
로컬 파일 직접 업로드나 미검증 배포 성공 표시는 하지 않는다.
운영 오류가 다시 관측되면 배포·요청 식별과 새 안전 진단을 결합한다.
계정이 준비되면 설치 토큰 신원·관리자 자료 접근 차단부터 확인하고, 그 뒤 PR #75와 실제 사람 승인 게이트를 검토한다.
