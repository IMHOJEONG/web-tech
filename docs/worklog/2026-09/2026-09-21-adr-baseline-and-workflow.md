# 현재 결정의 ADR 기준선과 작성 절차

## Summary

`feature/docs`의 현재 커밋에서 확인한 핵심 결정을 ADR로 분리하고, 이후 작업에서 ADR 충돌·작성 필요성을 점검하는 절차를 도입했다.

## Changed

- 초기 ADR-0001/0002의 본문은 보존하고 상태를 대체됨으로 갱신했다.
- [ADR-0003](../../architecture/adr-0003-feed-and-docs-roles.md)은 `/feed`와 `/docs`의 역할, [ADR-0004](../../architecture/adr-0004-about-content-and-shared-shell.md)는 About과 셸, [ADR-0005](../../architecture/adr-0005-document-preview-card-boundary.md)는 카드 재사용 경계를 기록한다.
- [ADR 관리 규칙](../../process/adr-management.md), [템플릿](../../process/documentation-templates.md), 저장소 `AGENTS.md`에 작업 전후 판단 기준을 연결했다. `CLAUDE.md`는 `AGENTS.md`를 참조하므로 별도 중복 규칙을 만들지 않았다.
- [문서 UI 재사용 정책](../../architecture/docs-document-ui-reuse-policy.md)의 현재 구현 설명을 맞췄다.

## Notes

현재 커밋과 기존 정책·코드가 함께 뒷받침하는 결정만 소급 기록했다. 모든 과거 커밋을 ADR로 변환하지 않았다. 다른 작업의 미커밋 허브 변경은 포함하지 않았다. 링크·문서 형식과 변경 범위를 검사한다.

## Open Questions

없음. 다른 주제의 오래된 정책 문서는 해당 영역을 다음에 변경할 때 점진적으로 검토한다.

## Next

앞으로 구조·계약·책임 경계 변경 시 관련 ADR을 먼저 확인하고, 새 선택 또는 대체 결정만 별도 ADR로 기록한다.
