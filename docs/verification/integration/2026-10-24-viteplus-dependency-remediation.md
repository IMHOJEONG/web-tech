# Vite+ 의존성 호환 보완과 override 정리

## 대상과 조건

- 검증일: 2026-10-24 KST. artifact 시간은 UTC.
- 기준: main `16c51e9911f041b125a445b3939966986426a0b4` + `codex/vuln-radar-viteplus-experiment-20261024` 미커밋 변경.
- 추적: [KAN-34](https://web-tech-service.atlassian.net/browse/KAN-34).
- Node 24.12.0·pnpm 12.14.0·Vite+ 1.4.0. 기존 테스트·mise·pnpm·Turborepo를 유지했다. Railway 배포·운영 DB·실제 수집은 하지 않았다.
- [직전 조사](2026-10-24-viteplus-peer-lockfile-impact.md)에서 확인한 호환성 문제의 후속 보완이다. 저장소 전체 보안 권고 정리를 뜻하지 않는다.

## 재현 방법

저장소 루트에서 실행한다. 네이티브 패키지의 기존 설치 허용 정책을 바꾸지 않고 lockfile을 사용한다.

```sh
mise exec -- pnpm install --frozen-lockfile --ignore-scripts
mise exec -- pnpm peers check
mise exec -- node --experimental-strip-types --test scripts/viteplus-dependency-policy.test.mts
mise exec -- node --experimental-strip-types scripts/verify-vuln-radar-viteplus.mts
mise exec -- node --experimental-strip-types scripts/analyze-vuln-radar-lockfile.mts
mise exec -- node --experimental-strip-types scripts/verify-viteplus-consumer-impact.mts
mise exec -- pnpm exec tsc -p tsconfig.vuln-integration.json
mise exec -- pnpm test:repo
mise exec -- pnpm --filter vuln-radar build
mise exec -- pnpm --filter vuln-radar typecheck
mise exec -- pnpm --filter vuln-radar lint
mise exec -- pnpm --filter vuln-radar test:lib
mise exec -- pnpm verify:vuln-radar:integration
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter docs test:ui:consumer
mise exec -- pnpm --filter docs test:ui:package
mise exec -- pnpm --filter docs-backend build
mise exec -- pnpm --filter docs-backend test --runInBand
mise exec -- pnpm --filter vuln-radar-backend test --runInBand
mise exec -- pnpm --filter @web-tech/ui typecheck
mise exec -- pnpm --filter @web-tech/api typecheck
```

`test:ui:consumer`는 원격 콘텐츠·외부 로그 수집을 비활성화하고 실제 Next production 빌드 후 loopback 서버로 Chromium을 실행한다. UI package 검사는 로컬 tarball을 임시 외부 소비자에 설치할 뿐 레지스트리에 게시하지 않는다. vuln-radar 통합은 격리 PostgreSQL·합성 토큰/데이터를 사용한다.

## 결과와 증거

### 기존 override 제거 판단과 실제 수정

| 기존 항목                         | 판단과 수정                                                                                                                                                      | 확인 결과                                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 전역 `postcss: >=8.5.23`          | 제거. 보안 최소 버전을 강제하려던 범위가 core의 `^8.5.30`, sanitizer의 `^8.5.27`, Next의 고정 버전까지 덮어쓰고 있었다                                           | core·sanitizer·Tailwind는 8.5.31, Next는 원래 요청한 8.5.23. 모두 각 소비자 범위와 보안 floor를 충족 |
| 전역 `nanoid: >=3.3.18 <4`        | 같은 규칙을 단순 삭제하지 않고 `nanoid@ : 3.3.20` convergence override로 교체. 기존 보안 floor와 CJS 호환성을 유지하면서 다른 major 요청까지 3으로 강제하지 않음 | 각 PostCSS의 nanoid 요청을 만족하는 3.3.20, `require('nanoid/non-secure')` 성공                      |
| 전역 `@babel/core: >=7.29.6`      | `@babel/core@ : 7.29.6` convergence override로 교체. 무제한 major 범위가 Babel 7 소비자에게 8을 연결하던 문제를 제거                                             | styled-jsx·기존 Babel 7 소비자에 패치된 7.29.6 연결, 실제 JSX 변환 성공                              |
| styled-jsx의 빠진 Babel peer 범위 | 정확히 5.1.6의 package extension으로 `@babel/core: ^7.29.6`을 보완. 기존 optional 메타데이터는 유지                                                              | 느슨한 optional 해석으로 Babel 8을 선택하지 않음                                                     |
| 다른 보안 override                | 유지. 이번 호환성 문제와 무관한 보안 수정까지 삭제할 근거는 확보하지 못함                                                                                        | source-map·Handlebars·sanitizer 등 기존 보안 회귀도 함께 통과                                        |

도입 이력은 `git show 1ab5953 -- pnpm-workspace.yaml`과 [과거 CJS/ESM 회귀 기록](../../worklog/2026-09/2026-09-10-pr-30-html-sanitizer-security.md)을 대조했다. 당시 `nanoid`의 무제한 major 강제로 PostCSS CommonJS 로드가 깨졌다는 목적은 보존한다. 다만 **전역 강제 규칙을 유지하는 것과 보안 목적을 유지하는 것은 다르다.**

[pnpm convergence override](https://pnpm.io/settings/dependency-resolution#convergence-overrides)는 대상 exact 버전이 원래 요청 범위를 만족할 때만 수렴시킨다. 예를 들어 nanoid 5나 Babel 8을 원래 요구한 소비자에게 3.3.20/7.29.6을 억지로 적용하지 않는다. 현재 프로젝트에 필요한 보안 floor·major 호환성은 회귀 검사로 확인한다. 모든 override를 지워도 안전하다는 결론은 아니다.

### Peer 경고는 검증된 버전에만 예외 적용

`peerDependencyRules.allowedVersions`에 다음 정확한 소비자와 alias 버전 1.4.0만 등록했다.

- `@vitejs/plugin-react@5.2.0>vite`
- `@vitest/mocker@5.0.5>vite`
- `vitest@5.0.5>vite`

이는 upstream peer 선언을 수정한 것이 아니라 [pnpm이 지원하는 버전 한정 호환 예외](https://pnpm.io/settings/peer-dependencies#peerdependencyrulesallowedversions)다. `allowAny`, 전역 Vite/Vitest override, strict 검사 해제는 사용하지 않는다. 실제 core 1.4.0·내장 Vite 8.3.5·동일 진입점·소비자의 Vite 8 지원 범위를 별도로 검사한다. 다른 core 버전·내장 버전·패키지명은 실패하는 음성 대조군도 추가했다. 내장 Vitest runner로 기존 테스트를 전환하지 않았다.

### Lockfile 소비자 회귀 결과

의도된 의존성 해석 수정 때문에 다른 앱의 snapshot 변경이 전부 없어지는 것은 아니다. 특히 PostCSS override 제거 후 lockfile의 `specifier`가 강제 값에서 원래 manifest의 `catalog:` 선언으로 복원되고, Babel 관련 그래프가 실제 호환되는 7 계열로 바뀐다. 문자열 diff를 줄이려고 optional 기능을 삭제하거나 peer 해석을 전역 비활성화하지 않았다. 대신 소비자의 원래 요구 범위·CJS 로드·실제 빌드·화면·외부 설치를 검증했다.

| 검사                               | 수정 후 결과                                                                                                   |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `pnpm peers check`                 | exit 0, 경고 0건                                                                                               |
| frozen install·공급망 정책         | 통과. 설치 스크립트 허용 범위·서명 검증 유지                                                                   |
| 신규 의존성 정책 회귀              | 6개 통과. exact alias, 미승인 버전 거부, PostCSS 원래 범위·nanoid CJS, Babel 실제 변환, convergence major 구분 |
| Vite+ CLI·프록시·보안 경계         | 최종 8개 그룹 통과                                                                                             |
| vuln-radar                         | build·typecheck·lint·32개 단위 통과                                                                            |
| 기존 Nest/PostgreSQL/Chromium 통합 | 25개·정리 6단계 통과. backend build 포함, 실제 수집 아님                                                       |
| backend 단위·빌드                  | vuln-radar-backend Jest 48개, docs-backend Jest 13개·build 통과                                                |
| docs                               | 285개 단위·typecheck 통과                                                                                      |
| Next production + 소비자 화면      | build 후 Chromium 모바일·데스크톱 16개 통과. 한/영·light/dark·drawer 포커스·필터·320px 포함                    |
| 공용 UI 외부 tarball               | 설치·React 단일 인스턴스·types·browser bundle·CSS·SSR 통과                                                     |
| 공용 UI·API                        | typecheck 통과. UI build는 prebuild/prepack에서도 실행                                                         |
| 저장소 node:test                   | 최종 120개 통과                                                                                                |

증거:

- [최종 CLI 8개와 정리](../artifacts/2026-10-24T07-08-35-791Z-vuln-radar-viteplus.json)
- [수정 후 그래프·PostCSS 실제 버전](../artifacts/2026-10-24T07-01-06-763Z-viteplus-lockfile-impact.json)
- [기준 main Babel 8 실패 → 수정 후 Babel 7 성공](../artifacts/2026-10-24T07-05-39-300Z-viteplus-consumer-control.json)
- [기존 통합 25개·정리 6단계](../artifacts/2026-10-24T07-03-22-206Z-vuln-radar-integration.json)
- [수정 후 audit 요약](../artifacts/2026-10-24-viteplus-override-audit.json)

새 검사기의 첫 실행에서는 일부 패키지의 `package.json` export가 닫혀 있어 실패했다. 실제 진입점에서 package metadata를 찾는 방식으로 보완했다. CLI 검사는 제거한 override의 lockfile specifier가 원래 manifest로 복원되는 경우를 반영한 뒤 다시 통과했다. [초기 CLI 실패](../artifacts/2026-10-24T07-02-39-424Z-vuln-radar-viteplus.json)는 보존한다.

Next 빌드 중 기존 TCP 글 placeholder 경고와 NO_COLOR/FORCE_COLOR 경고가 있었으며 작업 범위와 무관해 원문을 수정하지 않았다. 통합검사의 backend 종료/401 로그는 의도된 장애 대조군이다.

## 한계와 후속 작업

- 이번에 확인한 peer·PostCSS·Babel 호환성 문제는 로컬 보완·소비자 검증을 마쳤다. 의존성 수정이 전이 그래프를 바꾸지 않는다는 주장은 하지 않는다.
- 기존 audit **13건(critical 2/high 7/moderate 2/low 2)은 그대로**다. PostCSS/nanoid/Babel에서 새 경고가 추가되지 않았지만 Next·toml·zod·body-parser·multer·fast-uri의 별도 보안 조치는 남아 있다. 전체 보안 완료로 표시하지 않는다.
- Linux용 Vite+ 네이티브 빌드·원격 CI·운영 배포는 미검증이다. macOS의 Next production 검사와 Vercel 배포 성공을 구분한다.
- Node/mise·pnpm·Turborepo·테스트 러너·CI·Dockerfile은 교체하지 않았다. 커밋·푸시·Railway 배포는 하지 않았고 KAN-32 보안 재개 조건도 해제하지 않았다.

## 관련 문서

- [수정 전 조사](2026-10-24-viteplus-peer-lockfile-impact.md)
- [실험 설계](../../architecture/vuln-radar-viteplus-experiment.md)
- [작업 기록](../../worklog/2026-10/2026-10-24-viteplus-dependency-remediation.md)
