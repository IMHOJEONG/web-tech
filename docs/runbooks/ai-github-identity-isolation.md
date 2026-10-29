# AI 신원 분리와 공통 설정 승인 게이트 활성화

## 목적과 준비 조건

[공통 설정 정책](../process/shared-configuration-approval.md)을 사람이 운영에 적용하는 절차다.
대상은 공개 개인 저장소 `IMHOJEONG/web-tech`, Node24와 사람 관리자·AI 작업 환경이다.
사용자는 `web-tech-github-app` 등록·`web-tech` 설치 완료와 개인키 미생성을 확인했다.
실제 App 권한·설치 범위는 현재 CLI 인증으로 조회하지 못했다. 사용자 확인과 독립 검증을 구분한다.
전용 App 신원 연결·main CODEOWNERS 반영·원격 규칙 활성화는 아직 미완료다.
token·개인키·cookie를 채팅·Git·artifact에 넣지 않는다.

## 실행 순서

### 1. 사람이 App 등록·설치

관리자 전용 브라우저에서 [새 GitHub App](https://github.com/settings/apps/new)을 등록한다.
고유 이름, Homepage는 저장소 URL, Only on this account, Webhook Active 해제, 사용자 OAuth 권한 요청·Device Flow 해제로 설정한다.

| Repository permission                            | 권한             |
| ------------------------------------------------ | ---------------- |
| Contents, Pull requests                          | Read and write   |
| Metadata                                         | 자동 Read        |
| Actions, Checks, Commit statuses                 | 필요할 때만 Read |
| Administration, Workflows, Environments, Secrets | No access        |
| 조직·계정 권한                                   | No access        |

`web-tech` 한 개 저장소에만 설치하고 단기 **installation access token**을 사용한다. 사용자 access token이 아니다.
App 개인키는 AI가 읽을 수 없는 사람 전용 저장소/key broker에서 관리한다. 현재 에이전트가 App 등록·키 발급을 수행한 것은 아니다.
Workflows write가 없으므로 CI 파일 push가 거부될 수 있다. 사람이 검토 후 별도 운영 흐름으로 전달하고 AI 권한을 상시 확대하지 않는다.

### 2. 실행 환경 격리

AI 전용 OS 계정/컨테이너에는 필요한 저장소와 단기 설치 token만 전달한다.
사람 홈·SSH agent·keychain·gh 설정·App 개인키·관리자 브라우저·관리자 커넥터를 공유하지 않는다.
token 환경 변수만 바꾸고 원래 관리자 keychain을 남기는 것은 분리가 아니다. 현재 세션은 관리자 gh 사용이 가능하므로 이 단계 미완료다.
다른 작업 세션의 token/로그인을 에이전트가 임의 폐기하지 말고 사람이 전환한다.

#### 환경 선택과 사람이 수행할 전환

사용자는 Codex 데스크톱을 유지하는 별도 macOS 일반 계정을 선택했다. 계정 생성·로그인 전환은 아직 미완료다.
기존 관리자 세션을 환경 변수만 바꿔 재사용하지 않는다. 아래는 준비 절차이며 이번 세션에서 실행한 결과가 아니다.

1. 사람이 시스템 설정 → 사용자 및 그룹 → 사용자 추가에서 일반 계정(예: `webtech-ai`)을 만든다. 관리자 권한이나 관리자 암호를 제공하지 않는다.
2. 새 계정으로 로그인하고 필요한 도구를 새로 준비한다. 기존 홈의 `.codex`, `.config/gh`, `.ssh`, keychain, 브라우저 프로필·셸 시작 파일을 복사하지 않는다.
3. 공개 저장소를 새 계정 홈에 HTTPS로 새 clone한다. 기존 checkout·worktree·node_modules를 공유하지 않는다. 특히 기존 worktree의 `.git`은 관리자 저장소를 가리킬 수 있다.
4. GitHub 사람 계정으로 `gh auth login`하거나 관리자 GitHub 커넥터를 연결하지 않는다. 같은 ChatGPT 로그인에서 기존 연결 도구가 다시 나타나는지도 별도로 확인한다. 로컬 OS 분리는 원격 도구 권한을 제한하지 않는다.
5. 관리자 홈·자격 증명 경로의 읽기 권한/ACL과 파일 공유를 사람이 확인한다. 읽을 수 있다면 강제 분리 완료로 표시하지 않는다. 검사하려고 키 내용이나 keychain 암호를 출력하지 않는다.

새 계정에서 토큰 없이 실행할 준비 명령:

```sh
whoami
id -Gn
printf '%s\n' "$HOME"
git clone https://github.com/IMHOJEONG/web-tech.git "$HOME/web-tech"
```

예시 계정이라면 사용자/홈은 `webtech-ai`와 그 홈이어야 하고 그룹에 `admin`이 없어야 한다.
이는 초기 점검이며 인증 격리 전체의 증거는 아니다. OS 생성·로그인 전환은 사람이 수행하고 기존 관리자 계정은 로그아웃/폐기하지 않는다.

VM/컨테이너를 선택하면 전용 디스크/볼륨에 새 clone하고 non-root로 실행한다.
관리자 홈, 기존 저장소와 `.git`, Docker/Podman socket, SSH agent, App 개인키, 광범위한 `.env`를 마운트하지 않는다.
컨테이너 안에서 관리자 호스트에 접속할 수 있는 SSH/서비스/공유 경로도 점검한다. 컨테이너 존재만으로 격리를 입증하지 않는다.

#### 개인키 보관과 token 발급 경계

위 준비가 확인되기 전 개인키를 생성하지 않는다. 격리 후 사람이 관리자 환경에서 App 설정의 실제 권한과 선택 저장소를 확인하고 키를 만든다.
장기 개인키와 JWT 생성은 사람이 관리하는 별도 발급기(broker)에 두고 AI 환경에는 전달하지 않는다. 발급기 구현·연결은 아직 미완료다.
AI 계정·공유 볼륨·저장소·동기화 폴더·현재 에이전트가 읽을 수 있는 관리자 Downloads에 키를 두지 않는다.

발급 요청은 저장소 `web-tech`와 Contents/PR write·Metadata read로 명시적으로 좁힌다. 필요할 때만 Actions/Checks/Statuses read를 포함한다.
GitHub 설치 token은 발급 시점부터1시간 후 만료되며 발급기는 갱신 때도 같은 범위로 제한한다.
값은 로그·명령 인수·remote URL·채팅에 넣지 않는다. token 환경 변수도 AI 코드가 읽을 수 있으므로 단기 최소 권한 credential로 취급한다.
사람 토큰으로 자동 fallback하거나 만료 시 `gh auth login`으로 해결하지 않는다. AI 환경에 개인키를 넣어 자동 갱신하지 않는다.
발급기 경계와 주입 방식이 결정되기 전 토큰 발급 예제를 현재 관리자 세션에서 실행하지 않는다.

신뢰하는 broker가 token을 주입한 환경에서 읽기 접근을 확인한다. 아래 성공만으로 App 신원이나 최소 권한이 입증되지는 않는다.

```sh
gh api repos/IMHOJEONG/web-tech --jq '{full_name,default_branch}'
git ls-remote origin refs/heads/main
```

발급 시스템에서 installation/선택 저장소/permission/만료를 대조하고 실제 PR author가 App `[bot]`인지 확인한다.
App token의 `/user` 조회는 실패할 수 있다. 이를 곧바로 인증 불량으로 해석하지 않는다.
broker에서 token 값이 아닌 permission map만 별도 JSON으로 내보냈다면 `node --experimental-strip-types scripts/shared-config-policy.mts --audit-agent-permissions /absolute/path/to/permissions.json`으로 허용 범위를 검사할 수 있다.
이 검사는 제출한 설정의 모양만 확인하며 실제 token 신원·관리자 접근 경로 제거의 증거를 대체하지 않는다.

완료 조건은 새 OS/실행 신원, 관리자 인증 경로 차단, 원격 관리자 커넥터 부재, 발급기의 실제 App/설치/권한/만료 대조와 App 작성 PR 확인이다.
하나라도 미확인하면 main 승인 게이트는 활성화하지 않는다. 실제 작업 PR 생성과 서버 거절 실험은 Step5의 범위·승인에 따른다.

### 3. Bootstrap과 main 반영

준비한 CODEOWNERS·정책·검사기를 기존 CI와 사람 검토로 먼저 전달한다. 아직 없는 게이트를 먼저 required로 등록하지 않는다.
main 반영 뒤 정확한 main SHA와 서버 CODEOWNERS 오류 목록을 확인한다.

```sh
gh api repos/IMHOJEONG/web-tech/codeowners/errors --jq '.errors'
```

### 4. 추가 ruleset 활성화

사람 관리자 환경에서 기존 main-ruleset을 token 없이 JSON 백업한다. 기존 규칙을 PUT으로 덮어쓰지 않는다.
GitHub Settings → Rules → Rulesets에서 [추가 규칙 템플릿](../../.github/rulesets/shared-configuration-human-approval.json)을 Import한다.
초기 상태는 disabled다. Step1~3과 실제 승인자 준비를 확인한 사람이 active로 바꾼다.
기본 브랜치·승인1명·CODEOWNERS·승인 무효화·마지막 push 외 승인·대화 해결·squash·bypass 없음으로 설정한다.
**일반 코드 PR에도 승인1명이 필요하다.** 본인 PR의 자기 승인이 불가능하므로 App/별도 인간 검토자를 먼저 준비한다.
기존 CI·force push/삭제 방지는 원래 ruleset으로 유지한다.

원격 재조회 JSON을 인증값 없이 로컬 파일에 저장하고 저장소 루트에서 검사한다.

```sh
node --experimental-strip-types scripts/shared-config-policy.mts --check
node --experimental-strip-types scripts/shared-config-policy.mts --audit-ruleset /absolute/path/to/ruleset.json
```

disabled 템플릿의 audit 실패는 정상이다. 파일에 active라고 적는 것만으로 서버가 켜지지 않는다.
원격 ruleset ID·main SHA·읽은 설정의 출처를 확인한다. CLI는 활성화·승인·merge API를 호출하지 않는다.

### 5. 실제 거절·승인 검사

운영과 같은 규칙을 둔 **별도 테스트 저장소**에서 아래 거절을 확인한 뒤, 운영에는 폐기 가능한 App PR의 승인 요구 상태만 확인한다.
운영 main 직접 push나 규칙 완화 API를 거절될 것으로 가정해 실행하지 않는다. 허용됐다면 운영 변경이 되기 때문이다.

| 검사                                  | 기대 결과                          |
| ------------------------------------- | ---------------------------------- |
| App의 일반 PR                         | 승인1명 전 병합 불가               |
| 공통 설정 PR                          | 지정 사람 소유자 승인 전 병합 불가 |
| CODEOWNERS/검사기 삭제·완화 PR        | base 소유자 승인 요구 유지         |
| 승인 뒤 새 push                       | 기존 승인 무효, 재승인 필요        |
| 작성자/마지막 push 수행자의 자기 승인 | 조건 충족 불가                     |
| App의 ruleset 변경 시도               | 권한 거절                          |
| 사람의 최신 App 변경 승인             | 기존 CI·대화 해결 후 병합 가능     |

현재 위 실제 서버 검사 전체는 미검증이다. JSON unit test를 통과했다고 위 검사가 완료된 것은 아니다.

## 기대 결과

GitHub가 main 반영을 막고 사람 검토 후 허용한다. App이 사람 자격 증명·관리 권한·bypass를 사용할 수 없다.
feature push·파일 편집·Preview 생성 자체의 차단 정책은 아니다.

## 실패 대응과 복구

신원/main 소유권/승인자가 없으면 활성화하지 않는다. skip env·라벨·자기 승인으로 우회하지 않는다.
잘못된 설정으로 잠겼다면 사람의 격리된 관리자 환경에서 **추가 ruleset만** 비활성화한다. 원래 main-ruleset은 유지하고 원인·복구·재검증을 기록한다.
AI가 자기 PR을 병합하려고 규칙을 비활성화하는 동작은 금지한다. token/개인키 노출은 사람이 폐기·회전을 판단한다.

## 관련 검증

- [회귀와 미검증 범위](../verification/security/2026-10-24-shared-config-approval.md)
- [공식 App 등록](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app)
- [공식 App 권한](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app)
- [공식 설치 token 발급](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
- [Apple 일반 계정 추가](https://support.apple.com/guide/mac-help/add-a-user-or-group-mchl3e281fc9/mac)
- [OpenAI 자격 증명 경계 안내](https://learn.chatgpt.com/docs/enterprise/security-cookbook)
