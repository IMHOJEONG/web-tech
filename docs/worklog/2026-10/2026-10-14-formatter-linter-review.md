# 포맷터·린터 개선 후보 조사

## Summary

2026-10-14에 feature/docs HEAD `d8c0952`와 현재 작업 트리의 설정을 확인하고 공식 문서로 Prettier, Oxfmt, ESLint, Oxlint, Biome을 비교했다. 도구 설치·교체, 전체 포맷, 린트 정책 변경은 하지 않았다. 추천은 검증 전 후보이며 채택 결정이 아니다.

## Changed

- 이 조사 기록과 월별 목차만 추가했다. 기존 미커밋 작업은 보존했다.
- 구조·공개 계약·운영 정책이 바뀌지 않았으므로 새 ADR은 작성하지 않았다. 도입을 결정하면 별도 ADR로 확정한다.

## Notes

### 저장소에서 확인한 내용

| 항목             | 현재 상태                                                                                      | 개선 후보                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 설치된 포맷터    | Prettier 3.8.3, catalog 범위는 `^3.8.1`                                                        | 비교 실험에는 설치된 정확한 버전을 기록                                             |
| 전체 포맷        | 루트 `format`은 TS·TSX·MD에 `--write`                                                          | MDX·JS·MJS·MTS·JSON·CSS·YAML의 의도적 대상 여부를 정의하고 읽기 전용 검사와 구분    |
| 경로별 스타일    | docs는 4칸·세미콜론 없음·작은따옴표·es5 trailing comma, 백엔드는 작은따옴표·all trailing comma | 루트 기본값을 명시하되 앱별 차이를 보존; 스타일 통일과 엔진 교체를 동시에 하지 않음 |
| 루트·공용 UI     | `prettier.resolveConfig` 결과 null; 현재 Prettier 기본값 사용                                  | 기본값을 명시해 업그레이드·도구 전환 시 뜻하지 않은 diff 방지                       |
| 커밋 검사        | Git snapshot의 staged blob을 Prettier API로 검사, 파일/인덱스를 수정하지 않음                  | 이 안전장치를 유지; Oxfmt CLI로 작업 트리만 검사하는 방식은 대체가 아님             |
| 공유 ESLint 구성 | base와 Next/React 확장에서 JS/TS recommended 구성이 반복됨                                     | 최종 resolved config와 진단을 비교한 뒤 불필요한 반복 정리                          |
| 린트 반복 실행   | 앱·패키지 lint 스크립트에 ESLint `--cache` 없음; Turbo는 별도 task cache 제공                  | Turbo cache hit와 task가 실제 실행될 때의 ESLint 비용을 분리해서 측정               |
| IDE              | Prettier format-on-save, TypeScript organizeImports                                            | 새 import sorter를 함께 켜기 전에 책임을 하나로 정리                                |
| 원격 CI          | 현재 워크플로에서 포맷 검사 직접 호출을 찾지 못함                                              | 로컬 훅 우회 시에도 changed-commit 검사하는 CI 후보 검토                            |

근거: [루트 스크립트](../../../package.json), [포맷 훅](../../../scripts/check-staged-format.mjs), [snapshot](../../../scripts/git-check-snapshot.mjs), [부분 스테이징 회귀 테스트](../../../scripts/documentation-checks.test.mjs), [docs 설정](../../../apps/docs/.prettierrc.yaml), [백엔드 설정](../../../apps/docs-backend/.prettierrc), [공유 ESLint](../../../packages/eslint-config/base.js), [Next 확장](../../../packages/eslint-config/next.js), [React 확장](../../../packages/eslint-config/react-internal.js), [IDE](../../../.vscode/settings.json), [CI](../../../.github/workflows/ci.yml), [현재 품질 검사 정책](../../process/documentation-quality-gates.md).

### 도구의 역할과 제약

