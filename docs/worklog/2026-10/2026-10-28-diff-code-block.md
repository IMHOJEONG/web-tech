# Diff 코드 블록의 추가·삭제 표시

## Summary

[KAN-45](https://web-tech-service.atlassian.net/browse/KAN-45). diff가 일반 텍스트로 보이는 문제를 경량 공통 하이라이터에서 보완했다. 로컬 MDX·Shiki·원격 HTML 모두 추가/삭제와 메타데이터를 구분한다. 최신 main 기반 전용 브랜치이며 앞선 PR·다른 작업 트리의 수정은 보존한다.

## Changed

- diff/patch 행 분류·HTML escape·원문 기호 보존과 두 테마의 행 배경/경계선.
- Shiki의 언어 클래스 보존 및 해당 diff 표면의 중복 스타일 덮어쓰기 방지.
- 로컬/원격 접힌 미리보기·원문 복사·키보드·JS 비활성·고대비·가로 넘침 회귀.
- 기존 [작성 정책](../../architecture/docs-content-authoring-markup-policy.md#코드-변경분-표시)에 펜스 예시와 자동 추측 금지를 추가했다.

## Notes

Node 315개와 브라우저 22개가 통과했고 타입·변경 파일 lint도 통과했다. 중간 검사 도구 실패와 상세 실행 조건은 [검증 보고서](../../verification/accessibility/2026-10-28-diff-code-block.md)를 따른다. 새 라이브러리·공통 설정·백엔드·블로그 초안은 변경하지 않았다.

[Jira 댓글 10037](https://web-tech-service.atlassian.net/browse/KAN-45?focusedCommentId=10037)의 모든 행이 실제 3열 표인 것을 재조회했다. [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817) v185는 이전 본문 보존·새 요약 1개를 확인했다. 로컬 구현·미커밋 상태만 기록했고 존재하지 않는 원격 커밋 링크는 만들지 않았다.

## 로컬 화면 후속 확인

커밋 `a2e2f271`을 푸시하고 [PR #74](https://github.com/IMHOJEONG/web-tech/pull/74)를 생성했다. 이후 사용자가 로컬 화면 확인을 우선 요청했다. 실제 개발 서버에서 Turbopack이 Shiki transformer 함수를 직렬화하지 못하는 문제를 발견해 빌드용 순수 데이터 옵션과 본문 runtime 옵션으로 분리했다. 추가 회귀를 포함한 Node 316개·앱 typecheck·변경 3파일 lint가 통과했다.

3039 개발 서버에서 실제 블로그 레이아웃을 렌더링하고 Chromium 데스크톱·모바일 × 두 테마 4조합의 표시·키보드 접기·전체 복사·가로 넘침을 확인했다. 기존 3001 서버는 종료하지 않았다. 개발 전용 임시 draft는 공개 목록·검색 및 커밋에서 제외한다. 상세 결과는 [검증 보고서](../../verification/accessibility/2026-10-28-diff-code-block.md#실제-개발-서버-후속-확인)를 따른다. 후속 수정은 아직 미커밋이며 원격 CI·배포 성공으로 보고하지 않는다.

## Open Questions

실기기·타 브라우저·production build/배포는 미검증이다. 언어 metadata가 사라진 원격 응답은 원문 서버에서 언어 지정이 필요하다.

## Next

최초 구현 요청에서는 커밋·배포하지 않았다. 이후 사용자 승인으로 이번 diff 수정·회귀·관련 문서 17파일만 커밋·푸시하고 main 대상 별도 PR을 준비한다. 기존 작업 트리의 27파일은 해시를 보관해 보존 여부를 대조한다. 실제 원격 SHA·PR·CI 결과는 같은 KAN-45와 Confluence에 후속 기록하며, 앞선 로컬 성공을 원격 결과로 대체하지 않는다. main 병합·NAS 교체·운영 배포는 이번 승인 범위가 아니다.

전용 `test:code-block` 22개는 로컬 검증이며 현재 공통 CI가 직접 호출하지 않는다. 원격에서는 기존 라이브러리·반응형·상세·공용 UI 검사 범위를 확인한다. 이번 기능 PR에서 공통 CI 설정을 임의로 확대하지 않는다.

사용자 화면 확인 후 Turbopack 보완 커밋·푸시 승인을 받았다. 코드 3파일과 같은 주제의 검증·작업 기록만 스테이징한다. 미리보기 draft는 경로와 SHA-256으로 보존 여부를 대조하고, 다른 작업 트리·stash는 조작하지 않는다. Node 316개·타입·변경 3파일 lint를 재검증했다. 브라우저 검사 최초 재실행의 샌드박스 권한 거부와 이전 CI의 loader 오류/별도 생성기 타임아웃은 [후속 검증](../../verification/accessibility/2026-10-28-diff-code-block.md#후속-수정-게시-전-재검증)에 구분했다. 푸시 후 새 head 기준 CI·Preview를 조회하며 main 병합은 진행하지 않는다.
