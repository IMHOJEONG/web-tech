# Vite+ peer 경고와 다른 앱의 lockfile 영향 조사

## 대상과 조건

- 검토일: 2026-10-24 KST.
- 기준 main: `16c51e9911f041b125a445b3939966986426a0b4`.
- 실험: `codex/vuln-radar-viteplus-experiment-20261024`의 미커밋 작업 트리.
- 환경: Node 24.12.0·pnpm 12.14.0·Vite+ 1.4.0. 기존 테스트 러너·mise·pnpm·Turborepo·공통 의존성 설정을 바꾸지 않았다.
- [KAN-34](https://web-tech-service.atlassian.net/browse/KAN-34)의 후속 조사다. Railway 배포·운영 DB·실제 수집은 제외했다.

## 재현 방법

저장소 루트에서 실행한다. 분석기는 마지막 YAML document의 전체 snapshot을 읽고, production과 개발 도구 포함 그래프를 따로 비교한다. workspace link는 연결된 패키지의 production 의존성까지 따라간다.

```sh
mise exec -- pnpm peers check
mise exec -- node --experimental-strip-types --test scripts/analyze-vuln-radar-lockfile.test.mts
mise exec -- node --experimental-strip-types scripts/analyze-vuln-radar-lockfile.mts --base 16c51e9911f041b125a445b3939966986426a0b4
mise exec -- node --experimental-strip-types scripts/verify-viteplus-consumer-impact.mts --base 16c51e9911f041b125a445b3939966986426a0b4
mise exec -- pnpm exec tsc -p tsconfig.vuln-integration.json
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs-backend build
mise exec -- pnpm --filter docs-backend test --runInBand
mise exec -- pnpm --filter vuln-radar-backend build
mise exec -- pnpm --filter @web-tech/ui build
mise exec -- pnpm --filter @web-tech/ui typecheck
mise exec -- pnpm test:repo
```

기준선 대조기는 HEAD의 manifest·workspace 설정·lockfile만 임시 디렉터리에 복제한다. pnpm store의 기존 패키지로 `--offline --frozen-lockfile --ignore-scripts` 설치 후 동일한 합성 JSX 변환을 두 환경에서 실행한다. 실제 `.env`·콘텐츠·인증 값은 복제하지 않는다. 임시 기준선을 정리하고 실험 lockfile이 그대로인지 검사한다. 캐시에 패키지가 없으면 실패하며 온라인 설치로 우회하지 않는다.

## 결과와 증거

### Peer 경고는 별칭의 버전 비교다

`pnpm peers check`는 exit 1이며 아래 세 소비자가 `vite` peer 경고를 낸다.

| 소비자                       | 요구 범위                    | pnpm이 비교한 패키지 버전 |
| ---------------------------- | ---------------------------- | ------------------------- |
| `@vitejs/plugin-react@5.2.0` | `^4.2.0 / ^5 / ^6 / ^7 / ^8` | core 별칭 `1.4.0`         |
| `@vitest/mocker@5.0.5`       | `^6 / ^7 / ^8`               | core 별칭 `1.4.0`         |
| `vitest@5.0.5`               | `^6.4.0 / ^7 / ^8`           | core 별칭 `1.4.0`         |

앱·React 플러그인·Vite+·Vitest·mocker가 실제 참조하는 진입점은 모두 같은 `@voidzero-dev/vite-plus-core@1.4.0`이며, 내장 Vite는 8.3.5다. 서로 다른 Vite 인스턴스가 섞여 발생한 경고는 아니다. 세 요구 범위 모두 내장 버전 8.3.5를 포함하지만 패키지 버전 1.4.0을 포함하지 않는다.

따라서 확인된 경고의 직접 원인은 버전 표기 불일치다. 이것을 전체 런타임 호환성의 증명으로 확대하지 않는다. 이번 프로젝트는 내장 Vitest runner로 테스트를 전환하지 않았다. [Vite+ 공식 수동 설치](https://viteplus.dev/guide/local-cli)도 core alias 정렬을 요구한다. 경고를 없애려고 전역 Vite/Vitest override, `allowAny`, strict 검사 해제를 적용하지 않았다.

### Lockfile은 문자열만 바뀐 것이 아니다

공통 설정과 다른 앱의 직접 의존성 기본 버전은 그대로지만 optional peer가 명시적으로 연결되는 snapshot이 늘었다. [pnpm 공식 동작](https://pnpm.io/settings/peer-dependencies)에 따르면 workspace의 다른 프로젝트·개발 의존성에 있는 optional peer도 사용될 수 있고 peer-dependent 중복 제거에도 영향을 받는다. 이번 조사에서 pnpm의 재계산 내부 단계까지 추적한 것은 아니므로 특정 패키지가 모든 변경을 직접 유발했다고 단정하지 않는다.

| 소비자                             | production 그래프의 변화                                                                                                                                               | 개발 도구를 포함한 추가 변화                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| docs                               | `styled-jsx → @babel/core@8.0.1 / babel-plugin-macros`, `terser-webpack-plugin → @swc/core / uglify-js`, `debug → supports-color`. 도달 가능한 패키지 식별자 25개 증가 | ESLint 쪽 `debug` 연결 추가                                                                    |
| docs-backend·vuln-radar-backend    | `debug → supports-color@8.1.1`, 함께 `has-flag`가 도달 가능해짐                                                                                                        | `ts-jest → esbuild`, terser 플러그인의 optional minifier 연결. 모든 플랫폼 후보 포함 27개 증가 |
| 공용 UI                            | Emotion의 Babel 도구 경로 안에서 `debug → supports-color`                                                                                                              | 기존 도구가 이미 가진 `has-flag`를 제외하면 1개 증가                                           |
| 루트·API·콘텐츠 계약·ESLint config | production 그래프 변화 없음                                                                                                                                            | `debug → supports-color` 연결, 1개 증가                                                        |
| Tailwind config·TypeScript config  | 변화 없음                                                                                                                                                              | 변화 없음                                                                                      |

여기서 증가한 개수는 해당 앱에서 정적으로 도달 가능한 `name@version`의 차이다. workspace 전체에 처음 설치된 패키지 수, 실제 번들 포함 수나 이미지 크기가 아니다. Babel 8·macros·uglify-js·supports-color 해당 버전은 기준 lockfile에도 이미 있었다. 플랫폼별 optional 패키지도 포함한다.

의미상 변화가 있는 연결은 peer suffix를 제거한 뒤에도 남는다. 반대로 suffix만 달라진 snapshot은 기능 변화로 세지 않는다. 모든 workspace의 두 그래프에서 해석하지 못한 참조는 0개였다. 분석기 회귀 6개는 alias·optional 연결·workspace link·dev 구분·순환 참조·버전 변경을 확인한다.

### Babel 오류는 기준 main에도 있었다

현재 `styled-jsx` 위치에서 찾은 Babel 8로 동일 JSX를 변환하면 `BABEL_VERSION_UNSUPPORTED`, 요구 범위 `^7.0.0-0` 오류가 발생한다. 그러나 깨끗한 기준 main의 오프라인 고정 설치에서도 **같은 Babel 8과 같은 오류**가 재현됐다. pnpm의 명시적 snapshot 연결뿐 아니라 설치된 모듈의 탐색 결과까지 비교해야 하는 이유다.

두 환경 모두 Next.js 내장 Babel 7.26.10으로 같은 코드를 변환하면 성공했고, 앱 디렉터리의 사용자 Babel 설정은 없었다. 로컬 Next 구현은 사용자 Babel 설정 유무로 SWC/Babel 경로를 판단한다. 따라서 이번 변경이 새로 블로그 장애를 만들었다거나 lockfile의 Babel 연결만으로 앱 전체가 Babel 8을 사용한다고 판단하지 않는다. 이 결과는 내장 변환 경로의 작은 smoke 검사이지 Next 전체 빌드 성공 결과가 아니다.

### 별도로 확인한 PostCSS 요청 범위 불일치

Vite+ core 1.4.0은 `postcss: ^8.5.30`을 선언한다. 실제 연결은 **8.5.26**이다. 기존 공통 `overrides.postcss: >=8.5.23`이 원래 의존성 범위를 덮어쓰고 잠긴 버전이 유지된 결과다. peer 경고가 아니라 직접 의존성 요청 범위 문제이며, 앞선 Vite+ 빌드 성공만으로 모든 PostCSS 기능의 호환을 보장할 수 없다.

이번 요청은 조사이므로 override나 lockfile을 수정하지 않았다. 후속 조치에서는 Vite+ core에 한정한 좁은 PostCSS 해석 변경을 먼저 검토해야 한다. 루트 override 수정은 다른 소비자·기존 CJS/ESM 보안 정책 회귀까지 확인한 뒤 결정해야 하며, 전체 PostCSS 최신화로 임의 확대하지 않는다.

### 소비자 검사

| 검사                       | 결과                                                                        |
| -------------------------- | --------------------------------------------------------------------------- |
| 새 그래프 분석기 단위 검사 | 6개 통과                                                                    |
| 검사기 TypeScript          | 통과                                                                        |
| docs 기존 라이브러리 검사  | 타입 검사 포함 285개 통과                                                   |
| docs-backend               | 빌드·Jest 3개 suite/13개 통과                                               |
| vuln-radar-backend         | 기존 Prisma generate·Nest build 통과. 서버 실행이나 DB 변경 없음            |
| 공용 UI                    | 기존 build·typecheck 통과                                                   |
| 저장소 node:test           | 114개 통과. 기존 108개와 분석기 6개                                         |
| 기준선 대조                | 오프라인 고정 설치 성공, 동일 Babel 관측, 임시 폴더 정리·실험 lockfile 보존 |

원본 증거:

- [생산/개발 그래프·실제 peer 진입점·PostCSS 버전](../artifacts/2026-10-24T06-22-13-436Z-viteplus-lockfile-impact.json)
- [기준 main 대조군과 실험 결과·정리 확인](../artifacts/2026-10-24T06-25-28-202Z-viteplus-consumer-control.json)

## 한계와 후속 작업

아래는 조사 시점의 미해결 상태다. 사용자 승인 후 [의존성 호환 보완과 override 정리](2026-10-24-viteplus-dependency-remediation.md)에서 peer 예외·PostCSS·Babel을 보완하고 Next production·외부 UI 소비자까지 추가 검증했다. 과거 결과와 최종 상태를 구분한다.

현 단계 결론은 **즉시 발생한 새 소비자 장애는 이번 검사에서 확인하지 못했지만, main에 그대로 넣어도 안전하다는 근거도 부족하다**는 것이다.

- Vite+ core의 PostCSS 요청 범위부터 좁게 맞추는 방안을 검토한다. 이번에 자동 수정하지 않았다.
- peer 경고는 실제 버전·진입점 증거를 유지한 채 upstream 대응 또는 버전 한정 예외를 검토한다. 단순 경고 억제는 lockfile 영향이나 PostCSS 문제를 고치지 않는다.
- 다른 앱의 연결 변경 최소화 또는 변경을 수용할 소비자 CI 범위를 결정한다. optional peer 설정을 전역으로 꺼서 모든 앱의 해석 규칙을 바꾸는 조치는 하지 않는다.
- Next 전체 production 빌드·브라우저 E2E, UI tarball 외부 설치, Linux 이미지 크기·캐시 무효화 영향은 미검증이다. 기존 도구 버전 유지와 출력 동작 불변은 별개다.
- 기존 audit 경고·Railway 보안 보류 조건은 이번 peer 조사로 해소되지 않는다. 커밋·푸시·배포는 하지 않았다.

## 관련 문서

- [최초 Vite+ 로컬 기능 검증](2026-10-24-vuln-radar-viteplus.md)
- [실험 범위·대안](../../architecture/vuln-radar-viteplus-experiment.md)
- [이번 조사 기록](../../worklog/2026-10/2026-10-24-viteplus-peer-lockfile-impact.md)
