# Nest 구조와 요청 흐름

이 문서는 `apps/vuln-radar-backend`를 왜 현재처럼 `NestJS` 구조로 나눴는지와,
브라우저 요청 하나가 들어왔을 때 내부에서 어떤 순서로 흐르는지 설명한다.

## 왜 이렇게 나눴나

현재 백엔드는 단순 CRUD API가 아니라 아래 역할을 같이 맡는다.

- 프론트용 read API 제공
- 외부 취약점 소스 수집 준비
- DB read-model 조립
- 점수 계산과 알림으로 확장될 기반 제공

이런 앱은 파일을 기능별로 한데 몰아두면 금방 커진다.
그래서 지금은 아래 경계를 먼저 세워 두었다.

### `main.ts`

역할:

- Nest 앱 생성
- 앱 전체 bootstrap 시작

이 파일은 가능한 얇게 유지한다.
앱 시작 규칙이 많아질수록 `main.ts`가 비대해지기 쉬워서,
실제 공통 설정은 `bootstrap` 계층으로 분리했다.

### `bootstrap/app-bootstrap.ts`

역할:

- global prefix 적용
- CORS 적용

이렇게 분리한 이유:

- 테스트에서도 같은 bootstrap 로직을 재사용할 수 있다.
- `main.ts`와 e2e 테스트가 서로 다른 설정을 갖지 않게 막을 수 있다.
- 앱 시작 정책을 한 군데에서 바꿀 수 있다.

### `config/*`

역할:

- `process.env` 읽기
- 앱 실행 설정의 기본값 정리

이렇게 분리한 이유:

- 여러 파일에서 직접 `process.env.PORT`, `process.env.CORS_ORIGIN`를 읽기 시작하면
  추적이 어려워진다.
- 설정을 한 군데로 모아야 나중에 `validation`, `config module`, `secret manager`로
  확장하기 쉽다.

### `modules/*`

Nest에서 제일 중요한 경계는 도메인 모듈이다.

지금 기준:

- `health`: 상태 확인
- `feeds`: 프론트 read API

이렇게 나눈 이유:

- HTTP 엔드포인트 단위가 아니라 도메인 책임 단위로 묶기 위해서다.
- 나중에 `ingest`, `watchlist`, `scoring`, `alerts`가 들어와도 같은 패턴으로 확장된다.

### `controller -> service -> repository`

현재 `feeds`는 아래처럼 흐른다.

- `controller`: HTTP route만 받는다.
- `service`: 유스케이스를 연결한다.
- `repository`: DB 조회와 응답 조립을 담당한다.

이렇게 나눈 이유:

- controller가 DB 세부 구현을 알지 않게 하기 위해
- service가 나중에 여러 repository나 scorer를 조합할 수 있게 하기 위해
- DB read model 변경을 repository 안에서 끝내기 위해

### `infra/prisma/*`

역할:

- Prisma client 생성
- DB 연결 방식 숨기기
- Prisma 7 adapter 복잡도 격리

이렇게 분리한 이유:

- 서비스 코드가 `PrismaPg`, direct URL 해석, client 생성 세부 구현까지 알 필요가 없다.
- Prisma 7은 runtime adapter가 필요해서 연결 코드가 예전보다 복잡하다.
- 인프라 계층으로 밀어 넣어야 도메인 코드가 덜 흔들린다.

### `shared/*`

역할:

- 공용 타입
- mock fallback 데이터
- seed에 재사용되는 샘플 데이터

이렇게 둔 이유:

- 프론트 응답 shape와 seed 데이터가 어긋나지 않게 하기 위해
- 아직 ingest가 없어도 FE가 붙을 수 있도록 하기 위해

## 왜 mock fallback을 남겼나

현재 백엔드는 DB 데이터가 있으면 DB를 읽고,
없거나 연결에 실패하면 mock 응답으로 fallback 한다.

이 방식의 장점:

- 프론트와 백엔드를 병렬로 만들 수 있다.
- ingest가 없어도 API 계약을 먼저 고정할 수 있다.
- DB 이슈가 있어도 최소 UI 개발이 막히지 않는다.

즉 지금 fallback은 “임시 꼼수”라기보다
`개발 속도를 위한 계약 보호 장치`에 가깝다.

## 요청 1건의 실제 흐름

예시 요청:

```text
GET /api/feed
```

내부 흐름은 이렇게 본다.

```text
Browser
  -> Nest HTTP adapter
  -> main.ts
  -> applyAppBootstrap()
  -> AppModule
  -> FeedsModule
  -> FeedsController.getFeed()
  -> FeedsService.getFeed()
  -> FeedsRepository.getFeed()
  -> PrismaService.getClient()
  -> Prisma Client
  -> PostgreSQL
  -> repository가 응답 shape로 변환
  -> controller return
  -> JSON response
```

