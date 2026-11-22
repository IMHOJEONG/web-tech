# 검색 입력 접근성 점검과 점진적 개선안

## 대상과 조건

- 날짜: 2026-11-21 KST. 기준: `a2c6505e`와 보존한 기존 작업 트리.
- 추적: [KAN-6](https://web-tech-service.atlassian.net/browse/KAN-6). 카드 현대화의 [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)에서 이어진 독립 점검이며 두 이슈의 전체 상태는 변경하지 않는다.
- 앞선 카드 작업은 사용자 요청에 따라 소스 5개·정제 기록 6개·manifest의 12파일을 `a2c6505e`에 로컬 커밋했다. 실제 훅, 해당 커밋 범위 publication, commitlint 0문제/0경고가 통과했다. 첫 메시지의 `docs` scope 거부는 허용된 `docs-ui`로 고쳤다. 공유 목차는 카드 행만 부분 스테이징했다.
- 이번 검색 제품 코드는 변경하지 않는다. 프로젝트 스킬과 pnpx Modern Web Guidance CLI 1.0.1의 `forms`, `ime-safe-enter-submit`, `accessibility` 전문을 조회하고, ADR-0007·ADR-0031·설치된 Next 접근성 문서와 실제 소비 경로를 대조했다. 특정 검색 기능 점검이므로 legacy-scan은 실행하지 않았다.
- 실제 Next 16.4.6 개발 서버의 `/ko/docs`, `/en/docs`와 검색 Drawer를 사용했다. SSR 목록은 기존 loopback 합성 콘텐츠 서버, 자동완성의 2개·0개·503 응답은 브라우저 route 합성 응답이다. 운영 문서·인증을 사용하지 않았다.
- Chromium 151.0.7922.34·Firefox 153.0·WebKit 26.5 × 390/1280px × 한/영의 12환경. 밝은 테마·reduced-motion 설정이며 모바일 viewport는 실제 모바일 기기가 아니다.

## 재현 방법

```sh
pnpx modern-web-guidance@latest search "accessible search input" --skill-version 2026_11_10-47b4c80e
pnpx modern-web-guidance@latest retrieve forms,ime-safe-enter-submit,accessibility
pnpm publication:check --base HEAD~1
pnpm exec commitlint --from HEAD~1 --to HEAD --verbose
```

기존 `apps/docs/article-e2e/content-server.ts`를 3112의 loopback에서 실행하고 별도 3017 포트의 Next 개발 서버에 연결했다. 기존 article fixture 설정의 API·Markdown 후보 URL 모두를 해당 loopback으로 지정하고 합성 credential 모듈을 사용했다. 운영 로그 수집 변수는 비웠다. `/docs?q=fixture`로 본문 폼을 렌더하고, Drawer에는 합성 자동완성 응답을 제공했다. 임시 실행 코드·원시 로그는 저장소 밖에 보관하며 아래에는 정제 집계만 남긴다.

본문 입력의 GET action·name과 IME 차단, Drawer 열기→입력 포커스→방향키 선택→IME Enter 차단→Tab 이동→목록 방향키→Escape 복귀를 확인했다. 결과 0개는 로딩이 아니라 `0개 문서`/`0 documents`가 렌더될 때까지 기다렸다. 오류 상태와 결과 갱신 중 포커스, 명시적 전체 검색 이동도 검사했다. `isComposing=true`, `keyCode=229`, composition 이벤트는 합성이며 실제 OS IME 입력은 아니다.

## 결과와 증거

[정제 증거](../artifacts/2026-11-21-search-input-audit.json)에 소스 해시·환경·판정과 미검증 범위를 연결한다.

| 항목                     | 관측과 판정                                                                                                                                                                                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 유지: 이름               | 두 입력 모두 aria-label이 있어 이름 누락으로 분류하지 않는다. 본문은 예시 문구 `React, V8, ARIA...`, Drawer는 검색 안내 문구를 이름으로 쓴다.                                                                                                                                                 |
| 유지: IME                | 본문·Drawer의 composing/ref·native isComposing·229 방어가 있다. 12환경에서 합성 조합 Enter 차단, Drawer 조합 중 Escape 유지가 통과했다. 폐기된 keyCode라도 호환 fallback이므로 무조건 제거하지 않는다.                                                                                        |
| 유지: 포커스·이동        | 초기 입력 포커스, active descendant·선택 일치, 목록 방향키, Escape 트리거 복귀, 갱신 중 입력 포커스와 명시 검색 이동이 12환경에서 통과했다. 두 입력 높이 44px, outline solid 2px가 관측돼 포커스 소실 의심은 제외했다. 대비·클리핑·실제 모바일 확대의 적합성까지 증명한 것은 아니다.          |
| 유지: 결과 안내          | 확정된 0개·2개 결과 수와 오류에 role=status가 있다. 실제 발화·중복 발화·공지 타이밍은 스크린리더 검증이 필요하다. 상태가 없다는 결함으로 분류하지 않는다.                                                                                                                                     |
| 개선 후보 1: 포커스 모델 | Drawer input은 combobox/aria-activedescendant를 사용하면서 결과 A role=option도 tabIndex=0이고 Tab/Option-Tab으로 직접 포커스를 받는다. 입력 포커스를 유지하고 popup 자손을 Tab 순서에서 제외하는 APG combobox 모델과 다르다. 키보드 사용 불능이나 실제 스크린리더 결함을 확인한 것은 아니다. |
| 개선 후보 2: 레이블      | 두 입력에 id·연결된 label이 없다. 본문 aria-label은 입력 목적보다 검색 예시다. 명시적인 지속 레이블과 안정된 이름을 우선 제안한다. 주변 제목·검색 버튼도 있으므로 label 요소 부재만으로 WCAG 전체 실패로 판정하지 않는다.                                                                     |
| 개선 후보 3: 입력 힌트   | 두 입력의 autocorrect·autocapitalize·enterkeyhint가 명시되지 않았고 본문 spellcheck도 기본값이다. 본문 font-size는 14px, Drawer는 16px다. 가이드에 따라 힌트와 본문 16px를 검토하되 iOS 자동 확대·실제 오교정 발생은 미검증이다.                                                              |

### 오탐과 검사 보완

첫 실행은 로컬 게시 콘텐츠가 0개여서 DocsEmptyPage가 렌더되고 본문 폼을 찾지 못했다. 실제 소스의 empty-search 분기를 확인하고 기존 합성 콘텐츠 서버를 연결했다. 이는 접근성 실패 집계가 아니다. standalone 브라우저 action의 무기한 대기는 제한하고 단계별 관측을 남겼다.

처음 0개 결과는 로딩 직후에도 성립하므로 확정된 결과 수를 기다리도록 판정을 보완했다. 최종 12환경 통과만 집계한다. WebKit 링크 순차 탐색에는 macOS 기본 설정을 고려해 Option-Tab을 사용했다.

포커스 가드 직후 즉시 읽은 activeElement가 잠깐 외부를 가리켜 추가 점검했다. WebKit·390px·한국어에서 일반 Tab과 Option-Tab 각각 18회, 두 animation frame 뒤와 열린 dialog 상태를 함께 확인하자 36회 모두 dialog 안에 있었다. 안정된 배경 포커스 이탈 결함으로 분류하지 않는다. 실제 Safari·OS 설정 검증과는 구분한다.

### 제안하는 적용 순서

1. **레이블·입력 힌트 한 묶음:** 기존 GET·query·IME·제출 동작을 유지하고 두 입력의 명시 레이블/id, 목적을 나타내는 번역 이름, 자동 교정·대문자화·Enter 힌트, 본문 16px를 작은 커밋으로 적용한다. 레이블 클릭 포커스·한/영·좁은 폭·키보드·기존 검색 이동을 검증한다.
2. **포커스·의미 구조 한 묶음:** 사용자에게 필요한 결과 링크 직접 탐색을 보존할 방식을 먼저 확정한다. 현재 결과가 문서 이동 링크인 점을 고려해 일반 search input + 링크 목록으로 정리하는 안을 우선 제안한다. combobox를 유지한다면 입력 DOM 포커스 유지·popup Tab 제외 방식으로 통일해야 한다. 기존 목록 방향키·링크 기능을 무조건 없애지 않는다. ADR-0031의 현재 혼합 책임이 바뀌므로 구현 전에 결정 문서를 갱신한다.
3. **보조기술 확인:** 실제 Safari/VoiceOver·Firefox/NVDA에서 이름·선택·결과 0/다수·오류·발화를 확인한다. role=status만 보고 실제 발화 성공으로 완료 처리하지 않는다.

## 한계와 후속 작업

이번 결과는 점검과 제안이다. 검색 코드·공통 지침·의존성·ADR을 수정하지 않았다. 기존 `role=search` 폼은 이미 검색 landmark이므로 native `<search>` 교체만을 급한 결함으로 취급하지 않는다. 실제 사용자·OS IME·Safari 앱·실기기·스크린리더·forced colors·어두운 테마·확대·색상 대비·성능·운영은 미검증이다. 실제 데이터의 검색 품질·NAS 응답도 평가하지 않는다.

검색 점검 문서는 로컬 미커밋이고 카드 커밋만 완료했다. 푸시·PR·배포는 수행하지 않는다. 임시 브라우저와 이번에 시작한 서버만 종료한다.

마감 재조회에서 Jira 두 댓글의 실제 3열 표·카드 SHA·연결을 확인했다. Confluence 별도 지식 v10은 기존 본문을 보존했고 새 개념·원본 경로·공식 근거를 확인했다. 운영 댓글 v4의 상위 페이지는 65817이며 지식의 동일 상위 경로도 저장 응답에서 확인했다. 이번에 시작한 두 서버와 브라우저는 종료했다. 시작 전 2,342파일 중 의도한 기존5개·새 기록3개만 달라졌고 다른2,337개 및 검색 관련14개 해시·빈 인덱스를 보존했다. 기존5개 중 manifest·카드 worklog는 카드 커밋에 반영된 변경이다. 공통 지침의 로컬/원격 변경은 없다.

## 관련 문서

- [이번 작업 기록](../../worklog/2026-11/2026-11-21-search-input-audit.md)
- [카드 모션 검증](2026-11-21-card-hover-motion.md)
- [입력 계약 ADR-0007](../../architecture/adr-0007-search-input-contract.md)
- [Drawer ADR-0031](../../architecture/adr-0031-docs-search-drawer.md)
- [검색 경험 정책](../../architecture/docs-search-experience-policy.md)
- [WAI-ARIA APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/): Tab 순서·DOM 포커스 기준. 권장 패턴과 실제 WCAG 판정을 구분한다.
- [W3C Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html): 이름·시각적 레이블·설명을 따로 판단하는 기준.
- [W3C Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): 결과 수와 문맥 이동의 구분.
- [Apple Safari 단축키](https://support.apple.com/guide/safari/keyboard-shortcuts-and-gestures-cpsh003/mac): Option-Tab 탐색의 환경별 의미.
- [웹 현대화 판단 지식](https://web-tech-service.atlassian.net/wiki/pages/19464193#검색-접근성은-이름과-포커스-모델을-분리해-판단하기)

## 후속 적용과 검증

2026-11-21 KST에 사용자 요청으로 레이블과 입력 힌트를 적용했다. 적용 기준은 `a2c6505e`와 로컬 변경분이다. 위의 검색 코드 무수정 기록과 해시는 적용 전 점검을 설명한다.

- 본문과 Drawer 위에 한·영 검색어 레이블을 표시하고 각 입력의 `useId` 값에 연결했다. 검색 예시는 본문 placeholder로 남는다. 본문 글자 크기는 기본 환경에서 16px이다.
- 공통 검색 입력 속성으로 `enterKeyHint="search"`, `autoCorrect="off"`, `autoCapitalize="none"`, `spellCheck={false}`를 선언했다. [HTML 키보드 힌트 명세](https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-enterkeyhint-attribute)
- 제출 경로와 기존 IME 차단·Drawer 선택 동작을 회귀 확인한다. 포커스 모델은 다음 단계에서 다룬다.

실제 개발 앱을 합성 콘텐츠 서버에 연결하고 본문과 Drawer의 레이블 클릭, 입력 후 이름·레이블 유지, 동시에 렌더된 입력 ID, 키보드 힌트, 16px, 폼 넘침·IME·포커스·검색 이동을 검사했다. 대상은 390/1280px와 한/영이다. 임시 검증 코드와 원시 출력은 저장소 밖에 보관한다.

초기 검사에서 Drawer가 열린 상태의 본문을 접근성 역할로 찾으려다 실패했다. ID 비교는 DOM에서 수행하도록 수정했다. 본문에서는 CSS와 최종 검색 결과 영역이 렌더된 뒤 레이블을 검사했다. 기존 검색 이력 회귀에는 `React`에 응답하는 합성 문서를 넣어 빈 결과 화면으로 인한 초기 실패를 해결했다.

수화 전의 CSS 미적용 표본 1개를 계기로 수화가 끝난 뒤 IME를 검사하고 동일 URL 재요청도 확인했다. 최종 검사에서 본문 조합 중 Enter에 따른 문서 요청은 없었고 두 입력의 계산 글자 크기는 모두 16px였다.

합성 서버가 동작하는 동안 저장소 루트에서 기존 회귀를 다음 명령으로 실행했다.

```sh
DOCS_E2E_PORT=3017 pnpm --filter docs exec playwright test \
  e2e/shell-focus-contrast.spec.ts e2e/search-navigation.spec.ts e2e/keyboard-accessibility.spec.ts \
  --grep 'shell focus|Escape closes|searches without|native GET' \
  --project chromium-mobile --project chromium-desktop --workers 1
```

최종 Chromium·Firefox·WebKit 12환경에서 위 항목이 통과했고 브라우저 페이지 오류는 0개였다. Chromium 모바일·데스크톱의 기존 검색 이력·native GET·포커스 복귀·밝은/어두운 대비 회귀 20개와 `pnpm --filter docs typecheck`, `pnpm --filter docs lint`도 통과했다. 실제 모바일 키보드·OS IME·스크린리더는 미검증이다. [후속 적용 정제 증거](../artifacts/2026-11-21-search-input-labels.json)

## Drawer 포커스 모델 후속 점검과 제안

2026-11-21 KST, 레이블·힌트 구현과 회귀 수정 6파일을 커밋한 `f36db6de` 기준이다. Modern Web Guidance의 `accessibility`·`ime-safe-enter-submit`, Next 접근성 문서와 ADR-0031을 대조했다. 실제 앱의 한국어 `/ko/about`, 폭 390px, 합성 결과 두 개로 키보드 흐름을 확인했다. macOS WebKit에서는 링크 탐색에 Option-Tab을 사용했다.

현재 입력의 방향키는 `aria-activedescendant`를 바꾸고 DOM 포커스를 입력에 둔다. 같은 결과가 `href` 있는 앵커이지만 `role="option"`이므로 접근성 역할은 옵션이다. Tab은 실제 결과 앵커에 포커스를 주며, 결과에서 방향키로 순환하고 Enter로 문서를 열 수 있다. Escape로 닫으면 트리거에 포커스가 돌아온다. 기존 테스트에도 이 동작이 있어 개선 후에도 유지할 가치가 있다. [WAI-ARIA Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) · [WAI-ARIA Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)

Tab으로 결과 링크에 갔다가 Shift+Tab으로 입력에 돌아오면 링크의 `onFocus`가 설정한 선택이 남는다. 이 상태에서 Enter는 앞서 포커스한 문서를 연다. 결과에 포커스를 준 적 없는 입력에서 같은 Enter는 `/docs?q=fixture`로 간다. 사용자가 보고 있는 포커스 위치는 같은데 탐색 이력에 따라 Enter 목적지가 달라진다.

Chromium·Firefox·WebKit 세 엔진에서 모두 위 키보드 동작을 관측했다. WebKit에서는 개발용 스택 프레임 요청 오류가 나서 최초 무오류 조건을 통과하지 못했다. 최종 실행은 키보드 판정과 개발 진단을 따로 기록했고 WebKit 진단 1건이 남았다. 실제 Safari 앱과 스크린리더의 동작은 미검증이다. [정제 관측값](../artifacts/2026-11-21-drawer-focus-model.json)

**권장안은 기존 모달 안의 검색 폼과 문서 링크 목록이다.** 결과의 기능은 검색어 선택이 아니라 문서 이동이다. 목록의 `<ul><li><a href>` 역할을 유지하면 Tab 순서와 보조기술의 링크 탐색을 한 구조로 제공할 수 있다. 표준 combobox로 통일하는 대안은 가상 선택을 유지하지만 팝업 자손을 Tab 순서에서 빼므로 결과 링크를 직접 탐색한다는 요구에 맞지 않는다. [WAI-ARIA Link](https://www.w3.org/WAI/ARIA/apg/patterns/link/) · [WAI-ARIA Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

| 키 또는 사건  | 권장 동작                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Tab·Shift+Tab | Drawer 안의 컨트롤과 각 결과 링크를 DOM 순서대로 탐색한다. 결과 링크에 별도 양수 tabindex를 주지 않는다.                                  |
| 입력의 ↓·↑    | 현재 검색어의 결과가 있으면 첫·마지막 실제 링크로 포커스를 옮긴다. 빈 결과·로딩·오류·IME 조합과 수정 키 조합에서는 기본 동작을 유지한다.  |
| 결과의 ↓·↑    | 실제 링크 간 이동과 처음·끝 순환을 유지한다. 포커스된 항목이 내부 스크롤 영역에 보이도록 한다.                                            |
| Enter         | 입력에서는 전체 검색을 제출하고, 결과에서는 포커스된 링크를 기본 동작으로 연다. 새 탭·컨텍스트 메뉴의 기존 링크 동작도 검증한다.          |
| Escape        | 기존 Sheet의 닫기·트리거 복귀를 사용한다. IME 조합 중에는 닫기를 미루며, 링크 이동 후 목적지 포커스는 별도로 확인한다.                    |
| 비동기 갱신   | 현재 포커스된 링크가 없어질 때만 입력으로 복귀한다. 입력 중인 사용자에게 결과가 도착해도 포커스를 옮기지 않고 결과 수·오류 상태를 알린다. |

적용 시 입력의 combobox 관계와 공유 선택 상태를 제거하고, 현재 결과 링크를 기준으로 초점 이동을 구현한다. DOM 포커스 표시를 활용하고 검색 결과·추천어·오류 재시도는 기존 UI로 유지한다. 한국어·영어와 세 엔진에서 0·1·여러 결과, 늦은 응답, 왕복 Tab 후 Enter, 목록 순환, 새 탭, IME, 모달 경계 및 링크 목적지를 확인한다. 스크린리더에서 링크로 탐색하는 실기기 검증을 추가한다. 동작 계약이 바뀌므로 코드와 ADR-0031을 함께 검토한다. 이번 점검은 제안 단계다.

## 실제 링크 포커스 적용과 회귀

2026-11-21 KST에 `f36db6de` 기준 작업 트리에 ADR-0035 초안의 실제 링크 포커스 모델을 적용했다. 검색 입력은 `type="search"`와 기존 폼 제출을 사용하고, 결과는 기본 링크를 담은 목록이다. 입력에서 위·아래 방향키는 실제 마지막·첫 링크를 포커스하고 링크 사이의 위·아래 이동은 순환한다. 수식 키와 조합 중인 입력은 가로채지 않는다. Tab·Shift+Tab은 기본 순서로 이동한다.

링크 Enter는 문서를 열고 입력 Enter는 항상 전체 검색으로 이동한다. 검색 결과가 제거돼 해당 링크의 포커스가 사라졌을 때만 검색 입력으로 복구한다. Sheet가 조합 중 Escape에 따른 닫기 요청을 받으면 취소한다.

| 검사                     | 관측 결과                                                                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chromium 모바일·데스크톱 | 대상 검색·Drawer·키보드·헤더·대비 회귀 63개 통과, 기존 화면 폭 조건 1개 건너뜀.                                                                                         |
| Firefox·WebKit 390px     | 각 엔진에서 Tab 왕복 뒤 전체 검색, 방향키 실제 포커스·순환, 문서 이동과 Escape 복귀 확인. 두 엔진의 22조건에서 초기 실패한 Firefox 합성 IME 1조건을 보완 후 재검증했다. |
| 세 엔진 합성 IME 재검사  | 3개 통과. 조합 중 Enter·Escape, 링크 제거 시 복귀와 조합 제한·재열기를 확인했다.                                                                                        |
| 로컬 프로덕션 빌드       | 한국어·영어 헤더 검색 2개 통과. 합성 원격 본문 검색, 전체 결과와 링크 이동을 확인했다.                                                                                  |

Firefox의 Playwright `fill()`이 자체 조합을 생성하고 끝내는 이벤트를 추적했다. 테스트에서 값 변경과 조합 업데이트 이벤트를 명시적으로 보내고 Escape 전후의 Drawer 열림 상태를 확인했다. 이 검사 실패를 실제 사용자 IME 결함으로 분류하지 않는다. macOS WebKit은 Option-Tab으로 순차 탐색했다.

초기 넓은 Chromium 실행에서는 합성 앱에 원본 로컬 MDX가 없어 로컬 글 구조 4개와 글꼴 변경 뒤 본문 제목 검증 2개가 통과하지 못했다. 영어 검색 이력의 시간 초과 1건은 최종 검색 회귀에서 통과했다. 별도의 headless Chromium 새 탭 확인은 팝업 이벤트 시간 초과로 판정하지 못했다. 실제 Safari 앱·OS IME·스크린리더·컨텍스트 메뉴는 미검증이다.

`pnpm --filter docs typecheck`와 `pnpm --filter docs lint`가 통과했다. 로컬 프로덕션 테스트는 `pnpm --filter docs test:article:prod article-e2e/body-search-navigation.spec.ts --grep 'user search:.*header' --project article-desktop --workers 1`로 실행했다. [검증 집계와 구현 파일 해시](../artifacts/2026-11-21-drawer-link-focus.json)

## 실제 Safari와 VoiceOver 점검

2026-11-21 KST에 Drawer 구현·회귀 11파일을 `bbe6acae`에 로컬 커밋했다. 검증 자료의 SHA-256과 소스가 일치했고 실제 커밋 훅과 커밋 범위 검사가 통과했다. macOS 26.6.2 및 Safari 26.6.2에서 동일 커밋의 로컬 앱을 열었다. `/ko/about`에서 Drawer를 열고 합성 검색어 `fixture`를 입력했다.

Safari 접근성 트리의 결과 3개가 Web·UI/UX·Mobile 문서 링크로 노출됐다. 검색 입력에서 아래 방향키를 한 번 누르면 첫 링크, 한 번 더 누르면 두 번째 링크가 실제 포커스를 받았다. 두 번째 링크에서 Enter를 눌러 UI/UX 문서 상세로 이동한 URL과 제목을 확인했다. 이 관측 범위는 Safari의 링크 역할·키보드 포커스·링크 활성화다.

시스템 설정에서 VoiceOver 스위치를 켜고 `on` 표시를 확인했다. 앱 자동 입력으로 보낸 `Control+Option+U`는 로터를 열지 않고 Safari 입력에 제어 문자를 전달했다. 검색어는 바로 복구했다. VoiceOver 제어 표면 조회도 시간 초과됐다. 물리 키보드로 로터 조작을 요청했으나 최종 관측까지 로터 메뉴·커서·발화를 확인하지 못했다. 테스트 탭을 닫고 VoiceOver 스위치가 시작 전과 같은 `off`임을 재확인했다. [Apple VoiceOver 로터 사용법](https://support.apple.com/guide/voiceover/voiceover-rotor-mchlp2719/mac) · [정제 관측 증거](../artifacts/2026-11-21-drawer-safari-voiceover.json)

### VoiceOver 재검증

같은 커밋의 실제 Safari에서 한국어 `fixture` 검색 결과 세 개를 열었다. VoiceOver 유틸리티에서 시작 환영 창과 발화 자막 패널이 켜진 설정을 확인했다. 시스템 설정에서 VoiceOver를 켜면 실행 앱 목록에 `com.apple.VoiceOver`가 나타났으나 자동 도구로 환영 창을 조회하는 단계는 시간 초과됐다. [Apple VoiceOver 시작 및 환영 창 안내](https://support.apple.com/guide/voiceover/turn-voiceover-on-or-off-vo2682/mac)

사용자는 물리 키보드로 로터를 열었을 때 `윈도우 스팟` 범주가 표시됐으며 그 안에서 항목을 선택하지 않았다고 확인했다. 같은 시도 중 Safari에서 `Taxonomy fixture mobile` 상세 URL도 관측했다. 이 URL은 이동 경로를 확인할 수 없어 로터 링크 활성화의 검증 근거에서 제외했다. 테스트 탭을 닫고 VoiceOver 스위치를 초기 `off`로 복구했다.

같은 커밋의 Safari에 `fixture` 결과 세 개를 다시 준비했다. 로터에서 `←`·`→`로 `링크` 범주를 선택하고 `↑`·`↓`로 결과를 찾는 물리 키보드 조작을 요청했다. [Apple VoiceOver 로터와 활성화 안내](https://support.apple.com/en-euro/guide/voiceover/vo4be8816d70/10/mac/27)

사용자가 제공한 Safari 캡처에서 UI/UX 결과 카드에 포커스 테두리가 보였고 VoiceOver 자막은 `방문함, 링크, UI/UX Taxonomy fixture ui-ux Synthetic canonical channel regression document.`를 표시했다. UI/UX 결과 한 건의 제목·링크 역할 발화는 자막 기준 통과다. 캡처에는 로터 `링크` 목록과 문서 상세가 보이지 않아 로터를 통한 항목 탐색과 VoiceOver 명령으로 링크 열기는 확인 대기다. [자막 전사와 관측 범위](../artifacts/2026-11-21-drawer-safari-voiceover.json)

### 로터 링크 탐색과 문서 열기 확인

`bbe6acae`의 로컬 Safari에서 사용자가 VoiceOver 로터 탐색과 링크 열기 순서를 수행했다고 확인했다. 제공된 사진의 `링크` 범주에 Web·UI/UX·Mobile 합성 문서, 추가 결과 두 개와 `전체 검색 결과 보기`가 표시됐다. Web 결과에 선택 강조가 보였다.

조작 후 Safari 창 제목, 주소, 상세 본문의 첫 제목에서 `Taxonomy fixture mobile`을 확인했다. 로터 목록은 사진, 링크 열기 조작은 사용자 보고, 상세 도착은 Safari 직접 관측으로 확인했다. 이 결과와 앞선 UI/UX 자막을 근거로 Drawer의 로터 탐색·링크 열기와 UI/UX 결과 한 건의 발화를 통과로 판정했다. [정제 증거](../artifacts/2026-11-21-drawer-safari-voiceover.json)
