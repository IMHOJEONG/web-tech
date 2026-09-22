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

### #32 병합 후 #33 재검증

- #32의 squash merge 결과인 main `41a6ba5`를 블로그 브랜치에 merge했다. 충돌은 이미 포함된 공용 UI 전환을 보존하면서 해결했다.
- 기존 #33 CI는 사이트맵 테스트의 고정 날짜와 새 문서의 품질 규격 누락으로 실패했다. 사이트맵 기대값을 실제 frontmatter의 `updatedAt`/`date`에서 읽도록 바꿨다. 원격 문서 날짜의 고정 fixture 검증은 유지한다.
- 문서 검사 기준은 완화하지 않았다. 역할별 필수 항목과 상대 링크를 보완했으며, 과거 측정값과 미검증 상태는 유지했다.
- 크기 제한을 넘긴 렌더링 trace는 gzip으로 무손실 압축했다. 압축 해제한 바이트와 이전 커밋 원본이 동일함을 확인했다.
- Node 24에서 `pnpm --filter docs test:lib` 149개와 `pnpm test:repo` 19개가 통과했다. 스테이징된 전체 PR diff를 main과 비교한 문서 검사도 통과했다.
- 전체 CI와 프로덕션 E2E는 이 수정 커밋 이후 다시 확인한다. 이전 실행 결과를 이번 실행의 성공으로 간주하지 않는다.

## Open Questions

Prisma Studio의 Radix 전이 경로, 외부 소비 모노레포, 실제 모바일·스크린 리더 검증이 남아 있다.

## Next

#32는 main에 병합되었다. #33의 base를 main으로 변경하고 diff와 CI를 재확인한다. 다른 feature 브랜치의 동기화는 별도 작업으로 진행한다. #33은 검토가 끝날 때까지 draft로 유지하며 자동 병합하지 않는다.
