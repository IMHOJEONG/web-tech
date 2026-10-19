# vuln-radar 프론트·백엔드 로컬 통합 검증

## 대상과 조건

- 날짜: 2026-10-19. 초기 제출 실행 23:01:56~23:02:08 KST, 리뷰 보완 재실행 23:58:50~23:59:03 KST. 원본 JSON은 UTC ISO 시각을 사용한다.
- 기준 main: `d4a89c094d8d2dae87c44c9192ada42428c931cd`.
- 브랜치: `codex/vuln-radar-integration-verification`. 기존 배포 브랜치를 재사용하지 않았다.
- 도구: Node `24.12.0`, pnpm `11.10.0`, Chromium `151.0.7922.34`, 로컬 Docker의 `postgres:16-alpine`.
- 구성: 격리 PostgreSQL → 실제 Prisma/Nest 모듈·공통 bootstrap → Vite production preview 프록시 → Chromium. 배포용 `api/proxy.ts`는 같은 실제 백엔드에 별도로 직접 호출했다.
- 데이터: 새 DB의 가상 `CVE-2099-91001`~`91003` 3개와 KEV advisory·watch match. 운영 데이터가 아니다.
- 표본: 최종 통합 검사 13개. 확장 과정의 9개·10개·11개 실행도 성공했지만 중복 시나리오를 합산하지 않는다.

앱 런타임 코드는 수정하지 않았다. 검증 도구는 작업 트리 상태에서 실행했으므로 기준 main SHA와 별도로 JSON의 `runnerSha256`에 실행 스크립트 해시를 기록했다.

## 재현 방법

준비 조건과 자원 격리는 [실행 절차](../../runbooks/vuln-radar-local-integration-verification.md)를 따른다. 저장소 루트에서 실행한다.

```sh
mise exec -- pnpm verify:vuln-radar:integration
```

이번 환경에서는 node_modules의 `enableGlobalVirtualStore` 설정 차이로 자동 재설치를 막는 `pnpm_config_verify_deps_before_run=warn`을 해당 명령에만 적용했다. 검사·타입 확인은 그대로 수행했고 의존성·lockfile을 변경하지 않았다.

앱별 보조 회귀도 Node 24에서 수행했다.

```sh
# apps/vuln-radar-backend
node node_modules/jest/bin/jest.js --runInBand
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
node node_modules/eslint/bin/eslint.js src test --max-warnings 0

# apps/vuln-radar
node --experimental-strip-types --test ./src/pages/feed/model/*.test.ts
node node_modules/typescript/bin/tsc --noEmit
node ../../node_modules/eslint/bin/eslint.js api src vite.config.ts --max-warnings 0
```

통합 명령은 Nest와 Vite를 빌드한다. Nest의 실제 컴파일된 AppModule·공통 bootstrap을 사용하되 wrapper가 loopback에만 listen한다. 운영 `main.ts`를 외부 인터페이스로 실행한 검사는 아니다.

## 결과와 증거

**초기 제출 통합 검사 13개 모두 통과.** [초기 제출 JSON](../artifacts/2026-10-19T14-01-56-387Z-vuln-radar-integration.json)의 결과와 당시 실행 스크립트 해시가 일치했다. 리뷰 보완 후 현재 도구의 증거는 아래 재실행 결과를 사용한다.

