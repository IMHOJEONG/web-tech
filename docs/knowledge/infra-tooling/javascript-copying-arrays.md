# JavaScript 배열 복사·정렬과 iterable 변환의 차이

## 상태와 범위

- 대상: lockfile 그래프 직렬화와 비공개 콘텐츠 경로 비교 스크립트의 정렬 패턴.
- 최종 검토: 2026-11-21.
- 상태: `routes.toSorted()` 로컬 적용, 동결한 역순 입력의 순서 무관 비교·원본 보존과 기존 음성 회귀 통과. Set 정렬은 유지하며 공통 타입 설정·원격 Git·운영 배포는 미변경.
- 관리: [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83). 공통 호환성 판단은 [웹 현대화 판단](https://web-tech-service.atlassian.net/wiki/pages/19464193).
- Confluence 주제: [배열 현대화와 Set 변환](https://web-tech-service.atlassian.net/wiki/pages/20119630).

## 개념과 배경

`Array.prototype.sort()`와 `reverse()`는 호출한 배열을 변경하고 그 배열을 반환한다. 같은 배열을 다른 코드와 공유하면 정렬만 하려다가 입력 순서를 바꾸는 부작용이 생길 수 있다. 기존에는 먼저 얕게 복사한 뒤 정렬해 원본을 보호했다.

ES2023의 `toSorted()`·`toReversed()`·`toSpliced()`·`with()`는 결과를 새 배열로 돌려주는 의도를 직접 표현한다. `findLast()`와 `findLastIndex()`는 뒤에서 검색하므로 검색만을 위한 역순 배열을 만들 필요가 없다. 이들은 배열 API이며 모든 iterable의 메서드는 아니다. [ECMAScript 배열 명세](https://tc39.es/ecma262/2023/multipage/indexed-collections.html#sec-properties-of-the-array-prototype-object)

## 적용 원리

```ts
const routes = ["/b", "/a"];
const before = [...routes].sort();
const after = routes.toSorted();
// 두 결과 모두 ["/a", "/b"], routes는 ["/b", "/a"] 유지
```

두 방식 모두 새 배열을 하나 만들고 원본 배열을 유지한다. `toSorted()`로 바꾸면 할당이 사라지거나 항상 빨라진다는 보장은 없다. 여기서는 불변 변환이라는 의도를 명확하게 표현하는 이점이 중심이다.

얕은 복사이므로 요소가 객체면 내부 객체 참조는 공유한다. 결과 배열의 순서를 바꾸지 않는 것과 객체 내부까지 복제하는 것은 다르다. 숫자 정렬은 기존 비교 함수를 그대로 전달한다.

```ts
const values = [10, 2];
values.toSorted(); // [10, 2]: 기본 문자열 순서
values.toSorted((a, b) => a - b); // [2, 10]
```

## 프로젝트 사례

### Set 직렬화: 개선 대상에서 제외

[lockfile 분석 원본](../../../scripts/analyze-vuln-radar-lockfile.mts)의 `serializedEdges()`는 `Map<string, Set<string>>`를 받는다. 탐지된 `targets`의 실제 타입은 `Set<string>`이다.

```ts
.map(([key, targets]) => [key, [...targets].sort()])
```

`[...targets]`는 기존 배열을 복사하는 것이 아니라 Set을 배열로 변환한다. 새 배열을 바로 정렬하므로 원래 Set의 삽입 순서를 바꾸지 않는다. `targets.toSorted()`는 메서드가 없어 실패한다. `[...targets].toSorted()`는 변환 결과를 다시 복사하므로 이 경우 목적에 맞지 않는다.

이 항목은 `js/copying-array-methods`의 non-Array iterable 제외 조건에 해당한다. 스캔 결과 0건을 만들기 위해 정상 패턴을 바꾸지 않는다.

### 경로 비교: 로컬 적용

[비공개 콘텐츠 CI 정책 원본](../../../scripts/private-content-ci-policy.mts)의 `assertPrivateSearch()`는 검색 경로를 정렬한 뒤 기대 경로와 비교한다.

```ts
assert.deepEqual(data.results.map((r) => r.href).sort(), routes.toSorted());
```

`routes`를 `readonly string[]`로 받아 입력을 변경하지 않는 계약을 타입에도 표시했다. 기존에도 복사해 원본을 지켰으므로 결함 수정으로 분류하지 않는다. 순서만 무시하며 중복 개수는 유지하는 비교다. Set으로 바꿔 비교하면 중복 의미가 달라진다.

2026-11-21 회귀는 정렬되지 않은 기대 경로를 `Object.freeze()`로 동결하고 반대 순서의 검색 결과를 비교했다. 원본 순서가 보존되고 누락·중복·외부·오래된 경로를 계속 거절했다. `tsconfig.private-content-ci.json`에만 `ES2023.Array` 타입을 추가했으며 공통 ES2022 target/lib는 유지했다.

왼쪽은 `map()`이 이미 새 배열을 만들었으므로 `.sort()`가 원래 `data.results`의 배열 순서를 바꾸지 않는다. `.sort()`라는 이유만으로 전체를 일괄 교체하지 않는다.

## 판단 기준

| 코드와 요구                                          | 판단                                       |
| ---------------------------------------------------- | ------------------------------------------ |
| 일반 배열을 복사한 뒤 정렬·역순 변환                 | copying 메서드 검토                        |
| Set·Map iterator·NodeList 등을 배열로 변환한 뒤 정렬 | 변환 유지, 새로 만든 배열에 `.sort()` 가능 |
| 원래 배열을 제자리에서 변경하려는 코드               | `.sort()`·`.reverse()` 유지 가능           |
| `map()`·`filter()`가 새로 만든 배열을 정렬           | 입력 불변성은 이미 확보, 일괄 교체 불필요  |
| 마지막 일치 요소나 인덱스만 필요                     | `findLast()`·`findLastIndex()` 검토        |

## 주의점

- TypedArray의 기본 정렬은 숫자 순서지만 일반 배열의 기본 정렬은 문자열 순서다. `[...typed].sort()`를 `typed.toSorted()`로 바꾸면 순서와 반환 타입이 달라질 수 있다.
- 희소 배열의 `slice().sort()`는 빈 슬롯을 보존하지만 `toSorted()`는 `undefined` 요소로 채운다. spread도 이미 빈 슬롯을 `undefined`로 구체화한다. 원래 복사 방법까지 확인한다.
- `findLastIndex()`는 원래 배열의 인덱스를 반환한다. 역순 배열의 `findIndex()`와 수치가 다르며, 검색 실패는 `-1`이다. 콜백의 index·array 인자도 함께 점검한다.
- ES2023 타입 선언과 실행 환경 지원은 별도로 확인한다. 공통 `lib: es2022`만 보고 프로젝트 전체의 컴파일 실패를 단정하지 않는다.
- 성능 개선 여부는 별도 측정 대상이다. 이번 검증은 결과·입력 보존·의미 차이를 확인했다.

## 원본 근거와 관리

- [ECMAScript: toSorted](https://tc39.es/ecma262/2023/multipage/indexed-collections.html#sec-array.prototype.tosorted), [TypedArray toSorted](https://tc39.es/ecma262/2023/multipage/indexed-collections.html#sec-%typedarray%.prototype.tosorted).
- [TypeScript lib](https://www.typescriptlang.org/tsconfig/lib.html), [프로젝트 공통 설정](../../../packages/typescript-config/base.json).
- [항목별 재검증 보고서](../../verification/integration/2026-11-20-modern-javascript-guidance.md), [재현 검사](../../../scripts/verify-modern-javascript-guidance.mjs).
- [실제 적용·회귀 검증](../../verification/integration/2026-11-21-modern-javascript-implementation.md), [경로 계약 회귀](../../../scripts/private-content-ci.test.mts).
- 관련 개념: [취소 신호](javascript-abort-timeout.md), [외부 Promise 완료 제어](javascript-promise-with-resolvers.md).

입력 타입·비교 함수·호출자의 원본 변경 기대·타입 설정이 바뀌면 적용 판단을 다시 검토한다.
