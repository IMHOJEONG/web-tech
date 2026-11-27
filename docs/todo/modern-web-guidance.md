# Modern Web Guidance 후속 실행 계획

## 상태와 범위

- 검토일: 2026-11-25 KST.
- 기준: PR111의 main 병합b841d21a에서 이어진 로컬 수집기402e2970·HTTPS 호환bf316ae1. 두 후속 커밋은 미푸시·미배포다.
- 대상: docs·Vuln Radar·공통 프런트엔드 경계. 진행 상태의 원본은 [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83), 이 문서는 작업 선택·완료 기준의 저장소 원본이다.
- 원칙: 한 주제씩 조사 → 재현·측정 → 개선안 설명 → 승인 범위의 구현 → 회귀·문서 → 커밋 순으로 진행한다. 이 계획 작성으로 제품 변경·의존성 추가·배포·방화벽 변경을 실행하지 않는다.

**첫 번째 P1 진단과 Feed 조합 입력 수정이 로컬에 적용됐다.** 실제 OS IME와 좁은 화면의 동시 포인터 동작은 후속 확인에 남겼다.

## 이미 끝낸 일과 보류한 실험

| 항목                                                                        | 현재 판단과 근거                                                                                                                                                                                                                               | 다시 시작할 조건                                                                                  |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 카드/버튼/Skeleton 모션, 검색 레이블·Drawer 포커스, Feed 상태·페이지 포커스 | PR111 범위에서 적용·검증했다. 이전 결과를 이번 실행으로 재집계하지 않는다. [감사·후속](../verification/accessibility/2026-11-21-frontend-modernization-audit.md), [검색 검증](../verification/accessibility/2026-11-21-search-input-audit.md). | 구체적인 회귀가 있을 때. VoiceOver 후속은 사용자 요청으로 생략 유지.                              |
| 본문 이미지 크기·lazy·sizes                                                 | 로컬 MDX 및 합성 브라우저 검증을 완료했다. [이미지 보고서](../verification/performance/2026-11-22-docs-article-images.md).                                                                                                                     | 실제 Next 프로덕션 최적화 응답·출력 추적·전체 페이지 CWV를 확인할 때.                             |
| 한글 Noto Sans KR·로딩                                                      | 사용자 선택으로 유지한다. 라이선스·부분집합·한글 표시와 LCP/CLS 비교를 마쳤다. [폰트 보고서](../verification/performance/2026-11-22-docs-noto-sans-kr.md).                                                                                     | 실제 페이지의 폰트 전환 CLS가 확인될 때 fallback 보정을 비교한다. 다른 폰트로 재교체하지 않는다.  |
| Feed 요청 취소                                                              | signal 전달·타임아웃/호출자 취소 분리 적용과 회귀를 마쳤다. [취소 검증](../verification/integration/2026-11-22-feed-request-cancellation.md).                                                                                                  | 늦은 응답·불필요 재요청 등 구체적 회귀가 확인될 때.                                               |
| 화면별 JavaScript 분리                                                      | 초기 전송 감소와 추가 waterfall을 비교해 현재 후보를 적용 보류했다. [실험](../verification/performance/2026-11-22-vuln-radar-route-splitting.md).                                                                                              | 실제 번들·의존성 증가 또는 초기 JS 병목이 재현될 때. 기존 import를 단순히 lazy로 바꾸지 않는다.   |
| 화면 밖 카드 렌더링                                                         | 25개 목록에서 절약이 작고 스크롤 비용이 증가해 보류했다. [실험](../verification/performance/2026-11-22-feed-offscreen-rendering.md).                                                                                                           | 카드 무게·목록 길이·실사용 패턴이 달라질 때. content-visibility 부재 자체를 결함으로 보지 않는다. |
| 보안 헤더·jitless·정제 CSP 수집기                                           | 로컬 커밋·검증 완료. [수집기](../verification/security/2026-11-24-csp-report-collector.md), [HTTPS 재검증](../verification/security/2026-11-25-csp-https-delivery.md).                                                                         | 실제 Preview 라우팅·플랫폼 준비 확인 후 Report-Only 연결. enforcement는 별도 결정.                |