| 검사                  | 관측 결과                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 프론트 번들           | 생성된 JS/CSS에 서버 API 토큰이 없었다.                                                                                                                             |
| Nest 인증·Vite 프록시 | 직접 요청의 토큰 누락·오류는 401, 브라우저가 토큰을 보내지 않는 프록시 요청은 서버 토큰 주입으로 200이었다.                                                         |
| DB 목록·상세·보조 API | feed는 database 출처·fixture 3개였다. 같은 CVE의 목록·상세 reliability가 일치했다. overview·KEV·watchlist·ingest/status는 200, 없는 상세는 404였다.                 |
| 배포 프록시 함수      | rewrite 형태의 proxyPath로 목록·상세를 연결하고 upstream 401을 보존했다. Vercel 플랫폼 자체의 검증은 아니다.                                                        |
| Overview              | 실제 6개 API의 프론트 Zod 파싱을 거쳐 개요·KEV matrix와 수동 갱신이 성공했다.                                                                                       |
| 1280px 브라우저       | 그룹 이름·키보드 선택·keyword 검색·priority/severity 교집합 빈 결과·KEV 필터·상세 클릭/reload가 성공했다.                                                           |
| 390px 브라우저        | 같은 실제 API 흐름이 성공했고 페이지 가로 넘침이 없었다.                                                                                                            |
| 백엔드 실제 중단      | 검증용 Nest만 종료했다. 배포 프록시 함수는 502/error를 반환했다. 브라우저의 60초 자동 refetch·재시도가 Vite 프록시 오류를 받아도 기존 CVE·검색어와 안내를 유지했다. |
| 최초 요청 중 장애     | 캐시 없는 별도 페이지는 전체 피드 오류 화면을 표시했다.                                                                                                             |
| DB 변경·서버 재시작   | DB fixture 제목 변경 후 Nest를 재시작했다. 재시도로 새 제목을 읽었고 검색어는 유지되며 경고는 사라졌다.                                                             |
| DB 미설정 fallback    | 실제 Nest는 mock/database_unavailable과 unknown 신뢰도를 반환했고 프론트도 MOCK 출처·목록을 표시했다.                                                               |
| 브라우저 요청         | 요청 헤더·URL에 서버 API 토큰이 없었다.                                                                                                                             |
| 브라우저 예외         | 모든 UI 흐름에서 uncaught pageerror가 없었다.                                                                                                                       |

### 데이터 대조와 화면

- alpha는 P0·KEV true·watch match·CISA advisory가 있으며 `high/71`, 최신성 fresh였다.
- beta는 핵심 근거가 없어 `low/0`이었다. missing에 kev가 있지만 keyword kev 검색에는 나타나지 않았다.
- gamma는 P1·watch match가 있으며 `low/43`이었다.
- affected·mitigation은 현재 계약상 미제공이므로 alpha도 verified가 아닌 high였다. 이 계산값을 실제 취약점 대응 근거로 일반화하지 않는다.

화면: [1280px 피드](../artifacts/2026-10-19T14-01-56-387Z-vuln-radar-feed-1280.png), [390px 피드](../artifacts/2026-10-19T14-01-56-387Z-vuln-radar-feed-390.png).

### 보조 검사와 실행 이력

- 백엔드 Jest 10개 suite·26개, 프론트 모델 6개와 저장소 도구 테스트 45개 통과. 두 앱 빌드·타입·전체 앱 영역 ESLint도 성공했다.
- 단위 테스트의 timeout·403·partial 로그는 mock 실패 시나리오다. 통합 단계의 ECONNREFUSED·502는 실제 검증용 서버 중단과 연결해 확인했다.
- [초기 9개 검사](../artifacts/2026-10-19T13-48-55-854Z-vuln-radar-integration.json): 핵심 DB·API·브라우저 연동. `.ts` 형식 경고는 이후 도구만 `.mts`로 지정해 해결했다.
- [10개 검사](../artifacts/2026-10-19T13-50-20-622Z-vuln-radar-integration.json): 번들 토큰 검사 추가.
- [11개 검사](../artifacts/2026-10-19T13-51-52-193Z-vuln-radar-integration.json): 배포 프록시 함수의 실제 upstream 호출 추가.
- [13개 검사 도입 실행](../artifacts/2026-10-19T13-54-02-394Z-vuln-radar-integration.json): Overview·uncaught 오류 검사 추가. [당시 데스크톱](../artifacts/2026-10-19T13-54-02-394Z-vuln-radar-feed-1280.png)·[모바일](../artifacts/2026-10-19T13-54-02-394Z-vuln-radar-feed-390.png) 캡처도 보존했다.
- 최종 실행: 동일 13개를 다시 통과했다. 도구의 시험용 오류 토큰을 짧게 표시해 패턴 검사 오탐을 없애고, 프론트 공개 제목·기본 경로를 검증 값으로 고정했으며 JSON을 저장소 포맷으로 출력하게 했다.
- 기존 4개 JSON은 공백·줄바꿈만 포맷 정리했다. 전후 JSON 파싱 결과의 SHA-256 4개를 대조해 측정값이 그대로임을 확인했다. 최종 변경 파일의 문서·포맷·고신뢰도 비밀정보 패턴 검사에 문제는 없었다.

