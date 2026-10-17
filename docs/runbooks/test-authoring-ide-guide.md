# 테스트 직접 작성과 IDE 점검 가이드

## 목적과 준비 조건

- 대상: 이 모노레포에서 테스트를 읽고 직접 작성하는 개발자.
- 최종 검토: 2026-10-12, Asia/Seoul.
- 준비: 실제 저장소 루트를 IDE에서 열고, mise 프로젝트 설정의 Node.js 24와 기존 pnpm 의존성을 사용한다.
- 이 가이드는 파일 목록 조사를 바탕으로 한 시작 절차다. 전체 테스트 품질·coverage를 검증 완료했다는 의미가 아니다.
- [전체 테스트 목록과 실행 경로](repository-test-inventory.md)를 먼저 확인한다.

저장소 루트의 IDE 터미널에서 확인한다.

```sh
git branch --show-current
mise exec -- node --version
```

전역 Node.js 26과 프로젝트 Node.js 24를 혼동하지 않는다. IDE 터미널과 GUI 확장이 사용하는 실행 환경이 다를 수 있다.

## 실행 순서

### 1. 처음 볼 파일과 순서

처음부터 131개를 읽지 않는다. 작은 기능 하나의 규칙을 이해하고, 그 규칙이 함수·화면·API까지 이어지는지 순서대로 확인한다.

| 순서 | 구현                                                                                      | 대응 테스트                                                                                   | 읽을 질문                                             |
| ---- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1    | [검색어 처리 함수](../../apps/docs/shared/lib/search-query.ts)                            | [검색어 단위 테스트](../../apps/docs/lib/search-query.test.ts)                                | 공백·한글·이모지·40자 제한의 기대 결과는 무엇인가?    |
| 2    | [페이지네이션 함수](../../apps/docs/widgets/docs-index/model/docs-index-pagination.ts)    | [페이지네이션 테스트](../../apps/docs/widgets/docs-index/model/docs-index-pagination.test.ts) | 빈 목록과 범위를 벗어난 페이지를 어떻게 처리하는가?   |
| 3    | [본문 검색 폼](../../apps/docs/feature/search/ui/document-search-form.tsx)                | [검색 화면 E2E](../../apps/docs/e2e/search-query-policy.spec.ts)                              | 실제 입력·IME·제출 후 URL에도 같은 규칙이 적용되는가? |
| 4    | [Backend 이미지 경로 처리](../../apps/docs-backend/src/modules/content/content-assets.ts) | [이미지 경로 테스트](../../apps/docs-backend/src/modules/content/content-assets.spec.ts)      | 상대 경로와 상위 경로 탈출의 기대 결과는 무엇인가?    |
| 5    | [상세 스트리밍 E2E](../../apps/docs/article-e2e/article-streaming.spec.ts)                | 같은 파일의 fixture·응답 검사                                                                 | 본문이 먼저 도착한 것을 어떤 증거로 판정하는가?       |

5번은 서버·fixture·stream lifecycle을 함께 이해해야 하므로 첫 작성 연습으로는 권하지 않는다.

각 파일은 다음 순서로 읽는다.

1. import에서 무엇을 검사하는지 찾는다.
2. 테스트 이름을 요구사항 문장으로 바꿔 말한다.
3. 입력과 준비 상태를 확인한다.
4. assertion의 기대 결과가 요구사항과 일치하는지 확인한다.
5. cleanup, 외부 통신, 시간·env 의존성을 확인한다.
6. 어떤 package 스크립트와 CI가 이 파일을 실행하는지 찾는다.

### 2. 현재 구조 평가

**기본적인 역할 분리는 적절하지만, 작성자의 실행 진입점과 일부 CI 연결은 보완할 여지가 있다.** 이것은 구조 평가이며 모든 assertion의 검증력에 대한 전수 판정은 아니다.