- **Prettier ↔ Oxfmt**는 포맷터 비교다. 줄바꿈·들여쓰기·따옴표 같은 출력 형식을 정한다. **ESLint ↔ Oxlint**는 린터 비교이며 오류 가능성·Hooks·환경 변수 등의 규칙을 검사한다. [Prettier의 역할 설명](https://prettier.io/docs/comparison).
- **Oxfmt**는 Prettier 호환을 목표로 한다. 현재 공식 지원 표는 JS/TS·CSS·JSON·YAML·Markdown 등을 Rust 네이티브로, MDX 등을 npm 패키지에 내장된 Prettier로 분류한다. 따라서 이 블로그의 모든 형식이 Rust 처리로 바뀌거나 같은 비율로 빨라진다고 주장하지 않는다. [지원 형식](https://oxc.rs/docs/guide/usage/formatter/language-support).
- Oxfmt는 기존 Prettier 플러그인을 그대로 실행하지 않는다. 기본 printWidth는 100이므로 현재 Prettier 기본값 80을 명시해 비교해야 한다. docs의 YAML 설정은 자동 migration 대상이 아니며 수동 변환을 검토해야 한다. migration은 중첩 Prettier 설정을 자동 순회하지 않는다. [이전 가이드](https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier.html).
- Oxfmt의 import·Tailwind 정렬은 기본 비활성화, package.json 정렬은 기본 활성화다. 초기 출력 비교에서는 정렬 기능을 꺼 추가 diff와 책임 충돌을 분리한다. Tailwind 정렬을 나중에 도입하면 각 앱의 stylesheet와 `cn`·`cva`·`cx` 사용 패턴을 검증한다. [설정](https://oxc.rs/docs/guide/usage/formatter/config.html), [정렬](https://oxc.rs/docs/guide/usage/formatter/sorting.html).
- **Oxlint**는 기본 JS/TS 검사와 React·Next 등의 내장 규칙을 제공한다. 현재 ESLint의 규칙명·옵션·파일 override·ignore·환경 변수 검사와 일치하는지 비교해야 한다. 공식 JS 플러그인 지원은 alpha이므로 Turbo 등 플러그인을 바로 옮긴다고 호환을 보장하지 않는다. [규칙 그룹](https://oxc.rs/docs/guide/usage/linter/plugins.html), [이전](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint.html), [JS 플러그인](https://oxc.rs/docs/guide/usage/linter/js-plugins.html).
- Oxlint의 일반 검사 엔진은 Rust지만 타입 인식 검사는 Go 기반 tsgolint가 담당한다. `tsc`의 전체 프로젝트 검사와 lint는 역할이 다르며 이번 조사에서 타입 검사 교체를 권고하지 않는다. [타입 인식 검사](https://oxc.rs/docs/guide/usage/linter/type-aware.html).
- **Biome**은 포맷·린트 통합 후보다. 다만 현재 공식 표에서 YAML·Markdown은 진행 중이며 이 저장소의 MDX를 포함한 문서 포맷 전부를 단독 대체할 근거가 없다. 코드 영역만 도입해도 문서 포맷터를 따로 유지해야 한다. [언어 지원](https://biomejs.dev/introduction/language-support/).
- 캐시는 엔진 교체보다 저위험일 수 있지만 CI runner에 cache 파일을 보존하지 않으면 반복 실행 효과가 제한적이다. 실제 코드 변경 여부와 설정 변경 invalidation을 확인한다. [ESLint cache](https://eslint.org/docs/latest/use/command-line-interface#--cache).

### 측정과 적용 후보 순서

1. 대상 확장자·ignore·앱별 스타일·IDE/CLI/CI의 검사 계약을 명시한다. 전체 write는 실행하지 않는다.
2. 분리된 임시 작업 환경에서 TSX, Nest decorator TS, 설정 MJS/MTS, CSS, YAML, MD, MDX를 같은 옵션으로 Prettier/Oxfmt 비교한다. 정렬은 별도 실험으로 분리한다.
3. 같은 파일 집합으로 cold/warm 실행 시간을 각각 여러 번 측정하고 출력 diff·실패 파일·장비·도구 버전을 남긴다. upstream 배율을 우리 저장소의 성능으로 간주하지 않는다.
4. staged/working tree가 다른 fixture에서 hook이 정확히 staged blob만 판정하고 둘 다 수정하지 않는 회귀 테스트를 유지한다.
5. ESLint와 Oxlint의 진단을 나란히 비교하고 중복 규칙만 분리한다. 동일 파일을 두 도구로 모두 lint하면 오히려 비용이 늘 수 있으므로 총 시간을 측정한다. Next·Hooks·Turbo 규칙을 검증하기 전 ESLint를 제거하지 않는다.
6. 검증된 범위만 도입하고 diff를 엔진 변경·스타일 변경·새 규칙 변경 커밋으로 분리한다. 앱 코드를 Rust로 재작성하는 것은 이 개선의 범위가 아니다.

## Open Questions

- 저장 시 지연, pre-commit, CI lint 중 실제 병목은 무엇인가? 이번 조사에서는 성능 benchmark를 실행하지 않았다.
- 중첩 설정과 ignore를 보존한 formatter adapter를 어떻게 유지할 것인가?
- 선택할 버전에서 Turbo·Hooks·Next 규칙의 진단이 같은가? 실제 호환 검사 전이다.

## Next

설정 정리 후 임시 환경의 출력·속도 비교를 우선한다. Oxfmt formatter 전환과 Oxlint lint 전환은 독립적으로 판단한다. 현재 의존성·훅·IDE·CI 설정은 변경하지 않았고 커밋·푸시하지 않았다.
