# Squash 최종 메시지 사전검사 검증

## 대상과 조건

- 검증일: 2026-10-22 KST.
- 기준 main: `9a208e09eed76b32a68f7f3a310a241dabaa2a50`. 브랜치 `codex/squash-merge-preflight`의 로컬 변경 검증이다.
- Node `24.12.0`, pnpm `11.10.0`, commitlint CLI `21.2.1`, GitHub CLI `2.96.0`.
- 실제 commitlint·파일시스템·Node 자식 프로세스를 사용한다. GitHub 조회/병합은 회귀 테스트에서 주입한 대역을 사용하므로 실제 원격 쓰기는 없다.
- 배경: [main CI의 실제 메시지 실패](https://github.com/IMHOJEONG/web-tech/actions/runs/39699972108/job/119566570905). 기존 실패 기록과 main 이력은 유지한다.

## 재현 방법

저장소 루트에서 실행한다. 버전 변경이나 전역 설치 없이 기존 의존성을 사용한다.

```bash
mise exec -- pnpm test:squash
mise exec -- pnpm typecheck:squash
mise exec -- pnpm test:repo
```

읽기 전용 실제 PR 검사는 [절차](../../process/squash-merge-preflight.md)의 기본 명령으로 수행한다. `--merge`는 사용자 병합 승인이 필요하며 이번 PR 준비 검증에서는 실행하지 않는다.

## 결과와 증거

| 검사               | 관측                                                                                                 | 판정                    |
| ------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------- |
| squash 회귀        | 33개 통과, skip·실패 0                                                                               | 통과                    |
| 전체 저장소 계약   | 기존 64개 + CI 연결 1개 + squash 33개 = 98개 통과                                                    | 통과                    |
| Node 24 TypeScript | strict·NodeNext·erasableSyntaxOnly·noEmit                                                            | 통과                    |
| 실제 PR #53 설명문 | 저장소에 설치된 commitlint가 `footer-max-line-length`로 거부, 짧게 나눈 정상 메시지는 허용           | 재현·통과               |
| 잘못된 메시지      | 대괄호 type, 잘못된 scope, 긴 제목/본문, 기본 ignore 대상, 제어문자·잘못된 UTF-8·빈 파일·64 KiB 초과 | 거부 확인               |
| 병합 경계          | 기본 검사 전용, 명시한 repo/PR/SHA, head 변경·비 main·draft·충돌/unknown/behind·리뷰 미충족          | 거부 확인               |
| CI 경계            | 체크 없음·진행·실패·skip·모르는 형태, 미완료 status context                                          | 거부 확인               |
| 메시지 동일성      | 검사 뒤 원본 파일 변경 대조군, CRLF 정규화, shell 문자 보존, 제목만 있는 메시지                      | 검사한 스냅샷 전달 확인 |
| 실패·정리          | GitHub 실패 전파, 본문 권한0600, 성공/실패의 임시 파일 정리                                          | 통과                    |
| 실제 GitHub 병합   | 테스트 대역만 사용                                                                                   | 미실행                  |
| 새 PR 원격 CI      | 푸시 후 최종 SHA 기준으로 PR·Jira에서 확인할 단계                                                    | 로컬 결과와 구분        |

초기 구현에서 설치된 commitlint CLI가 `--default-ignores` 인수를 지원하지 않아 정상 대조군이 실패했다. CLI 인수를 제거하고 루트 규칙을 공유하는 전용 설정의 `defaultIgnores: false`로 수정한 뒤 위 결과를 다시 확인했다. 따라서 단순히 예외가 발생했다는 이유만으로 음성 대조군을 통과시키지 않으며 PR 상태 거부 사유도 검사한다.

## pnpm 업그레이드와 PR 범위 구분

사용자 결정은 **11계열 중간 갱신 없이 `12.14.0`으로 전환**이다. 초기의 `11.28.6` 우선 권고는 철회한다. 업그레이드 구현·검증 원본은 이미 열린 [PR #55 / KAN-25](https://github.com/IMHOJEONG/web-tech/pull/55)를 사용하고, #56에 같은 변경을 다시 만들지 않는다.

| PR  | 핵심 변경                                                | 조회한 head와 검증                                                                                    |
| --- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| #55 | pnpm12.14.0 루트/mise 핀, 검증된 설치·CI·Docker·lockfile | `7de34b3fbc11f2cb4a1f21aa35a018425b068ad8`. CI13개·CodeQL·Docker 검사·두 앱 Preview 성공              |
| #56 | 최종 squash 메시지 전체 검사·스냅샷/head 고정·회귀       | `7898a373b1342c49f64a00cdf67b45ec81433201`. 기존 CI13개·저장소98개 성공. 이번 범위 정정은 문서만 변경 |

겹치는 파일은 `.github/workflows/ci.yml`, `package.json`, 검증·worklog 목차 4개지만 구현은 중복되지 않는다. #55의 `typecheck:toolchain`은 pnpm 설치기를 검사하고, #56의 `typecheck:squash`는 병합 도구를 검사한다. 두 PR 모두 같은 CI 타입 검사 다음 위치에 단계를 추가하므로, 먼저 병합한 뒤 다른 PR을 최신 main에 반영할 때 두 검사를 모두 보존해야 한다.

이 PR의 위 로컬 결과는 pnpm11.10.0에서 실행한 당시 증거다. 이를 pnpm12에서 두 PR을 통합 검증한 결과로 바꾸어 쓰지 않는다. 둘을 합친 회귀·배포는 아직 미검증이다. 병합 승인은 별도이며 두 PR 모두 이번 확인에서 병합하지 않았다.

pnpm 업그레이드 절차·서명 검증·lockfile·Docker 결과는 #55의 [운영 절차](https://github.com/IMHOJEONG/web-tech/blob/7de34b3fbc11f2cb4a1f21aa35a018425b068ad8/docs/runbooks/pnpm-toolchain-upgrade.md)와 [검증 원본](https://github.com/IMHOJEONG/web-tech/blob/7de34b3fbc11f2cb4a1f21aa35a018425b068ad8/docs/verification/integration/2026-10-22-pnpm12-toolchain.md)을 참조한다. 여기에는 별도의 버전 조사·업그레이드 체크리스트를 중복 유지하지 않는다.

## 한계와 후속 작업

- 이번 보완은 CLI 운영 경로다. GitHub UI를 원격 강제로 막거나 branch protection을 변경하지 않는다.
- 원격 CI·리뷰를 확인한 뒤 별도 승인으로 실제 병합을 검증한다. 성공 응답만으로 merge queue·Production 완료를 선언하지 않는다.
- 기존 main CI의 메시지 실패는 그대로 남으며 이력 재작성·검사 완화는 하지 않는다.
- pnpm12 전환은 #55에서 진행한다. 이 PR은 pnpm 핀·설치기·lockfile을 변경하지 않으며 두 PR 통합 검증과 운영 배포는 별도다.

## 관련 문서

- [실행 절차](../../process/squash-merge-preflight.md)
- [작업 기록](../../worklog/2026-10/2026-10-22-squash-merge-preflight.md)
- [커밋 메시지 규칙](../../process/commit-message-convention.md)
