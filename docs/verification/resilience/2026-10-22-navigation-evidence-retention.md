# CI 증거 보관과 문서 이동 계측 검증

## 대상과 조건

- 날짜: 2026-10-22 KST. 기준 head `5f2f699f6398d70a06de33b3a952947657b0a1ba`와 이번 미커밋 변경, Jira KAN-22.
- 범위: Docs Offline Reading job·이동 헬퍼·계측 회귀. 앱 UI·본문·번역·의존성·NAS는 변경하지 않았다.
- 환경: macOS arm64, Node 24.12.0, pnpm 11.10.0, Playwright 1.62.1·Chromium 151.0.7922.34 headless. 1280×800·390×844, worker 1·retry 0.
- 기존 작업 트리의 `.next`·실제 환경 파일을 건드리지 않기 위해 tracked HEAD와 이번 테스트 변경만 임시 복사본에 옮겼다. 원격 콘텐츠·푸시는 껐으며 의존성은 기존 캐시에서 offline frozen 설치했다.

이 문서의 미커밋·원격 미검증은 최초 로컬 결과의 상태다. 이후 사용자 승인으로 커밋·푸시와 새 head의 CI artifact 확인을 진행하며, 최종 실행·보관·다운로드 증거는 연결된 PR #53·KAN-22·Confluence에 기록한다. 과거 수치를 새 head의 결과로 바꾸지 않는다.

## 재현 방법

