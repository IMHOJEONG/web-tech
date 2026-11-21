# JavaScript 현대화 후보 4곳 실제 적용

## Summary

사용자가 실제 적용과 타입·회귀·기록 갱신을 요청해 timeout·배열·Promise 2곳을 수정했다. 오탐인 Set 변환 정렬은 유지했다. 기존 [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)의 후속 작업이며 전날의 분석·문서화 기록을 보존한다.

## Changed

- [실제 변경·회귀 보고서](../../verification/integration/2026-11-21-modern-javascript-implementation.md)에 네 지점, Node 진입점별 lib, readonly 경로 회귀와 브라우저 검사 원본을 연결했다.
- 기존 [시간 제한](../../knowledge/infra-tooling/javascript-abort-timeout.md)·[배열](../../knowledge/infra-tooling/javascript-copying-arrays.md)·[Promise](../../knowledge/infra-tooling/javascript-promise-with-resolvers.md)의 상태를 로컬 적용으로 갱신했다.
- 저장소 지식·검증·artifact·월별 목차에 실제 적용과 이전 분석을 구분해 연결했다.

## Notes

- 브랜치 `feature/modern-web-guidance`, 기준 HEAD `c6465f48c96aef681a42de77a584b25e69fd8525` + 로컬 작업 트리. 기존 docs 앱·원고 미리보기·문서·미추적 스킬의 변경을 삭제·되돌리지 않았다. 인덱스를 변경하지 않았다.
- 앱·Node 2진입점 타입 검사, 관련 Node 46개·앱 36개, API Chromium 7조건, 실제 DB/production build 통합 26그룹과 정리 6단계, 기존 의미 비교 16조건, 앱 lint가 통과했다. 초기 타입·서버 정리·Docker 권한 실패와 복구는 보고서에 구분했다.
- 재사용 지식: 실제 타입 진입점에서 선언 부족을 확인한 뒤 lib를 해당 범위에만 추가했다. 브라우저 timeout은 헤더뿐 아니라 부분 본문 대기도 검사해야 한다. 외부 gate는 해제 함수의 초기화·finally 범위를 함께 보존했다. 기존 Confluence 주제 3개에 이 판단을 반영하며 새 중복 주제를 만들지 않는다.
- Confluence [시간 제한](https://web-tech-service.atlassian.net/wiki/pages/20676655)·[배열](https://web-tech-service.atlassian.net/wiki/pages/20119630)·[Promise](https://web-tech-service.atlassian.net/wiki/pages/20250653)와 [상위 지식](https://web-tech-service.atlassian.net/wiki/pages/19464193)의 게시 버전 3 본문·현재 적용·근거·연결을 재조회했다. 주제 ancestors의 운영 안내 → 상위 지식 경로도 확인했다.
- 문서·artifact 11개의 기존 `validate()` 작업 트리 검사 오류 0건, 선택 코드·설정·문서 18파일 Prettier·diff 검사 통과. 증거의 9소스 해시와 현재 bytes가 일치하며 인덱스는 미변경이다.
- Jira의 실제 적용 댓글 `10124`를 갱신하고 HTML로 재조회해 `항목 | 상태 | 결과 및 남은 작업`의 실제 3열 표·검증 수치·지식 링크 4개를 확인했다. 기록 대기는 없다. 전날 분석 댓글 `10120`과 최초 도입 이력, 이슈의 검토 중 상태는 보존했다.
- ADR-0017의 패널 격리·재시도·8초 제한을 유지한다. 구조·데이터 흐름·공용 컴포넌트 책임이나 새 장기 정책을 도입하지 않아 새 ADR은 없다. readonly 인자는 기존 배열 호출도 계속 허용하는 타입 확장이다.
- 공통 지침의 로컬/원격 반영: 이번에는 AGENTS·공통 TypeScript base·공통 프로세스 지침을 수정하지 않았다. 초기 구현·검증 단계에서는 실제 코드·문서의 Git 커밋·푸시·PR·main 반영·배포를 수행하지 않았다. 아래 공개 준비 후속과 구분한다.

- 공개 준비 후속: 사용자가 이번 개선과 관련 문서만 분리해 공개 검수 후 커밋·푸시·PR 생성과 CI 확인을 명시 요청했다. 최신 main `2cf837f04954d05d5ff409bdec6794ec28fd7f07` 기반 `codex/modern-javascript-implementation-20261121`의 별도 worktree에서 코드·설정·검사 8파일과 관련 문서·정제 증거·목차 14파일을 선택했다. 원본 작업 트리의 다른 변경과 인덱스는 보존한다. 분리한 후보에서도 타입 3진입점·관련 46개·앱 36개·API 7조건·통합 26그룹·정리 6단계·의미 비교 16조건·앱 lint가 통과했다.
- 공개 검수: 실제 비밀값·개인 경로·원고·스크린샷·실제 서비스 응답을 제외하고 합성 재현 코드·판정·조건·실패·한계만 확인했다. 비공개 원시 자료의 로컬 위치는 공개본에서 제거했다. 사용자 승인 범위와 최종 staged bytes의 SHA-256을 `.publication-review.json`에 기록한다. 외부 스킬·기존 다른 작업의 코드/문서·원시 자료는 포함하지 않는다. 첫 공개 검사에서 artifact README를 증거 종류로 분류한 불일치를 확인해 Markdown 문서 종류로 바로잡았다. 검수 대상 bytes나 검사 규칙을 우회하지 않았다.

- 원격 반영: 코드·검증·문서 22파일과 공개 검수 manifest만 `905b57fd892e10dcc4af2df728e2c22704de03f6`로 커밋·푸시하고 [PR #106](https://github.com/IMHOJEONG/web-tech/pull/106)을 생성했다. GitHub 연결 도구의 생성 권한 403은 기존 GitHub CLI로 복구했고 원격 PR head·main base·Jira/Confluence 연결·23개 diff 경로를 재조회했다.
- 커밋 전 공개·staged 포맷·문서·diff와 커밋 훅, 실제 pre-push 공개 검사가 통과했다. 원본 작업 트리 파일 248개의 해시와 인덱스가 분리 전과 같음을 확인했다.
- PR 생성 시점 CI는 실행 중이었다. 최종 head의 원격 결과는 [PR checks](https://github.com/IMHOJEONG/web-tech/pull/106/checks)와 [Jira 실제 적용 댓글](https://web-tech-service.atlassian.net/browse/KAN-83?focusedCommentId=10124)의 마감 표에서 확인한다. 이전 SHA의 성공을 새 head 결과로 대신하지 않는다.

## Open Questions

- 다른 브라우저·모바일 실기기·bfcache와 실제 운영 적용은 이번 검증 범위 밖이다.

## Next

- main 병합과 운영 배포는 이번 사용자 승인 범위에 포함하지 않았다. 원격 CI·리뷰 결과는 같은 PR과 Jira에서 관리하고 실제 병합·배포 시 적용 상태를 별도로 갱신한다.
