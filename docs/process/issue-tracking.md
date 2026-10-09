# Jira 이슈 추적과 저장소 문서 연결

## 목적과 현재 적용

2026-10-09부터 KAN 프로젝트에 우선 과제를 등록한다. 적용 범위는 1차 에픽과 작업 9개이며 전체 TODO 이전이나 GitHub 자동 동기화는 아니다.

- [Jira 에픽 KAN-1](https://web-tech-service.atlassian.net/browse/KAN-1): 운영 검증과 공용 플랫폼 후속 개선.
- [Confluence 개발·운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira): 개인 공간 `임호정`에 도구별 역할, 앱 분류, Jira 과제와 저장소 문서 입구를 게시했다. 기존 페이지·공간 권한은 변경하지 않았고 별도 공용 공간은 만들지 않았다.
- 토큰·계정 비밀번호·인증 헤더는 저장소나 이슈에 기록하지 않는다. 연결 도구의 계정 권한을 사용한다.

## 역할과 원본

- Jira는 등록된 작업의 진행 상태, 우선순위, 완료 조건, 보류 사유의 원본이다.
- 저장소 `docs/architecture/`, `docs/runbooks/`, `docs/verification/`는 기술 결정·절차·실행 증거의 원본이다. Jira에서 해당 문서와 커밋을 연결한다.
- [TODO](../todo/todo.md)는 탐색용 이슈 목차와 아직 이전하지 않은 후보를 유지한다. Jira로 옮긴 작업의 상태를 별도 수동 복제하지 않는다.
- Confluence는 프로젝트 배경·논의·운영 안내와 저장소 원본을 연결하는 입구로 사용한다. 기술 결정·절차·검증 결과 전체를 복제하거나 Jira 상태를 수동으로 재작성하지 않는다.
- 오래된 TODO 체크박스만 보고 미구현을 판단하지 않는다. 코드·병합·검증 결과와 대조하고 중복 이슈를 만들지 않는다.

## 분류와 우선순위

앱 분류는 Jira Component가 아니라 라벨로 적용했다. 여러 앱에 걸친 작업은 라벨을 복수 사용한다.

| 라벨           | 범위                           |
| -------------- | ------------------------------ |
| `docs`         | 블로그 프론트·검색·콘텐츠 이용 |
| `docs-backend` | 콘텐츠 API·NAS 게시·푸시 저장  |
| `ui`           | 공용 UI·외부 소비·접근성       |
| `vuln-radar`   | 프론트와 백엔드의 서비스 과제  |
| `infra`        | CI·배포·보안 의존성·백업·관측  |

공통 라벨은 `web-tech`, 이번 이전 묶음은 `backlog-2026-10`이다. 우선순위는 `p1`·`p2`·`p0-gate` 라벨로 기록한다. 현재 작업 생성 필드에는 priority가 노출되지 않아 Jira 기본 Priority를 수정하지 않았다. `p0-gate`는 공개 활성화 전 필수 조건이며 현재 사고나 악용 관측을 뜻하지 않는다.

## 작업 생명주기와 완료

프로젝트의 현재 상태는 `해야 할 일 → 진행 중 → 검토 중 → 완료`다. 작업 시작과 실제 검토 시점에만 전환한다.

- 이슈에는 배경·현재 구현 상태·완료 조건·근거 문서·실행 제약을 기록한다.
- 버그는 재현 환경·순서·기대/실제 결과·회귀 검사까지 포함한다. 미검증 과제를 확인된 버그로 등록하지 않는다.
- PR 템플릿에 Jira 키/URL과 이번 PR에서 닫는 완료 조건을 적는다. 브랜치는 기존 [브랜치 정책](branch-policy.md), 커밋은 기존 [커밋 규칙](commit-message-convention.md)을 따른다.
- 구현 완료·PR 병합·배포 성공·운영 검증은 다르다. 배포 검증 과제는 PR 병합만으로 완료하지 않는다.
- 완료 전 해당 커밋/배포 ID, 검사 명령과 관측 결과, 미검증 범위를 verification에 남기고 Jira에 연결한다.
- 이슈를 등록했다는 이유로 담당자·기한·스프린트를 지정하지 않는다.

보류는 이번에 새 workflow 상태를 만들지 않고 `on-hold` 라벨과 제목·설명으로 표시한다. Jira 상태는 `해야 할 일`에 유지한다. KAN-9는 NAS SSH 차단, KAN-10은 외부 백업 저장소 미구축이 사유다. 사용자 재개 승인 전 실행하지 않는다. 재개 시 라벨과 사유를 함께 갱신한다.

## 검색과 중복 방지

Jira 고급 검색에 아래 JQL을 사용한다. 앱 라벨을 바꾸면 다른 앱을 볼 수 있다.

```text
project = KAN AND labels = docs ORDER BY created DESC
project = KAN AND labels = p1 AND statusCategory != Done ORDER BY created ASC
project = KAN AND labels = "on-hold" ORDER BY key ASC
parent = KAN-1 ORDER BY key ASC
```

Jira의 기본 Priority는 위 라벨 우선순위와 다르므로 초기 목록을 `priority`로 정렬하지 않는다. 라벨별 저장 필터·대시보드는 아직 만들지 않았다.

새 등록 전 KAN의 이슈 제목·라벨·설명을 검색한다. 각 작업 설명 끝의 `web-tech:<주제>` 추적 ID를 비교한다. 생성 응답이 불명확하면 다시 검색한 뒤 복구하고, 즉시 재생성하지 않는다. 이 추적 ID 자체는 서버의 idempotency 보장이 아니다.

## 연결 범위와 후속 과제

Confluence 안내의 게시 여부·역할·링크를 갱신할 때는 저장된 페이지를 다시 읽어 확인한다. 현재 안내는 등록 시 확인한 GitHub 커밋의 문서 링크를 사용한다. 미커밋·미푸시 문서를 존재하는 원격 문서처럼 연결하지 않는다. 저장소 원본이 변경되어 안내의 의미가 달라지면 요약과 링크를 함께 갱신한다. 페이지는 기존 공간의 공개 범위와 권한을 따르며 별도 공개 공유를 켜지 않는다.

현재는 대화 도구를 통한 생성·조회와 PR 본문 수동 연결이다. GitHub for Atlassian 설치, 브랜치/PR 자동 연결, 머지 시 자동 전환, CI 실패 자동 티켓, 양방향 동기화는 미설정이다. Jira 이슈 키를 PR에 쓴 것만으로 자동 연결이 완료됐다고 표시하지 않는다.

공통 템플릿·정책의 main 반영은 사용자 승인 후 별도 커밋/PR로 진행한다. 전체 TODO를 일괄 이전하거나 외부 서비스를 자동 변경하지 않는다.

## 관련 기록

- [도입 작업 기록](../worklog/2026-10/2026-10-09-jira-issue-tracking.md)
- [Confluence 안내 게시 기록](../worklog/2026-10/2026-10-09-confluence-project-guide.md)
- [문서 역할과 구조](documentation-organization.md)
- [문서 품질 검사](documentation-quality-gates.md)
