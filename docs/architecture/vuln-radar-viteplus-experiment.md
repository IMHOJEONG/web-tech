# vuln-radar Vite+ 개발·빌드 실험

## 상태와 범위

- 상태: 제안
- 대상: `apps/vuln-radar`의 로컬 개발·빌드와 결과물 미리보기
- 최종 검토: 2026-10-24
- 추적: [KAN-34](https://web-tech-service.atlassian.net/browse/KAN-34)
- 적용 위치: `codex/vuln-radar-viteplus-experiment-20261024` 브랜치의 [PR #59](https://github.com/IMHOJEONG/web-tech/pull/59). 원격 검토 중이며 main 미병합이다. main 채택과 운영 배포는 별도 결정이다.

Railway 보안 재개 조건인 [KAN-32](https://web-tech-service.atlassian.net/browse/KAN-32)는 유지한다. 사용자가 승인한 예외는 툴체인 실험·회귀 검사와 PR 검토다. 실제 수집·운영 DB 접근·Railway 배포·토큰 변경은 포함하지 않는다.

## 배경

기존 React SPA는 Vite 8.2.4를 사용한다. Vite+의 개발·빌드 경로만 비교하되, 모노레포의 기존 도구와 테스트를 교체하지 않는 것이 목표다. 성능 우위나 전체 도입을 미리 가정하지 않는다.

## 결정

1. `vite-plus@1.4.0`을 vuln-radar의 devDependency로만 고정한다. 전역 CLI를 설치하지 않는다.
2. 앱의 `vite`를 `npm:@voidzero-dev/vite-plus-core@1.4.0`으로 맞추고 설정의 `defineConfig`·`loadEnv`는 `vite-plus`에서 가져온다. 기존 Vite를 남기면 `vp build`가 버전 불일치로 실행을 거부한다.
3. `dev`·`build`는 `vp dev`·`vp build`로 바꾼다. core 별칭 패키지는 기존 `vite` 실행 파일을 제공하지 않으므로 `preview`·`start`도 동일한 미리보기 동작의 `vp preview`로 연결한다. 운영 서버나 배포 설정을 새로 도입하는 변경이 아니다.
4. 기존 `predev`·`prebuild`의 공용 UI 빌드를 유지한다. Turborepo의 태스크 그래프와 캐시 설정도 바꾸지 않는다.
5. 기존 통합검사는 Vite core의 실행 파일 위치만 구분한다. 보안 회귀는 alias의 패키지명 대신 실제 내장 Vite 버전과 패치된 launch-editor를 확인한다. node:test·Jest·Playwright, ESLint·Prettier, mise Node 24, pnpm 12.14.0, 공용 UI 빌드 방식은 유지한다.
6. 루트의 Vite/Vitest override나 카탈로그를 바꾸지 않는다. `vp migrate`, `vp test`, `vp check`, `vp run`, `vp env`로 기존 도구를 대체하지 않는다.
7. 조사 후 승인된 호환성 보완으로 전역 PostCSS 강제는 제거하고 Babel/nanoid는 호환 범위의 convergence 규칙으로 좁힌다. styled-jsx 5.1.6의 Babel 7 peer와 정확한 세 소비자의 Vite alias 예외만 보완한다. 미승인 core·내장 Vite 버전은 회귀 검사에서 거부한다. 다른 보안 override는 일괄 제거하지 않는다.
8. 비교 도구 3개에는 `--base <commit-or-ref>`를 필수로 지정한다. 시작 시 한 번 확정한 SHA로 파일·트리·대조군 복사와 보고서 식별자를 공유한다. 원래 실험을 재현할 때는 main의 고정 SHA `16c51e9911f041b125a445b3939966986426a0b4`를 사용하고, 현재 HEAD나 이동 가능한 원격 ref를 자동 기준으로 쓰지 않는다.

Vite+ 1.4.0의 지원 Node 범위는 `^22.18.0 || ^24.11.0 || >=26.0.0`이다. 이번 검증은 기존 mise의 Node 24.12.0으로 실행했다. 임의의 오래된 Node 24 버전까지 지원한다는 뜻은 아니다.

## 대안과 영향

| 선택                            | 판단                                                       |
| ------------------------------- | ---------------------------------------------------------- |
| 전역 Vite+/전체 자동 migration  | 다른 앱, 테스트·포맷·태스크 도구까지 바뀔 수 있어 제외     |
| 기존 Vite를 유지하고 CLI만 추가 | 실제 `vp build`의 alias 정렬 검사에서 실패                 |
| 앱 전용 core 별칭 + 로컬 CLI    | 현재 실험. 다른 앱 manifest를 바꾸지 않고 경로를 검증 가능 |
| 기존 Vite 유지                  | 실험 채택을 보류하면 되돌릴 기준선                         |

실행 도구를 교체하지 않아도 Vite+는 Vitest 5·Oxlint·Oxfmt 등을 전이 의존성으로 설치한다. 이것들이 기존 테스트·lint·format 명령을 실행하는 것은 아니다.

pnpm이 lockfile의 다른 workspace peer 연결 문맥도 다시 계산한다. 기존 도구·원래 의존성 범위를 유지하되 PostCSS 보완 등 의도된 해석 차이는 허용하고 검사한다. 모든 전이 그래프와 출력이 불변이라고 주장하지 않는다. alias 패키지 버전 `1.4.0`과 내장 Vite semver의 차이는 정확한 버전에 한정한 호환 예외와 실제 core 회귀로 관리한다. `allowAny`나 전역 peer 해석 비활성화는 사용하지 않는다.

본 도입 전에는 Linux/CI·실제 배포 호환성, lockfile의 전체 소비자 회귀, peer 경고 처리와 보안 경고를 별도로 검토한다. 장기 도입을 결정할 때 ADR을 작성한다. 이번 실험만으로 배포 보류를 해제하지 않는다.

후속 [peer·lockfile 조사](../verification/integration/2026-10-24-viteplus-peer-lockfile-impact.md)에서 발견한 PostCSS 요청 범위와 Babel 호환 문제는 [후속 보완](../verification/integration/2026-10-24-viteplus-dependency-remediation.md)에서 해결했다. 초기 PR head `096aad7`의 CI·CodeQL과 Vercel Linux `vp build`는 [원격 점검](../verification/integration/2026-10-24-pr59-ci-review.md)에서 확인했다. 기준선 리뷰 보완과 새 head의 검증은 [후속 기록](../verification/integration/2026-10-24-pr59-baseline-fixes.md)으로 구분한다. 기존 audit·운영 채택·Railway 배포는 별도이며 실험 제안 상태를 유지한다.

## 관련 문서

- [로컬 검증과 재현 명령](../verification/integration/2026-10-24-vuln-radar-viteplus.md)
- [작업 기록](../worklog/2026-10/2026-10-24-vuln-radar-viteplus.md)
- [공식 로컬 CLI·수동 설치](https://viteplus.dev/guide/local-cli)
- [공식 마이그레이션](https://viteplus.dev/guide/migrate)
