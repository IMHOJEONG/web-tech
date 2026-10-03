# Docs 요청 생명주기 로그 정책

## 상태와 범위

- 상태: 제안
- 대상: `apps/docs`의 document·RSC·API 요청과 해당 요청에서 발생한 서버 오류
- 최종 검토: 2026-10-03
- 현재 적용: 로컬 production fixture에 요청별 계측·판정 테스트를 추가했고, 앱 코드에는 요청 ID·작업 시간·서버 오류 이벤트를 부분 반영했다. 운영 알림과 Vercel 관측 범위는 미구현·미검증이며 전체 정책을 적용한 것은 아니다. [로컬 검증](../verification/cache/2026-09-24-local-request-lifecycle.md)을 참고한다.

2026-10-03에 Proxy 발급 ID, 상세·검색 operation span과 `onRequestError` 안전 이벤트를 앱 코드에 추가했다. 전송 종료 계측과 운영 알림은 구현하지 않았다. ADR의 전체 완료/취소 판정은 여전히 제안 상태다. [측정 절차](../runbooks/docs-deployed-performance-measurement.md)의 범위와 한계를 따른다.

## 배경

`The destination stream closed early.`는 종료 현상이지 원인 분류가 아니다. 기존 대조 실험은 prefetch 취소와의 연관성을 보여줬지만 서버 오류와 브라우저 요청을 ID로 연결하지 못했다. 테스트 통과, HTTP 200, 동일 digest만으로 운영 장애를 제외할 수 없다.

현재 Better Stack 전송 대상은 remote payload schema failure다. 아래 이벤트가 이미 수집된다고 가정하지 않는다. 기존 검증 결과는 [스트림 조기 종료 조사](../verification/cache/2026-09-24-stream-cancellation.md)에 보존한다.

## 결정

### 1. 요청 단위의 상관관계

- 서버의 신뢰 가능한 진입점에서 각 HTTP 요청에 새 `requestId`를 부여한다. 브라우저가 보낸 임의 ID를 그대로 신뢰하거나 인증에 사용하지 않는다.
- 같은 URL의 prefetch, 실제 탐색, 재시도는 서로 다른 요청이다. 경로나 digest를 ID 대신 사용하지 않는다.
- 플랫폼 ID·trace ID는 관측 가능한 경우 별도 필드로 연결한다. 진입점이 다른 프로세스라면 검증된 전달 경로가 필요하며 AsyncLocalStorage만으로 연결된다고 가정하지 않는다.
- 캐시 HIT 응답의 ID가 다음 방문에 재사용되지 않도록 한다. 공유 캐시 본문·캐시 함수 결과에 요청 ID를 넣지 않는다. 응답 헤더에 노출할 경우 캐시 이후의 요청별 주입이 검증되어야 한다.
- 공유 캐시 생성이나 백그라운드 작업은 별도 `operationId`를 사용한다. 여러 요청이 공유한 실패를 최초 요청 하나의 전용 실패처럼 기록하지 않는다.

### 2. 이벤트와 필드 계약

구조화 JSON으로 `docs.request.started`, `docs.request.error`, `docs.request.finished`, `docs.request.closed`를 기록한다. 관측 불가능한 이벤트를 가짜로 생성하지 않는다. 후속 집계에서 요청별 `docs.request.summary`를 하나로 결합하며, 늦게 도착한 오류는 같은 요청의 판정을 갱신한다.

