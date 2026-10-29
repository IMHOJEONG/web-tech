# 공통 설정 소유권·승인 정책의 로컬 회귀

## 대상과 조건

2026-10-24 KST, 최신 origin/main `16c51e9` 기준 `codex/shared-config-approval-20261024`의 미커밋 트리.
별도 임시 작업 공간으로 기존 블로그 미커밋·녹화본·개발 서버를 유지했다. Node24.12.0과 기존 설치 의존성을 사용한다.
운영 GitHub는 공개 개인 저장소이며 관리자 계정으로 읽기만 수행했다. token 값은 수집/출력/변경하지 않았다.

## 재현 방법

저장소 루트에서 Node24와 기존 TypeScript/Prettier 설치를 준비한다.

```sh
node --experimental-strip-types --test scripts/shared-config-policy.test.mts
node --experimental-strip-types --test scripts/*.test.mjs scripts/*.test.mts
node node_modules/typescript/bin/tsc -p tsconfig.shared-config.json
node --experimental-strip-types scripts/shared-config-policy.mts --check
node --experimental-strip-types scripts/shared-config-policy.mts --audit-ruleset .github/rulesets/shared-configuration-human-approval.json
```

마지막 명령은 비활성 template을 검사하므로 `Ruleset is not active.`와 exit1이 기대 결과다.
로컬 fixture에 active라고 넣어 통과시키는 것은 원격 활성화를 증명하지 않는다.

## 결과와 증거

[원본 요약·소스 해시·읽기 전용 ruleset 스냅샷](../artifacts/2026-10-24-shared-config-approval.json)을 함께 확인한다.

- 정책 회귀11개 통과: CODEOWNERS 생성 일치/자기 보호, root·중첩 설정, 비보호 UI/번역/글 구분, Git의 경로 매칭과 대조.
- 비활성 규칙, 승인0명, stale/owner/last-push 보호 누락, bypass·브랜치 제외·잘못된 입력이 통과하지 않음을 확인했다.
- App 허용 권한·금지 write 권한·잘못된 값의 비노출과 apply/approve/skip 옵션 부재를 확인했다.
- 기존 저장소 회귀를 포함해119개 통과(실패/취소/skip0), 전용 TypeScript 검사 통과.
- 변경 소스 포맷·문서 delta12개·Git diff 검사를 통과했다. 인덱스는 수정하지 않았다.

운영 조회 결과: `main-ruleset`16880032는 기존대로 active·최소 승인0·CODEOWNERS 요구false·bypass 없음이다.
main `.github/CODEOWNERS` 조회는404다. 신규 서버 규칙을 생성/활성화하지 않았다.
협업자 조회는 관리자 본인만 반환했다. 기존 App 설치의 존재 여부를 이 조회로 단정하지 않는다. 현재 CLI 신원은 여전히 사람 관리자이며 AI 전용 신원은 미연결이다.

초기 CODEOWNERS 생성 때 mise stderr 경고가 합쳐진 것을 exact-match 회귀가 잡아냈고 제거 후 재검사했다.
공유 node_modules symlink에서 pnpm12의 사전 설치 검사가 경고해, 의존성 추가 없이 설치된 Node/TypeScript CLI를 직접 실행했다.
package/lockfile 변경은 없다. mise의 상태 추적 권한 경고는 검사 실패와 구분한다.

## 한계와 후속 작업

GitHub CODEOWNERS parser·실제 승인 요청·승인 후 새 push·병합 거절·App 관리자 API 거절·토큰 격리는 미검증이다.
Git ignore 대조는 사용한 제한 glob 문법의 로컬 확인이지 GitHub 서버 검사 대체가 아니다.
새 CI는 아직 원격 실행하지 않았다. PR/커밋/푸시/main 반영·App 등록·개인키/토큰 발급·교체·원격 권한 변경은 수행하지 않았다.
설정 파일 존재만으로 강제화가 완료됐다고 표시하지 않는다. 신원 준비와 bootstrap 이후 사람이 별도 ruleset을 활성화해야 한다.

## App 등록 후 신원 분리 준비 점검

같은 날짜 사용자가 `web-tech-github-app` 등록·`web-tech` 설치와 개인키 미생성을 확인했다.
이는 사용자 보고이며 서버 권한 검증 성공으로 승격하지 않는다. [후속 조회 증거](../artifacts/2026-10-24-ai-github-isolation-preflight.json)에 경계를 남겼다.

