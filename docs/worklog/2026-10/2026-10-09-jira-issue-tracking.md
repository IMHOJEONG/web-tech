# Jira 우선 과제 등록과 Confluence 연결 확인

## Summary

2026-10-09 사용자가 제공한 Confluence 사이트에서 공간 접근을 다시 확인하고, KAN에 에픽 1개와 작업 9개를 등록했다. 저장소의 TODO와 PR 템플릿을 이슈 추적에 연결한다.

## Changed

- Confluence 공간 목록·공간 정보·페이지 목록 조회가 성공했다. 개인 공간 `임호정`과 기존 페이지 2개를 확인했으며 페이지를 변경하거나 새로 게시하지 않았다.
- [KAN-1](https://web-tech-service.atlassian.net/browse/KAN-1)에 KAN-2~KAN-10을 자식 작업으로 생성했다. 앱 라벨 5종, 우선순위 라벨, 완료 조건과 근거 문서를 포함한다.
- 이미 병합된 PR #36 보안 변경을 재구현 이슈로 중복 등록하지 않았다. 남은 배포 검증과 main의 glob 제거를 별도 작업으로 분리했다.
- NAS 게시와 외부 백업은 `on-hold`로 등록하고 사용자 재개 승인 조건을 보존했다.
- [이슈 추적 규칙](../../process/issue-tracking.md), [TODO 이슈 목차](../../todo/todo.md#jira-우선-과제), PR 연결 항목을 추가했다. 기존 미커밋 변경과 미푸시 커밋은 보존했다.

## Notes

등록 전 JQL `project = KAN ORDER BY created DESC`는 기존 이슈 0개를 반환했다. 생성 후 `project = KAN AND labels = backlog-2026-10 ORDER BY key ASC`로 10개를 재조회했다. 작업 9개의 parent가 KAN-1이고 앱·우선순위·보류 라벨 및 완료 조건이 유지됨을 확인했다. 모두 `해야 할 일`이고 담당자는 미지정이다.

기본 도구의 생성 필드 조회는 tool not found로 실패했지만 발견된 동일 작업을 generic read로 호출해 성공했다. Task 생성 필드에 priority가 노출되지 않아 우선순위를 라벨로 관리한다. Jira 기본 Priority나 workflow·권한은 변경하지 않았다.

근거 링크는 원격에 실제 존재하는 feature/docs `e441e53` 문서만 사용했다. 미푸시 c000e41의 게시 검증 자료는 파일 경로와 로컬 전용 상태를 적고 없는 GitHub 링크를 만들지 않았다.

문서 검사기 테스트 17개, 변경한 6개 파일의 Prettier 검사, 작업 트리 snapshot을 사용한 문서 delta 검사, `git diff --check`를 통과했다. delta 검사로 새 링크·필수 섹션·목차 연결을 확인했으며 실제 Git 인덱스는 변경하지 않았다. TODO 포맷 전에는 새 Jira 섹션 외의 본문이 변하지 않는지도 비교했다. 앱 실행 코드 변경이 없어 앱 빌드·E2E를 다시 실행하지 않았으며, 커밋·푸시는 이번 요청에 포함하지 않았다.

서비스 코드·공개 계약·공용 UI 책임은 바뀌지 않아 새 ADR은 만들지 않았다. 이 작업은 GitHub 자동 연동·Confluence 문서 게시·배포 성공의 증거가 아니다. 자격증명·인증 응답·개인 계정 ID를 저장하지 않았다.

## Open Questions

Confluence 공용 공간, 앱별 저장 필터, GitHub 자동 연동과 기본 Priority 사용은 아직 결정·설정하지 않았다. TODO 전체 이전도 이번 범위가 아니다.

## Next

KAN-2와 KAN-3의 보안 후속 검증을 우선 진행한다. 공통 정책·PR 템플릿은 승인 후 main 기반 PR로 반영한다. KAN-9·KAN-10은 기존 보류 조건이 해소되고 사용자가 재개를 승인할 때만 착수한다.
