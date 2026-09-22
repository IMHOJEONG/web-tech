# 공용 UI와 블로그 PR 분리

## Summary

장기 `feature/docs`의 블로그 변경을 공용 UI 전파와 분리한다. 공용 UI PR은 `origin/main`의 `c87fe59`에서 만들고, 블로그 PR은 그 브랜치를 기준으로 쌓는다.

## Changed

- 공용 UI·cn·shadcn 설정·직접 의존성 정리와 독립 UI 테스트만 옮긴다.
- main에 있던 CategorySidebar는 `asChild`를 `render`로 바꾸고 라우팅은 유지한다.
- 순수 variant 클래스가 포함되도록 Tailwind source 경로를 추가한다.
- 블로그 콘텐츠·페이지 개편·로케일·인증·캐시 변경은 포함하지 않는다.
- 원래 작업 폴더의 미커밋 Obsidian 문서는 제외하고 보존한다.

## Notes

API 변경과 한계는 [ADR-0006](../../architecture/adr-0006-shared-ui-base-ui.md), 분리 후 검사 결과는 [검증 보고서](../../verification/content/2026-09-22-shared-ui-main-baseline.md)를 따른다. 이전 feature/docs에서 통과한 검사를 main 기반 브랜치의 결과로 대신하지 않는다.

## Open Questions

Prisma Studio의 Radix 전이 경로, 외부 소비 모노레포, 실제 모바일·스크린 리더 검증이 남아 있다.

## Next

공용 UI PR을 main에 먼저 병합한다. 그 다음 블로그 PR의 base를 main으로 변경하고, squash merge였다면 main을 블로그 브랜치에 merge하여 조상을 맞춘 뒤 diff와 CI를 재확인한다. 다른 feature 브랜치도 main을 받아 API 호출부를 수정하고 각 앱을 검증한다. 이번 작업에서는 main 병합이나 전체 브랜치 자동 동기화를 하지 않는다.
