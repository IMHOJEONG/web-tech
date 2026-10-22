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

## pnpm 안정판 조사

이번 PR에서는 설치·버전 핀·lockfile을 바꾸지 않는다. 2026-10-22에 공식 원격 메타데이터를 읽었다.

```bash
gh api repos/pnpm/pnpm/releases/latest \
  --jq '{tag_name,published_at,prerelease,draft,html_url}'
curl -fsS https://registry.npmjs.org/pnpm \
  | jq '."dist-tags" | {latest,"latest-11","latest-12","next-11","next-12"}'
```

| 항목                   | 실제 조회값                  | 해석                                              |
| ---------------------- | ---------------------------- | ------------------------------------------------- |
| 저장소 packageManager  | `11.10.0` + SHA-512 핀       | 현재 검증 환경                                    |
| GitHub latest          | `v12.14.0`, prerelease=false | 공식 최신 안정 릴리스                             |
| npm latest / latest-12 | `12.14.0`                    | 12계열 전환 후보                                  |
| npm latest-11          | `11.28.6`                    | 동일 메이저의 우선 검증 후보                      |
| npm next-11 / next-12  | `11.28.7` / `12.15.0`        | 더 높은 숫자만 보고 안정 기본값으로 선택하지 않음 |

이 저장소는 여러 모노레포가 아니라 하나의 pnpm workspace다. `apps/*`, `packages/*`에서 별도의 packageManager 핀은 발견되지 않았고, 루트 `package.json`의 단일 핀과 루트 lockfile을 공유한다. 다른 독립 저장소는 각 루트에서 별도 버전을 고정할 수 있지만 이 workspace의 앱별로 pnpm 버전을 나누지 않는다. GitHub Actions는 별도 version 값을 지정하지 않고 루트 핀을 사용하며 backend Docker도 Corepack을 사용한다.

**권장:** 우선 별도 PR에서 `11.28.6`을 정확한 버전·integrity로 고정해 검증한다. `12.14.0`도 안정판이지만 Rust 재작성과 동작 차이가 있으므로 독립 검증 대상으로 둔다. `latest` 범위를 그대로 핀하거나 두 변경을 squash 보완 PR에 섞지 않는다.

12계열은 공식 문서상 기존 lockfile·대부분의 명령과 설정을 유지한다. 다만 순환 peer 재해석의 최초 lockfile 차이, Linux hardlink 우선순위, 알 수 없는 workspace 설정 오류, Git dependency 해석·일부 CLI 플래그 차이를 확인해야 한다. 현재 workflow/scripts/Docker에서 `--resolution-only`나 `--frozen-lockfile false/true` 사용은 발견하지 않았다. 이는 전체 호환성 검증 통과를 의미하지 않는다.

업그레이드 PR의 완료 조건:

1. 루트 packageManager/integrity만 후보 버전으로 고정하고 독립 checkout·store에서 Node24의 frozen 설치를 확인한다. 전역 pnpm·기존 node_modules를 먼저 바꾸지 않는다.
2. 재설치 뒤 lockfile이 그대로인지 확인하고, 재해석이 필요하면 의도한 변경과 peer 변화를 검토한다. install script 허용 정책·서명/TLS 검증을 끄지 않는다.
3. 기존 계약·보안·lint·typecheck·각 앱 build/브라우저·공용 UI 검사와 backend Docker 빌드를 확인한다. Vercel과 NAS의 amd64 환경도 구분한다.
4. 로컬과 같은 SHA의 원격 CI·배포를 확인하고, 실패하면 버전 핀/lockfile 변경 PR을 되돌린다. pnpm 자체의 서명 오류를 검증 우회로 해결하지 않는다.

공식 근거: [12.14 릴리스](https://github.com/pnpm/pnpm/releases/tag/v12.14.0), [npm 태그 원본](https://registry.npmjs.org/pnpm), [pnpm 12 차이](https://pnpm.io/blog/whats-different-in-pnpm-12), [workspace](https://pnpm.io/workspaces). 설명 문서의 오래된 태그 안내보다 이 날짜의 registry/GitHub 조회값을 버전 선택 근거로 삼았다.

## 한계와 후속 작업

- 이번 보완은 CLI 운영 경로다. GitHub UI를 원격 강제로 막거나 branch protection을 변경하지 않는다.
- 원격 CI·리뷰를 확인한 뒤 별도 승인으로 실제 병합을 검증한다. 성공 응답만으로 merge queue·Production 완료를 선언하지 않는다.
- 기존 main CI의 메시지 실패는 그대로 남으며 이력 재작성·검사 완화는 하지 않는다.
- pnpm 업그레이드 호환성은 조사만 했고 새 버전 설치·frozen install·빌드·배포 실험은 하지 않았다.

## 관련 문서

- [실행 절차](../../process/squash-merge-preflight.md)
- [작업 기록](../../worklog/2026-10/2026-10-22-squash-merge-preflight.md)
- [커밋 메시지 규칙](../../process/commit-message-convention.md)
