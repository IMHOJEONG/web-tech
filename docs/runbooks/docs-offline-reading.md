# Docs 오프라인 저장과 네트워크 장애 점검

## 목적과 준비 조건

인터넷이 없는 상태에서 **미리 직접 저장한 공개 글**을 읽고 삭제하는 절차다. 인터넷이 연결된 HTTPS 사이트 또는 localhost, Service Worker·CacheStorage를 허용한 브라우저가 필요하다. 알림 권한과 로그인은 필요하지 않다. 글 저장은 서버/NAS 콘텐츠를 수정하지 않는다.

## 실행 순서

1. 공개 글 본문 끝의 ‘오프라인 저장’을 누른다. 성공 안내 또는 누락 이미지 수를 확인한다. 버튼이 있다는 사실만으로 저장이 끝난 것은 아니다. 본문이 로딩 중이라는 안내가 나오면 내용 표시 후 다시 누른다. 로딩 placeholder는 저장하지 않는다.
2. ‘저장한 글’을 열어 목록을 확인한다. 같은 출처의 `/offline.html?lang=ko`를 북마크하면 전체 인터넷 차단 후에도 접근할 수 있다.
3. DevTools Network를 Offline으로 바꾸거나 연결을 끊는다. 저장한 글 목록에서 제목을 누른다. 또는 저장한 상세 주소를 직접 열거나 새로고침한다. Next 앱 안의 모든 클라이언트 링크 이동이 오프라인으로 보장되는 것은 아니다.
4. 저장본 안내·본문·코드·저장 시각을 확인한다. 이미지는 빠질 수 있다. 저장하지 않은 글 주소를 직접 열면 저장한 글 목록이 나타난다.
5. 다시 온라인으로 바꾼다. 최신 내용이 필요하면 원문을 열고 ‘저장본 업데이트’를 누른다. 자동 동기화하지 않는다.
6. 저장소에서 글별 삭제 또는 ‘전체 삭제’를 누른다. 전체 삭제는 확인창을 승인해야 실행된다.

저장소는 브라우저 프로필별로 분리된다. 시크릿 모드, 다른 기기, `localhost`와 `127.0.0.1`, Preview와 Production 사이에는 공유되지 않는다.

### 자동 회귀 검사

저장소 루트에서 프로젝트 Node.js 24를 사용한다. 포트 3018과 앱의 Next 개발 캐시를 사용하므로 같은 앱의 dev/build를 동시에 실행하지 않는다. Playwright가 개발 서버를 시작하고 종료한다. 외부 콘텐츠 API와 푸시는 테스트 환경에서 비활성화한다.

```bash
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs test:offline
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter docs lint
```

production도 같은 브라우저 검사를 실행할 수 있다. 먼저 원격 콘텐츠를 끈 상태로 빌드한 후 아래 명령을 실행한다. 기존 dev/start와 동시에 실행하지 않는다.

```bash
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false BLOG_CONTENT_API_BASE_URL= BLOG_CONTENT_API_BASE_URL_INTERNAL= BLOG_CONTENT_API_BASE_URL_PUBLIC= BLOG_PUSH_ENABLED=false mise exec -- pnpm --filter docs build
NODE_ENV=production mise exec -- pnpm --filter docs test:offline
```

최초 환경은 `pnpm --filter docs exec playwright install chromium`이 필요할 수 있다. CI는 독립 `Docs Offline Reading` job에서 `test:offline`을 실행하고 기존 lib job에서 네트워크·Worker 단위 검사를 실행한다.

### CI 보고서와 실패 trace 확인

오프라인 job은 list·JSON·HTML 보고서를 만들고 실패한 테스트의 trace를 유지한다. 업로드 설정은 로컬 작업 트리에 추가한 상태이며, 실제 GitHub 업로드는 커밋·푸시 후 같은 head의 실행에서 확인해야 한다.

위 미커밋 표기는 최초 로컬 작성 시점이다. 이후 승인된 커밋·푸시의 최종 원격 결과는 [검증 기록](../verification/resilience/2026-10-22-navigation-evidence-retention.md)과 연결된 PR·KAN-22에서 확인한다.

