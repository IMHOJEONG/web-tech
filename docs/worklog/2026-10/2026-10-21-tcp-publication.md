# 승인된 TCP 소켓 학습 문서 게시

## Summary

2026-10-21 사용자가 보존된 문서 게시와 CI 통과 후 PR 병합·Production 확인까지 승인했다. 최신 main 기반 게시 브랜치에서 기존 TCP 본문·도식을 유지하고 공개 메타데이터를 전환했다. [검증 보고서](../../verification/content/2026-10-21-tcp-publication.md)에 로컬 production 결과를 연결했다.

## Changed

- 대상 문서의 상태를 published로, 발행일·수정일을 10-21로 갱신했다. PR #49 리뷰 후 선택 캡처 예제의 EOF 종료와 안내를 보완했고, 도식·TCP 관측값은 유지했다.
- 기존 미커밋 TCP 준비·재검증 문서와 증거만 함께 보존하고 목차에 연결했다. 과거 draft 상태 기록은 덮어쓰지 않았다.
- 원래 `codex/docs-tcp-draft`의 미커밋 원본과 공통 지침·다른 운영 작업은 별도 보존한다. 해당 작업을 게시 PR에 섞지 않는다.
- [KAN-17](https://web-tech-service.atlassian.net/browse/KAN-17)과 [기존 Confluence 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)에 PR·원격 결과를 단계별로 기록한다. 이전 KAN-16의 로컬 검증 완료와 구분한다.

## Notes

실제 게시 MDX를 바인딩한 원문 테스트 14개, 콘텐츠 19개와 production build, 공개 상세 6개 화면 조건·도식·접기·clipboard·canonical·검색·sitemap·카드 이동, 저장소 테스트 58개를 통과했다. “임시 포트”의 placeholder 휴리스틱 경고는 기술 용어의 오탐으로 확인하고 그대로 기록했다.

리뷰의 EOF 대기 문제는 이전 코드에서 timeout으로 재현했고, 보완 후 EOF 두 경우와 정상 Enter·MDX 14개 검사를 재수행했다. 세 에이전트의 기술·초보자·한국어 재검토에서 Ctrl-D의 빈 입력 줄 조건도 반영했다. 새 관리자 캡처·구조 변경은 없고 ADR 추가 대상이 아니다. 원격 CI·배포 성공은 아직 로컬 결과와 구분해 후속 확인한다. Preview 준비 오류와 raw stream 검사기의 경계 가정 실패는 검증 보고서에 별도로 남겼다.

## Open Questions

PR 검토·main 병합·동일 SHA CI 및 Production 공개 반영 확인이 남아 있다. 다른 미커밋 운영 문서의 반영은 이번 게시 범위가 아니다.

## Next

문서·포맷·민감정보 검사 후 이번 변경만 커밋·푸시하고 PR을 만든다. 필수 검사와 리뷰를 통과하면 사용자 승인에 따라 병합하고, 운영 목록·검색·상세·도식을 확인한 뒤 Jira·Confluence 기록을 마감한다.
