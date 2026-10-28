# 로컬·원격 본문 H1 경고 전환

## Summary

사용자 승인으로 본문 H1을 게시 차단에서 편집 경고로 낮춘다. [KAN-37](https://web-tech-service.atlassian.net/browse/KAN-37)의 최신 main4e80275 기반 별도 브랜치에서 작업하며 NAS 진단·보안 변경·다른 세션 미커밋은 보존한다.

## Changed

- 공용 body-style에서 H1은 warnings로 반환하고, 첫 heading H1을 별도 규칙으로 다시 차단하지 않는다. H4~H6 시작·제목 단계 건너뛰기·주석/펜스/callout 실패는 유지한다.
- 공유 계약·로컬 어댑터·실제 CLI·원격 API의 회귀를 보완했다. API 목록/상세200·경고 로그·HTML H1과 원문 보존을 확인하며 자동 H2 변환은 없다.
- 작성 정책·기고 가이드·렌더링 출력 계약을 맞추고 [검증 보고서](../../verification/content/2026-10-25-body-h1-warning.md)·동일 입력 전후 증거·목차를 연결한다.

## Notes

공용26·로컬36·백엔드13+39·docs lib285·저장소153개가 통과했다. 실제 콘텐츠19개·관련 lint·타입·ESM/CJS/Nest build도 통과했다. 최초 sandbox 포트 제한·store 접근 실패와 CLI fixture symlink 실패는 검증 보고서에 후속 성공과 구분했다. 테스트 조건을 완화하거나 기존 placeholder 경고를 제거하지 않았다.

새 아키텍처 도입이 아니라 기존 공용 검사기의 실패/경고 경계 변경이므로 기존 정책을 갱신하며 새 ADR은 만들지 않는다. KAN-35의 NAS 진단과 연결하되 패키지 보안 조치의 완료 조건과 혼합하지 않는다. Jira·Confluence는 로컬 반영과 운영 미배포 상태를 명시한다.

## Open Questions

앞선 HTML Content-Type·JSON404 경고는 별도 후속이다. H1 외의 본문 실패나 metadata 문제는 여전히 게시를 막으며 이번에 완화하지 않는다. 전체 Markdown AST 검사로 확장하지도 않는다.

## Next

최초 구현·검증 단계에서는 커밋·푸시·병합·배포·NAS 파일 변경·웹훅 호출을 하지 않았다. 이후 사용자 승인으로 이번 H1 변경과 회귀·정책 문서만 하나의 커밋으로 묶어 현재 작업 브랜치에 푸시한다. 기존 NAS 진단 worktree의 미커밋 문서는 포함하지 않는다. 실제 원격 SHA와 저장 결과는 같은 KAN-37·Confluence에 기록한다.

PR·main 병합·운영 배포는 이번 승인 범위에 없다. NAS에 적용하려면 변경된 공용 패키지를 포함한 이미지 게시·교체 후 실제 H1 문서 목록/상세를 재검증해야 한다.
