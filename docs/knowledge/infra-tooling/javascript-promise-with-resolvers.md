# JavaScript 외부 Promise 완료 제어와 withResolvers

## 상태와 범위

- 대상: `scripts/verify-vuln-radar-integration.mts`의 API 응답 대기·해제 제어 2곳.
- 최종 검토: 2026-11-21.
- 상태: 통합 검증 스크립트 2곳에 `Promise.withResolvers<void>()` 로컬 적용. 타입 검사와 실제 Postgres·브라우저 통합 26그룹·정리 6단계 통과. [적용 검증](../../verification/integration/2026-11-21-modern-javascript-implementation.md)은 [PR #106](https://github.com/IMHOJEONG/web-tech/pull/106)의 원격 브랜치 반영과 main·운영 배포를 구분한다.
- 관리: [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83). 공통 호환성 판단은 [웹 현대화 판단](https://web-tech-service.atlassian.net/wiki/pages/19464193).
- Confluence 주제: [외부 Promise 완료 제어](https://web-tech-service.atlassian.net/wiki/pages/20250653).

## 개념과 배경

Promise는 비동기 작업의 완료 상태와 결과를 나타낸다. 보통 `new Promise(executor)` 안에서 작업을 연결하지만, 이벤트·메시지·테스트 순서에 따라 바깥에서 완료시켜야 할 때도 있다. 이 경우 Promise는 다른 흐름을 기다리게 하는 대기 장치가 된다.

기존에는 바깥 변수에 `resolve`·`reject`를 대입해 보관했다. ES2024의 `Promise.withResolvers()`는 Promise와 그 완료 함수를 함께 반환해 이 패턴을 직접 표현한다. 호출 자체가 작업을 시작하거나 자동으로 완료시키지는 않는다. [ECMAScript withResolvers 명세](https://tc39.es/ecma262/2024/multipage/control-abstraction-objects.html#sec-promise.withresolvers)

## 적용 원리

기존 방식:

```ts
let release: (() => void) | undefined;
const gate = new Promise<void>((resolve) => {
  release = resolve;
});
```

같은 대기 장치의 선언을 다음처럼 표현할 수 있다.

```ts
const { promise: gate, resolve: release } = Promise.withResolvers<void>();
```

사용하는 쪽은 `await gate`로 기다리고, 다른 제어 흐름에서 `release()`를 호출해 진행시킨다. 같은 흐름에서 `await gate` 다음에만 `release()`를 두면 영원히 진행할 수 없으므로 해제 주체가 필요하다.

```ts
const { promise: gate, resolve: release } = Promise.withResolvers<void>();
const consumer = gate.then(() => "대기 종료");
release();
await consumer;
```

`resolve` 호출 즉시 `.then()` 콜백이 동기 실행되는 것은 아니다. 후속 처리는 Promise 반응 작업으로 이어진다. 또한 먼저 완료된 상태가 유지되므로 두 번 `resolve()`해도 결과가 두 번 바뀌지 않는다.

## 프로젝트 사례

[통합 검증 원본](../../../scripts/verify-vuln-radar-integration.mts)에는 두 사용처가 있다.

| 위치 식별자                       | 목적                                                | 교체 시 보존할 조건                                           |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `holdRetry` 생성과 `release` 대입 | 재시도 응답을 보류해 버튼 disabled 상태를 확인      | 보류 Promise를 클릭 전에 연결하고 확인 후 해제                |
| 보조 API의 `gate`                 | 핵심 패널은 보이고 느린 보조 패널만 대기하는지 확인 | route handler가 같은 gate를 기다리며 정상·실패 경로 모두 정리 |

두 곳 모두 이전 executor가 해제 함수 대입만 수행해 `withResolvers()`로 교체했다. `holdRetry`는 기존 route handler가 읽는 가변 바인딩이므로 모든 변수를 기계적으로 `const`로 바꾸지는 않았다.

```ts
const { promise: retryGate, resolve: release } = Promise.withResolvers<void>();
// 실제 재시도를 시작할 때 기존 route handler의 대기 바인딩을 활성화한다.
holdRetry = retryGate;
```

실제 스크립트는 gate와 해제 함수를 `try` 바깥에서 함께 선언한다. 재시도 직전에만 `holdRetry`를 연결하고 성공·`finally` 모두에서 `release()`한다. 이제 해제 함수는 항상 존재하므로 `release!()`와 `release?.()`가 필요 없다. 보조 API gate도 같은 생명주기를 유지한다. 해제 함수를 `try` 안에만 선언한 뒤 기존 `finally`에서 참조하는 식으로 옮기면 안 된다.

기존 `new Promise()`의 executor는 생성 중 동기적으로 호출된다. 따라서 현재 `release` 대입 자체를 비동기 초기화 경쟁이나 확인된 버그로 설명하지 않는다. `release!()`는 TypeScript에 값의 존재를 단언하는 표현이며 런타임 검사를 추가하지 않는다. 새 API의 이점은 바깥 가변 선언과 단언의 필요성을 줄이는 데 있다.

## 판단 기준

| 조건                                             | 판단                                             |
| ------------------------------------------------ | ------------------------------------------------ |
| executor의 목적이 외부에 완료 함수를 제공하는 것 | `Promise.withResolvers()` 검토                   |
| executor 안에서 콜백 API 연결과 처리가 완결됨    | `new Promise()` 유지 가능                        |
| 단순히 Promise 결과를 변환함                     | `async`·`await`·`.then()`으로 충분한지 먼저 확인 |
| setup 코드도 함께 바깥으로 이동함                | 동기 예외가 rejection으로 유지되는지 확인        |
| 지원 Node·브라우저 또는 타입 선언이 부족함       | 기존 패턴 유지 또는 별도 도입 판단               |

## 주의점

`new Promise()`의 executor 안에서 던진 동기 예외는 Promise rejection이 된다. 같은 setup을 `withResolvers()` 다음 줄로 옮기면 동기 예외로 전파된다. 이는 관측 가능한 계약 차이다.

```ts
const { promise, resolve, reject } = Promise.withResolvers<void>();
try {
  setup(resolve); // 설명용 함수: 동기 예외를 던질 수 있음
} catch (error) {
  reject(error);
}
```

이번 두 executor에는 이런 setup이 없지만 일반화해서 교체할 때는 필요하다. 해제 함수를 잃거나 `finally` 정리를 삭제하면 대기가 풀리지 않을 수 있으며, 새 API가 이를 자동 방지하지는 않는다.

공통 TypeScript 설정은 ES2022이고 API는 ES2024다. 실제 교체 직후 통합 검사 진입점에서 진단 2550 두 건을 확인했고, `tsconfig.vuln-integration.json`에만 `ES2024.Promise` 타입을 추가한 뒤 통과했다. Node 24 실행 지원과 타입 선언의 포함 여부를 분리한 사례다. [TypeScript lib](https://www.typescriptlang.org/tsconfig/lib.html)를 올린다고 런타임 API가 설치되는 것은 아니다.

## 원본 근거와 관리

- [ECMAScript: Promise 생성자와 executor 처리](https://tc39.es/ecma262/2024/multipage/control-abstraction-objects.html#sec-promise-executor), [withResolvers](https://tc39.es/ecma262/2024/multipage/control-abstraction-objects.html#sec-promise.withresolvers).
- [프로젝트 통합 검사 설정](../../../tsconfig.vuln-integration.json), [공통 타입 설정](../../../packages/typescript-config/base.json).
- [항목별 재검증 보고서](../../verification/integration/2026-11-20-modern-javascript-guidance.md), [재현 검사](../../../scripts/verify-modern-javascript-guidance.mjs).
- [실제 코드 적용·통합 회귀](../../verification/integration/2026-11-21-modern-javascript-implementation.md).
- 관련 개념: [취소 신호](javascript-abort-timeout.md), [배열 복사·정렬](javascript-copying-arrays.md).

해제 주체·선언 범위·setup 예외 처리·런타임 지원이 바뀌면 이 문서와 회귀 조건을 다시 검토한다.
