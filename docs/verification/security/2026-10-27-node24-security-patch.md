# Node 24 보안 patch·CI·Docker 검증

## 대상과 조건

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
