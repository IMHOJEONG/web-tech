# JavaScript 요청 시간 제한과 취소 신호

## 상태와 범위

- 대상: `apps/vuln-radar/src/shared/api/client.ts`의 브라우저 GET 요청과 취소 가능한 비동기 API.
- 최종 검토: 2026-11-21.
- 상태: `AbortSignal.timeout(8_000)`을 앱에 로컬 적용. 실제 클라이언트를 번들한 Chromium GET·오류·헤더/본문 timeout 7조건 통과. [PR #106](https://github.com/IMHOJEONG/web-tech/pull/106)의 원격 브랜치에 반영했으며 main·운영 배포와 다른 브라우저는 미검증.
- 관리: [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83). 상위 개념은 [웹 현대화 판단](https://web-tech-service.atlassian.net/wiki/pages/19464193).
- Confluence 주제: [시간 제한과 취소](https://web-tech-service.atlassian.net/wiki/pages/20676655).

## 개념과 배경

네트워크 요청이 끝없이 대기하지 않도록 일정 시간 뒤 요청 중단을 알릴 수 있다. `AbortController`는 중단을 요청하는 주체이고, `AbortSignal`은 그 상태와 이유를 전달하는 신호다. 신호를 받은 API가 중단에 협력하는 구조이며 서버에서 이미 시작한 작업까지 되돌리는 트랜잭션은 아니다.

기존에는 컨트롤러를 만들고 `setTimeout()`에서 `abort()`를 호출했다. 시간 제한 하나를 표현하는 데 타이머 생성·핸들 저장·해제까지 관리해야 했다. `AbortSignal.timeout(ms)`는 지정한 시간 뒤 중단되는 신호를 제공해 이 의도를 직접 표현한다. 기존 API의 사용이 폐기되었거나 모든 수동 타이머가 결함이라는 뜻은 아니다.

시간 제한은 동기 JavaScript를 선점하지 않는다. 응답 헤더 이후 본문 읽기도 신호의 영향을 받을 수 있지만, 이미 실행 중인 동기 스키마 검증을 정확히 8초에 중단시키지는 않는다. 브라우저의 문서 정지·작업 큐 처리에도 영향을 받으므로 엄밀한 벽시계 실행 상한으로 해석하지 않는다.

## 적용 원리

기존 패턴을 축약하면 다음과 같다.

```ts
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 8_000);

try {
  const response = await fetch(url, { signal: controller.signal });
  return await response.json();
} finally {
  clearTimeout(timeoutId);
}
```

시간 제한에만 쓰인다면 다음처럼 표현할 수 있다. 두 예제의 `url`은 호출자가 제공하는 요청 URL이며 아래는 현재 앱에 적용한 요청 부분의 축약이다. 실제 함수의 HTTP·스키마 검사와 `ApiError` 래핑은 보존했다.

```ts
const response = await fetch(url, {
  signal: AbortSignal.timeout(8_000),
});
return await response.json();
```

사용자 취소와 시간 제한이 함께 필요하다면 컨트롤러를 보존하고 신호를 결합한다.

```ts
const controller = new AbortController();
const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(8_000)]);
// 취소 동작에서 controller.abort()를 호출한다.
const response = await fetch(url, { signal });
```

`AbortSignal.any()`는 먼저 중단된 입력의 이유를 전달한다. 먼저 일어난 취소의 원인을 나중 시간 초과로 덮어쓰지 않는다. [WHATWG DOM의 AbortSignal 명세](https://dom.spec.whatwg.org/#interface-abortsignal)

## 프로젝트 사례

[API 클라이언트 원본](../../../apps/vuln-radar/src/shared/api/client.ts)의 `getJson()`은 외부 signal이나 수동 취소 입력이 없다. 2026-11-21에 시간 제한 전용 컨트롤러·타이머·`finally` 해제를 제거하고 fetch의 signal에 `AbortSignal.timeout(API_TIMEOUT_MS)`를 전달했다. 상수 8초와 HTTP·파싱 계약은 유지한다.

수정 전에도 `finally`의 `window.clearTimeout(timeoutId)`가 있었다. 누수 수정으로 보고하지 않는다. 개선 목적은 직접 관리하는 상태와 코드의 축소다.

`catch`는 일반 오류의 메시지를 `ApiError`에 넣고 `code: "network"`로 분류한다. 실제 Chromium의 헤더 대기·부분 본문 대기에서 각각 약 8초 후 `signal.reason.name === "TimeoutError"`, 바깥 오류 `ApiError.code === "network"`를 확인했다. 원래 오류 메시지 자체의 동일성은 보장하지 않는다. 단순 Node 실험과 달리 실제 브라우저 fetch를 사용한 결과이며 상세 범위는 [적용 검증](../../verification/integration/2026-11-21-modern-javascript-implementation.md)을 따른다.

## 판단 기준

| 조건                                               | 판단                                                |
| -------------------------------------------------- | --------------------------------------------------- |
| 한 번 정한 시간 뒤 중단하는 용도로만 컨트롤러 사용 | `AbortSignal.timeout()` 검토                        |
| 취소 버튼·cleanup·외부 signal도 요청을 중단        | 컨트롤러 유지, 필요한 경우 `AbortSignal.any()` 결합 |
| 활동이 있을 때마다 시간을 연장하는 idle timeout    | 단순 치환 제외                                      |
| 조기 타이머 취소나 사용자 정의 중단 이유가 계약    | 기존 생명주기와 이유를 먼저 검토                    |
| 지원 브라우저가 API를 제공하지 않음                | 기존 구현을 fallback으로 유지하거나 도입 보류       |

## 주의점

- `controller.abort()`의 기본 이유는 `AbortError`, timeout 신호의 이유는 `TimeoutError`다. 둘을 구분하는 분기와 오류 메시지를 함께 검토한다.
- 작업이 먼저 끝났다고 timeout 신호의 시간 제한이 취소되지는 않는다. 이 API에는 `clearTimeout()`에 해당하는 공개 취소 핸들이 없다. 직접 붙인 이벤트 리스너의 생명주기도 관리한다.
- Node의 timeout 신호만으로 프로세스 생존이 보장되지 않는다. 합성 실험은 별도의 timer로 대기 조건을 유지한다. 브라우저 동작에 그대로 일반화하지 않는다.
- Node 지원과 사용자 브라우저 지원은 별개다. 타입에 API가 보이는 것과 런타임에 존재하는 것도 별개다.
- “8초 뒤 중단 신호 전달”과 “서버 실행 취소·롤백 완료”를 구분한다.

## 원본 근거와 관리

- [WHATWG DOM: timeout](https://dom.spec.whatwg.org/#dom-abortsignal-timeout), [HTML: timeout 처리와 문서 활성 조건](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#run-steps-after-a-timeout).
- [Node: AbortSignal](https://nodejs.org/api/globals.html#class-abortsignal). 이번 실험 버전은 보고서의 Node 24 조건을 따른다.
- [항목별 재검증 보고서](../../verification/integration/2026-11-20-modern-javascript-guidance.md), [재현 검사](../../../scripts/verify-modern-javascript-guidance.mjs).
- [실제 코드 적용·회귀 검증](../../verification/integration/2026-11-21-modern-javascript-implementation.md), [실제 클라이언트 브라우저 검사](../../../scripts/verify-vuln-radar-api-client.mjs).
- 관련 개념: [배열 복사·정렬](javascript-copying-arrays.md), [외부 Promise 완료 제어](javascript-promise-with-resolvers.md).

실제 API 교체, 취소 입력 추가, 지원 브라우저 변경 시 이 문서의 적용 상태와 검증 보고서를 다시 연결한다. 문서 생성만으로 앱 적용 상태를 승격하지 않는다.
