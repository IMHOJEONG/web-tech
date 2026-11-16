# Hono Dependabot 5건 패치 검증

## 대상과 조건

- 검증: 2026-11-15 최초 조사·설치, 2026-11-17 KST 재개·최종 로컬 검사.
- 기준 main: `3b5444edabe021dc18b62baa7e7060c9353c9c3a`. 11-17 원격 조회에서도 같은 SHA였다. 브랜치 `codex/security-dependabot-20261115`의 미커밋 변경을 검사했다.
- 환경: macOS arm64, Node 24.22.1, pnpm 12.14.0, TypeScript 6.0.3. 별도 작업 트리에 frozen lockfile을 `--ignore-scripts`로 설치했다. agent skill 설치 승인은 하지 않았다.
- 추적: [KAN-79](https://web-tech-service.atlassian.net/browse/KAN-79), [Confluence 진행 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=18120705).
- 대상은 로컬 검사 시점에 open인 #357~361이다. [11-07 보안 조치](2026-11-07-dependabot-advisories.md)의 다른 권고와 구분한다. 이후 사용자가 작업 단위 커밋·푸시·main 반영용 PR 생성과 CI·리뷰 확인을 요청했다. 아래는 최초 로컬 검증 기록이며 후속 원격 결과는 연결된 Jira·Confluence와 PR에서 별도로 추적한다. main 병합·운영 배포는 이번 요청에 포함하지 않는다.

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

## 한계와 후속 작업

- 별도 기존 [deepmerge Low 권고](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)는 수정·무시하지 않았다. 과거 판단은 11-07 보고서에 있고 이번에는 현재 상태를 새로 오탐 처리하지 않았다.
- 합성 테스트는 취약 라이브러리 동작과 소비자 호환을 검사한다. 실제 Prisma 개발 서버의 모든 기능·운영 노출·악용 이력, 실제 DB 연결, NAS 교체는 미검증이다.
- 최초 로컬 검증에서는 GitHub CI·CodeRabbit·main 병합·운영 배포를 실행하지 않았다. 후속 커밋·PR 요청에 따라 CI·리뷰를 확인하되, main 반영 뒤 해당 알림의 재평가와 운영 배포는 별도 단계로 남긴다.
- 기존 초안·stash·다른 작업 브랜치·개발 서버·NAS 작업은 유지했다. 공개 승인 manifest는 최종 파일별 검수 승인 후 해당 문서의 해시만 갱신한다.

## 관련 문서

- [이번 작업 기록](../../worklog/2026-11/2026-11-17-hono-advisories.md)
- [공개 검수 절차](../../process/publication-review.md)
- [Jira·Confluence 기록 기준](../../process/issue-tracking.md)