모든 실행에서 백엔드·프론트·DB·임시 파일 정리 플래그가 성공했다. Docker 이름과 4310/4311 포트도 별도 조회해 잔여 실행 자원이 없는지 확인한다. 기존 사용자 서버·DB·볼륨·stash는 변경하지 않는다.

### PR #46 정리 실패 보완과 재검증

- 기준 커밋 d3c6eb9의 작업 트리에서 정리 실행기를 분리하고 2026-10-19 23:58 KST에 재실행했다. [새 JSON](../artifacts/2026-10-19T14-58-50-231Z-vuln-radar-integration.json)의 runnerSha256·cleanupRunnerSha256은 각각 제출할 도구·정리 실행기와 대조한다. 기존 artifact는 덮어쓰지 않았다.
- 통합 13개 모두 통과. browserClosed·backendStopped·frontendStopped·databaseDisconnected·databaseRemoved·temporaryFilesRemoved 6개가 true였고 cleanupErrors는 빈 배열이었다. 별도 Docker 목록과 포트 조회에도 잔여 자원이 없었다.
- 재실행 캡처: [1280px](../artifacts/2026-10-19T14-58-50-231Z-vuln-radar-feed-1280.png), [390px](../artifacts/2026-10-19T14-58-50-231Z-vuln-radar-feed-390.png). 모바일 캡처를 직접 확인했다.
- `mise exec -- pnpm test:repo`: 기존 45개 + 신규 정리 회귀 13개 = 58개 통과. 전용 tsconfig의 tsc 검사도 통과했다.
- 신규 테스트는 정리 6단계 각각의 예외 이후 나머지 시도·실제 임시 JSON 저장·최초 오류 보존·단계별 성공 플래그·오류 메시지 비밀값 제거를 확인했다. 전체 단계의 비동기 거부와 보고서 저장 실패도 별도로 확인했다.
- 실패 주입은 [정리 실행기 단위 테스트](../../../scripts/verification-cleanup.test.mts)의 콜백으로 수행했다. 실제 Docker daemon·SIGKILL·디스크 장애를 발생시킨 검증은 아니다. 전체 통합 실행은 정상 종료 정리를 확인한다.
- 오류가 없어도 보고서 저장 실패는 성공으로 처리하지 않는다. 원래 error와 cleanupErrors를 유지하고 REPORT FAIL과 실패 상태로 알린다. 기록 장치 자체가 고장 나면 파일 보존까지 보장할 수 없다.

## 한계와 후속 작업

- 외부 NVD·CISA·EPSS 수집을 실행하지 않았다. upstream의 최신 데이터·rate limit·checkpoint·장기 backfill 검증은 아니다.
- 배포 핸들러는 로컬 호출이다. 실제 Vercel rewrite·env·WAF·함수 제한·TLS·배포 CORS는 미검증이다.
- schema는 버려지는 빈 DB에 db push로 만들었다. 운영 migration·데이터 보존·장애조치 검증이 아니다.
- mock은 DB 미설정 조건으로 확인했다. 연결된 DB가 질의 도중 끊기는 상황의 fallback을 보장하지 않는다. 백엔드 프로세스 중단과 DB 질의 장애는 다른 조건이다.
- Chromium 2개 폭만 검사했다. Safari·Firefox·실기기·색 대비·접근성 전체는 미검증이다. 자동 갱신 시간은 브라우저 clock으로 진행했다.
- Docker 통합 도구는 CI에 연결하지 않았다. 정리 실행기의 독립 회귀 테스트만 기존 test:repo를 통해 CI에 포함했다. NAS·Vercel 운영 배포나 기존 배포 브랜치 변경은 하지 않았다.

다음 단계는 배포 기준·환경변수를 확인하고 승인된 환경에서 같은 SHA의 운영 smoke test를 수행하는 것이다.

## 관련 문서

- [실행·격리·복구 절차](../../runbooks/vuln-radar-local-integration-verification.md)
- [작업 기록](../../worklog/2026-10/2026-10-19-vuln-radar-integration.md)
- [피드 리뷰 보완](../../worklog/2026-10/2026-10-19-vuln-radar-feed-review.md)
- [신뢰성 정책](../../../apps/vuln-radar/docs/012_vulnerability_reliability_policy.md)