| 필드                                                       | 규칙                                                                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `schemaVersion`, `event`, `eventId`                        | 버전 1, 고정 이벤트명, 이벤트 중복 제거용 ID                                                                       |
| `requestId`, `operationId`                                 | 요청 식별자와 필요 시 공유 작업 식별자. 연결 실패는 `requestId=null`과 `correlation=unavailable`로 표시            |
| `timestamp`, `sequence`                                    | UTC ISO 시각, 같은 계측 지점·요청 내 순서. 수집 서버 도착 순서를 실행 순서로 간주하지 않음                         |
| `service`, `environment`, `deploymentId`, `observer`       | docs, development/preview/production, 배포 식별자, browser/node/platform/next-error-hook 등 관측 지점              |
| `method`, `route`, `path`, `queryPresent`                  | 라우트 템플릿 우선. 공개 문서 경로만 정규화해 허용하고 임의 경로는 마스킹. query는 존재 여부만 기록                |
| `requestKind`, `prefetch`, `prefetchEvidence`              | document/rsc/api/unknown, true/false/unknown, 판별에 사용한 헤더 이름만 기록                                       |
| `statusCode`, `headersSent`                                | 실제 관측값. 관측 전에는 null. 서버 기본값 200을 전송된 상태 코드로 기록하지 않음                                  |
| `responseFinished`, `responseClosed`, `closeBeforeFinish`  | true/false/null. null은 미관측·지원 불가이며 false와 구분                                                          |
| `transportClosed`                                          | 소켓 등 전송 계층 종료를 실제 관측한 경우만 true/false. 응답 close와 동일시하지 않음                               |
| `durationMs`, `durationScope`                              | 단조 시계로 측정한 시간과 범위(request-to-finish/request-to-close/hook-only). 시작을 모르면 null                   |
| `errorId`, `errorCategory`, `errorCode`, `digest`, `phase` | 오류 식별자, render/upstream/timeout/transport/stream/unknown, 정제한 코드, digest, headers 이전/이후/unknown      |
| `precedingErrorIds`, `errorCoverage`                       | 같은 요청에서 먼저 관측한 오류 ID 최대 8개와 계측 범위 complete/partial/unknown. 빈 배열은 오류 부재의 보장이 아님 |
| `outcome`, `reason`, `evidence`                            | 아래 판정, 고정 사유 코드, 판정에 사용한 이벤트 ID. 추측을 사실 필드에 넣지 않음                                   |

prefetch는 `next-router-prefetch`, `next-router-segment-prefetch` 등의 관측 신호로 판별한다. 헤더는 클라이언트가 조작할 수 있고 버전별 차이도 있으므로 보안 판정이나 단독 오류 무시 조건으로 사용하지 않는다. 브라우저의 resource type과 서버의 추론 결과는 관측 지점을 구분한다.

### 3. 응답 완료와 종료의 의미