## 우선순위와 완료 조건

### 1. P1 — Feed 상호작용 비용 진단

2026-11-25 진단 완료·제품 수정 로컬 반영. 관측 Event Timing은 최대104ms였고 검색 완료 시간에는300ms debounce와 합성 API80ms가 크게 반영됐다. 수정 전 Chromium 조합 시험의 두 폭에서 중복 입력을 재현했다. [20환경 기준선과 IME 대조 결과](../verification/performance/2026-11-25-feed-interaction-latency.md).

조합 중 로컬 입력을 동기 유지하고 브라우저 확정 시 검색어를 반영했다. Chromium 확정·취소와 세 엔진 링크/검색 회귀를 확인했다. 실제 OS 입력기와 좁은 화면에서 조합 확정과 필터 포인터 클릭이 겹치는 경로가 남았다. [후속 제품 수정 검증](../verification/performance/2026-11-25-feed-interaction-latency.md#후속-제품-수정-검증).

관련 가이드: identify-inp-causes·identify-heavy-scripts·performance. 현재 코드의 검색300ms debounce, URL 상태 변경, Query placeholder와 취소, 25개 카드 렌더링은 존재 사실이며 병목 판정이 아니다. 조사 시작점은 [FeedPage](../../apps/vuln-radar/src/pages/feed/ui/feed-page.tsx), [필터](../../apps/vuln-radar/src/pages/feed/ui/feed-filter-bar.tsx), [라우터](../../apps/vuln-radar/src/app/router/create-app-router.tsx)다.

- 실제 프로덕션 빌드와 합성 API에서 한/영 입력·IME 확정·필터 토글·페이지 이동·연속 검색을 실행한다. 네트워크 대기·300ms debounce·입력 이벤트부터 다음 paint·결과 표시 시간을 따로 기록한다.
- Chromium에서 Event Timing과 지원되는 Long Animation Frames로 input delay·processing·presentation을 분리한다. LoAF 미지원은 N/A로 기록하며0ms로 채우지 않는다. Firefox/WebKit은 기능·키보드·검색/페이지/취소 회귀를 별도로 검사한다.
- 초기 기준안은 두 폭390/1280px·일반/CPU4배·조건당5회로 계획한다. 동일 합성 데이터·cache·네트워크 조건을 고정하고 원시 trace는 저장소 밖에 둔다. 실제 실행하지 않은 표본은 결과 표에 채우지 않는다.
- 완료 조건: 지연이 어느 단계에 있는지 근거와 함께 설명하고, 병목이 없으면 코드 유지로 끝낸다. 병목이 있으면 가장 작은 변경 한 가지를 제안하고 기준/후보를 교대로 비교한다. 결과 정확성·취소·URL·IME·연속 링크 탐색을 유지한다.
- 한계: 합성 이벤트나 화면 준비 시간을 필드 INP로 부르지 않는다. RUM 수집기·분석 SDK·URL/검색어 전송은 이 진단 범위에 추가하지 않는다.

### 2. P1 — CSP Preview 전달과 플랫폼 준비

관련 가이드: security. [수집기 runbook](../runbooks/csp-report-collector.md)·[ADR0038](../architecture/adr-0038-csp-report-collector.md)을 따른다.

- 완료 조건: 검증할 head와 배포 범위를 확정하고 두 앱 Preview에서 exact /api/csp-report POST가 HTML rewrite 없이204를 반환하는지 확인한다. 공개 CA HTTPS에서 report-to와 legacy native 전달·정제 로그·오류/413/429 경계를 확인한다.
- 플랫폼 ingress·동시성·access log의 정보 보관과 앱/환경별 규칙을 조회한다. 리전별 WAF와 인스턴스 메모리 제한을 정확한 전역 예산으로 합치지 않는다. 비대화형 보고에는 challenge를 쓰지 않는다.
- 그 후 Report-Only 헤더 연결안을 제안하고 실제 관측 범위·중단 조건을 정한다. 원시 URL·코드 sample을 수집하거나 정책을 자동 강화하지 않는다.
- 의존 조건: 현재 로컬 후속은 미푸시다. 푸시·원격 Preview·유료 자원·방화벽 쓰기·운영 변경은 이번 문서 정리에서 실행하지 않는다. 이 조건이 대기 중이어도1번 로컬 성능 진단은 진행할 수 있다.

### 3. P2 — 실제 Next 페이지의 이미지·폰트 CWV 마감

관련 가이드: optimize-image-priority·visually-stable-font-fallbacks·performance.

- 한/영 본문, 이미지/이미지 없는 글, 두 폭의 실제 프로덕션 렌더에서 LCP 요소·폰트 첫 표시/전환·이미지 최적화 응답·출력 파일 추적을 확인한다. 동일 cache/CPU/네트워크로 반복한다.
- 완료 조건: 합성 컴포넌트 관측과 전체 페이지 LCP/최대 session-window CLS를 분리한 보고서, 소스/빌드 기준, 재현 명령과 한계가 있다. fallback 줄 수 변화가 CLS의 원인으로 확인된 경우에만 보정 후보를 비교한다.
- Noto Sans KR·라이선스 고지는 유지한다. LCP 요소를 확인하기 전 preload나 fetchPriority를 추가하지 않는다.

### 4. P2 — 초기 JavaScript와 외부 스크립트 비용 재평가

관련 가이드: identify-heavy-scripts·optimize-script-priority·performance.

- 초기 자원별 압축 전송·평가 시간·long frame·실제 사용 경로를 측정한다. 앱 코드와 분석/개발 전용 스크립트를 구분한다.
- 완료 조건: 비용이 재현된 의존성/기능만 후보로 삼고 초기 화면·후속 이동·선로딩·실패 복구의 손익을 비교한다. 이전 lazy route/화면 밖 렌더링 보류안을 근거 없이 재적용하지 않는다.
- 분석 기능의 제거·동의 정책 변경·새 수집 SDK 도입은 독립적인 범위 결정이 필요하다.

## 매 작업 착수와 마감

착수할 때 해당 주제의 Modern Web Guidance를 검색·조회하고 현재 설치 문서·실제 소비 경로·Baseline/fallback을 다시 확인한다. 이번 계획은 이미 설치된 로컬 가이드와 저장소의 기존 검증을 대조했으며 최신 원격 CLI·지원표를 새로 조회한 결과는 아니다. 향후 착수 시 API가 달라졌다면 계획도 갱신한다.

자동 legacy-scan은 기존 감사에서 전체 가이드의 약20%만 검사했다. 그때0건이었다는 사실은 전체 현대화 완료가 아니다. 원본51개 미커밋 작업은 이번 계획/커밋에 포함하지 않는다. 각 주제는 Jira 기존 이슈를 먼저 찾고, 검증·worklog와 지식 승격 판단을 남긴다. 새 구조·데이터 흐름·공개 계약 결정이 있을 때만 ADR을 검토한다.

## 관련 문서

- [최초 감사](../verification/accessibility/2026-11-21-frontend-modernization-audit.md)
- [이번 계획 작성 기록](../worklog/2026-11/2026-11-25-modern-web-next-plan.md)
- [Confluence 현대화 판단](https://web-tech-service.atlassian.net/wiki/pages/19464193)
- [web.dev INP 진단·최적화](https://web.dev/articles/optimize-inp): 필드/실험실 관측과 지연 단계 분리 기준.
- [PerformanceObserver 지원 entry 검사](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver/supportedEntryTypes_static): 미지원 지표를 관측값과 구분하는 기준.
- [일반 프로젝트 백로그](todo.md)