| 현재 장점                        | 근거                                                                |
| -------------------------------- | ------------------------------------------------------------------- |
| 순수 로직과 브라우저 검사를 분리 | Node.js `.test.ts`와 Playwright `.spec.ts`의 실행 경로가 다름       |
| FSD 기능별 테스트 배치           | callout·code-block·widget model의 구현 가까이에 테스트가 있음       |
| 콘텐츠 규칙을 공용 계약에서 검사 | `packages/docs-content-contract`를 로컬 CLI와 Backend가 공유        |
| 실제 사용자 흐름 검사            | 검색, Drawer, 키보드, 헤더, 게시·캐시 E2E가 있음                    |
| production 상세 경로 검사        | 로컬 production 빌드와 콘텐츠 fixture를 함께 실행                   |
| Node 직접 실행용 TS 검사         | `tsconfig.node-test.json`과 `erasableSyntaxOnly`로 실행 제약을 검사 |

| 보완 후보                                       | 작성자가 주의할 점                                                            |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm test`가 전체 실행이 아님                  | docs suite와 API E2E는 별도 명령                                              |
| 일부 suite가 CI 명시 호출에서 빠짐              | 폰트 preload, 코드 접기·Activity·푸시 브라우저, Vuln Radar API E2E            |
| 공용 UI 테스트가 docs 소비 앱에 위치            | 앱에서 실제 소비되는지 검증하는 장점이 있지만 docs 도구에 의존                |
| `lib` 테스트 이름만으로 구현 위치를 알기 어려움 | 예: 검색어 구현은 `shared/lib`, 테스트는 `lib`; import를 확인                 |
| 테스트 suffix·glob·tsconfig가 여러 곳에 있음    | 파일을 만들었다는 사실만으로 실행·타입 검사·CI 포함이 보장되지 않음           |
| 일반 화면 설정은 Chromium 중심                  | 모바일 viewport 통과와 실제 Safari·기기 검증은 다름                           |
| IDE 전용 테스트 설정이 제한적                   | 현재 `.vscode`에는 공용 테스트 launch/task 구성이 없으며 runner별 연결이 필요 |

지금 모든 테스트를 한 runner로 옮길 필요는 없다. Node/Jest/Playwright의 책임 차이를 유지하고 실행 명령의 발견 가능성부터 개선하는 것이 우선이다.

### 3. 어떤 테스트를 작성할지 고르기

| 바뀌는 동작                     | 선택                | 위치                                              |
| ------------------------------- | ------------------- | ------------------------------------------------- |
| 입력값을 결과값으로 바꾸는 함수 | Node.js 단위 테스트 | 기존 docs `lib`, 해당 feature/model의 `*.test.ts` |
| 공개 콘텐츠 형식·상태 계약      | 공용 계약 테스트    | `packages/docs-content-contract/src/*.test.ts`    |
| Backend 서비스·설정·경로 함수   | Jest 단위 테스트    | 구현 옆 `*.spec.ts`                               |
| HTTP 인증·응답·여러 계층 연결   | API E2E             | Backend `test/*.e2e-spec.ts`                      |
| 클릭·입력·포커스·레이아웃       | Playwright E2E      | docs `e2e/*.spec.ts`                              |
| production 캐시·게시·스트리밍   | 상세 통합 E2E       | docs `article-e2e/*.spec.ts`                      |

버그를 발견했다면 **재현 입력 또는 사용자 행동 → 잘못된 현재 결과 → 의도한 기대 결과**부터 적는다. 구현 방법이나 CSS 클래스 이름보다 사용자가 관찰하는 결과를 먼저 검사한다.

### 4. 첫 단위 테스트 작성 연습

연습할 요구사항: “공백만 입력한 검색어는 빈 검색어가 된다.”

새 파일 예: `apps/docs/lib/search-query-whitespace.test.ts`. 아직 가이드 예시일 뿐 이 파일을 저장소에 추가한 것은 아니다.

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSearchQuery } from "../shared/lib/search-query.ts";

test("공백만 입력하면 빈 검색어가 된다", () => {
  const input = " \t\n ";
  const actual = normalizeSearchQuery(input);
  assert.equal(actual, "");
});
```

입력 준비, 실행, 기대 결과 비교의 세 부분이다. 현재 구현은 이 규칙을 이미 만족하므로 학습용 중복 예시다. 실제 PR에서는 기존 테스트와 합칠지 먼저 판단한다.

저장소 루트에서 해당 파일 하나만 실행한다.

```sh
mise exec -- node --experimental-strip-types --test apps/docs/lib/search-query-whitespace.test.ts
```

먼저 기대값을 의도적으로 틀리게 바꾸어 실패 출력과 actual/expected를 읽고, 올바른 기대값으로 복원해 통과하는지 확인한다. 이는 assertion이 작동하는지 보는 연습이다. 실제 버그 수정에서는 **수정 전 재현 실패 → 구현 수정 → 통과 → 관련 회귀 검사** 순서를 지킨다.

배울 때는 테스트마다 핵심 규칙 하나를 둔다. 정상값, 빈값, 경계값, 거부해야 할 값의 검사 여부를 확인한다. “예외가 없었다”, console 출력만 있었다는 사실을 성공 기준으로 삼지 않는다.

새 테스트가 실행 대상인지 확인한다.

- 이 예시는 기존 `lib/*.test.ts` glob에 포함되어 `test:lib` 및 Node 테스트 tsconfig 대상이 된다.
- 새 폴더를 만들면 [docs 실행 스크립트](../../apps/docs/package.json), [Node 테스트 tsconfig](../../apps/docs/tsconfig.node-test.json), CI 호출 경로를 함께 확인한다.
- Node가 TS를 직접 실행할 때는 런타임 alias·JSX·변환이 필요한 enum 등을 임의로 섞지 않는다. Node type stripping은 타입 검사나 tsconfig 기반 전체 변환을 대신하지 않는다. [Node.js 공식 TypeScript 설명](https://nodejs.org/docs/latest-v24.x/api/typescript.html).

### 5. IDE에서 사람이 직접 확인하는 방법

**가능하다.** 코드 비교, 테스트 한 개 실행, breakpoint, 실제 브라우저 동작 확인을 구분하면 된다. 아래 절차는 VS Code 기준이며 다른 IDE도 터미널 실행은 동일하다.

#### 단위 테스트

1. 구현과 테스트를 좌우로 연다.
2. 테스트의 함수 import에서 정의로 이동한다.
3. IDE 통합 터미널에서 기존 테스트 파일 하나를 실행한다.

```sh
mise exec -- node --experimental-strip-types --test apps/docs/lib/search-query.test.ts
```

이름 하나만 선택하거나 저장할 때 반복 실행할 수도 있다. 옵션은 파일 경로 앞에 둔다.

```sh
mise exec -- node --experimental-strip-types --test --test-name-pattern='query limit' apps/docs/lib/search-query.test.ts
mise exec -- node --experimental-strip-types --test --watch apps/docs/lib/search-query.test.ts
```

`node:test` 파일에 Playwright 실행 버튼이 자동으로 생기는 것은 아니다. runner를 구분하고, Node 디버깅은 VS Code의 JavaScript Debug Terminal에서 명령을 실행해 breakpoint를 확인한다. IDE 자동 연결 여부는 Node 실행 경로·설정에 따라 달라질 수 있다. [Node test runner](https://nodejs.org/docs/latest-v24.x/api/test.html), [VS Code Node 디버깅](https://code.visualstudio.com/docs/nodejs/nodejs-debugging).

#### Backend Jest

```sh
mise exec -- pnpm --filter docs-backend test --runInBand --runTestsByPath src/modules/content/content-assets.spec.ts
```

Jest의 `expect`를 사용하는 파일을 Node runner로 실행하지 않는다. 해당 명령의 pretest는 공용 콘텐츠 계약 빌드를 수행한다.

#### Playwright 화면 검사

VS Code의 Microsoft 공식 **Playwright Test for VSCode** 확장을 사용하면 Testing 패널에서 실행·디버깅·브라우저 표시를 할 수 있다. 현재 레포에는 Playwright가 이미 있으므로 새 프로젝트를 생성하거나 Install Playwright로 설정을 덮어쓰지 않는다. [공식 VS Code 가이드](https://playwright.dev/docs/getting-started-vscode).

1. Testing 패널에서 docs의 기본 `playwright.config.ts`를 선택한다.
2. `chromium-desktop` 프로젝트 하나만 선택한다.
3. `search-query-policy.spec.ts`의 테스트 하나를 실행한다.
4. Show browser를 켜서 입력·제출 동작을 본다.
5. breakpoint를 추가하고 Debug Test로 한 단계씩 검사한다.
6. GUI에서 Node 경로가 맞지 않거나 파일이 검색되지 않으면 아래 터미널 명령으로 먼저 재현한다.

```sh
mise exec -- pnpm --filter docs exec playwright test e2e/search-query-policy.spec.ts --project=chromium-desktop --list
mise exec -- pnpm --filter docs exec playwright test e2e/search-query-policy.spec.ts --project=chromium-desktop --headed
mise exec -- pnpm --filter docs exec playwright test e2e/search-query-policy.spec.ts --project=chromium-desktop --debug
```

`--list`는 테스트 발견만 확인하며 실행 성공을 뜻하지 않는다. `--headed`는 실제 브라우저를 표시하고, `--debug`는 디버깅용 실행이다.

기본 설정은 로컬 개발 서버를 재사용할 수 있다. 이미 실행 중인 서버의 원격 API/env가 테스트 fixture 조건과 다르면 결과가 달라질 수 있으므로 전용 포트를 사용하거나 기존 서버 상태를 확인한다. production E2E는 빌드하므로 같은 앱의 dev 서버와 무분별하게 동시에 돌리지 않는다.

### 6. 코드 리뷰 체크리스트

- [ ] 테스트 이름만 읽어도 기능의 기대 동작을 설명할 수 있는가?
- [ ] 테스트가 구현을 그대로 복제하지 않고 독립적인 기대 결과를 비교하는가?
- [ ] 정상값 외에 빈값·경계값·거부 입력을 검사하는가?
- [ ] 비동기 함수와 assertion을 await하는가?
- [ ] env, mock, 임시 파일, 서버를 복구·정리하는가?
- [ ] 실제 NAS·토큰·외부 API 없이 실행 가능한가? 불가능하면 조건과 영향이 명시되어 있는가?
- [ ] 브라우저 locator는 role/name 등 의미 있는 기준이며 헤더·본문처럼 중복된 영역을 구분하는가?
- [ ] 고정 sleep 대신 상태·응답·화면 변화로 기다리는가?
- [ ] skip/retry/timeout이 실제 실패를 가리고 있지 않은가?
- [ ] 신규 파일이 실행 스크립트·타입 검사·CI에 포함되는가?
- [ ] 수정 전 실패와 수정 후 통과를 확인했는가?
- [ ] 결과를 기능 coverage나 실제 기기 검증 완료로 과장하지 않았는가?

## 기대 결과

첫 단계의 완료 기준은 **검색어 규칙 한 가지를 자신의 말로 설명하고, 테스트 하나를 직접 작성·실행해 실패 이유와 통과 이유를 설명하는 것**이다. 이후 화면 E2E로 같은 규칙이 입력과 URL까지 이어지는지 확인한다.

권장 학습 순서: 검색어 단위 → 페이지네이션 단위 → 검색 화면 → Backend 경로·API → 상세 스트리밍·캐시. 도구를 통합하기 전에 요구사항과 assertion을 읽는 능력을 우선한다.

## 실패 대응과 복구

- 파일을 찾지 못하면 shadow workspace가 아닌 실제 저장소 루트를 열었는지 확인한다.
- Node/TS 오류는 Node.js 24, 상대 import 확장자, type stripping 제약, 필요한 계약 빌드를 먼저 확인한다.
- Playwright 실행 파일이 없으면 기존 pnpm 설정으로 필요한 브라우저를 설치한 뒤 재실행한다. 전체 의존성을 임의로 재생성하지 않는다.
- API/E2E fixture의 포트 충돌과 기존 dev 서버 env 차이를 먼저 구분한다.
- 실패 시 기대값을 현재 출력에 맞춰 무조건 고치지 않는다. 요구사항·실제 버그·낡은 fixture 중 무엇이 원인인지 판단한다.
- 학습 중 바꾼 기대값·임시 skip·only는 복원하고 diff를 확인한다. 다른 작업자의 변경은 되돌리지 않는다.
- IDE 버튼 실행은 이번 작업에서 직접 검증하지 않았다. 통합 터미널 명령과 공식 확장 절차를 안내했다.

## 관련 검증

- [전체 테스트 목록](repository-test-inventory.md)
- [반응형·브라우저·기기 점검](docs-responsive-browser-device-checklist.md)
- [작성 가이드 점검 기록](../worklog/2026-10/2026-10-12-test-authoring-guide.md)