- 보고서: `apps/docs/playwright-report/offline/`, `apps/docs/test-results/offline-report/results.json`.
- 실패 trace·에러 문맥: `apps/docs/test-results/offline/`. 통과한 테스트의 trace가 없는 것은 정상이다.
- artifact: `docs-offline-<run ID>-<attempt>`, 7일 보관. 테스트 실패 후에도 업로드하며 취소·runner 종료·job timeout에서는 보관을 보장하지 않는다. 테스트 시작 전에 실패해 결과가 없으면 경고만 남긴다.
- 전체 작업 폴더나 환경 파일은 업로드하지 않는다. 다만 trace 자체에는 DOM·네트워크 정보가 포함될 수 있으므로 실제 토큰·로그인 세션·비공개 글을 테스트에 주입하지 않는다. 공개 저장소 artifact를 비밀 저장소로 취급하지 않는다.

GitHub Actions 실행 화면의 Artifacts에서 내려받거나 다음 명령을 사용한다. 아래 `RUN_ID`는 실제 실행 번호로 교체한다. 재실행이면 `ATTEMPT`도 바꾼다.

```bash
RUN_ID=실제_실행_번호
ATTEMPT=1
gh api "repos/IMHOJEONG/web-tech/actions/runs/${RUN_ID}/artifacts" --jq '.artifacts[] | {name, expired, expires_at}'
gh run download "$RUN_ID" --repo IMHOJEONG/web-tech --name "docs-offline-${RUN_ID}-${ATTEMPT}" --dir "/tmp/docs-offline-${RUN_ID}"
mise exec -- pnpm --filter docs exec playwright show-report "/tmp/docs-offline-${RUN_ID}/playwright-report/offline"
```

HTML 보고서에서 테스트의 Attachments → `offline-article-navigation` JSON을 확인한다. 실패 항목의 trace도 열 수 있으며 CLI에서는 `playwright show-trace <trace.zip 경로>`를 사용한다. 만료·업로드 실패·취소로 artifact가 없다면 당시 원인을 사후 확정하지 않고, 재실행 결과는 별도 실행 ID로 기록한다.

정상 회귀는 실패 trace가 없어야 하므로 CI는 별도 `verify:offline-evidence` 단계에서 보관 probe를 실행한다. 이 명령은 공개 정적 fixture의 지정 실패만 인정하며 누락·다른 오류를 무시하지 않는다. 제품 회귀 실패를 성공으로 바꾸지 않는다.

- `test-results/offline-report/results.json`: 제품 회귀 결과.
- `test-results/offline-report/retention-probe.json`: 의도적으로 실패시킨 하위 검사 결과. 이 파일의 지정 실패 1건은 제품 회귀 실패가 아니다.
- `test-results/offline-report/retention-probe-summary.json`: 상위 검증 성공 여부와 trace 경로·크기·SHA-256.
- `test-results/offline/retention-probe/`: 실제 실패 trace ZIP.
- `playwright-report/offline/retention-probe/`: probe HTML. 실행 전 이 probe의 이전 결과만 삭제하며 제품 보고서는 보존한다.

서버를 시작하지 않고 probe만 확인하려면 `mise exec -- pnpm --filter docs verify:offline-evidence`를 실행한다. Chromium과 `unzip`이 필요하며 제품 `.next`·NAS·실제 인증 정보를 사용하지 않는다.

### 이동 계측 해석

`offline-article-navigation` schema v2는 목적지 pathname과 허용한 플래그·상태만 수집한다. query·전체 헤더·쿠키·응답 본문은 이 JSON에 저장하지 않는다.

| 항목                            | 의미                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `request`                       | 요청 발생. `requestId`, resource type, RSC/prefetch 여부로 연결                    |
| `response-headers`              | 응답 상태·헤더 수신. 본문 완료나 렌더 완료는 아님                                  |
| `response-finished`             | 같은 ID 요청의 응답 본문 수신 완료. HTTP 503도 이 이벤트가 생길 수 있음            |
| `request-failed`                | HTTP 오류 상태와 구분되는 네트워크 요청 실패                                       |
| `url-committed`, `body-visible` | URL·본문 검사에서 확인된 시점. 정확한 paint 시각은 아님                            |
| `pendingRequestIds`             | 측정 종료 시 아직 완료/실패 이벤트를 관측하지 못한 요청. 실패로 자동 단정하지 않음 |
| `nprogress.samples`             | `<html>`의 busy 초기값·변화·최종값. 같은 task의 on/off도 보존                      |
| `nprogress.status=unavailable`  | 문서 교체나 페이지 종료 등으로 관측기를 읽지 못함. 가짜 false로 바꾸지 않음        |

