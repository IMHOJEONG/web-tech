# 게시 글 주간 점검 기록 분리

## Summary

10-28에 수행한 게시 글 세 편의 공개 화면·본문·예제 점검을 보존 기록에서 분리했다. 10-29의 전체 미커밋 정리에서는 개인 경로와 원시 캡처를 제외한 요약만 옮겼으며 새 검사를 했다고 기록하지 않는다.

## Changed

- [당시 검증 보고서](../../verification/content/2026-10-28-weekly-article-maintenance.md)와 정제 집계를 연결했다.
- 최초 TCP 복제본 불일치와 동기화 후 통과를 구분했다. 게시 원문을 수정하거나 재배포하지 않았다.
- 원본 로그·캡처·초안 상태의 사본은 비공개 보관했다. 보존 브랜치 전체나 미승인 글을 공개 대상으로 가져오지 않았다.

## Notes

원래 작업은 [KAN-18](https://web-tech-service.atlassian.net/browse/KAN-18)이며 당시 Jira·Confluence 기록을 갱신했다. [KAN-51](https://web-tech-service.atlassian.net/browse/KAN-51)에서 보존 커밋 `d511f1f`의 수치·한계를 정제 이관했다. 현재 코드·원격 서비스의 재검증이 아니며 앱 구조 변경이나 새로운 ADR은 없다.

## Open Questions

원격 API·알림·실기기·운영 패치 적용은 이 주간 점검으로 보장하지 않는다. `drain` 조기 종료는 별도 검토다.

## Next

다음 점검은 당시 날짜와 현재 상태를 구분해 기록한다. 당시 draft였던 Brotli는 이후 게시됐으므로 옛 메타데이터를 다시 적용하지 않는다.