Node의 `ServerResponse.finish`는 서버가 응답 데이터를 운영체제에 넘겼다는 신호이지 브라우저 수신·화면 완성의 증명이 아니다. `ServerResponse.close`는 정상 완료 뒤에도 발생할 수 있다. 따라서 `close`만으로 실패를 집계하지 않고 finish 관측 여부와 함께 판단한다. 요청 객체의 close, 응답 close, 소켓 close를 혼용하지 않는다. [Node.js HTTP 공식 문서](https://nodejs.org/docs/latest-v24.x/api/http.html#class-httpserverresponse)

HTTP 전송 결과와 콘텐츠 결과도 분리한다. 스트리밍 중 오류 화면이 200으로 완료되더라도 렌더링 오류는 유지한다. 브라우저의 본문 끝·로딩 종료·pageerror 검사는 전송 계측과 별도의 검증이다.

### 4. 판정 우선순위

| 조건                                                                                           | outcome / 수준     | 대응                                                             |
| ---------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------- |
| 같은 요청의 미복구 render 오류, 실제 5xx, 확인된 deadline 초과                                 | `failed` / error   | prefetch·취소 신호가 있어도 장애를 우선 조사                     |
| upstream 오류 후 로컬 대체 등 복구가 확인되고 응답 완료                                        | `degraded` / warn  | 원래 오류와 대체 결과를 연결. 단순 취소로 축소하지 않음          |
| 복구 가능한 오류가 있지만 완료·복구 여부가 미확인                                              | `unknown` / warn   | 추가 증거 확보 전 성공·실패 확정 보류                            |
| 완료 전 종료 + 같은 요청의 명시적 취소 증거 + 관련 오류 계측 누락 없음 + 미복구 선행 오류 없음 | `cancelled` / info | 취소 건수와 비용은 유지. 사용자 읽기 성공으로 집계하지 않음      |
| 완료 전 종료, prefetch=true이지만 취소 근거가 불충분                                           | `unknown` / warn   | `prefetch-cancellation-suspected`로 조사. 정상 취소 확정 금지    |
| finish 확인, 관련 실패 없음                                                                    | `completed` / info | 서버 전송 완료로만 해석. 이후 정상 close는 중복 실패로 세지 않음 |
| ID 연결 불가, 관측 범위 부족, 시작만 있고 종료 없음                                            | `unknown` / warn   | 로그 유실·프로세스 종료·플랫폼 timeout을 함께 확인               |

명시적 취소 증거는 계측된 앱의 abort 사유 또는 통제된 테스트에서 같은 요청에 실행한 취소다. `net::ERR_ABORTED`, 연결 reset, 시간상 가까운 화면 이동, 오류 문구만으로 사용자 의도를 확정하지 않는다. 선행 오류는 시간상 앞선 관측값이며 반드시 근본 원인인 것은 아니다. 동일 digest의 후속 스트림 오류는 원래 오류와 연결하되 삭제하지 않는다.

### 5. 수집 경계와 구현 순서

1. 로컬 production fixture에서 요청 ID, finish/close, 오류 순서, 소요 시간을 계측한다. 현재 `local-io-probe.ts`의 테스트 전용 Node 계측을 운영에 복사하지 않는다.
2. Next.js `onRequestError`로 수집 가능한 오류·경로·컨텍스트를 확인한다. 설치된 Next.js 문서의 콜백 인자에는 응답 객체가 없으므로 이것만으로 finish/close·전체 요청 시간을 측정했다고 하지 않는다. Next가 해당 스트림 오류를 이 훅으로 전달하는지도 실험한다.
3. Vercel Preview에서 제공되는 요청·실행 로그와 ID 연결 가능성을 검증한다. 앱 훅에서 보이지 않는 종료는 플랫폼 관측값으로 보완하고, 연결할 수 없으면 unknown으로 유지한다. 이를 위해 모든 페이지를 동적 렌더링하거나 스트림을 버퍼링하지 않는다.
4. 브라우저 취소 신호는 우선 E2E에서 수집한다. 운영 브라우저 수집은 별도 개인정보·비용 검토 후 도입하며 클라이언트 진술만으로 서버 오류를 무시하지 않는다.
5. 검증된 관측 범위와 누락 비율을 기록한 뒤 운영에 확대한다. custom server, Next 내부 패치, 전역 console 필터는 이번 정책의 기본 수단이 아니다.

프로세스 강제 종료 시 종료 로그를 남기지 못할 수 있다. started만 남은 요청은 해당 배포의 실행 제한과 수집 지연 허용 시간을 지난 뒤 외부 집계에서 unknown으로 분류한다. 10초 같은 고정값을 모든 환경에 적용하거나, 함수 내부 타이머로 종료 로그를 보장하려 하지 않는다.

### 6. 보안·비용·알림

- Authorization, Cookie, 토큰, 요청/응답 본문, query 값, Referer 원문, IP, 전체 User-Agent는 수집하지 않는다. 오류 객체도 그대로 직렬화하지 않고 허용 필드만 정제한다.
- 경로는 공개 콘텐츠 allowlist/라우트 템플릿 기준으로 제한한다. 알 수 없는 경로·헤더 입력의 개행과 제어 문자를 제거하고 길이를 제한한다. URL이 포함된 오류 메시지·stack의 비밀값과 사용자 입력도 제거한다.
- 이벤트는 최대 8 KiB, 오류 메시지는 512자, 정제한 stack은 4 KiB를 상한으로 하고 초과는 `truncated=true`로 표시한다. 요청별 메모리 버퍼는 최대 16개 이벤트이며 생략 수를 기록하고 종료 시 정리한다.
- 초기 검증은 대상 경로에서 전수 수집한다. 운영 초기에는 최소 started·종료 요약·error를 수집하고 비용을 확인한다. 추후 성공·확인된 취소를 샘플링하면 요청 단위로 선택하고 `sampleRate`를 기록한다. failed·degraded·unknown은 의도적으로 샘플링하지 않는다. 실제 전달 유실은 별도로 측정한다.
- 기본 출력은 서버 Runtime Logs다. 기존 Better Stack 전송 범위를 자동 확장하지 않는다. 외부 수집 도입 시 별도 개발 소스·비용 한도·전송 실패 정책을 검증한다. 로깅 실패로 원래 응답을 실패시키거나 응답 경로에 무제한 재시도·대기를 추가하지 않는다.
- 정제한 상세 로그 보관 목표는 7일, 요청 ID와 경로 원문을 제외한 집계는 30일이다. 실제 플랫폼 지원·삭제 설정은 적용 전에 확인하며 현재 보관 설정이라고 주장하지 않는다.
- 알림 초기안: production의 같은 route/reason에서 failed 5분 내 3회, unknown 조기 종료 5분 내 5회에 조사 알림. confirmed cancellation은 건수·비율을 관찰하되 단건 호출 알림은 하지 않는다. 두 값은 초기 운영 기준이며 실제 트래픽을 보고 조정한다.
- 집계 차원은 route 템플릿·배포·requestKind·outcome이다. requestId/digest를 무제한 metric label로 사용하지 않는다. prefetch와 실제 탐색의 분모를 분리하고, 계측되지 않은 요청을 성공으로 세지 않는다.

### 7. 완료 조건

| 검증 시나리오                           | 필요한 증거                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| 정상 전송 후 close                      | 완료 1건, 실패 0건, finish와 close 순서 보존                                     |
| 통제된 prefetch 취소                    | 브라우저·서버 동일 요청 연결, 종료 전후 상태, 취소 사유. 다음 document 본문 완료 |
| 원인 불명의 연결 단절                   | prefetch여도 unknown, 정상 취소로 자동 분류하지 않음                             |
| 헤더 전/후 렌더링 오류                  | 선행 error ID 보존, HTTP 200이어도 failed 유지                                   |
| upstream timeout과 로컬 복구            | upstream operation 연결, 대체 성공이면 degraded, 미복구면 failed                 |
| 동시 동일 경로·캐시 HIT·soft navigation | 요청 ID 혼선·캐시 ID 재사용 없음, 공유 오류 연결 검증                            |
| 플랫폼 강제 종료·로그 전달 실패         | 종료 이벤트 없이도 unknown 조사 가능, 원래 응답에 추가 장애 없음                 |
| 민감값·긴 입력·중복/역순 이벤트         | 비밀값 미노출, 길이 제한, eventId 중복 제거와 늦은 오류 재분류                   |

운영 수집 연결은 별도 완료 항목이다. 로컬 테스트 통과만으로 Vercel의 전체 생명주기를 관측했다고 표시하지 않는다.

## 대안과 영향

메시지 전체를 무시하면 실제 장애도 사라지고, 모든 close를 error로 처리하면 정상 종료가 장애 지표를 오염시킨다. 전면 prefetch 비활성화는 원인 관측 대신 탐색 동작을 바꾸므로 기본 해결책으로 채택하지 않는다.

요청별 구조화 로그는 비용과 구현 복잡도를 늘리지만 근거 없는 정상 판정을 피할 수 있다. 관측 범위를 명시하는 단계적 구현을 우선하며, 지연·캐시 영향이나 민감정보 유출이 확인되면 새 계측을 중지하고 기존 로그는 유지한다.

## 관련 문서

- [ADR-0008: 요청별 스트림 종료 판정](adr-0008-request-lifecycle-observability.md)
- [현재 원격 콘텐츠 관측 절차](../runbooks/docs-remote-payload-observability.md)
- [스트림 조기 종료 진단 절차](../runbooks/docs-article-rendering-regression.md#스트림-조기-종료-진단)
- [후속 구현 목록](../todo/todo.md#infra--tooling)
- [정책 수립 작업 기록](../worklog/2026-09/2026-09-24-request-lifecycle-logging-policy.md)
