# Feed 상호작용 반응 시간과 IME 대조 진단

## 대상과 조건

2026-11-25 KST. 기준bf316ae1과 기존 계획4파일, 실제 Vuln Radar 프로덕션 빌드다. 제품 소스·의존성·라우팅·300ms debounce는 바꾸지 않았다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)의 첫 번째 P1 진단이며 두 번째 CSP Preview는 실행하지 않았다.

Chromium151.0.7922.34에서390/1280×850px·CPU1/4배·각5회, 새 context20개에서5동작씩100동작을 측정했다. 브라우저 버전의 정확한 관측값은 [정제 artifact](../artifacts/2026-11-25-feed-interaction-latency.json)가 원본이다. API는 합성50건·페이지당25개, 응답 지연80ms다. 교체 취소용 요청만1200ms로 보류했다. static은 gzip/no-cache, API는 no-store, 외부 요청은 차단했다. 실제 backend/CDN·실기기 측정이 아니다.

## 재현 방법

루트 의존성과 Playwright 세 엔진을 준비한다. 새 출력 폴더로 빌드하고 검사기를 실행한다.

```sh
pnpm --filter vuln-radar exec vp build --outDir /private/tmp/web-tech-inp-baseline/dist
node scripts/verify-feed-interaction-latency.mjs /private/tmp/web-tech-inp-baseline/dist --pilot
node scripts/verify-feed-interaction-latency.mjs /private/tmp/web-tech-inp-baseline/dist
node scripts/verify-feed-interaction-latency.mjs /private/tmp/web-tech-inp-baseline/dist --functional
pnpm --filter vuln-radar test:lib
```

수정 전 빌드의 functional 실행은 IME 불일치2건으로 exit1을 반환했다. 수정본 실행 결과는 아래 후속 검증에서 확인한다.

측정은 영어 키 입력·우선순위P1 클릭·다음 페이지·한국어 텍스트 삽입·보류 요청 교체를 차례로 실행한다. 입력 캡처 시각·Resource Timing·Event Timing·LoAF를 분리한다. 결과 준비는 예상 카드 제목 DOM 변경 후 두 animation frame의 시각이며 실제 paint timestamp가 아니다. Event Timing은 최소16ms·8ms 단위이며 interactionId가 있는 항목만 집계한다. 직접 텍스트 삽입/fill의 해당 항목 부재는 N/A다.

관측기 작동은 별도 페이지의80ms 작업이 Event Timing과 LoAF에 잡히는지 대조했다. 전체 JS profiler나 운영 RUM은 추가하지 않았다. style/layout 개별 필드가 없으면 combined 값만 남기고 미지원·미관측을0ms로 채우지 않았다.

MWG CLI1.0.2로 diagnose interaction latency를 검색해 identify-inp-causes·identify-heavy-scripts·performance를 조회했다. 새 스킬 버전 안내는 적용하지 않았다. 오프라인 CLI 캐시 미스와 후속 도구 다운로드를 앱 의존성 설치로 보고하지 않는다.

## 결과와 증거

### 반응과 검색 완료를 분리한 기준선

표의 준비 시간은 조건당5회 중앙값, Event Timing은 해당 조건에서 노출된 항목의 최대값이다. 서로 다른 의미의 지표다.

| 폭 / CPU   | 마지막 영어 입력→결과 준비 ms | 마지막 입력→요청 ms | 필터 클릭→준비 ms | 페이지 클릭→준비 ms | Event Timing 최대 ms | LoAF 수 / blocking 최대 ms |
| ---------- | ----------------------------- | ------------------- | ----------------- | ------------------- | -------------------- | -------------------------- |
| 390 / 1배  | 417.6                         | 304.7               | 106.4             | 103.9               | 56                   | 0 / N/A                    |
| 390 / 4배  | 441.9                         | 310.2               | 155.3             | 148.6               | 88                   | 6 / 22.8                   |
| 1280 / 1배 | 411.0                         | 304.2               | 133.6             | 119.8               | 80                   | 0 / N/A                    |
| 1280 / 4배 | 446.0                         | 309.4               | 169.0             | 189.6               | 104                  | 15 / 26.1                  |

