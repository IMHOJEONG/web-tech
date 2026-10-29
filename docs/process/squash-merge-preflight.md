# Squash 병합 최종 메시지 사전검사

## 목적과 준비 조건

- 대상: 이 저장소의 main 대상 squash 병합. Node 24, 루트 의존성, 인증된 GitHub CLI가 필요하다.
- 적용 상태: 이 PR의 로컬 구현. main 반영 및 실제 병합은 별도 승인·검증 단계다.
- Jira: [KAN-22](https://web-tech-service.atlassian.net/browse/KAN-22).
- 개별 PR 커밋 검사와 최종 squash 메시지는 다르다. PR #53의 main 커밋 `9a208e0`은 병합 설명문이 100자를 넘겨 `footer-max-line-length`로 실패했다. 기존 이력은 유지한다.

## 실행 순서

1. PR의 코드·리뷰·검사와 병합 의도를 확인한다. PR 전체 템플릿을 커밋 본문으로 복사하지 않는다.
2. 최종 메시지 파일을 작성한다. 첫 줄은 제목, 빈 줄 다음은 본문·footer다. 다음은 파일 내용 예시다.

```text
ci(repo-ci): validate final squash messages

Lint the exact subject, body and footer before requesting a merge.
Keep the existing main history unchanged.

Refs: KAN-22
```

3. `gh pr view NUMBER --repo IMHOJEONG/web-tech --json headRefOid`로 검토한 **전체 40자리 SHA**를 확인한다. 아래 `NUMBER`, `FULL_SHA`, 파일 경로를 실제 값으로 바꾼다. 루트에서 기본 검사만 실행한다.

```bash
mise exec -- pnpm pr:squash \
  --repo IMHOJEONG/web-tech --pr NUMBER \
  --expected-head FULL_SHA --message-file /tmp/squash-message.txt
```

4. 사용자에게 병합 승인을 받은 경우에만 같은 인수에 `--merge`를 추가한다. 이 단계에서도 메시지와 PR 상태를 다시 검사한다. 검사 전용 명령의 성공만 보고 직접 `gh pr merge`를 실행하지 않는다.

```bash
mise exec -- pnpm pr:squash \
  --repo IMHOJEONG/web-tech --pr NUMBER \
  --expected-head FULL_SHA --message-file /tmp/squash-message.txt --merge
```

5. PR의 실제 `MERGED` 상태·병합 SHA·같은 SHA의 main CI와 배포를 각각 확인한다. `merge-requested`는 GitHub 요청 성공이지 병합·배포 완료 선언이 아니다. 병합 대기열이 있으면 실제 결과를 별도로 확인한다.

## 기대 결과와 책임 경계

- 기본 결과는 `action: check-only`이며 GitHub에 쓰지 않는다. 명시적인 `--merge`만 병합 요청을 보낸다. 실행 자체가 사용자 승인 여부를 판단하는 장치는 아니다.
- 메시지 전체를 저장소 commitlint 규칙으로 검사한다. 전용 설정은 루트 규칙을 재사용하고 기본 ignore만 끈다. `Merge ...` 같은 문자열로 검사를 건너뛰지 않는다. 기존 훅·main CI 규칙은 변경하지 않는다.
- UTF-8 64 KiB 이하만 허용한다. CRLF는 LF로, 끝의 추가 개행은 하나로 정규화한다. 긴 줄을 자동으로 감싸거나 제목·본문 내용을 자동 수정하지 않는다. 제목과 본문 사이의 빈 줄, 제어문자도 검사한다.
- 검사한 메모리 스냅샷에서 제목과 본문을 나눈다. 본문은 임시 디렉터리의 권한 `0600` 파일에 담고 `--subject`, `--body-file`로 전달한다. 원본 파일을 다시 읽지 않으며 성공·실패 모두 임시 파일을 제거한다. SHA-256은 전달할 메시지 스냅샷의 식별자다.
- 명시한 repo·PR·예상 head를 요구한다. head 불일치, draft, main 이외 base, 충돌/unknown/behind, 승인 필요·변경 요청, 체크 없음·진행·실패·skip·알 수 없는 형태에서는 중단한다. 아래의 검증된 CodeRabbit 한도 초과만 예외다. GitHub 요청에도 `--match-head-commit`을 사용한다.
- shell을 거치지 않고 인수 배열로 호출한다. `--admin`, `--auto`, 브랜치 삭제·force push는 사용하지 않는다. 기존 리뷰 스레드 해결 여부도 병합 전에 별도로 확인한다.

### CodeRabbit 리뷰 한도 예외

2026-10-29 사용자 승인에 따라, CodeRabbit의 리뷰 서비스 이용 한도를 코드 품질 실패와 구분한다. 일반 명령을 그대로 사용하며 별도의 `ignore-check` 옵션은 제공하지 않는다. 다음 조건을 **모두** 확인해야 한다.

- 실패/미완료 항목이 정확히 하나이며 이름 `CodeRabbit`, 상태 `COMPLETED`, 결론 `NEUTRAL`이다. 다른 독립 검사는 성공해야 한다.
- 동일한 예상 head의 GitHub REST `check-runs`를 모든 페이지에서 조회한다. 이름이 같은 체크가 복수이면 차단한다.
- 체크의 `head_sha` 일치, 공식 GitHub.com App ID `347564`·slug/owner `coderabbitai`, 양의 정수 check-run ID를 확인한다.
- 해당 체크의 제목이 정확히 `Review rate limited`, summary 첫 줄이 `Result: Rate limited - Review rate limited`다. PR 댓글의 문구나 체크 이름만으로 판정하지 않는다.
- 출력의 `checkExceptions`에 check-run ID·head·사유·`reviewPerformed: false`를 기록한다. 리뷰가 성공하거나 실제 수행됐다고 표시하지 않는다.

다른 CI·보안 검사·리뷰의 FAILURE, 일반 SKIPPED, 다른 사유의 NEUTRAL, 조회 권한/네트워크/JSON 오류는 여전히 차단한다. 공식 App이나 보고 형식이 바뀌면 자동으로 허용하지 않고 실제 원본을 다시 확인해 테스트와 정책을 갱신한다. GitHub branch protection·required checks·리뷰 승인 요건을 변경하거나 우회하지 않는다. 서버의 필수 규칙은 이 로컬 예외보다 우선한다.

리뷰 한도는 자동 코드 검토가 **수행되지 않았음**을 뜻한다. 실제 지적 사항은 기존 검토·수동 코드 리뷰로 확인해야 하고, 사람의 변경 요청이나 미해결 리뷰를 무시할 근거가 아니다. 결정 배경은 [ADR-0024](../architecture/adr-0024-advisory-review-rate-limit.md)를 따른다.

### 무료 대체 리뷰 도구

2026-10-29 공식 자료 기준이다. 아래는 비교만 수행했으며 앱 설치·새 비밀값·과금·필수 체크 설정은 변경하지 않았다.

| 후보                                                         | 무료 조건과 비용 경계                                                                         | 이번 저장소의 판단                                                                     |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [Sourcery](https://www.sourcery.ai/pricing)                  | 공개 저장소 PR 리뷰용 Open Source 요금제는 무료다. private repo와 더 높은 한도는 유료 범위다. | 가장 단순한 1차 비교 후보. 무료를 무제한/SLA 보장으로 해석하지 않는다.                 |
| [Greptile OSS](https://www.greptile.com/pricing/open-source) | 공개·OSI 승인 라이선스·비상업 커뮤니티 프로젝트 등 프로그램 조건을 확인하고 신청해야 한다.    | 조건부 후보. 저장소 적격성·승인을 임의로 확정하지 않는다.                              |
| [Qodo OSS](https://www.qodo.ai/pricing/)                     | 일반 영구 무료 요금제는 없고, 적격 OSS 프로젝트의 무료 지원 신청이 별도다.                    | 무료 체험·OSS 프로그램을 혼동하지 않는다.                                              |
| [PR-Agent](https://github.com/The-PR-Agent/pr-agent)         | 오픈소스 자체 운영 도구. Qodo hosted 무료 상품과 다르며 모델 API·Actions·서버 비용은 별도다.  | 데이터/모델 선택권이 필요할 때 검토. NAS1대에 새 가용성 의존성을 바로 추가하지 않는다. |

Gemini의 2025년 무료 소개만으로 현재 개인 GitHub 리뷰를 무료라고 권하지 않는다. [현재 GitHub 리뷰 안내](https://docs.cloud.google.com/gemini/docs/code-review/review-repo-code)는 Enterprise 연동을 설명하고, [개인용 종료 안내](https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals)는 IDE·CLI 소비자 계정에 관한 별도 범위다. Copilot 역시 [현재 요금제의 기능 범위](https://docs.github.com/en/copilot/get-started/plans)를 확인해야 하며 일반 무료 PR 리뷰 대안으로 일괄 분류하지 않는다.

새 리뷰 봇은 선택한 저장소만 연결하고 권한·소스 전송/보관·자동 승인 기능을 먼저 검토한다. 자동 merge/approve는 기본 도입하지 않는다. CodeQL·기존 테스트를 대체하지 않고, 동일한 과거 버그·정상 PR 표본에서 유효 지적과 오탐·지연·한도를 비교한 뒤 채택한다. 임의의 새 봇에 이번 CodeRabbit 전용 예외를 확대하지 않는다.

## 실패 대응과 복구

- commitlint 실패: 원본 메시지의 해당 줄을 수정하고 전체를 다시 검사한다. 제목만 따로 검사하거나 규칙을 끄지 않는다.
- head 변경: 새 diff·리뷰·CI를 확인한 후 새 SHA를 사용한다. 검증한 이전 SHA를 그대로 재사용하지 않는다.
- CI 미완료·실패: 원인을 확인한다. 필요한 검사만 임의로 골라 성공으로 처리하지 않는다.
- GitHub/API/명령 실패: 비정상 종료를 그대로 전파한다. 토큰·세션·비공개 글을 메시지 파일에 넣지 않는다.
- 이미 main에 올라간 메시지 실패는 기록을 보존한다. 이 도구를 추가해도 과거 CI가 성공으로 바뀌지는 않는다.
- **한계:** GitHub UI·직접 CLI를 원격에서 강제 차단하는 설정은 아니다. required checks나 서버측 ruleset도 변경하지 않는다. 최종 메시지를 이 경로 밖에서 수정하면 보장이 사라진다. 원격 강제 정책은 별도 설계·승인이 필요하다.

## 관련 검증

- [10-22 회귀 검증](../verification/resilience/2026-10-22-squash-merge-preflight.md)
- [10-29 CodeRabbit 한도 예외 검증](../verification/resilience/2026-10-29-coderabbit-rate-limit.md)
- [작업 기록](../worklog/2026-10/2026-10-22-squash-merge-preflight.md)
- [커밋 규칙](commit-message-convention.md) · [브랜치 정책](branch-policy.md)
- 공식 [commitlint CLI](https://commitlint.js.org/reference/cli.html) · [GitHub CLI merge 인수](https://cli.github.com/manual/gh_pr_merge)
