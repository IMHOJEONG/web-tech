# ADR 상태와 문서 생명주기 점검

## Summary

ADR 6개의 현재 상태·대체 관계를 점검하고 코드 반영과 배포 검증을 구분했다. 일반 문서도 역할별로 상태를 해석하도록 관리 기준을 보완했다.

## Changed

- [설계 목록](../../architecture/README.md)에 ADR 상태·적용 범위 표를 정리했다. 0001·0002는 대체됨, 0003~0006은 적용 중이다.
- ADR-0001·0002의 상태 메타데이터를 한국어 공통 형식으로 맞추고 후속 결정을 명시했다. 당시 결정·후속 과제 본문은 보존했다.
- ADR-0006의 적용 위치를 PR 단계에서 main 병합 상태로 갱신했다. `upstream`이 두 문단으로 끊어진 오탈자도 복구했다. 외부 소비 모노레포와 전이 의존성 후속 범위는 완료로 처리하지 않았다.
- ADR-0004에 최근 About 소개 문구 정리 기록을 연결했다. 기존 결정의 변경이 아니므로 새 ADR을 만들거나 검토일을 일괄 변경하지 않았다.
- [문서 품질 기준](../../process/documentation-quality-gates.md)에 ADR·정책·절차·검증·작업 기록·TODO의 상태 관리 책임과 변경 순서를 추가했다. [템플릿](../../process/documentation-templates.md)에는 ADR 전용 상태와 대체 관계 필드를 명확히 했다.

## Notes

2026-09-23, `feature/docs`에서 다음 근거를 확인했다.

- `git fetch origin` 후 `git log origin/main -4 --oneline`: 공용 UI PR #32의 main 병합 커밋은 `41a6ba5`, 블로그 PR #33은 `677bfe1`이다.
- `git show origin/main:packages/ui/package.json`: Base UI 의존성과 dist exports를 확인했다.
- `git merge-base --is-ancestor 41a6ba5 HEAD`: 종료 코드 0으로 현재 브랜치 포함을 확인했다.
- `/feed`·`/docs` 라우트의 MainFeed·DocsIndex 분리, About의 본문 전용 구성, feed·UI/UX의 DocumentPreviewCard 소비를 현재 코드와 대조했다.
- 기존 Obsidian 연결 문서의 미커밋 변경은 이번 상태 관리 작업과 분리해 남긴다. 외부 vault는 읽거나 수정하지 않았다.

`mise exec -- pnpm validate:docs --staged`와 `mise exec -- pnpm format:staged:check`는 커밋 전 인덱스 기준으로 통과했다. 기존 문서의 미해결 형식 문제는 증가하지 않았다. 이번 변경은 문서 전용이며 앱 빌드·운영 배포를 다시 검증하는 작업이 아니다. 앞선 About 코드 변경 검증은 [해당 작업 기록](2026-09-23-about-intro-label.md)을 따른다.

## Open Questions

ADR 이외의 일반 architecture 문서 전체를 실제 구현과 대조한 것은 아니다. 기존 정책의 형식과 검토일은 관련 작업 때 점진적으로 정리한다. 문서 검사 도구는 코드·배포 상태의 사실 여부를 자동 판정하지 않는다.

## Next

문서 변경을 별도 커밋하고 앞선 About 커밋과 함께 `origin/feature/docs`에 일반 푸시한다. 운영 배포 완료 여부는 푸시 성공과 별도로 확인한다.