루트에서 Node 24와 Playwright Chromium을 준비한다. 브라우저 검사는 앱의 개발 캐시를 쓰므로 실제 작업과 병행하지 말고 환경 파일 없는 격리 복사본에서 실행한다. 실행·다운로드 절차와 이벤트 해석은 [운영 절차](../../runbooks/docs-offline-reading.md#ci-보고서와-실패-trace-확인)에 유지한다.

```bash
mise exec -- node --experimental-strip-types --test scripts/*.test.mjs scripts/*.test.mts
mise exec -- pnpm --filter docs exec playwright test --config=playwright.offline.config.ts
mise exec -- pnpm --filter docs exec playwright test --config=playwright.offline.config.ts navigation-observer.spec.ts --repeat-each=3
mise exec -- pnpm --filter docs exec tsc --noEmit --incremental false
mise exec -- pnpm --filter docs verify:offline-evidence
mise exec -- pnpm --filter docs exec eslint offline-e2e/article-navigation.ts offline-e2e/article-navigation.spec.ts offline-e2e/navigation-observer.ts offline-e2e/navigation-observer.spec.ts playwright.offline.config.ts --max-warnings 0
```

## 결과와 증거

| 검사                           | 결과              | 근거                                                                 |
| ------------------------------ | ----------------- | -------------------------------------------------------------------- |
| 전체 오프라인                  | 34개 통과, 51.6초 | 기존 22개·새 계측 12개, skip/flaky/retry 0                           |
| 계측 6종×두 화면×3회           | 36개 통과, 13.2초 | busy·스트림·503·연결 단절·pending·문서 교체                          |
| 저장소 계약                    | 64개 통과         | 업로드 조건·SHA 고정·경로·보관 기간·reporter·retry/timeout 유지 포함 |
| 앱 TypeScript·변경 파일 ESLint | 통과              | 타입 오류·lint 경고 없음                                             |
| 의도적 실패 보관 probe         | 예상대로 exit 1   | JSON·HTML·이동 첨부·5,540,575바이트 trace ZIP 생성. `unzip -t` 통과  |
| 새 원격 CI·업로드·다운로드     | 최초 시점 미검증  | 후속 승인 후 새 head 결과는 PR·KAN-22에서 확인                       |

실행 시간·대표 관측·보관 probe·소스 해시는 [선별 증거](../artifacts/2026-10-22-navigation-evidence-retention.json)에 보관한다. 의도적 실패는 임시 복사본에만 둔 테스트에서 정상 상세 이동 후 존재하지 않는 속성을 100ms 검사한 것이다. 실제 기능 회귀가 아니며 실패용 테스트는 저장소에 추가하지 않았다.

보관 probe는 당시 임시 파일이 있는 격리 복사본에서 아래 명령으로 실행했다. 저장소에는 이 파일이 없으므로 일반 회귀 명령으로 복사해 쓰지 않는다. 정상 `openArticleFromCard` 직후 `[data-offline-content]`에 없는 `data-deliberately-missing="never"` 속성을 100ms 검사해 의도적으로 실패시켰으며, `retain-on-failure`와 실제 reporter 설정은 바꾸지 않았다.

```bash
mise exec -- pnpm --filter docs exec playwright test --config=playwright.offline.config.ts expected-failure-upload-probe.spec.ts --project=offline-desktop
# 출력된 trace.zip에 대해 unzip -t 실행: 압축 데이터 오류 없음 확인
```

실제 Link 지연 대조군 desktop 표본은 Node clock 기준 요청 62.95ms → 헤더 200 수신 7408.01ms → 본문 수신 완료 7424.65ms → URL 확인 7449.61ms → 본문 검사 완료 7520.36ms였다. browser clock의 busy 표본은 initial false → change true → change false → final false였다. 정상 응답 전달을 의도적으로 보류한 대조군이며 평상시 속도나 원래 CI 지연의 재현 수치가 아니다.

### 원격 보관 확인용 격리 probe

후속 요청에서 정상 CI도 실제 실패 trace를 업로드·다운로드해 확인할 수 있도록 `evidence-fixtures/trace-retention.spec.ts`와 별도 config·harness를 추가했다. 이 fixture는 기존 `offline-e2e`나 제품 suite가 발견하지 않으며 Next 서버·NAS·외부 HTTP·로그인 세션을 쓰지 않는다. 공개 정적 DOM에서 지정 문구 불일치를 일으킨다.

`verify:offline-evidence`는 하위 Playwright의 exit 1·정확히 한 개의 지정 오류·retry 0·새 JSON/HTML·이동 첨부·유효 ZIP이 모두 맞을 때만 성공한다. 예상과 다른 오류·정상 통과·브라우저 시작 실패·보고서 누락은 상위 명령도 실패한다. 실행 전 자신의 이전 출력만 제거하므로 이전 보고서 재사용으로 통과하지 않는다. `continue-on-error`로 제품 실패를 무시하지 않으며 제품 34개 결과와 probe 결과는 다른 파일에 둔다.

이 후속 도구도 로컬에서 통과했다. 브라우저 경로를 비워 실행 실패를 만든 음성 대조군은 지정 실패로 인정하지 않고 상위 exit 1로 거부했다. 이후 정상 probe를 다시 실행해 새 trace·보고서를 확인했다. 결과와 새 소스 해시는 artifact의 `followUpProbeLocal`에서 초기 5.5MB probe와 구분한다.

새 회귀는 짧은 busy on/off와 관측기 정리, 헤더/본문 수신 분리·요청 ID와 RSC/prefetch 연결, HTTP 503 수신 완료, 연결 단절, 측정 종료 시 pending, 문서 교체 시 unavailable을 검사한다. 기존 정상 RSC 지연 대조군은 실제 Link에서 busy 변화·본문 수신 완료를 추가 확인한다.

초기 격리 실행은 pnpm의 자동 설치 확인과 외부 node_modules symlink를 거부한 Turbopack 때문에 테스트 시작 전에 실패했다. 원본은 변경하지 않고 임시 복사본에 의존성을 offline 설치한 뒤 실제 34개를 실행했다. 단독 TypeScript 검사의 NodeNext 옵션도 앱의 Bundler 해석과 맞지 않아 수정했으며, 비공개 Page 메서드 사용은 제거했다. 이 준비 오류를 서비스 장애로 분류하지 않는다.

## 한계와 후속 작업

### PR 리뷰 후 본문 완료 판정 보강

리뷰에서 컨테이너가 Suspense fallback만 있어도 보인다는 지적을 실제 상세 구조와 대조했다. 이동 헬퍼와 공개 검색 도구 모두 placeholder가 없어지고 본문에 공백 이외의 텍스트가 있을 때만 완료로 기록하도록 보강했다. 이전 관측은 wrapper 표시를 확인한 것이며 당시 본문 완료·paint까지 소급해 증명하지 않는다. 검색 버튼 선택자 충돌 원인과는 별도 검사 공백이다.

로딩 wrapper와 빈 wrapper만으로 완료되지 않는 합성 대조군을 두 화면에 추가했다. 격리된 전체 제품 38개(59.5초)와 실제 공개 검색·상세 4개(ko/en·1280/390px)가 통과했고 변경 타입/lint도 통과했다. 새 결과·소스 해시는 artifact의 `bodyReadinessReview`에 보관한다.

첫 새 원격 CI `39698192407`(head `6db191a`)은 Chromium 다운로드에서 CDN 인증서 호스트 불일치로 테스트 시작 전에 실패했다. 업로드 단계는 실행됐지만 생성된 보고서가 없어 artifact 0개였다. 이 단계 성공을 보관 성공으로 간주하지 않으며 TLS 검증을 끄지 않았다. 리뷰 보완을 포함한 새 head에서 CI·다운로드를 다시 확인한다.

- 최초 검증은 로컬 미커밋 상태였다. 후속 커밋의 원격 CI에서 업로드 성공·artifact ID·만료일·다운로드를 별도로 확인하고 PR·KAN-22에 연결한다. 이전 PR #53 CI의 성공을 이번 변경의 검증으로 대신하지 않는다.
- 10-21 실패 CI는 artifact 0개여서 당시 RSC 지연 원인을 복원하지 못한다. 이번 계측은 이후 실패의 증거를 보존하는 작업이다.
- `response-finished`는 브라우저 수신 완료이며 서버 작업 완료·React paint·전체 스트림 무장애를 증명하지 않는다. busy와 수신 종료 어느 하나만으로 성공/장애를 판정하지 않는다.
- 정상 본문을 모든 supplementary stream 종료까지 막지 않는다. 측정 종료 시 pending 또는 busy=true가 남을 수 있으며 마지막 상태를 그대로 기록한다.
- 두 clock은 따로 해석하고 설치 구간을 함께 본다. 성능 SLO나 정확한 cross-process 지연으로 일반화하지 않는다.
- trace는 DOM·요청 정보를 담을 수 있다. 공개 fixture만 사용하며 7일 보관·결과 폴더 allowlist·숨김 파일 제외로 범위를 제한한다. 이 설정이 trace 내부 비밀값을 자동 제거하는 것은 아니다.
- 취소·runner 강제 종료·timeout에서는 업로드가 실행되지 않을 수 있다. 아직 다른 브라우저 job 전체에 보관 정책을 확장하지 않았다.

## 관련 문서

- [기존 실패 원인 조사](2026-10-21-kan22-offline-navigation.md)
- [작업 기록](../../worklog/2026-10/2026-10-22-navigation-evidence-retention.md)
- [Playwright 요청 이벤트 의미](https://playwright.dev/docs/api/class-request)
- [공식 artifact action](https://github.com/actions/upload-artifact)
