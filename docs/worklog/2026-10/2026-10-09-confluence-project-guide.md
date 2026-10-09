# Confluence 개발·운영 안내 게시

## Summary

2026-10-09 사용자의 요청으로 개인 공간 `임호정`에 [web-tech 개발·운영 안내: Jira와 기술 문서 연결](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)을 게시했다. Jira는 작업 상태, Confluence는 배경과 지식 공유, 저장소는 구현·기술 문서 원본으로 구분한다.

## Changed

- 기존 `개요` 아래에 새 페이지 1개를 게시했다. 페이지 ID는 `65817`, 최초 게시 버전은 `1`이다. 기존 페이지나 공간 권한은 변경하지 않았으며 별도 공개 공유를 켜지 않았다.
- 도구별 역할, 앱 라벨, KAN-1 에픽과 작업 9개, 문서·PR·검증 연결 순서, 저장소 문서 입구를 정리했다.
- KAN-9의 NAS SSH 차단과 KAN-10의 외부 저장소 미구축에 따른 보류를 경고 패널에 기록했다. 안내 게시가 실행 승인이나 완료를 의미하지 않음을 명시했다.
- [이슈 추적 규칙](../../process/issue-tracking.md)에 게시된 안내와 갱신 기준을 연결했다. 이전 Jira 등록 시점의 [작업 기록](2026-10-09-jira-issue-tracking.md)은 당시의 사실을 유지한다.

## Notes

Atlassian의 [Jira·Confluence 함께 사용하기](https://support.atlassian.com/confluence-cloud/docs/use-jira-and-confluence-together/)와 생성 도구의 HTML 형식 안내를 확인했다. 게시 전에 공간·기존 페이지·Jira 과제를 조회해 중복 안내와 없는 이슈 링크를 피했다.

생성 후 `getconfluencecontent`를 `content_id=65817`, `content_format=html`, `detail=full`로 호출했다. 저장된 페이지가 `current`, 버전 `1`이고 섹션 7개, KAN-1~KAN-10 링크, GitHub 원본 링크 5개, 보류 경고와 자동 연동 미설정 안내를 포함함을 확인했다. HTML 저장 내용 검증이며 실제 브라우저의 시각적 배치는 미검증이다.

GitHub 링크는 원격에 존재하는 `e441e530dec91c695da965d780cce77caac663c5`의 문서 목차를 사용했다. 아직 로컬에만 있는 추적 규칙·PR 템플릿·일부 게시 검증 자료는 원격 링크를 만들지 않고 미반영 상태를 명시했다. Jira 진행 상태를 Confluence 표에 수동 복제하지 않으며 기술 문서 전체를 자동 동기화하지 않는다.

문서 검사기 테스트 17개, 변경한 3개 파일의 Prettier 검사, 작업 트리 snapshot을 사용한 문서 delta 검사, `git diff --check`를 통과했다. 새 링크·필수 섹션·월별 목차 연결을 확인했으며 Git 인덱스는 변경하지 않았다. 앱 코드·데이터 흐름·공개 계약은 바뀌지 않아 새 ADR이나 앱 빌드·E2E 실행은 이번 범위가 아니다. 자격증명·인증 응답은 기록하지 않았다. 커밋·푸시는 요청받지 않았다.

### 게시 후 연결 재점검

같은 날 사용자의 후속 확인 요청으로 `project = KAN AND labels = backlog-2026-10 ORDER BY key ASC`를 다시 조회했다. `isLast=true`인 응답에서 에픽 1개와 작업 9개를 확인했으며, 모든 작업의 parent가 KAN-1이고 앱 라벨 5종이 사용된다. 모두 `해야 할 일`이며 Jira 기본 Priority는 `Medium`이다. `p1`·`p2`·`p0-gate`는 별도 라벨이므로 기본 Priority 정렬과 혼동하지 않는다.

KAN-9·KAN-10의 설명을 개별 조회해 `on-hold` 라벨, 보류 사유, 사용자의 재개 승인 조건이 유지됨을 확인했다. Confluence 페이지는 여전히 `current`, 버전 `1`이며 이슈 링크 10개와 GitHub 목차 링크 5개가 유지된다. `git ls-tree`로 링크 대상 커밋의 해당 파일 존재를 확인했으며 실제 브라우저 표시나 다른 계정의 열람 권한은 검증하지 않았다.

추적 규칙·PR 템플릿을 포함한 관련 7개 파일의 Prettier 및 문서 delta 검사와 문서 검사기 테스트 17개를 재실행해 통과했다. `git diff --check`도 통과했다. 추적 규칙은 아직 로컬 미커밋 상태이며, Jira 상태·Priority·권한·자동 연동 설정이나 Confluence 내용은 변경하지 않았다. 기존 다른 작업과 미푸시 커밋 3개도 유지했다.

## Open Questions

공용 Confluence 공간, GitHub 자동 연동, 앱별 저장 필터·대시보드는 미설정이다. 이번 작업은 Jira 상태 변경이나 후속 과제 실행을 포함하지 않는다.

## Next

후속 사용자 승인으로 추적 규칙·PR 템플릿·프로세스 목차·TODO의 Jira 연결 구역·Jira/Confluence 작업 기록 2개·월별 목차의 해당 링크만 7개 파일의 독립 커밋으로 묶는다. TODO의 기존 NAS·보안 변경과 다른 작업 기록 링크는 부분 스테이징에서 제외하고 작업 트리에 유지한다. 커밋 전 실제 인덱스의 포맷·문서 검사와 문서 검사기 테스트를 확인한다. 이번 승인은 커밋까지만이며 푸시·main 반영은 포함하지 않는다.

`feature/docs`의 독립 커밋 `eca0a9a` 생성 후 푸시·PR 준비 요청을 받았다. 원래 브랜치에는 다른 미푸시 구현 커밋이 있고 main과의 전체 차이도 크므로 `origin/main`의 `742707e`에서 `codex/jira-tracking-policy`를 따로 만들었다. 같은 7개 파일의 추적 규칙 변경만 옮기되 TODO·월별 목차는 main의 기존 내용을 보존해 삽입 위치만 조정했다. 원래 작업 트리·미커밋 변경·배포 브랜치는 그대로 둔다. 이 PR은 앱 코드·의존성 변경이나 NAS 작업을 포함하지 않는다. 로컬 검사와 원격 CI·PR 병합은 구분하며 main에 직접 푸시하거나 자동 병합하지 않는다.

main 기반 임시 작업 트리에서는 기존 개발 의존성을 연결해 문서 도구만 실행했다. pnpm의 기본 의존성 재설치 시도가 비대화형 TTY 조건으로 중단됐으므로, 이 작업의 실행에만 `pnpm_config_verify_deps_before_run=warn`을 사용한다. 문서·포맷·commitlint 훅은 생략하지 않으며 기존 개발 의존성을 재설치하거나 lockfile을 변경하지 않는다. 직접 검사한 포맷·문서 delta와 테스트 17개는 통과했다. main의 frozen lockfile 설치·전체 CI는 원격에서 별도로 확인한다.

추적 규칙 전용 브랜치를 푸시하고 main 대상 PR을 준비한다. 원격 CI 결과와 병합은 이후 확인한다. 승인된 원격 반영 후 저장소 추적 규칙의 실제 링크를 Confluence에 연결하고, 이후 원칙 변경 시 요약과 원본 링크를 갱신한다.