전체 검색 동작의 마지막 입력→요청 중앙값은 CPU1배304~306ms,4배310~313ms 범위였다. 의도한300ms debounce와 합성 API80ms가 검색 완료 시간의 큰 부분이다. 빠른 연속 입력과 결과 준비를 같은 INP 값으로 부르지 않는다.

관측된 이벤트의 최대 input delay9.1ms·processing31.1ms였다. 필터 클릭의 presentation 근사 최대97.1ms는 양자화된 Event Timing에서 구한 근사값이다. 4배 CPU에서 필터16개·페이지5개의50ms 이상 프레임이 관측됐고 blocking 최대26.1ms였다. 응답 후 필터 결과 준비 중앙값은1배24.5ms·4배57.9ms였다. 별도 style/layout 필드가 없으므로 특정 CSS·React 함수·날짜 포매터를 원인으로 단정하지 않는다.

**판단:** 이 표본에서200ms 이상 Event Timing 항목은 관측되지 않았다. 필드 INP 통과나 모든 사용자 환경의 반응성을 입증한 것은 아니다. debounce 단축·memo·Worker·content-visibility를 즉시 적용할 근거는 충분하지 않다. 현재 성능 코드는 유지하고 반복적인 갱신 비용은 후속 관측 대상으로 남긴다.

### 기능 회귀와 IME 불일치

Chromium·Firefox·WebKit × 두 폭의6환경에서 URL/현재 결과·0건·필터/페이지·보류 요청 취소·25개 결과 링크 연속 키보드 탐색이 통과했다. 총150개 링크 도달이며 사용자150명 표본이 아니다. pageerror0, 기존 lib36개도 통과했다.

Chromium의 두 폭에서는 CDP로 조합 후보 보 →400ms대기→보안→확정을 전달했을 때 예상2글자 대신5글자 중복 문자열이 입력·검색 URL에 반영됐다. 조합 중간 요청도 관측됐다. 같은 CDP 시퀀스의 일반 native input과 같은 React 버전의 최소 controlled input은 모두 예상값이었다. 따라서 이 실험에서는 단순한 프로토콜 전반 실패로 제외하지 않고 **Feed 통합 경로의 자동화 IME 회귀2건**으로 남긴다. functional exit1은 이 불일치 때문이다. 실제 macOS 한글 입력기·Firefox/WebKit 조합·물리 키보드는 미검증이다.

소스의 경로는 input onChange → onFiltersChange → navigate(search) → URL의 query로 controlled value 재공급이다. 이 경로와 조합 상태의 충돌을 우선 의심하지만 정확한 취소 지점을 계측으로 확정한 결과는 아니다. 일반 영어 입력·한국어 텍스트 삽입의 성공과 조합 입력의 성공은 다르다.

초기 파일럿의 MetaOrControl 키 표기 오류와 전체 article29개(요약4+결과25) 선택자 오류는 검사기에서 바로잡았다. 이 둘은 제품 결함으로 집계하지 않는다. IME의 첫 기대값 timeout은 native/React 대조 후 실패로 유지했다. 측정20환경과 기능6환경을 병렬 실행하지 않았다.

## 한계와 후속 작업