네트워크·URL·본문의 `ms`는 Node monotonic clock, busy 표본은 브라우저 monotonic clock을 기준으로 한다. `progressInstallation`의 시작/종료 범위로 설치 구간을 확인할 수 있지만 두 clock의 값을 정확한 동일 시각으로 빼지 않는다. 이벤트와 busy 표본은 각각 100개로 제한하며 초과 수를 표시한다.

본문이 먼저 보이는 스트리밍을 막지 않도록 모든 응답 종료나 busy 해제를 추가로 기다리지 않는다. 끝나지 않은 응답은 pending으로 남긴다. 이 계측은 UI 완료 판정을 대신하지 않고 기존 HTTP 오류·동일 문서·본문 검사를 유지한다. 캐시된 이동은 새 RSC 요청이 없을 수도 있다.

## 기대 결과

- 저장 전에는 글 본문을 자동 보관하지 않는다. 저장 성공 뒤에만 저장한 글 목록에 나타난다.
- 연결 오류·HTTP 오류에 대한 원격 콘텐츠 자동 retry는 없다. 서버의 헤더·본문이 지연되면 deadline 이후 로컬로 대체한다. 원격 전용 글의 실제 오류는 오류 UI를 유지한다.
- 카드 이미지가 실패하면 로컬 대체 이미지, 그것도 실패하면 동일 영역의 배경으로 끝난다. 카드 제목·링크는 계속 동작하며 무한 재요청하지 않는다.
- 네트워크 전체 차단 후에도 저장본과 reader 자원만으로 글을 읽고 삭제할 수 있다. 정상 서버 404와 연결 실패는 구분한다.
- 저장 실패·공간 한도는 성공으로 표시하지 않는다. 기존 저장본을 먼저 지우지 않는다.

## 실패 대응과 복구

- 2026-10-31 추가 진단은 로컬 수정 상태다. 아래 새 안내·코드는 해당 변경의 배포 후 사용할 수 있으며 기존 운영의 공통 실패 안내만으로 원인을 단정하지 않는다.
- 글의 실패 안내 아래 **오류 자세히**를 열면 오류 코드와 실패 단계가 나온다. 같은 값은 status 요소의 `data-offline-error-code`, `data-offline-error-stage`에서도 확인한다. 코드·단계만 공유하고 저장한 본문·원시 오류·쿠키·브라우저 프로필은 업로드하지 않는다.
- 브라우저 저장소·Worker 내부 오류는 Vercel 서버 로그만으로 알 수 없다. 이번 진단은 UI에만 표시하며 원시 예외 출력·새 수집 API·자동 telemetry를 추가하지 않는다.

| 코드/단계                                                   | 의미와 다음 행동                                                                                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `registration` / `registration`                             | Worker 등록을 완료하지 못함. HTTPS·스크립트 응답·연결을 확인한다. 이것만으로 저장 용량 문제라고 판단하지 않는다.                                                    |
| `activation`, `activation-timeout` / `activation`           | 첫 Worker의 활성화 실패 또는 8초 내 미완료. 다른 블로그 탭을 닫고 새로고침해 확인한다. 이미 사용 가능한 active Worker가 있으면 대기 중 업데이트 때문에 막지 않는다. |
| `worker-unavailable` / `registration`                       | 동작할 active Worker가 없음. 새로고침 후 재시도하며 등록 상태를 확인한다.                                                                                           |
| `message-timeout` / `message`                               | 8초 내 결과 응답이 없음. 저장이 실제로 실패했다고 확정할 수 없으므로 ‘저장한 글’을 먼저 확인한다. 자동 저장 재시도나 전체 캐시 삭제는 하지 않는다.                  |
| `message-send`, `message-invalid` / `message`               | 메시지 전송 또는 응답 형식 확인 실패. 원시 메시지를 노출하지 않고 새로고침 후 확인한다.                                                                             |
| `storage-denied`                                            | 브라우저가 해당 단계의 접근을 거부함. 사이트 저장 설정·보안 확장 프로그램을 확인한다. 일반 Chrome에서도 발생할 수 있으며 시크릿 모드로 단정하지 않는다.             |
| `storage-quota` / `storage-write`                           | 저장소 쓰기 용량 부족. 필요 없는 저장본을 개별 정리한 뒤 재시도한다.                                                                                                |
| `storage` / `storage-open`, `storage-read`, `storage-write` | 저장소 열기·읽기·쓰기 중 실패. 표시된 단계로 조사 범위를 좁힌다.                                                                                                    |
| 모든 코드 / `storage-confirmation`                          | 쓰기는 끝났지만 목록으로 결과를 확인하지 못함. 저장본이 바뀌었을 수 있으므로 ‘저장한 글’을 먼저 확인한다.                                                           |
| `source`, `path` / `validation`                             | 현재 공개 글과 저장 대상 경로가 맞지 않음. 원문 주소에서 재시도하고 경로 검증을 우회하지 않는다.                                                                    |
| `loading`, `snapshot`, `size` / `snapshot`                  | 본문 로딩 중·스냅샷 생성 실패·본문 크기 초과. 본문 완료 후 재시도하거나 온라인에서 읽는다.                                                                          |

