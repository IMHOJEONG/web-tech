# vuln-radar-backend todo

이 문서는 `apps/vuln-radar-backend`를 만들면서 백엔드 관점에서 무엇을 구현하고, 무엇을 깊게 공부해야 하는지 정리한 학습용 TODO다.

## 1. 런타임 기초 다지기

- [x] `main.ts`의 bootstrap 흐름을 이해한다.
- [x] global prefix, CORS, env loading 전략을 정리한다.
- [x] health check가 왜 제일 먼저 필요한지 정리한다.

결정 메모:

- bootstrap 공통 로직은 `src/bootstrap/app-bootstrap.ts`로 분리한다.
- backend 공개 prefix는 계속 `/api`로 유지한다.
- CORS 허용 origin은 `CORS_ORIGIN`, `FRONTEND_ORIGIN`으로 제어한다.
- health 응답은 `status`뿐 아니라 `service`, `env`, `frontendOrigin`을 포함한다.

공부 포인트:

- [ ] Nest bootstrap이 어떤 순서로 module을 올리는지 설명할 수 있다.
- [ ] health endpoint가 왜 운영 관점에서 중요한지 이해한다.

## 2. 모듈 구조를 실제 코드로 확장하기

- [x] `modules/ingest`
- [ ] `modules/vulnerabilities`
- [ ] `modules/advisories`
- [ ] `modules/watchlist`
- [ ] `modules/scoring`
- [ ] `modules/alerts`
- [x] `modules/feeds`

공부 포인트:

- [ ] Nest에서 module을 domain 기준으로 자르는 이유를 설명할 수 있다.
- [ ] service, controller, module, provider 관계를 이해한다.

## 3. Prisma와 PostgreSQL 기본선 잡기

- [x] Prisma client 생성 흐름 정리
- [x] database URL 관리
- [x] migration 전략 정리
- [ ] local/dev/prod DB 분리 기준 정리

결정 메모:

- 로컬 초기화는 `pnpm --filter vuln-radar-backend db:push` 후 `db:seed` 순서로 진행한다.
- Prisma 7 기준 datasource URL은 `prisma.config.ts`에서 읽고, schema에는 provider만 둔다.
- 첫 단계에서는 migration SQL보다 schema + seed + read-model 검증을 우선한다.

공부 포인트:

- [ ] 왜 PostgreSQL을 선택했는지 설명할 수 있다.
- [ ] JSONB와 정규화 테이블을 함께 쓰는 장단점을 이해한다.
- [ ] Prisma schema와 실제 DB schema의 관계를 설명할 수 있다.

## 4. 첫 스키마 설계: vulnerability

- [x] `vulnerabilities` 테이블
- [x] raw payload 저장 방식
- [x] published / modified time 필드
- [x] severity / score 필드

공부 포인트:

- [ ] raw source data를 그대로 버리면 안 되는 이유를 설명할 수 있다.
- [ ] 정규화된 필드와 원본 JSON을 같이 저장하는 패턴을 이해한다.

## 5. advisory / enrichment 스키마 설계

- [x] `advisories`
- [ ] `kev_entries`
- [x] `epss_scores`
- [ ] `package_advisories`

공부 포인트:

- [ ] KEV, EPSS, OSV가 vulnerability 본체가 아니라 enrichment 계층이라는 점을 이해한다.
- [ ] source별 갱신 주기와 변경 이력을 따로 가져가야 하는 이유를 이해한다.

## 6. watchlist 스키마 설계

- [x] vendor
- [x] product
- [x] ecosystem
- [x] keyword
- [ ] user preference 확장 가능성 검토

공부 포인트:

- [ ] watchlist가 단순 즐겨찾기가 아니라 risk filter 역할을 한다는 점을 이해한다.
- [ ] exact match와 fuzzy match를 어떻게 다뤄야 하는지 생각해본다.

## 7. ingest 모듈 만들기

- [x] `collectors/nvd`
- [x] `collectors/kev`
- [x] `collectors/epss`
- [ ] `collectors/osv`
- [ ] `collectors/kisa`

결정 메모:

- 현재 upstream source는 모두 push가 아니라 polling API로 본다.
- 첫 단계는 scheduler 없이 `POST /api/ingest/sync` 수동 실행으로 시작한다.
- freshness 확인용 `GET /api/ingest/status`를 함께 둬서 live 여부를 바로 확인한다.
- `NVD + KEV + EPSS`를 먼저 연결하고 `OSV`, `KISA`는 다음 단계로 넘긴다.

공부 포인트:

- [ ] collector는 fetch만 할지, parse까지 할지, normalize input까지 할지 경계를 정할 수 있다.
- [ ] source마다 rate limit, pagination, retry 전략이 다르다는 점을 이해한다.

## 8. 스케줄링 전략 세우기