- 합성 입력·API·소수 반복의 로컬 결과이며 필드 INP·실서비스 성능·정상 사용자 분포가 아니다. 4배 CPU는 특정 실기기 모델이 아니다.
- DOM+두 frame 준비 시각은 paint의 대용 관측이며 polling 완료 시각을 지표로 쓰지 않았다. Event Timing 부재는0ms가 아니며 LoAF에는 지원 차이와50ms 문턱이 있다.
- 개선안은 [후속 계획](../../todo/modern-web-guidance.md#1-p1--feed-상호작용-비용-진단)에 제시했다. 권장 다음 변경은 조합 중 로컬 draft를 동기 유지하고 확정 때 query에 반영하는 입력 모델이다. 제품에는 적용하지 않았다.
- 적용 시 debounce300ms·요청 취소·IME 취소/blur·URL 직접 진입/뒤로 가기·필터/페이지·0건·150개 링크 도달을 다시 검사한다. 개선 효과는 같은 기준선으로 비교한다.
- 테스트 서버·브라우저는 종료했다. 원시 타임라인은 저장소 밖에 두고 artifact에는 집계와 제한된 숫자 표본·소스/번들/검사기 해시만 남겼다. 측정 후 기능 모드의 대조/실패 기록을 보완해 검사기 실행별 해시를 구분했다. 커밋·푸시·배포·CSP 설정 변경은 없다.

## 관련 문서

- [실행 계획](../../todo/modern-web-guidance.md)
- [작업 기록](../../worklog/2026-11/2026-11-25-feed-interaction-latency.md)
- [이전 요청 취소 검증](../integration/2026-11-22-feed-request-cancellation.md)
- [W3C Event Timing 편집 초안](https://w3c.github.io/event-timing/): 관측 문턱·반올림·지연 구분. 진행 중인 명세로 확인했다.
- [Chrome LoAF](https://developer.chrome.com/docs/web-platform/long-animation-frames)
- [web.dev INP 진단](https://web.dev/articles/optimize-inp)
- [CDP Input](https://chromedevtools.github.io/devtools-protocol/tot/Input/): 실험적 조합 입력 API.

## 후속 제품 수정 검증

2026-11-25 KST, bf316ae1과 로컬 수정 기준. Feed는 조합 중 DOM 입력값을 로컬 상태에 즉시 반영하고, 브라우저의 `compositionend`에서 전체 입력값을 검색 상태에 반영한다. 탐색으로 URL 검색어가 바뀌면 새 값을 표시한다. 검색 확정 이후 기존300ms 대기와 요청 취소가 이어진다. 포커스 이탈 때 Chromium이 조합을 자동 확정한 경우에도 최종 입력값을 반영한다.

위 재현 명령의 빌드 출력 폴더를 새 경로로 바꿔 수정본을 검증했다. Chromium 두 폭에서 400ms간 조합을 유지해도 URL이 그대로였고 API 요청은0회였다. 확정 후 입력·URL·결과가 ‘보안’으로 일치했으며 확정 요청은 각각1회였다. 조합 취소는 이전 검색어로 돌아갔고 새 요청은0회였다. 필터로 포커스를 이동하며 브라우저가 확정한 검색어를 확인하고, Space로 필터를 적용해 검색어와 조건이 함께 반영되는 것을 확인했다.

세 엔진·두 폭6환경에서 영어·한국어 입력, 연속 검색의 이전 요청 취소, 필터·페이지·0건, URL 직접 진입 후 검색어/필터/페이지가 다른 이력으로 뒤로 가기, 결과 링크 순서25개씩을 확인했다. [수정본 정제 증거](../artifacts/2026-11-25-feed-ime-fix.json)와 [후속 작업 기록](../../worklog/2026-11/2026-11-25-feed-ime-fix.md)을 연결한다. 앞 절과 기존 artifact는 수정 전 기준선이다.

좁은 폭에서는 조합 중 필터를 포인터로 한 번에 누르는 경로에 추가 문제가 있었다. 버튼에서 pointerdown이 시작됐으나 조합 확정과 결과 갱신 사이에 위치가 바뀌어 pointerup은 다른 요소에 도착했다. 탐색의 스크롤 초기화만 끄는 대조로는 해결되지 않았다. 결과 갱신 중 화면 높이와 포인터 동작은 후속 과제로 보존한다. 실제 OS 입력기와 Firefox/WebKit의 조합 이벤트는 미검증이다.

- [React 제어 입력](https://react.dev/reference/react-dom/components/input)
- [W3C 조합 이벤트](https://www.w3.org/TR/uievents/#events-compositionevents)
