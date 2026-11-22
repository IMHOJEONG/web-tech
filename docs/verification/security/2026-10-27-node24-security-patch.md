# Node 24 보안 patch·CI·Docker 검증

## 대상과 조건

10월 28일 게시 준비에서 보류·재개·병합 후 기록을 별도 PR로 분리했다. 본문의 ‘미커밋·미배포’ 문장은 각 관측 시점의 상태이며, 최종 확인은 아래 **재개와 병합 후 검증** 구역을 따른다. NAS 실제 교체는 여전히 미검증이다.

- 날짜: 2026-10-27 Asia/Seoul. [KAN-43](https://web-tech-service.atlassian.net/browse/KAN-43).
- 기준: 최신 main을 fetch한 `e8ab3bd6bc6c0f6ee890b05fa244cf9d040dc16e`. 별도 `codex/security-node24-20261027` 작업 트리에서 최초 로컬 검증을 수행했다. 후속 커밋·원격 검증은 아래에서 별도로 구분한다.
- 기존 필터 작업 트리의 수정·미추적 15파일은 SHA-256으로 대조해 보존했다. 해당 브랜치의 두 커밋과 필터·선행 조사 파일을 새 보안 브랜치에 섞지 않았다.
- macOS arm64의 mise Node 24.22.1, pnpm 12.14.0, Docker Desktop의 Linux amd64 이미지. 최초 로컬 검증에서는 실제 NAS·Railway·Vercel·운영 DB에 연결하거나 이미지 push·운영 배포·토큰 교체·커밋/푸시를 하지 않았다.

## 재현 방법

저장소 루트에서 실행한다. 전역 Node 설정을 바꾸지 않으며, frozen lockfile·기존 pnpm 서명 검증과 승인 정책을 유지한다.

```bash
mise install
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm check:node
mise exec -- pnpm typecheck:toolchain
mise exec -- pnpm test:repo
mise exec -- pnpm --filter docs-backend check
mise exec -- pnpm --filter vuln-radar-backend test --runInBand
mise exec -- pnpm --filter @web-tech/ui build
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs test:article:prod
mise exec -- pnpm --filter vuln-radar build
mise exec -- pnpm exec turbo lint --force
DATABASE_URL=postgresql://test:test@127.0.0.1:1/test mise exec -- pnpm exec turbo typecheck --force
```

테스트용 DB 주소는 Prisma 코드 생성/타입 확인에만 사용한다. migration·접속 검사가 아니며 실제 자격 증명으로 바꾸지 않는다. Turbo의 `--force`는 실행 캐시를 재사용하지 않기 위한 것이며 package 설치·무결성 검사를 우회하지 않는다. production E2E는 3111/3112의 콘텐츠 fixture를 사용하고 모든 NAS 후보·토큰을 테스트 전용으로 덮어쓴다.

```bash
docker build --platform linux/amd64 --pull -f apps/docs-backend/Dockerfile -t web-tech/docs-backend:node24-security-local .
docker build --platform linux/amd64 --pull -f apps/vuln-radar-backend/Dockerfile -t web-tech/vuln-radar-backend:node24-security-local .
docker run --rm --platform linux/amd64 --network none --entrypoint node web-tech/docs-backend:node24-security-local /opt/check-node-runtime.mts
docker run --rm --platform linux/amd64 --network none --entrypoint node web-tech/vuln-radar-backend:node24-security-local /opt/check-node-runtime.mts
docker run --rm --platform linux/amd64 --network none --mount "type=bind,source=$PWD/scripts/smoke-docs-container.mts,target=/tmp/smoke-docs-container.mts,readonly" --entrypoint node web-tech/docs-backend:node24-security-local /tmp/smoke-docs-container.mts
```

smoke 도구는 컨테이너 내부에만 임시 공개 글과 테스트용 인증값을 만들고, 실제 AppModule의 loopback HTTP를 검사한 뒤 정리한다. 포트를 공개하거나 NAS 볼륨·실제 비밀값을 전달하지 않는다. vuln-radar 이미지의 운영 DB 연결은 이 검사에 포함하지 않는다.

구버전 gate는 별도로 다음 명령을 실행해 **종료 코드 1**을 확인했다. 이는 의도한 음성 대조이며 실패를 무시하는 fallback을 추가하지 않는다.

```bash
mise exec node@24.12.0 -- node scripts/check-node-runtime.mts
```

## 결과와 증거

### 적용 내용

- [공식 24.22.1 보안 릴리스](https://nodejs.org/en/blog/release/v24.22.1)의 Node 24 patch를 정확히 선택한다. 로컬 `.mise.toml`과 CI `.node-version`을 동기화하고 회귀로 불일치를 차단한다. `engines.node=24.x`와 기존 Node 24 지원 정책은 유지한다.
- 독립적인 runtime gate는 실제 `process.version`이 stable Node 24이고 최소 24.22.1 이상인지 검사한다. 구버전·다른 major·prerelease·잘못된 버전을 거절한다. 임의 인자로 실행 버전을 덮어쓰는 기능은 없다.
- CI/문서/이미지 workflow의 Node setup 9곳은 pin 파일을 읽고 의존성 설치/빌드 전에 gate를 실행한다. `node-version:24`의 캐시 선택에 의존하지 않는다. 새 정책 테스트는 기존 `test:repo` glob에 포함되므로 CI에서도 실행된다.
- 두 backend의 builder/base와 runtime을 공식 `node:24.22.1-bookworm-slim`의 같은 multi-arch index digest에 고정했다. Node stage마다 실제 바이너리 gate를 실행한다. 이미지 workflow는 `pull:true`, policy 입력 path filter, 기존 `linux/amd64`와 PR 비게시 조건을 유지한다.
- Git hook wrapper는 mise와 gate를 먼저 적용한다. 예전 24.12.0 경로 fallback은 제거하고, mise가 없을 때도 PATH Node의 gate를 통과해야 pnpm/Corepack을 실행한다.

### 실행 결과

| 범위                   | 관측 결과                                                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 신규 보안 회귀         | 12 통과. 버전 경계, 실제 CLI, pin 일치, CI gate 누락/major-only 선택 거절, Docker 구버전/누락 gate 거절, image path/pull/PR 비게시, hook 실패 중단, 정상 Brotli·TLS 이름 판정 포함. |
| 저장소 검사기 회귀     | 165 통과·실패/skip 0. 위 12개를 포함하므로 별도 합산하지 않는다.                                                                                                                    |
| docs-backend check     | lint·typecheck·unit 31·HTTP E2E 55·build 통과.                                                                                                                                      |
| vuln-radar-backend     | unit 48·typecheck 통과. Docker 안의 production build도 통과.                                                                                                                        |
| docs lib               | 307 통과·실패/skip 0.                                                                                                                                                               |
| docs production        | build 및 mobile/desktop 162 통과, retry 0. 기존 timeout·assertion·fixture 계약 유지.                                                                                                |
| vuln-radar 프론트      | production build 통과.                                                                                                                                                              |
| 전체 workspace         | lint 7 tasks·typecheck 9 tasks 통과, Turbo cache 재사용 0. 도구 gate/smoke의 strict TypeScript 검사도 통과.                                                                         |
| 로컬 이미지            | 두 이미지 모두 linux/amd64 빌드 성공. 실행 Node 24.22.1, OpenSSL 3.5.9, Brotli 1.2.0, 내장 Undici 7.30.1 확인.                                                                      |
| 이미지 내 gate         | 두 파일의 SHA-256이 검증한 호스트 소스와 동일. 최소 버전 함수도 실제 실행해 통과.                                                                                                   |
| docs 이미지 HTTP smoke | health 200, 무인증 401, 목록 200/1개, 상세 HTML 200. network none·실제 비밀값 미사용.                                                                                               |

정제한 [artifact](../artifacts/2026-10-27-node24-security-patch.json)에 base/index digest, 로컬 이미지 ID, gate hash와 검사 범위를 남긴다. 로컬 image digest는 GHCR에 게시되었다는 뜻이 아니며 NAS가 바로 pull할 수 있는 배포 결과가 아니다.

### 중간 실패와 경고

- 새 guard/test의 첫 strict 타입 검사에서 tuple/index의 undefined 가능성과 TLS fixture의 타입 부족이 검출됐다. typed tuple·명시적인 존재 검사·인증서 이름 판정용 메타데이터 fixture로 보완했고 strict 설정을 낮추지 않았다.
- 첫 Docker 명령은 daemon이 꺼져 있어 실행되지 않았다. Docker Desktop을 시작한 후 빌드했다. 최초 docs 이미지는 타입 보완 전 gate 소스였으므로 최종 소스로 다시 빌드하고 이미지 내부 파일 hash까지 대조했다.
- 첫 HTTP smoke는 fixture의 필수 frontmatter가 없어 목록이 0개였고 `1개` assertion이 실패했다. slug·작성자·읽기 시간·분류·갱신일을 계약대로 채웠으며 서버의 validation이나 기대 건수를 낮추지 않았다. 이후 같은 상태·목록·HTML 검사가 통과했다.
- 새 worktree 설치의 simple-git-hooks prepare는 `.git`이 파일이라 `ENOTDIR`을 출력했다. hooks를 삭제하거나 검사를 끄지 않았고 실제 wrapper와 회귀를 직접 확인했다. 실제 커밋 단계의 hook 검증은 아직 실행하지 않았다.
- vuln-radar Docker build의 Prisma system libssl 탐지 경고와 legacy deploy 경고가 남는다. Node 내부 OpenSSL 버전과 system libssl은 다르며, 이미지 빌드 성공을 실제 운영 DB 연결 성공으로 확대하지 않는다. 패키지 override의 기존 stale 경고도 이 patch와 분리해 기록한다.

### 커밋·원격 검증 후속

사용자 승인 후 Node 실행 정책 `3493e63`과 CI·Docker·회귀 `9827277`을 별도 커밋했다. 실제 pre-commit의 포맷·문서 검사와 commit-msg의 commitlint를 우회 없이 통과했다. 따라서 설치 시의 linked worktree hooks prepare 경고를 실제 커밋 훅 미실행으로 혼동하지 않는다. 커밋 직전 저장소 회귀 165개와 toolchain 타입 검사도 재통과했다. 원격 CI는 이 로컬 검사와 분리해 확인한다.

운영·검증 문서 `7efc5715d1b5c5b167b0cda84685012fb3aa442f`까지 3개 커밋을 전용 브랜치에 푸시하고 [PR #68](https://github.com/IMHOJEONG/web-tech/pull/68)을 생성했다. 연결 앱의 PR 쓰기 403은 중복 PR이 없음을 확인한 뒤 기존 인증 CLI로 복구했다. PR의 head·base main·본문·검사 시작을 재조회했다. 기존 필터 15파일은 다시 해시가 같고 보안 작업 트리는 세 커밋 직후 clean이었다.

최초 원격 head `7efc5715d1b5c5b167b0cda84685012fb3aa442f`의 [CI](https://github.com/IMHOJEONG/web-tech/actions/runs/40505633372), [문서](https://github.com/IMHOJEONG/web-tech/actions/runs/40505633397), [CodeQL](https://github.com/IMHOJEONG/web-tech/actions/runs/40505630551), [PR 이미지 빌드](https://github.com/IMHOJEONG/web-tech/actions/runs/40505633515)를 확인했다. 이 기록 작성 시점에 commitlint·문서·lint·타입·CRP·CodeQL은 통과했고 나머지는 진행 중이었다. PR 이미지 빌드의 게시 조건은 false이며 main 병합·운영 배포는 하지 않았다. 후속 기록 커밋의 최신 검사는 PR의 Checks와 Jira 구현 댓글에서 head를 구분해 확인한다. 앞선 SHA의 통과를 후속 SHA의 통과로 간주하지 않는다.

Jira 댓글 10034를 PR·실제 원격 커밋·검사 URL이 있는 3열 표로 갱신하고 재조회했다. Confluence v172에 같은 PR과 원격 원본 링크를 추가했으며 기존 본문 보존을 확인했다. 전체 원격 검사 종료 결과는 같은 기록에서 후속 갱신한다.

최종 코드가 같은 기록 head `617cf03532d8189fe8522683b20bbf2034afc43e`의 CI 최초 실행에서는 데스크톱 job이 Ubuntu 시스템 의존성 17.6MB 다운로드에 13분 22초(21.9kB/s)를 사용했다. 12:58:53 UTC에 138개 검사를 시작했지만 12:59:34에 job 제한으로 취소돼 종합 Test도 실패했다. 다른 11개 job과 문서·CodeQL·PR 이미지 빌드는 통과했다. 같은 head의 데스크톱 job과 종속 Test만 attempt2로 재실행했다. 제한 시간·assertion·기존 필터 코드는 바꾸지 않았다. 이는 job 재실행이며 테스트가 최초부터 전부 통과한 결과가 아니다.

CodeRabbit의 NAS 명령 범위 지적을 확인해 gate뿐 아니라 `node --version`도 env-file·Compose-file을 명시한 `exec -T docs-backend` 명령으로 고쳤다. 문서 shell 구문의 정적 검사는 실제 NAS 명령 실행이나 운영 이미지 교체를 뜻하지 않는다. 후속 문서 수정 head의 원격 결과는 PR·Jira에서 앞선 head와 구분한다.

### 2026-10-28 병합 사전검사 보류

사용자 병합 승인 후 최종 메시지 전체의 전용 commitlint 검사는 0문제·0경고로 통과했다. 메시지 SHA-256은 [보류 artifact](../artifacts/2026-10-28-pr68-merge-hold.json)에 남겼다. 최초 공식 squash 사전검사는 CodeRabbit의 rate-limited NEUTRAL로 중단했다. 규칙을 바꾸지 않고 정상 증분 리뷰를 한 번 요청해 `96a1250`의 리뷰가 SUCCESS가 됐지만 NAS 절차 지적 두 건이 추가됐다. 실제 반영 파일과 대조해 이미지 선택값 설정·pull/up 후 버전 확인 순서를 보완했다.

추가 커밋 `05aa729fa456ac043dadcad20f1e7fa6fe70e2d9`의 정책 회귀는 13개, 저장소 전체는 166개이며 실패·skip 없이 통과했다. strict toolchain 타입 검사와 실제 커밋 훅도 통과했다. 초기 음성 fixture의 대상 선택 오류와 샌드박스 loopback EPERM은 [당일 작업 기록](../../worklog/2026-10/2026-10-28-node24-security-merge.md)에 구분했다. 실제 NAS 명령은 실행하지 않았다. 새 지적 두 건을 포함해 리뷰 스레드 세 개 모두 resolved를 재조회했다.

최신 head의 [CI40541395799](https://github.com/IMHOJEONG/web-tech/actions/runs/40541395799)는 11개 job 통과·desktop 취소·종합 Test 실패이며 전체 결론은 cancelled다. desktop은 Ubuntu 패키지 25.9MB에 9분30초를 사용했고, 이후 스켈레톤의 light feed/mobile/article 세 검사에서 retry #1 및 hydration 경고를 관측한 뒤 job 시간 제한으로 취소됐다. 따라서 설치 지연만을 단독 원인으로 확정하거나 전체 회귀 통과로 표시하지 않는다. 로그의 UTC 날짜는 10-27이지만 이번 작업의 KST 날짜는 10-28이다.

원격 문서 job에서도 저장소166·문서 검사가 통과했고 PR 이미지 빌드·CodeQL·두 Preview는 success다. PR 이미지는 기존 조건대로 비게시이며 main 이미지 게시가 아니다. 최신 CodeRabbit은 다시 rate-limited NEUTRAL이고 사용자가 **기존 정책 유지·한도 해제까지 병합 보류**를 선택했다. PR은 OPEN, mergedAt은 null이며 `--merge`를 실행하지 않았다. 한도 해제만으로 CI 실패가 해결되지는 않으므로 재개 시 desktop/종합 Test·최신 리뷰·최종 메시지와 head를 모두 다시 확인한다. 자동 재개·유료 한도 해제·검사 기준 완화는 설정하지 않았다.

사전 운영 기준으로 Vercel Production READY와 Railway SUCCESS의 소스가 main `e8ab3bd6`임을 확인했다. 이는 이번 보안 변경의 운영 배포 결과가 아니다. main 병합 후 CI·GHCR 게시·NAS 교체와 배포 확인은 미실행이며, 토큰·DB·SSH 설정은 변경하지 않았다. 기존 필터 미커밋15파일의 SHA-256은 동일하다. 이 후속 보류 기록은 로컬 미커밋으로 남겨 PR head를 추가로 변경하지 않는다.

### 2026-10-28 재개와 병합 후 검증

후속 사용자 승인으로 최신 head `05aa729fa456ac043dadcad20f1e7fa6fe70e2d9`의 CodeRabbit 리뷰를 정상 재요청하고 취소된 desktop job과 종속 Test만 재실행했다. 이전 보류·취소 artifact는 그대로 보존했다. 리뷰 check122526683712는 SUCCESS, CI40541395799 attempt2는 13개 job success다. desktop은120 passed/2 flaky/16 skipped이며 flaky는 feed·UI/UX 스켈레톤의 기존 retry #1 통과다. 테스트가 최초부터 전부 성공한 결과로 표시하지 않는다.

추가 Minor는 gate가 없는 이전 이미지에서 검사를 생략하자는 제안이었다. 운영상 혼동 가능성은 후속 문서 검토로 남기되, 자동 gate 생략은 보안 floor와 취약 이미지 자동 rollback 금지에 충돌해 미반영했다. [검토 답변](https://github.com/IMHOJEONG/web-tech/pull/68#discussion_r4395284068)을 남기고 스레드를 정리했으며 코드 수정 완료로 주장하지 않았다. 리뷰 스레드 네 개의 resolved와 모든 보고 검사 SUCCESS를 재조회했다.

최종 메시지 전체 SHA-256 `c8191f829146fe3d6a129118134f16006ff69314a9e404e51148c703ff6e7a44`를 같은 `pnpm pr:squash` 경로로 사전검사·재검사해 병합했다. PR의 실제 MERGED와 squash SHA `e2126a40c02694d968f62ce0e236ec0945a57d7b`, KST08:25:08을 확인했다. 직접 병합 우회·admin/auto·main 이력 재작성·브랜치 삭제는 하지 않았다.

| 범위                                                                                   | 병합 SHA에서 관측한 결과                                                                                                                       |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [main CI40601997663](https://github.com/IMHOJEONG/web-tech/actions/runs/40601997663)   | attempt1, 13개 job success. 실제 Node24.22.1 gate 및 최종 squash commitlint 통과.                                                              |
| 문서·CodeQL                                                                            | 문서40601997562와 main CodeQL40601997272의 actions/TypeScript 분석 success.                                                                    |
| 브라우저 잔여                                                                          | main desktop119 passed/3 flaky/16 skipped, mobile126/2/10, tablet114/24. 스켈레톤5건의 기존 retry #1 통과를 별도 후속으로 남긴다.              |
| [GHCR 게시40601997769](https://github.com/IMHOJEONG/web-tech/actions/runs/40601997769) | linux/amd64, pull/push=true, SBOM·provenance 유지. 실제 push-manifest·최종 digest 로그 확인.                                                   |
| Vercel Production                                                                      | dpl_FRZ6Ht4yFyC12Dev5HAth9GAcqnY READY, main/e2126a40 및 heap-forge.app alias 일치. 플랫폼 Node24.x이며 정확한 함수 patch는 별도다.            |
| Railway                                                                                | 0ba8ae87-54f2-4bcc-8e7b-a90393d76051 SUCCESS, main/e2126a40·새 이미지 digest 일치. 실제 Dockerfile builder와 Node24.22.1 build gate 로그 확인. |
| 공개 GET                                                                               | feed/docs/robots/sitemap 및 vuln-radar backend health 모두200. health JSON status=ok·storage=database. DB 변경·수집 실행은 하지 않았다.        |

게시 tag는 `ghcr.io/imhojeong/web-tech-docs-backend:sha-e2126a40c02694d968f62ce0e236ec0945a57d7b`, digest는 `sha256:3167e80350bb00edcceb39890181b24ce5aad7faf90421895234938414ac4265`다. 이는 workflow의 실제 게시 로그로 확인한 결과이며 독립 registry read나 NAS pull/up·컨테이너 실행 버전 확인은 아니다. NAS 교체는 아직 필요하다.

정제한 [병합 후 artifact](../artifacts/2026-10-28-pr68-postmerge.json)에 run/job·deployment·image·HTTP 결과를 연결했다. 기존 필터 미커밋15파일의 SHA-256은 계속 일치한다. 로컬 보류 기록과 이번 후속 문서는 커밋·업로드하지 않았고, 원격 커밋/배포 결과와 구분한다. 새 구조·공개 계약을 만들지 않아 ADR을 추가하지 않았다.

## 한계와 후속 작업

- 보안 버전 gate와 정상 API 회귀이며, 악성 Brotli·RCE exploit을 실행하거나 모든 CVE 경로를 재현한 검사가 아니다.
- setup-node와 gate는 workflow의 shell 실행 Node를 검증한다. 각 GitHub Action 내부의 별도 Node와 hosted runner 자체의 보안 patch는 provider 관리 범위이며 이 결과로 검증했다고 볼 수 없다.
- 최초 로컬 검증에는 새 원격 CI·PR·GHCR 게시·NAS/Railway 교체·Vercel 재배포가 포함되지 않았다. 후속 PR·CI 결과와 운영 배포는 구분한다. Vercel managed runtime의 patch는 provider가 관리하며 소스 pin만으로 운영 함수를 패치했다고 볼 수 없다.
- 실제 운영 DB와 ARM 컨테이너 서비스는 미검증이다. macOS arm64 호스트와 NAS 대상 linux/amd64 실행 결과를 구분한다.
- Node 24 지원 major·콘텐츠 공개 계약·공용 UI 책임은 바꾸지 않았다. 새 ADR을 강제하지 않고 기존 툴체인 절차에 patch 갱신·최소 버전·digest 확인을 추가했다.
- 코드·의존성 SRI·서명·lockfile을 완화하지 않았다. npm 의존성 lockfile과 pnpm bootstrap lockfile은 변경하지 않았다. pin은 자동 보안 업데이트가 아니므로 이후 공지 때 같은 절차로 검토한다.

## 관련 문서

- [Jira 구현 검증 기록](https://web-tech-service.atlassian.net/browse/KAN-43?focusedCommentId=10034): 검토 중. 댓글 3열 표를 재조회해 확인했다.
- [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817): v171의 KAN-43 구현 구역과 기존 본문 보존을 재조회했다. 로컬 검증과 운영 미배포를 구분한다.
- [툴체인 갱신 절차](../../runbooks/pnpm-toolchain-upgrade.md#node-보안-patch-갱신)
- [NAS 배포 절차](../../runbooks/docs-backend-nas-deployment.md#update-and-rollback)
- [작업 기록](../../worklog/2026-10/2026-10-27-node24-security-patch.md)