- 저장 실패의 대조 순서: 동일 글·브라우저 종류·일반/보호 모드·기존 프로필과 새 격리 프로필을 구분한다. 새 프로필의 성공은 사용자 기존 프로필의 권한·Worker·확장 프로그램 상태가 정상이라는 증거가 아니다. 원문 서버 장애와 브라우저 오프라인도 서로 다른 원인이다.
- `context-timeout` / `source-check`: 요청한 탭이 1.5초 안에 현재 글 주소를 확인하지 못했다. 페이지를 한 번 새로고침한 뒤 재시도한다. 구형 탭에는 새 listener가 없을 수 있다. `source`가 `source-check`에서 발생하면 응답한 글 주소와 저장 대상이 달랐다는 의미다. [SPA 문맥 확인 결정](../architecture/adr-0026-offline-spa-article-context.md)을 따른다.
- Feed→글 이동과 직접 URL 진입을 따로 확인한다. `WindowClient.url`은 SPA 이동 뒤에도 최초 Feed URL일 수 있다. 이 값만 보고 저장 권한 문제로 판단하거나 출처 검증을 삭제하지 않는다. 같은 탭 새로고침은 진단 대조이며 저장본·사이트 데이터를 지우는 절차가 아니다.
- 10개 한도: 목록에서 불필요한 저장본을 지운 뒤 다시 저장한다. 공간 부족은 브라우저가 앱 한도 이전에 거부할 수도 있다.
- 저장본 누락: 출처·프로필과 사이트 데이터 삭제 여부를 확인한다. 서버 백업에서 복구하는 기능은 없으므로 온라인 원문에서 다시 저장한다.
- Worker 설치 실패: `/push-sw.js`와 `/offline-worker.js`가 JS로 응답하는지, reader 파일 3개가 같은 출처에서 200인지, CSP가 같은 출처 연결을 허용하는지 확인한다.
- 오래된 저장본: 오류가 아니라 명시적 갱신 정책이다. 원문에서 업데이트한다. 원문이 삭제·비공개가 되어도 기존 저장본을 원격 회수할 수는 없다.
- 앱 기능을 되돌릴 때는 저장 UI와 오프라인 확장을 제거한 동일 URL의 Worker를 배포하는 방식을 검토한다. `/push-sw.js`를 임의로 unregister하면 푸시 구독에도 영향을 줄 수 있다. 모든 출처 캐시를 일괄 삭제하지 않는다. 개발 점검에서 글만 정리할 때는 reader의 삭제 기능을 사용한다.

## 관련 검증

- [10-31 운영 대조와 저장 실패 진단](../verification/resilience/2026-10-31-offline-save-diagnostics.md)
- [CI 증거 보관·이동 계측 회귀](../verification/resilience/2026-10-22-navigation-evidence-retention.md)
- [실제 실행 결과와 한계](../verification/resilience/2026-10-17-content-network-offline.md)
- [저장·보안 경계 결정](../architecture/adr-0015-explicit-offline-article-snapshots.md)
