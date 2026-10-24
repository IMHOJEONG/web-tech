# vuln-radar Vite+ 로컬 개발·빌드 검증

## 대상과 조건

- 날짜: 2026-10-24 KST. artifact 파일명의 시간은 UTC다.
- 기준: main `16c51e9911f041b125a445b3939966986426a0b4` + 실험 브랜치의 미커밋 변경.
- 브랜치: `codex/vuln-radar-viteplus-experiment-20261024`.
- 환경: macOS arm64, Node 24.12.0, pnpm 12.14.0, Turborepo 2.9.18, Vite+ 1.4.0(Vite 8.3.5·Rolldown 1.2.15 내장).
- 단일 로컬 기능 검증이다. Docker의 PostgreSQL 16과 실제 Nest, Playwright Chromium을 쓰되 데이터·토큰은 실행 중 생성한 합성 값이다. 수집 스케줄러를 끄고 실제 upstream이나 Railway에 요청하지 않는다.

## 재현 방법

저장소 루트에서 mise를 사용할 수 있어야 한다. 기존 공유 Node·pnpm 설정은 바꾸지 않는다.

```sh
mise exec -- pnpm install --frozen-lockfile --ignore-scripts
mise exec -- pnpm --filter vuln-radar exec vp toolchain
mise exec -- pnpm --filter vuln-radar build
mise exec -- pnpm --filter vuln-radar typecheck
mise exec -- pnpm --filter vuln-radar lint
mise exec -- pnpm --filter vuln-radar test:lib
mise exec -- pnpm --filter vuln-radar-backend test --runInBand
mise exec -- pnpm test:repo
mise exec -- pnpm exec tsc -p tsconfig.vuln-integration.json
mise exec -- node --experimental-strip-types scripts/verify-vuln-radar-viteplus.mts
mise exec -- pnpm verify:vuln-radar:integration
mise exec -- pnpm exec turbo run build --filter=vuln-radar --force --summarize
```

새 CLI 검사는 기존 `.env` 파일이 있으면 읽지 않고 실패한다. 깨끗한 실험 checkout에서 실행해야 한다. 임시 loopback upstream과 임시 빌드 폴더를 사용하며 종료 시 이번 실행의 프로세스·파일만 정리한다. YAML 판독에는 기존 docs-backend의 의존성을 사용하므로 해당 workspace도 설치되어 있어야 한다.

개발 서버를 직접 확인할 명령은 다음과 같다. 검사 후 `Ctrl+C`로 종료했다. API 화면을 실제로 이용하려면 승인된 로컬 백엔드를 별도로 준비해야 한다.

```sh
mise exec -- pnpm exec turbo dev --filter=vuln-radar -- --host 127.0.0.1 --port 4399 --strictPort
curl -f http://127.0.0.1:4399/overview
```

## 결과와 증거

| 검사                    | 관측 결과                                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 고정 설치·공급망 정책   | 통과. `--ignore-scripts` 사용, 기존 빌드 허용 정책·서명 검증 우회 없음                                                                                                 |
| 새 Vite+ CLI 회귀       | 7개 그룹 통과. 공통 설정/테스트 보존, Vite core 정렬, 다른 workspace 직접 버전 보존, dev 변환, 프록시 rewrite·인증 헤더 교체, build 토큰 비노출, preview 자산·SPA 경로 |
| 기존 frontend node:test | 32개 통과                                                                                                                                                              |
| 기존 backend Jest       | 13개 suite·48개 통과. collector는 fixture/mock이며 실제 수집 아님                                                                                                      |
| frontend 타입·ESLint    | 통과                                                                                                                                                                   |
| 통합검사·검사기 타입    | 통과. 기존 Playwright/Nest/PostgreSQL 25개 그룹과 정리 6단계 모두 성공                                                                                                 |
| Turborepo build         | UI → 앱 2개 태스크 성공. 기존 prebuild도 실행. 샌드박스 캐시 IO 경고가 있었지만 빌드 exit 0                                                                            |
| Turborepo dev           | predev UI 빌드·`vp dev` 시작, `/overview` HTTP 200, 수동 종료                                                                                                          |
| 의존성 audit            | 실패(exit 1). 13건: critical 2·high 7·moderate 2·low 2. Vite+ 경유 경고는 0개이나 저장소 전체 보안 통과는 아님                                                         |
| pnpm peer 검사          | 실패(exit 1). React 플러그인·Vitest 내부가 Vite alias 패키지의 `1.4.0`을 기존 Vite semver 범위와 비교. 실제 core 경로 정렬은 별도 검사로 통과                          |

최종 원본:

