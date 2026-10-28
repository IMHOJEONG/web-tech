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

## Open Questions

실기기·타 브라우저·production build/배포는 미검증이다. 언어 metadata가 사라진 원격 응답은 원문 서버에서 언어 지정이 필요하다.

## Next

최초 구현 요청에서는 커밋·배포하지 않았다. 이후 사용자 승인으로 이번 diff 수정·회귀·관련 문서 17파일만 커밋·푸시하고 main 대상 별도 PR을 준비한다. 기존 작업 트리의 27파일은 해시를 보관해 보존 여부를 대조한다. 실제 원격 SHA·PR·CI 결과는 같은 KAN-45와 Confluence에 후속 기록하며, 앞선 로컬 성공을 원격 결과로 대체하지 않는다. main 병합·NAS 교체·운영 배포는 이번 승인 범위가 아니다.

전용 `test:code-block` 22개는 로컬 검증이며 현재 공통 CI가 직접 호출하지 않는다. 원격에서는 기존 라이브러리·반응형·상세·공용 UI 검사 범위를 확인한다. 이번 기능 PR에서 공통 CI 설정을 임의로 확대하지 않는다.
