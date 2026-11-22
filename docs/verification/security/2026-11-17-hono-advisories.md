# Hono Dependabot 5건 패치 검증

## 대상과 조건

- 검증: 2026-11-15 최초 조사·설치, 2026-11-17 KST 재개·최종 로컬 검사.
- 기준 main: `3b5444edabe021dc18b62baa7e7060c9353c9c3a`. 11-17 원격 조회에서도 같은 SHA였다. 브랜치 `codex/security-dependabot-20261115`의 미커밋 변경을 검사했다.
- 환경: macOS arm64, Node 24.22.1, pnpm 12.14.0, TypeScript 6.0.3. 별도 작업 트리에 frozen lockfile을 `--ignore-scripts`로 설치했다. agent skill 설치 승인은 하지 않았다.
- 추적: [KAN-79](https://web-tech-service.atlassian.net/browse/KAN-79), [Confluence 진행 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=18120705).
- 대상은 로컬 검사 시점에 open인 #357~361이다. [11-07 보안 조치](2026-11-07-dependabot-advisories.md)의 다른 권고와 구분한다. 최초 PR 생성 요청과 별도로 사용자가 main 병합·운영 배포·알림 재평가 확인을 승인했다. 최초 로컬 검사와 아래 사후 운영 검증을 구분한다.

## 조치와 공식 근거

공통 최초 수정 버전은 4.13.16이다. override를 `^4.13.11`에서 `^4.13.16`으로 올렸고 실제 잠금·설치 버전은 **4.13.13 → 4.13.18**이다. 다음 major를 무제한 허용하는 하한만 지정하지 않았다. 공식 패치는 [Hono 4.13.16 릴리스](https://github.com/honojs/hono/releases/tag/v4.13.16)에서 확인할 수 있다.

| 알림 | 심각도 | 공식 권고와 검사 대상                                                                                                          |
| ---- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| #361 | Medium | [GHSA-46wx-v44x-9hh2](https://github.com/advisories/GHSA-46wx-v44x-9hh2): `text/ping` CSRF 검사 우회                           |
| #360 | Medium | [GHSA-4h7h-rv7c-7m2v](https://github.com/advisories/GHSA-4h7h-rv7c-7m2v): 추가 매개변수·공백을 포함한 multipart form 검증 누락 |
| #359 | Medium | [GHSA-4m76-xfj5-7975](https://github.com/advisories/GHSA-4m76-xfj5-7975): mount 동적 prefix·인코딩된 역슬래시로 보호 경로 우회 |
| #358 | Medium | [GHSA-h7mg-cq63-vhpq](https://github.com/advisories/GHSA-h7mg-cq63-vhpq): RegExpRouter wildcard middleware 누락                |
| #357 | Low    | [GHSA-3gg2-335m-rxc6](https://github.com/advisories/GHSA-3gg2-335m-rxc6): CSS template·보간 값 사이로 분할한 닫는 태그 삽입    |

실제 설치 경로는 `vuln-radar-backend → prisma@7.8.0 → @prisma/dev@0.24.3 → hono`와 그 아래 `@hono/node-server@2.1.6 → hono`다. `pnpm why`에서 Hono 4.13.18 한 버전만 확인했다. Hono의 Node 요구 사항 `>=16.9.0`은 프로젝트 Node 24와 호환된다.

Nest 앱 소스에서 해당 Hono 기능의 직접 사용 경로를 확인하지 못했다. GitHub의 runtime 분류나 취약 패키지 설치 사실만으로 운영 endpoint의 악용 가능성·침해를 단정하지 않는다. 이번 검사는 Prisma 개발 서버를 실행하지 않고, 실제 Prisma 경로에서 resolve한 Hono를 메모리 안에서 검사한다.

lockfile에는 Hono 버전·integrity·연결 snapshot 변경 외에 같은 버전의 `node-abort-controller@3.1.1`에 대한 registry deprecation 설명이 추가됐다. 해당 패키지의 버전·integrity는 바꾸지 않았다. 다른 앱·CI·토큰·DB·NAS 설정은 변경하지 않았다.

## 재현 방법

저장소 루트에서 Node 24를 PATH로 선택한 후 실행했다. pnpm은 Corepack으로 실행했으며 `.env`나 실제 운영 자격 증명은 복사하지 않았다. HTTP 검사는 임시 loopback listener 권한이 필요하다.

```sh
corepack pnpm install --frozen-lockfile --ignore-scripts
node --experimental-strip-types --test scripts/security-hono-advisories.test.mts
corepack pnpm exec tsc --noEmit --target ES2023 --module NodeNext --moduleResolution NodeNext --types node --allowImportingTsExtensions --erasableSyntaxOnly --skipLibCheck --strict scripts/security-hono-advisories.test.mts
corepack pnpm test:repo
corepack pnpm --filter vuln-radar-backend build
corepack pnpm --filter vuln-radar-backend typecheck
corepack pnpm --filter vuln-radar-backend test --runInBand
corepack pnpm --filter vuln-radar-backend test:e2e --runInBand
corepack pnpm --filter vuln-radar-backend lint
corepack pnpm validate:catalog
corepack pnpm why --recursive hono --depth 6
corepack pnpm audit --prod --json
corepack pnpm audit --json
```

음성 대조는 기준 main과 같은 의존성 구성·Hono 4.13.13을 설치한 별도 작업 트리를 읽기 전용으로 사용했다. 아래 변수는 해당 트리의 절대 경로로 바꾼다. 테스트 본체는 수정 측의 동일한 파일을 실행한다.

```sh
HONO_SECURITY_WORKSPACE=/path/to/baseline node --experimental-strip-types --test scripts/security-hono-advisories.test.mts
```

이 대조는 종료 코드 1이 기대값이며 패치 후 통과로 집계하지 않는다. 지정한 대상 트리의 workspace·lockfile과 Prisma를 통해 실제 resolve한 Hono를 읽는다. 기존 트리의 파일·개발 서버는 변경하지 않는다.

## 결과와 증거

| 검사             | 실제 결과                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 보안 회귀        | 수정 후 11/11 통과. 하한·모든 lock 사본·설치 사본·Node 호환, CSRF, multipart, mount 두 API, 역슬래시, RegExpRouter 3경로, CSS 2경로 검사 |
| 구버전 음성 대조 | 동일 11개 모두 assertion 실패, 0/11 통과. 모듈 누락·import 실패가 아니며 안전 조건이 만족되지 않았음을 확인                              |
| 정상 입력 대조   | 같은 origin 요청, 허용한 form 필드, 공개 child route, 정상 CSS 출력이 유지되는지 같은 검사에서 확인                                      |
| 저장소 검사      | 262/262 통과. 신규 11개는 기존 `test:repo` 파일 glob과 CI의 해당 명령에 자동 포함                                                        |
| 실제 소비자      | Prisma Client 생성·Nest build·typecheck·lint 통과. unit 15 suites·67/67, mock storage HTTP 2 suites·12/12 통과                           |
| 도구 검사        | 신규 TS strict·erasable 검사, catalog 11개 manifest, 변경 코드·workspace 포맷 검사 통과                                                  |
| 전체 audit       | 11-17 구버전 6건(Medium 4·Low 2) → 수정본 1건(Low). Hono 5건이 사라졌고 별도 기존 `deepmerge` 1건은 남아 종료 코드 1                     |
| production audit | 수정 후 0건·종료 0(11-17). 최초 비교에서도 전후 0건(11-15). 전체 graph의 무위험 또는 운영 비노출을 증명하는 수치는 아님                  |
| 원격 알림        | 11-17 #357~361 모두 open. 로컬 패치와 기본 브랜치 병합 후 GitHub 재평가는 별개                                                           |

초기 재개 검사에서는 7개 통과·3개 실패였다. mount fixture가 자동 wildcard를 추가하는 `app.mount()`에 wildcard까지 전달했고, CSS 정상 대조가 minification의 공백 제거를 예상하지 못했다. [공식 mount 수정](https://github.com/honojs/hono/commit/34f90432a1794b28e52802670efcd01963f716d6)과 설치 소스를 대조해 fixture를 고쳤다. 보안 차단 조건을 완화하지 않았으며 최종 fixture를 구버전에도 적용해 모두 실패하는지 확인했다.

저장소 검사의 첫 실행은 260개 통과·2개 실패였다. 두 실패 모두 기존 body-parser 테스트의 `listen EPERM 127.0.0.1`로 sandbox가 loopback listener를 차단한 경우다. 권한 허용 후 코드·assertion·timeout을 바꾸지 않고 같은 명령으로 262개를 통과했다.

실행 가능한 증거는 [자체 작성한 합성 회귀](../../../scripts/security-hono-advisories.test.mts)다. 네트워크 요청·실제 DB·브라우저 실행 없이 Hono의 메모리 응답을 검사하며, CSS 삽입 문자열은 텍스트로만 확인하고 평가하지 않는다. 원시 감사 응답·인증 정보·사설 경로·실제 로그 artifact는 공개 파일에 추가하지 않았다.

## main 병합과 운영 검증

사용자 후속 승인으로 [PR #95](https://github.com/IMHOJEONG/web-tech/pull/95)를 2026-11-17 00:49:12 KST에 squash 병합했다. 검증한 PR head는 `483300533a0cc4d8f159486c6fcca2d593bd5b83`, 실제 main 병합 커밋은 `6b807f26fd878af38bdc144fdfe8f4af02585281`이다. 저장소 `pr:squash`의 check-only·`--merge` 양쪽에서 최종 메시지 전체와 head를 다시 검사했고 예외·강제 병합·이력 재작성은 하지 않았다.

| 항목                  | 관측 결과                                                                                                                                                                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR 검증               | 전체 23개 검사 성공. CodeRabbit은 같은 head 검토 완료·actionable 코드 지적 0건·미해결 스레드 0개. 기본 filter의 lockfile 제외와 별도 실제 사본 검사는 구분                                                                                                                         |
| main CI               | [CI 43900553334](https://github.com/IMHOJEONG/web-tech/actions/runs/43900553334) 13/13 job 성공. [Documentation](https://github.com/IMHOJEONG/web-tech/actions/runs/43900552770)·[CodeQL](https://github.com/IMHOJEONG/web-tech/actions/runs/43900549229)도 같은 main SHA에서 성공 |
| 블로그 Production     | [배포 API 기록 7828847017](https://api.github.com/repos/IMHOJEONG/web-tech/deployments/7828847017): main SHA 일치·success. 실제 운영 alias는 target production·READY이며 기록의 deployment URL과 일치. provider 배포 ID는 생략.                                                    |
| vuln-radar Production | [배포 API 기록 7828860611](https://api.github.com/repos/IMHOJEONG/web-tech/deployments/7828860611): 같은 main SHA·success. 운영 alias는 production·READY. provider 배포 ID는 생략.                                                                                                 |
| Railway 백엔드        | 당시 대상 서비스의 `development` 환경을 실제 CLI로 조회해 같은 main SHA·SUCCESS, 이전 배포 REMOVED를 확인. GitHub 연동은 in_progress여서 플랫폼에서 별도 대조. 개별 배포 ID는 생략.                                                                                                |
| 이미지 게시           | [Docs Backend Image 43900553044](https://github.com/IMHOJEONG/web-tech/actions/runs/43900553044) main push 성공. GHCR 이미지 게시이며 NAS 컨테이너 교체는 실행하지 않음                                                                                                            |
| 공개 HTTP 표본        | 블로그 주요 경로·검색·상세·robots·sitemap 12개 200, 무인증 revalidation POST 401. vuln-radar SPA 2개·프록시 API 6개 200. 총 21개 기대 응답 통과                                                                                                                                    |
| 로그 표본             | 각 Vercel 배포를 명시한 조회 시점 최근 20분의 error·5xx JSON 표본이 모두 0행. 전체 운영 기간 무장애를 보장하지 않음                                                                                                                                                                |
| Dependabot            | #357~361 모두 **fixed**, dismissed_at 모두 null. 수정 시각은 2026-11-17 00:56:34~35 KST. open 알림 0건, GitHub SBOM의 Hono 4.13.18 확인                                                                                                                                            |

병합 직후 알림은 잠시 open이었고 SBOM 버전 갱신 후 fixed를 다시 확인했다. 알림을 직접 dismiss하거나 API로 상태를 강제 변경하지 않았다. 별도 기존 deepmerge Low가 전체 npm 감사에 남아 있다는 초기 결과와 GitHub open 알림 0건은 다른 집계다.

최초 Node fetch는 이 실행 환경에서 연결 오류로 중단됐다. 같은 공개 도메인의 curl 대조가 200이어서, curl을 자식 프로세스로 사용해 전체 HTTP 표본을 다시 검사했다. 이 차이의 단일 원인은 확정하지 않았으며 배포 애플리케이션 장애나 Node 일반 결함으로 단정하지 않는다. 초기 Vercel 로그 명령은 프로젝트 연결이 없어 실패했고, 확인한 CLI 53.1.1의 `--project` 인수를 명시해 재조회했다.

재현에는 `gh`·Vercel CLI 53.1.1·Railway CLI 5.12.1의 기존 인증을 사용했다. 공개 GET에 자격 증명을 전달하지 않았고 실제 DB 접속·수집 실행·토큰 교체·NAS 변경은 하지 않았다. Railway 조회는 별도 임시 디렉터리에만 프로젝트를 연결했으며 조회 후 `railway unlink --yes --json`으로 해제했다. 기존 작업 디렉터리의 연결은 유지했다.

아래는 당시 명령의 재현 형식이다. `VERCEL_SCOPE`는 본인의 조회 대상 scope, `VERCEL_DEPLOYMENT_ID`는 검사할 main SHA와 일치하는 배포 ID로 별도 지정한다. 개인 scope와 불필요한 provider 식별자는 이 정제본에 넣지 않는다. 현재 실행하는 `--since 20m` 조회는 과거 11-17 로그의 재현이나 당시 무오류 관측의 대체가 아니다. 이번 11-20 기록 통합에서는 아래 운영 명령을 다시 실행하지 않았다.

```sh
gh pr view 95 --repo IMHOJEONG/web-tech --json state,mergedAt,mergeCommit
gh run list --repo IMHOJEONG/web-tech --branch main --commit 6b807f26fd878af38bdc144fdfe8f4af02585281
gh api 'repos/IMHOJEONG/web-tech/dependabot/alerts?state=fixed&per_page=30' --jq '.[] | select(.number >= 357 and .number <= 361) | {number,state,fixed_at,dismissed_at}'
gh api 'repos/IMHOJEONG/web-tech/dependabot/alerts?state=open&per_page=100' --jq 'length'
gh api repos/IMHOJEONG/web-tech/dependency-graph/sbom --jq '.sbom.packages[] | select(.name == "hono") | {name,versionInfo}'
vercel inspect heap-forge.app --scope "$VERCEL_SCOPE"
vercel inspect vuln-radar-service.vercel.app --scope "$VERCEL_SCOPE"
curl --disable --silent --show-error --max-time 20 --output /dev/null --write-out '%{http_code}\n' https://heap-forge.app/ko/feed
curl --disable --silent --show-error --max-time 20 --output /dev/null --write-out '%{http_code}\n' https://vuln-radar-service.vercel.app/api/backend/health
vercel logs "$VERCEL_DEPLOYMENT_ID" --project web-tech --no-follow --no-branch --level error --since 20m --scope "$VERCEL_SCOPE" --json
vercel logs "$VERCEL_DEPLOYMENT_ID" --project web-tech --no-follow --no-branch --status-code 5xx --since 20m --scope "$VERCEL_SCOPE" --json
```

Railway 재조회는 기존 대상 프로젝트에 연결된 디렉터리에서 `railway deployment list --service web-tech/vuln-radar-backend --environment development --limit 3 --json`을 실행한다. CLI 원시 응답에는 불필요한 메타데이터도 있으므로 공개 기록에 통째로 복사하지 않는다.

## 한계와 후속 작업

- 별도 기존 [deepmerge Low 권고](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)는 수정·무시하지 않았다. 과거 판단은 11-07 보고서에 있고 이번에는 현재 상태를 새로 오탐 처리하지 않았다.
- 합성 테스트는 취약 라이브러리 동작과 소비자 호환을 검사한다. 실제 Prisma 개발 서버의 모든 기능·운영 노출·악용 이력, 실제 DB 연결, NAS 교체는 미검증이다.
- 최초 로컬 검증 당시 미실행이던 PR·main CI·배포·알림 재평가는 위 후속 관측으로 구분했다. 실제 DB 내부·Prisma 개발 서버 전체 기능·브라우저 시각 회귀·NAS 컨테이너 교체는 이번 운영 검사에서 실행하지 않았다.
- 기존 초안·stash·다른 작업 브랜치·개발 서버·NAS 작업은 유지했다. 이번 사후 기록은 새 main 기준 `codex/security-hono-deployment-20261117`에 로컬 보관한다. 추가 공개·커밋·푸시는 아직 하지 않았으며 승인 manifest도 임의로 갱신하지 않았다.

## 관련 문서

- [이번 작업 기록](../../worklog/2026-11/2026-11-17-hono-advisories.md)
- [공개 검수 절차](../../process/publication-review.md)
- [Jira·Confluence 기록 기준](../../process/issue-tracking.md)
