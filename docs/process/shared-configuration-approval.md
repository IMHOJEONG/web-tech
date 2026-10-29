# 공통 설정의 사람 승인 정책

## 상태와 범위

- 상태: 적용 중
- 대상: 모노레포 공통 설정과 GitHub main 병합
- 최종 검토: 2026-10-24
- 추적: [KAN-33](https://web-tech-service.atlassian.net/browse/KAN-33)

사용자가 GitHub 승인 게이트 + AI 권한 분리를 선택했다. 현재는 로컬 소유권·규칙 템플릿·검사 구현 단계다.
main 반영·서버 활성화·AI 전용 신원 연결·실제 거절 검증은 미완료다. 적용 중은 운영 강제화 완료를 뜻하지 않는다.

## 배경

일반 기능 작업 중 공통 의존성·CI·빌드 설정까지 임의 변경하는 것을 방지한다.
공개 개인 GitHub.com 저장소에는 임의 pre-receive를 설치할 수 없고, 로컬 훅은 `--no-verify` 등으로 우회할 수 있다.
따라서 GitHub 서버의 PR/CODEOWNERS 규칙과 별도 AI 신원을 보안 경계로 사용한다.

## 결정

### 보호 경로

[경로 정책](../../.github/shared-config-policy.json)이 원본이고 [CODEOWNERS](../../.github/CODEOWNERS)가 GitHub 입력이다.
정책으로 생성한 내용이 일치하는지 검사한다. 보호 대상은 다음과 같다.

- root package/lock/workspace/Turbo와 Node/pnpm 버전 설정.
- `.github/**`, 에이전트 지침, root 훅·스크립트와 보호 정책 자체.
- 각 workspace의 package/TypeScript/lint/빌드/테스트·컨테이너·배포 설정.
- 공용 TypeScript/ESLint/Tailwind 설정 패키지 전체. JS/CSS도 공통 규칙을 담기 때문이다.

일반 TSX UI·번역·공개 글·이미지·공용 UI 컴포넌트 구현 전체를 공통 설정으로 분류하지 않는다.
생성/수정뿐 아니라 삭제·이동도 검토한다. PR 라벨·제목·커밋 문구·skip 환경 변수는 승인 대체가 아니다.

### 원격 승인

[추가 ruleset 템플릿](../../.github/rulesets/shared-configuration-human-approval.json)의 초기값은 `disabled`다.
신원/main/승인자 준비 후 사람이 별도 규칙으로 활성화하며, 기존 `main-ruleset`의 CI·force push/삭제 방지는 덮어쓰지 않는다.

- 최소 승인1명 + CODEOWNERS 승인, 새 push 후 기존 승인 무효화.
- 마지막 reviewable push 수행자 외 승인, 대화 해결, squash 병합.
- bypass actor 없음. AI App·Renovate·관리자를 자동 예외로 두지 않는다.
- GitHub는 PR base의 CODEOWNERS를 사용한다. PR에서 보호 파일을 삭제해도 base 소유자의 검토를 요구한다.

**최소 승인1명은 일반 코드 PR에도 적용된다.** 공통 설정은 지정 소유자, 일반 변경은 적격 검토자의 승인을 받는다.
개인 저장소에서 자기 PR을 승인할 수 없으므로 AI App이 PR을 만들고 사람이 검토한다. 사람이 작성한 PR은 다른 적격 검토자가 필요하다.
이 제약을 해결하기 전 운영 규칙을 먼저 켜지 않는다. 자기 승인·상시 관리자 bypass로 해결하지 않는다.

### 신원과 검사 경계

사람 계정과 별도 **GitHub App installation token**을 사용한다. 사람 PAT의 scope 축소나 App user access token은 별도 신원이 아니다.
기본 권한은 해당 저장소 Contents/PR write와 자동 Metadata read, 필요 시 Actions/Checks/Statuses read다.
Administration·Workflows·Checks/Statuses write·Environments/Secrets·조직 권한은 주지 않는다. 개인키는 AI에 제공하지 않는다.

같은 환경에서 관리자 gh/keychain·관리자 커넥터·브라우저 프로필에 접근할 수 있으면 신원 분리 미완료다.
git 작성자 이름이나 기본 gh 계정만 바꾸는 것은 인증 격리가 아니다. 타 세션의 로그인을 AI가 임의 삭제하지 않는다.
[별도 실행 환경과 전환 절차](../runbooks/ai-github-identity-isolation.md)를 따른다.

`Shared Configuration Policy` CI는 파일 일치·경로·정책 회귀를 검사할 뿐 승인 수단이 아니다.
검사 CLI에는 활성화/approve/bypass 기능이 없다. 설정 audit 통과만으로 실제 거절·신원 분리 완료라고 하지 않는다.

## 대안과 영향

자체 Git pre-receive는 push 자체를 막지만 호스팅 변경이 필요해 선택하지 않았다.
현재 정책은 **main 병합**을 차단하며 로컬 편집·feature push·main 전 Preview 생성까지 막지는 않는다.
동일 관리자 계정의 환경 승인만으로 권한 분리를 대체할 수 없다. 소유자의 부재에 대비한 인간 관리자 복구 경로는 별도로 둔다.

## 관련 문서

- [ADR-0022](../architecture/adr-0022-shared-configuration-approval.md)
- [신원 분리·활성화·복구](../runbooks/ai-github-identity-isolation.md)
- [검증](../verification/security/2026-10-24-shared-config-approval.md)
- [작업 기록](../worklog/2026-10/2026-10-24-shared-config-approval.md)
- [GitHub CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub ruleset API](https://docs.github.com/en/rest/repos/rules)
