# GitHub App 전용 macOS 일반 계정 준비

## 목적과 준비 조건

KAN-33의 AI 전용 GitHub 신원을 소유자 관리자 인증과 다른 실행 환경에서 사용하기 위한 준비 절차다.
현재 적용된 설정이 아니라 사용자 계정 준비 후 실행할 절차다. 사용자는 별도 계정이 아직 없으므로 절차 정리만 요청했다.
App 등록·저장소 설치는 사용자가 알려준 상태이며 개인키 생성·설치 인증은 이 작업에서 실행하지 않는다.

관련 [PR #75](https://github.com/IMHOJEONG/web-tech/pull/75)는 점검 당시 Draft·충돌 상태였다.
병합되지 않은 CODEOWNERS나 보호 도구를 현재 main의 강제 규칙으로 간주하지 않는다.
[공개 검수 절차](../process/publication-review.md)의 해시도 사람 승인 신원 증명은 아니다.

## 실행 순서

### 1. 소유자가 일반 계정을 만든다

macOS 시스템 설정의 사용자 및 그룹에서 AI 작업용 **일반 사용자**를 생성한다.
관리자 권한·소유자 Apple 계정·브라우저 동기화·공유 키체인은 연결하지 않는다.
그 계정의 독립 로그인 세션에서 작업 도구를 시작한다. 소유자 셸에서 사용자 이름만 바꾸거나
현재 관리자 인증에 App 토큰만 덮어쓰는 방식으로 대체하지 않는다.

새 계정에서 `id -Gn`으로 admin 그룹이 없는지 확인한다.
소유자의 GitHub CLI 설정, SSH 키·agent socket, 셸 환경, 클라우드 설정, password manager 자료를 복제하지 않는다.
관리자 암호나 소유자 GitHub 토큰을 그 계정에서 입력하지 않는다.
일반 계정이라는 사실만으로 모든 공유 경로·IPC 접근이 차단된다고 보장하지 않으므로 접근 가능한 디렉터리도 점검한다.
별도 clone을 준비하고 소유자 작업 트리의 `.git`이나 credential helper를 공유하지 않는다.
연결 도구의 GitHub 인증도 점검한다. CLI만 App으로 바꾸고 연결 도구에 소유자 관리자 인증을 남겨 두면
실행 환경의 권한 분리가 완료된 것이 아니다. 이 경계를 검증할 수 없다면 실제 Git 작업을 시작하지 않는다.

### 2. App의 저장소와 권한을 좁힌다

소유자 세션에서 `web-tech-github-app`이 선택한 `web-tech` 저장소에만 설치됐는지 확인한다.
아래는 검토할 최소 권한안이며 실제 권한을 변경한 결과가 아니다.

| 권한                   | 최초 검토 범위                                               |
| ---------------------- | ------------------------------------------------------------ |
| Metadata               | read                                                         |
| Contents               | 코드 브랜치 push가 필요할 때 read/write                      |
| Pull requests          | PR 생성·갱신을 위해 read/write                               |
| Actions·Checks         | CI 조회에 필요한 read만 검토                                 |
| Administration·Secrets | 부여하지 않음                                                |
| Workflows              | 최초에는 부여하지 않음. workflow 변경은 소유자가 별도로 처리 |

Pull requests write는 리뷰 API도 허용할 수 있으므로 이를 승인 전용 제한이라고 설명하지 않는다.
App을 CODEOWNER나 bypass actor로 지정하지 않고 사람의 필수 소유자 리뷰로 구분한다.
추가 권한은 실제 막힌 작업과 API 요구를 확인한 뒤 별도로 승인한다.

### 3. 키와 단기 토큰을 별도 환경에서 준비한다

키 생성은 소유자의 명시 승인 후 진행한다. 개인키는 저장소 밖 사람 전용 발급 환경에 두고
디렉터리 0700·키 파일 0600으로 제한하며 AI 실행 계정에서는 읽을 수 없게 한다.
AI 계정에는 필요한 저장소·권한으로 줄인 단기 설치 토큰만 전달한다. 실제 키 경로나 값은 공유 문서에 기록하지 않는다.
GitHub App 설치 토큰은 최대 1시간 유효하며 설치 범위와 권한을 더 줄여 발급할 수 있다.
장기 개인 토큰을 App 토큰의 만료 회피 수단으로 넣지 않는다.
[공식 설치 인증 절차](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation)를 따른다.

토큰 발급·갱신 도구는 별도 검토한다. 토큰을 채팅·인수·remote URL·로그·추적 파일에 넣지 않고,
전용 프로세스의 제한된 인증 전달 경로를 사용한다. `set -x`나 전체 환경 덤프를 켜지 않는다.
이 문서 작업에서 키 생성·토큰 발급·현재 gh 로그인 교체는 하지 않았다.

### 4. 신원을 검증한다

설치 인증으로 `gh api installation/repositories`를 호출해 허용된 저장소만 보이는지 확인한다.
설치 토큰에서 사용자 전용 API가 실패하는 것은 개인 계정 인증 실패와 구분한다.
조회 실패를 해결하려고 소유자 PAT·관리자 키체인·공유 SSH agent로 fallback하지 않는다.

소유자가 결과를 확인할 전용 시험 브랜치와 PR을 만든다. 실제 GitHub actor가 App인지 확인하고,
그 환경에서 소유자 자격 증명에 접근할 수 없음을 값의 열람 없이 권한·설정으로 점검한다.
실제 사용자 승인 전 main push·브랜치 보호 변경·자격 증명 폐기는 시험하지 않는다.

### 5. 사람 승인 게이트를 별도 적용한다

PR #75를 최신 main과 대조하고 충돌·테스트를 해결한 뒤 소유자가 최종 diff를 검토한다.
CODEOWNERS는 공통 설정과 보호 규칙 자체를 포함해야 한다.
현재 required checks를 보존하면서 code-owner review, 필요한 승인 수, 새 push 시 승인 무효화,
마지막 push 작성자와 다른 승인자, bypass 제외를 각각 검토·승인한다.
[GitHub 보호 규칙 안내](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)를 따른다.

App이 작성한 공통 설정 시험 PR에서 사람이 승인하기 전 병합 불가, 승인 후 허용,
추가 push 뒤 재승인 필요를 실제 확인한다. 각 승인자의 역할과 최신 head를 함께 대조한다.
그 전에는 절차·로컬 검사기만으로 서버 강제화 완료를 선언하지 않는다.

## 기대 결과

- AI 작업은 App 신원과 선택한 저장소 범위만 사용하며 소유자 관리자 자격 증명은 접근할 수 없다.
- 사람이 검토하기 전 공통 설정 변경을 main에 병합할 수 없다.
- 일반 계정 생성·설치 인증·서버 규칙 적용·거부 동작 검증은 각각 별도 확인되며 비밀 값은 기록에 없다.

## 실패 대응과 복구

설치 인증 실패 시 전용 작업을 중단하고 소유자가 App 설치 범위·권한·만료를 확인한다.
현재 개인 토큰을 복사해 작업을 계속하지 않는다. App 키가 유출됐다고 판단되면 소유자가
해당 키 폐기·재발급과 설치 토큰 정리를 승인된 경로에서 진행한다.
승인 게이트가 정상 작업을 막으면 기존 ruleset을 무작정 삭제하거나 bypass를 추가하지 않고
대상 경로·승인자·요구 check와 실제 head를 먼저 대조한다.

## 관련 검증

- [순차 개선 점검 결과](../verification/resilience/2026-11-03-docs-sequential-followups.md)
- [작업 기록](../worklog/2026-11/2026-11-03-docs-sequential-followups.md)
- [KAN-33](https://web-tech-service.atlassian.net/browse/KAN-33)