- [x] `@nestjs/schedule` 또는 worker 기반 자동 ingest 실행 방식을 확정한다.
- [x] `POST /api/ingest/sync`를 수동 검증용으로 남기고, 정기 sync 경로를 분리한다.
- [ ] NVD 주기
- [ ] KEV 주기
- [ ] EPSS 주기
- [ ] OSV 주기
- [ ] daily summary 주기

결정 메모:

- 현재 단계는 `@nestjs/schedule + interval`로 단일 앱 인스턴스 기준 자동 sync를 돌린다.
- 중복 실행은 앱 내부에서 막고, 다중 replica 환경은 나중에 worker/queue로 분리한다.
- startup sync는 옵션으로 두고 기본값은 `false`로 유지한다.

공부 포인트:

- [ ] cron, BullMQ repeatable jobs, queue worker의 차이를 설명할 수 있다.
- [ ] request-response 안에서 수집 작업을 하면 왜 위험한지 설명할 수 있다.

## 9. 정규화 파이프라인 만들기

- [ ] raw fetch
- [ ] parse
- [ ] normalize
- [ ] dedupe
- [ ] upsert

공부 포인트:

- [ ] ETL처럼 생각하되, 왜 취약점 데이터는 source별 timestamp를 같이 가져가야 하는지 이해한다.
- [ ] CVE ID 하나만으로 충분하지 않은 경우를 생각해본다.

## 10. scoring 모듈 만들기

- [ ] KEV 가중치
- [ ] EPSS 가중치
- [ ] CVSS 가중치
- [ ] watchlist match 가중치
- [ ] RCE / auth bypass / PoC 신호
- [ ] `P0 ~ P3` 매핑

공부 포인트:

- [ ] “새 CVE = 위험”이 왜 아닌지 설명할 수 있다.
- [ ] CVSS만으로 우선순위를 정하면 왜 부족한지 설명할 수 있다.
- [ ] score와 priority를 분리하는 이유를 이해한다.

## 11. feeds API 만들기

- [x] `/api/overview`
- [x] `/api/feed`
- [x] `/api/kev`
- [x] `/api/alerts`
- [x] `/api/watchlist`

공부 포인트:

- [ ] 프론트에 raw DB row를 그대로 주지 않는 이유를 설명할 수 있다.
- [ ] read model을 별도로 만드는 개념을 이해한다.

## 12. alerts 모듈 만들기

- [ ] Telegram notifier
- [ ] Discord notifier
- [ ] Slack notifier
- [ ] duplicate alert 방지
- [ ] alert history 저장

공부 포인트:

- [ ] 알림은 “전송 성공 여부”와 “왜 보냈는지 근거”가 함께 남아야 한다는 점을 이해한다.
- [ ] idempotency가 왜 중요한지 설명할 수 있다.

## 13. SSE 또는 실시간 이벤트 만들기

- [ ] feed change event 설계
- [ ] alert event 설계
- [ ] 클라이언트 reconnect 고려

공부 포인트:

- [ ] backend에서 SSE를 열 때 어떤 데이터만 push해야 하는지 판단할 수 있다.
- [ ] full refresh와 incremental event의 차이를 이해한다.

## 14. 테스트 전략 세우기

- [ ] health e2e
- [ ] collector parsing unit test
- [ ] scoring test
- [ ] watchlist matching test
- [ ] feeds API e2e

공부 포인트:

- [ ] 백엔드에서 제일 먼저 테스트해야 하는 것은 controller보다도 parser / scorer / matcher라는 점을 이해한다.

## 15. 운영 기초 정리

- [ ] logging 전략
- [ ] retry / backoff
- [ ] dead letter 또는 failure 기록
- [ ] source 장애 시 degrade 전략

공부 포인트:

- [ ] 외부 API가 자주 실패할 수 있다는 전제에서 시스템을 설계하는 법을 이해한다.
- [ ] “실패를 숨기지 않고 기록하는 것”이 왜 중요한지 이해한다.

## 16. 중장기 확장 포인트

- [ ] OpenSearch 필요 시점 정리
- [ ] Python/Go collector 분리 시점 정리
- [ ] asset matching 또는 SBOM 연동 확장 검토
- [ ] multi-user watchlist 확장 가능성 검토

공부 포인트:

- [ ] 지금은 monolith backend가 맞지만, 언제 분리해야 하는지 기준을 설명할 수 있다.
- [ ] “collector”와 “API backend”가 왜 결국 다른 scaling 특성을 갖는지 이해한다.

## 17. 최종 학습 체크

- [ ] 왜 `NestJS + PostgreSQL + Redis`가 현재 repo에 맞는지 설명할 수 있다.
- [ ] ingest -> normalize -> score -> alert -> feed 흐름을 말로 설명할 수 있다.
- [ ] watchlist match가 risk 판단에서 왜 중요한지 설명할 수 있다.
- [ ] 이 backend를 단순 CRUD 서버로 보면 안 되는 이유를 설명할 수 있다.
