# docs 배포 브랜치 CI 실행 범위 보강

## Summary

PR 없이 `feature/docs`에 직접 push할 때 기존 CI가 실행되지 않는 공백을 줄인다.
이번 작업은 개선 점검의 1번만 반영한다. 구현 단계에서는 로컬 설정을 검증했으며, 후속 커밋·push에서 원격 실행 여부를 별도로 확인한다.

## Changed

- `.github/workflows/ci.yml`과 `.github/workflows/documentation.yml`의 push 대상에 `feature/docs`를 추가했다.
- 기존 `main` push, PR 이벤트, 최소 읽기 권한과 각 workflow의 작업 구성은 유지했다.
- [브랜치 정책](../../process/branch-policy.md)에 현재 docs 배포 브랜치의 한시적 검사 범위와 CI·Vercel 배포의 독립성을 명시했다.
- [TODO](../../todo/todo.md)에 실제 원격 실행 확인을 남겼다. 공용 UI 전용 테스트 연결과 원격 본문 검증은 이번 변경에 포함하지 않았다.

## Notes

로컬 검증 환경은 Node 24이며 저장소 명령은 `mise exec --`로 실행했다.

- `apps/docs-backend`에 이미 설치된 `yaml` parser로 두 workflow의 YAML 구문과 push 대상 `main`, `feature/docs`를 확인했다. HEAD와 구조 비교하여 push 브랜치 배열 외의 이벤트·작업·권한이 그대로임을 검사했다.
- `pnpm test:repo`: 20개 통과.
- `pnpm exec prettier --check`에 이번 변경 6개 파일을 명시하여 통과했다.
- 기존 문서 validator에 HEAD와 이번 변경 문서만 제공하여 템플릿·링크 검사를 통과했다. 월별 목차의 기존 미커밋 링크는 검사 대상에서 제외했으며 Git 인덱스는 변경하지 않았다.
- `git diff --check`: 통과.

이는 로컬 설정 검증이며 GitHub runner의 lint·typecheck·전체 E2E 실행 결과가 아니다. 위 검증 시점에는 원격 Actions와 Vercel 배포를 실행하지 않았다.

기존 Better Stack·Obsidian 미커밋 변경은 유지한다. 앱 동작이나 공개 계약 변경이 아닌 기존 CI 적용 범위 보완이므로 새 ADR은 만들지 않는다.

## Open Questions

- PR이 열린 브랜치는 push·PR 검사가 중복 실행될 수 있다. 필수 PR 검사를 유지하며 최적화는 별도 과제로 둔다.
- Vercel Git 배포는 CI 성공을 기다리지 않는다. 배포 차단이 필요하면 별도 정책과 플랫폼 설정 검증이 필요하다.

## Next

push 이후 `feature/docs`의 같은 SHA에 `CI`와 `Documentation` 실행이 생성되는지 확인한다. 각 job 결과와 Vercel 배포 상태를 별도로 확인하고, 배포 후 사용자 화면 검증을 진행한다. 현재 단계에서 원격 실행 또는 배포 성공으로 표시하지 않는다.