좀 더 코드 중심으로 풀면 아래 순서다.

### 1. 앱 시작

`src/main.ts`

- `NestFactory.create(AppModule)`로 앱을 만든다.
- `applyAppBootstrap(app)`를 호출한다.
- 포트를 읽고 서버를 listen 한다.

### 2. bootstrap 적용

`src/bootstrap/app-bootstrap.ts`

- `/api` global prefix를 건다.
- CORS origin을 적용한다.

그래서 이후 controller에 `@Controller('health')`만 있어도
실제 URL은 `/api/health`가 된다.

### 3. 모듈 로딩

`src/app.module.ts`

- `AppConfigModule`
- `PrismaModule`
- `HealthModule`
- `FeedsModule`

Nest는 이 시점에 provider 의존성을 연결한다.

### 4. 라우트 매핑

`src/modules/feeds/feeds.controller.ts`

- `@Get('feed')`
- `@Get('overview')`
- `@Get('kev')`
- `@Get('watchlist')`
- `@Get('alerts')`

이 route들이 `/api/*` 아래에 실제로 연결된다.

### 5. controller 진입

`FeedsController.getFeed()`

여기서는 거의 로직이 없다.
그냥 service로 요청을 넘긴다.

이유:

- controller는 HTTP 레이어에 집중해야 한다.
- 나중에 DTO, auth guard, cache header가 붙어도 도메인 로직과 섞이지 않는다.

### 6. service 진입

`FeedsService.getFeed()`

여기서는 repository를 호출한다.
현재는 단순 위임이지만,
나중에는 여기서 아래 같은 조합이 들어갈 수 있다.

- feature flag 분기
- permission 분기
- 여러 repository 결과 합치기
- score/summary 후처리

### 7. repository 진입

`FeedsRepository.getFeed()`

여기가 실제 read-model 조립 지점이다.

순서:

1. `PrismaService.getClient()` 호출
2. DB 연결 가능 여부 확인
3. 가능하면 `vulnerability.findMany()` 조회
4. `watchMatches`까지 포함해서 가져옴
5. 프론트 응답 타입(`FeedResponse`)으로 변환
6. DB가 비어 있으면 mock fallback 반환

즉 repository는 “DB row를 그대로 주는 곳”이 아니라
`프론트가 쓰기 좋은 shape로 조립하는 곳`이다.

### 8. Prisma 연결

`src/infra/prisma/prisma.service.ts`

현재 구조에서는 여기서:

- generated Prisma client import
- direct DB URL 해석
- `PrismaPg` adapter 생성
- `new PrismaClient({ adapter })`
- `$connect()`

까지 담당한다.

이유:

- Prisma 7 연결 세부 구현을 도메인에서 숨기기 위해서다.

### 9. DB 조회

Prisma가 PostgreSQL에서 row를 읽는다.

예:

- vulnerability
- watchMatches
- advisory
- alert

### 10. 응답 변환

repository는 DB row를 그대로 return 하지 않고
프론트 계약 타입으로 바꾼다.

예:

- `Date` -> ISO string
- nullable 필드 -> 화면 친화 기본값
- relation 배열 -> `matchedWatchlist` 같은 단순 배열

이 단계가 중요한 이유:

- 프론트가 DB 구조를 직접 알지 않아도 된다.
- schema 변경이 생겨도 API contract를 안정적으로 유지할 수 있다.

## `/api/health`는 왜 따로 중요하나

health는 단순 ping이 아니라
현재 앱 상태를 가장 싸게 설명하는 엔드포인트다.

지금은 아래 정보를 준다.

- `status`
- `service`
- `env`
- `frontendOrigin`
- `storage`

특히 `storage: mock | database`는
현재 read path가 실제 DB인지 fallback인지 빠르게 판단하게 해 준다.

## 직접 볼 때 추천 순서

코드를 읽는 순서는 아래가 제일 이해가 쉽다.

1. `src/main.ts`
2. `src/bootstrap/app-bootstrap.ts`
3. `src/app.module.ts`
4. `src/modules/feeds/feeds.controller.ts`
5. `src/modules/feeds/feeds.service.ts`
6. `src/modules/feeds/feeds.repository.ts`
7. `src/infra/prisma/prisma.service.ts`
8. `prisma/schema.prisma`
9. `prisma/seed.ts`

## 다음에 확장될 때도 같은 원칙을 유지한다

예를 들어 `ingest`가 들어오면 비슷한 구조를 유지한다.

- controller: 수동 트리거 API가 필요하면 최소화
- service: ingest 실행 orchestration
- collector/provider: 외부 API fetch
- mapper/normalizer: raw -> domain input 변환
- repository: upsert

즉 지금 구조는 현재 코드만 위한 게 아니라,
나중에 `ingest -> normalize -> score -> alert -> feed`로 커질 것을 미리 버틸 수 있게
잡아 둔 기본선이다.
