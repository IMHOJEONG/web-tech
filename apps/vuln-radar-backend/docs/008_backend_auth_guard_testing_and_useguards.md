# BackendAuthGuard 테스트 정리와 `@UseGuards`를 쓰는 이유

이 문서는 `vuln-radar-backend`에서 `BackendAuthGuard`가 추가된 뒤
왜 일부 controller unit test가 깨졌는지,
그리고 Nest에서 왜 `@UseGuards(...)` 방식으로 인증을 붙이는지 정리한다.

## 이번에 `pnpm test`가 실패한 이유

실패한 테스트는 아래 두 파일이었다.

- `src/modules/feeds/feeds.controller.spec.ts`
- `src/modules/ingest/ingest.controller.spec.ts`

두 컨트롤러는 현재 route 단위로 아래 가드를 사용한다.

- `src/modules/feeds/feeds.controller.ts`
- `src/modules/ingest/ingest.controller.ts`

둘 다 `@UseGuards(BackendAuthGuard)`가 붙어 있다.

문제는 `BackendAuthGuard`가 단독 함수가 아니라
`AppConfigService`를 constructor injection으로 받는 Nest provider라는 점이다.

즉 테스트에서 `TestingModule`을 만들 때도 Nest는 이 guard를 해석하려고 하고,
그 과정에서 `AppConfigService`를 못 찾으면 아래처럼 컴파일 단계에서 실패한다.

```text
Nest can't resolve dependencies of the BackendAuthGuard (?).
Please make sure that the argument AppConfigService at index [0] is available
```

정리하면:

- controller에 auth guard가 추가되었다
- guard는 `AppConfigService`에 의존한다
- 그런데 해당 controller unit test는 guard/provider 준비가 없었다
- 그래서 handler 호출 전, test module compile 단계에서 실패했다

## 이번에 적용한 테스트 보완 방식

controller unit test에서는 인증 로직 자체보다
controller가 service를 어떻게 호출하고 응답을 어떻게 넘기는지 보는 것이 목적이다.

그래서 이번에는 아래 방식으로 보완했다.

- `BackendAuthGuard`는 mock provider로 등록
- `canActivate`는 `true`를 반환
- `AppConfigService`도 테스트용 값으로 제공

예시:

```ts
{
  provide: BackendAuthGuard,
  useValue: {
    canActivate: () => true,
  },
},
{
  provide: AppConfigService,
  useValue: {
    backendApiToken: 'test-token',
  },
},
```

이렇게 하면 controller unit test는 인증 정책 때문에 흔들리지 않고,
route handler의 본래 책임만 집중해서 검증할 수 있다.

## 왜 guard를 완전히 빼지 않고 mock으로 두는가

겉보기에는 controller test에서 guard를 아예 제거하고 싶어 보일 수 있다.
하지만 최소한 mock token이라도 module에 남겨 두는 편이 의도가 더 명확하다.

이유:

- 실제 production controller는 인증 guard가 붙은 상태다
- 테스트도 "guard가 존재하는 controller"라는 사실은 유지하는 편이 구조를 잘 반영한다
- 다만 controller unit test의 관심사는 auth 정책이 아니므로 `canActivate: true`로 우회한다

즉:

- auth 정책 검증은 `backend-auth.guard.spec.ts`
- controller 동작 검증은 각 controller spec

처럼 책임을 분리하는 편이 유지보수에 유리하다.

## Nest에서 왜 `@UseGuards` 방식을 쓰는가

Nest에서 guard는 request pipeline의 앞단에서
"이 요청을 계속 처리해도 되는가"를 판단하는 계층이다.

`@UseGuards(...)`를 쓰는 핵심 이유는 인증/인가를
controller business logic와 분리하기 위해서다.

### 1. cross-cutting concern을 분리할 수 있다

인증은 여러 endpoint에 공통으로 들어가는 규칙이다.
이걸 controller method 안에서 직접 검사하면 아래 문제가 생긴다.

- header 파싱 코드가 여러 곳에 반복된다
- unauthorized 처리 문구가 매번 달라질 수 있다
- 토큰 비교 방식이 endpoint마다 어긋날 수 있다

guard로 빼면 인증 규칙을 한 군데에서 유지할 수 있다.

### 2. controller는 handler 책임에 집중할 수 있다

예를 들어 `FeedsController`의 책임은:

- overview 응답 반환
- feed 목록 반환
- kev 목록 반환

이지, bearer token parsing 자체가 아니다.

guard를 쓰면 controller는 "이미 통과한 요청"만 받는다는 가정 아래
핸들러 로직을 더 단순하게 유지할 수 있다.

### 3. Nest DI를 그대로 활용할 수 있다

이번 `BackendAuthGuard`처럼 설정값이 필요한 경우,
guard도 provider이기 때문에 `AppConfigService`를 자연스럽게 주입받을 수 있다.

즉:

- env parsing은 config 계층
- auth decision은 guard 계층
- business response는 controller/service 계층

으로 나눌 수 있다.

### 4. 적용 범위를 선언적으로 제어할 수 있다

`@UseGuards(...)`는 아래 수준에서 붙일 수 있다.

- method 단위
- controller 단위
- global 단위

현재 backend는 admin/운영 성격 route에 controller 단위로 붙여서
"이 controller 아래의 모든 handler는 같은 인증 규칙을 쓴다"는 의도를 드러내고 있다.

## 이 프로젝트에서의 권장 테스트 기준

현재 구조에서는 아래처럼 나누는 것을 권장한다.

### controller unit test

- guard/provider는 mock으로 등록
- 실제 목적은 request auth가 아니라 handler/service wiring 검증

### guard unit test

- `src/shared/guards/backend-auth.guard.spec.ts`에서 직접 검증
- missing token
- missing authorization header
- wrong bearer token
- correct bearer token

### e2e test

- 실제 HTTP 요청에 `Authorization: Bearer ...`를 붙여서 검증
- route 보호가 실제로 동작하는지 확인

이렇게 나누면 테스트가 서로의 책임을 침범하지 않는다.

## 앞으로 같은 문제가 생기면 볼 체크포인트

새 controller에 `@UseGuards(BackendAuthGuard)`를 붙였는데 unit test가 깨지면
먼저 아래를 확인한다.

1. controller spec에 `BackendAuthGuard` mock provider가 있는지
2. `AppConfigService` mock provider가 있는지
3. 이 테스트가 unit test인지 e2e test인지 목적이 섞여 있지 않은지

간단히 말하면:

- unit test는 guard를 우회하고
- guard test는 guard만 깊게 보고
- e2e test는 실제 auth 흐름을 검증한다

이 분리가 현재 backend에서 가장 안정적이다.