```sh
gh api apps/web-tech-github-app --jq '{slug, name, owner: .owner.login, permissions, events}'
gh api user/installations --jq '{installations: [.installations[] | select(.app_slug == "web-tech-github-app") | {id, app_id, app_slug, repository_selection, permissions, account: .account.login, suspended_at}], total_count}'
```

기본 sandbox에서는 연결 실패였고 허용된 읽기 재시도에서 첫 조회404, 두 번째403을 관측했다.
첫 조회는 App 존재/비공개 여부를 확정하지 못한다. 두 번째 응답은 App에 연결된 user access token을 요구했으므로 현재 인증 방식으로 설치 목록을 검증하지 못한 것이다.
조회 편의를 위해 사람 PAT를 추가하거나 App 권한을 늘리지 않았다. 새 개인키·JWT·설치 token을 발급하지 않았다.

runbook에 새 macOS 일반 계정/VM 선택, 새 clone, 관리자 홈·기존 `.git`·socket·원격 관리자 커넥터 비공유와 발급기 경계를 구체화했다.
사용자는 별도 macOS 일반 계정을 선택했다. OS 계정 생성·전환, App 실제 권한·설치 범위, broker 구현·연결, 단기 token·PR 신원·실제 접근 거절은 모두 미검증이다.
후속 정책 회귀11개·이번 변경5개 파일 포맷·미커밋 문서 delta13개·Git diff 검사를 통과했다. 인덱스는 변경하지 않았다.
정책 코드·CI·기존 관리자 인증·서버 ruleset을 변경하지 않았다. 과거119개 검사 결과는 위 최초 준비 결과이며 이번 권한 분리 완료 증거가 아니다.

## 2026-10-29 복원본 재검증

기반 `16c51e9`의 복원 작업21파일만 대상으로 Node24.22.1·pnpm12.14.0을 사용했다. 최신 main과의 통합·원격 CI 검증은 아니다. ADR-0019 번호 중복을 ADR-0022로 보정한 뒤 연결 경로를 다시 검사했다.

```sh
node --experimental-strip-types --test scripts/shared-config-policy.test.mts
node node_modules/typescript/bin/tsc -p tsconfig.shared-config.json
node scripts/shared-config-policy.mts --check
node scripts/shared-config-policy.mts --audit-ruleset .github/rulesets/shared-configuration-human-approval.json
node --experimental-strip-types --test scripts/*.test.mjs scripts/*.test.mts
```

정책11개·전체119개 모두 실패/skip0으로 통과했다. 전체 검사는 같은 기반과 변경 파일을 복사·대조한 별도 의존성 복제본에서 수행했다. 타입 검사·CODEOWNERS 일치도 통과했다. 비활성 템플릿 audit의 exit1/`Ruleset is not active.`는 예상 결과다. 최초 전체 검사에서 의존성 누락을 확인해 별도 frozen 설치로 준비했으며, 기존 공유 의존성 폴더를 덮어쓰지 않았다. 개발 도구 연결만 복구했으며 package/lockfile 변경은 없다. 문서/포맷/diff 및 commitlint는 실제 커밋 인덱스로 검사한다. 원본 artifact의10-24 소스 해시·당시 원격 응답은 보존하고 이번 결과를 별도 필드로 구분한다.

검사 성공은 GitHub 실제 거절·AI 신원 격리·main 반영의 증거가 아니다. 로컬 커밋만 승인됐으며 push·PR·규칙 활성화·인증 교체는 이번 범위에서 제외했다.
커밋 인덱스21파일의 `pnpm format:staged:check`, `pnpm validate:docs --staged`, `git diff --cached --check`도 통과했다. pnpm의 사전 의존성 준비가 node_modules 심볼릭 링크를 실제 디렉터리로 처리하지 못한다는 경고를 냈지만 뒤이은 읽기 전용 검사들은 exit0이었다. `verifyDepsBeforeRun`이나 훅을 끄지 않았고 package/lockfile 변경도 없다. 이 경고를 원격 설치 검증 성공으로 간주하지 않는다.

## 관련 문서

- [정책](../../process/shared-configuration-approval.md)
- [신원 분리·활성화·복구](../../runbooks/ai-github-identity-isolation.md)
- [ADR-0022](../../architecture/adr-0022-shared-configuration-approval.md)
- [작업 기록](../../worklog/2026-10/2026-10-24-shared-config-approval.md)