- [CLI 회귀 7개와 peer 문맥 변경 목록](../artifacts/2026-10-24T05-34-00-240Z-vuln-radar-viteplus.json)
- [기존 통합검사 25개·브라우저·정리 결과](../artifacts/2026-10-24T05-30-25-335Z-vuln-radar-integration.json)
- [모바일 Feed](../artifacts/2026-10-24T05-30-25-335Z-vuln-radar-feed-390.png), [데스크톱 Feed](../artifacts/2026-10-24T05-30-25-335Z-vuln-radar-feed-1280.png)
- [모바일 KEV](../artifacts/2026-10-24T05-30-25-335Z-vuln-radar-kev-390.png), [데스크톱 KEV](../artifacts/2026-10-24T05-30-25-335Z-vuln-radar-kev-1280.png)
- [audit 권고별 요약](../artifacts/2026-10-24-viteplus-dependency-audit.json)

audit의 Next.js·toml·zod·body-parser·multer·fast-uri 해당 버전은 모두 기준 main의 lockfile에도 존재한다. 이번 Vite+ 변경으로 처음 도입된 버전은 아니다. 실제 악용 가능성·운영 배포 버전까지 판정한 것은 아니며 별도 보안 패치가 필요하다.

저장소 node:test는 최초 107/108개 통과, alias 버전 탐색 1개 실패였다. 보완 후 108/108개 통과했다. 기존 보안 회귀의 목적은 launch-editor 패치 유지다. Vite+ alias에서는 패키지명이 달라 기존 버전 탐색이 실패했으므로 실제 모듈의 `version`을 읽도록 보완했다. 일반 Vite의 8.2.4 이상 게이트는 유지하고, 실험 core에는 정확히 1.4.0·내장 Vite 8.3.5·번들 launch-editor 2.14.2를 요구한다. [공식 경로 검사 권고](https://github.com/vitejs/launch-editor/security/advisories/GHSA-587h-7wmj-h5pm), [escaping 권고](https://github.com/vitejs/launch-editor/security/advisories/GHSA-698v-4r3x-3vcv), [flag 권고](https://github.com/vitejs/launch-editor/security/advisories/GHSA-r825-w8mm-5pxw)의 Vite 8.3 패치는 8.3.3, launch-editor 패치는 2.14.2다. Windows 공격을 실행한 검사는 아니다.

초기 시도도 구분한다. 기존 Vite 유지안은 CLI의 core alias 검사에서 실패했다. 최초 새 검사기의 `/src/main.tsx` 가정은 실제 `/src/app/main.tsx`와 달라 수정했다. 이후 YAML 의존성 위치를 잘못 가정한 [검사 실패](../artifacts/2026-10-24T05-33-28-501Z-vuln-radar-viteplus.json)를 보존했으며, 최종 소스에서는 docs-backend의 기존 YAML 의존성을 사용해 다시 통과했다. [초기 6개 통과](../artifacts/2026-10-24-vuln-radar-viteplus.json)는 lockfile 직접 버전 검사가 추가되기 전 결과다.

## 한계와 후속 작업

- 다른 workspace 8곳의 lockfile peer 연결 문맥이 바뀌었다. 직접 의존성의 이름·선언·기본 버전은 같지만 모든 전이 의존성 경로가 불변이라는 검사는 아니다. 다른 앱의 전체 빌드는 미실행이다.
- 기존 통합검사의 빌드·preview는 Vite+ core의 Vite 진입점을 호출한다. 별도 CLI 검사가 실제 `vp dev/build/preview`를 검증한다. 두 검사 의도를 혼동하지 않는다.
- 실제 브라우저 화면 회귀는 production preview 기준이다. dev HMR 편집 반복, Firefox/WebKit, Windows/Linux, CI·Vercel 빌드 및 Railway 배포는 미검증이다.
- Vite+의 Vitest·lint·format·task runner로 이전하지 않았다. 설치된 내장 도구 버전과 기존 테스트 실행기를 구분한다.
- 빌드 시간을 통제한 반복 측정은 하지 않았다. 더 빠르다고 일반화하지 않는다.
- 보안 경고와 peer 경고를 해소하거나 수용 범위를 결정하기 전 main 도입 완료로 취급하지 않는다. KAN-32 전체 보류 조건은 변경하지 않았다.

## 관련 문서

- [실험 범위와 대안](../../architecture/vuln-radar-viteplus-experiment.md)
- [작업 기록](../../worklog/2026-10/2026-10-24-vuln-radar-viteplus.md)
- [KAN-34](https://web-tech-service.atlassian.net/browse/KAN-34)
