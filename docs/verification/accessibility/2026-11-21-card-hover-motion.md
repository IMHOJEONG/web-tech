# 카드 hover 모션의 동작 줄이기 대응

## 대상과 조건

- 날짜: 2026-11-21 KST. 대상: docs 앱에서 소비 중인 카드 5곳.
- 기준: `082fcb6f`와 기존 작업 트리. 앞선 현대화 코드는 `545428a4`, 정제 기록은 `082fcb6f`에 로컬 커밋했고 실제 훅·두 커밋 범위 publication/commitlint를 검사한다. 푸시·배포는 별도다.
- 추적: [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83). 한 번에 한 주제씩 진행하는 후속 작업으로 카드 hover 이동·확대만 변경한다.
- 가이드: 프로젝트 Modern Web Guidance 스킬과 pnpx CLI 1.0.1의 `motion` 검색·조회를 실제 실행했다. 기존 모션·Base UI 결정과 Next 로컬 접근성 문서를 확인했다.
- 조건: 실제 소스에서 추출한 클래스와 앱 CSS를 컴파일한 합성 링크 DOM. React 서버 컴포넌트·번역·Next Link의 전체 라우트 검증과 구분한다.

## 재현 방법

```sh
pnpx modern-web-guidance@latest search "respect reduced motion" --skill-version 2026_11_10-47b4c80e
pnpx modern-web-guidance@latest retrieve motion
pnpm --filter docs typecheck
pnpm --filter docs lint
```

편집 전 5개 원본을 임시 위치에 보존했다. 원본/수정본의 실제 className 또는 imageClassName을 각각 추출하고 설치된 PostCSS·Tailwind로 `apps/docs/app/css/global.css`를 컴파일한다. 같은 CSS에 이전 클래스도 포함해 변경 전후를 비교한다.

Chromium·Firefox·WebKit, 390/768/1280px, light/dark, normal/reduce의 조합에서 각 카드의 hover 전후 위치·크기를 측정한다. 정상 모션은 이전과 같고 reduce에서는 이동/확대가 없어야 한다. hover 색상·테두리·배경과 키보드 포커스·Enter fragment 이동은 유지돼야 한다. finite CSS 애니메이션 종료를 기다리고 스크롤 후 같은 좌표 기준으로 비교한다.

## 결과와 증거

### 변경 범위

| 소비 경로             | 변경                                                             |
| --------------------- | ---------------------------------------------------------------- |
| category 문서 카드    | hover 위 이동을 `motion-safe:hover`로 제한                       |
| hub의 MainCard 썸네일 | group-hover 확대와 transition/duration을 모두 motion-safe로 제한 |
| docs-index 분류 카드  | hover 위 이동만 조건부로 변경, 기존 reveal·스타일 계약 유지      |
| 본문 이전/다음 카드   | 이동·공간 전환을 조건부로 변경하고 기본 색상 전환·포커스 유지    |
| 본문 관련 글 카드     | 이동·공간 전환을 조건부로 변경하고 기본 색상 전환·포커스 유지    |

현재 소비 경로가 없는 HeroSection 예시는 이번에 수정하지 않는다. 공용 `.ds-card`의 스타일·데이터·번역·링크 목적지·페이지 구조는 바꾸지 않는다. 전환을 끄는 것만으로 hover의 위치 변화가 없어지지 않으므로 효과 값 자체를 조건부로 만들었다.

타입·린트와 브라우저 최종 결과는 [정제 증거](../artifacts/2026-11-21-card-hover-motion.json)에 기록한다. 최초 합성 fixture는 docs-index의 실제 grid 부모를 누락해 inline 링크에서 이동이 발생하지 않았다. 실제 grid-item 문맥을 반영해 검증 입력을 고쳤으며 이 실패를 제품 실패로 집계하지 않는다. 판정 조건은 유지한다. 첫 링크에서 역방향 Tab으로 브라우저 영역을 거치는 순서는 명시적 시작 버튼의 순차 탐색으로 바꿨다. 이 macOS WebKit 환경은 링크 탐색에 Option-Tab을 사용했고 포커스·Enter 검사는 그대로 유지했다. [Apple Safari 단축키 안내](https://support.apple.com/guide/safari/keyboard-shortcuts-and-gestures-cpsh003/mac)를 근거로 삼으며 실제 Safari 앱 검증으로 확대하지 않는다.

본문 카드 두 곳은 reduce의 기본 전환을 transition-colors로 한정하고 no-preference에서만 일반 transition을 허용한다. hover 중 설정을 바꾸는 경우에도 공간 전환이 남지 않도록 하며 색상 피드백은 유지한다.

## 한계와 후속 작업

- 최종 브라우저 비교는 통과했다. 실제 라우트·실기기와 다음 주제의 적용은 별도다.
- 합성 DOM 검증은 실제 콘텐츠·번역·라우팅·모바일 터치·스크린리더·운영 검증을 대체하지 않는다. Playwright WebKit은 실제 Safari 앱·실기기와 다르다.
- 이번 후속 변경은 로컬 작업이다. 앞선 두 커밋의 완료와 새 카드 변경의 커밋 상태를 구분하며 새 코드를 자동 푸시·배포하지 않는다.
- 구조·공용 컴포넌트 책임이 바뀌지 않아 새 ADR·라이브러리·공통 지침 변경은 필요하지 않다.

## 최종 관측 요약

| 검사               | 결과                          | 범위                                                          |
| ------------------ | ----------------------------- | ------------------------------------------------------------- |
| docs 타입·린트     | 통과                          | 최종 5개 소스의 실제 소비 타입 포함                           |
| 기존 작업 두 커밋  | 통과                          | 실제 훅과 HEAD~2 범위 publication·commitlint 0문제/0경고      |
| CSS 변경 전후      | 72페이지·180개 카드 비교 통과 | 세 엔진 × 세 폭 × 두 테마 × normal/reduce × 5카드, 전후 2실행 |
| 일반 모션          | 90개 비교 동일                | 기존 이동·확대 수치 보존                                      |
| 동작 줄이기        | 90개 비교에서 이동/확대 없음  | 색상·테두리·배경·포커스와 Enter 이동 180개 비교 보존          |
| hover 중 설정 변경 | 90조건 통과                   | 두 프레임 뒤 공간 이동/확대가 남지 않음                       |
| 클라이언트 예외    | 0개                           | 합성 CSS/링크 DOM 범위                                        |

이 결과는 Chromium 151.0.7922.34·Firefox 153.0·WebKit 26.5에서 얻었다. 초기 fixture·탐색 키 실패와 최종 통과를 합산하지 않는다. 임시 harness와 원시 출력은 저장소 밖에 두고 정제 요약·최종 소스 해시만 artifact에 남긴다. 별도의 영구 테스트 파일은 추가하지 않았다.

마감 시 소스5·문서6의 선택 11파일 포맷·diff, 작업 트리 view의 문서6개 검증이 통과했고 문서 오류는 0개다. 기존 파일 중 의도한 변경8개와 새 기록3개만 다르며 나머지2,331개·HEAD·빈 인덱스는 보존했다. 앞선 커밋의 publication/commitlint 성공을 새 미커밋 자료의 공개 승인으로 간주하지 않는다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-21-card-hover-motion.md)
- [이전 현대화 감사·적용](2026-11-21-frontend-modernization-audit.md)
- [모션 정책](../../architecture/docs-motion-interaction-policy.md)
- [브라우저·기기 QA](../../runbooks/docs-responsive-browser-device-checklist.md)
- [웹 현대화 판단 지식](https://web-tech-service.atlassian.net/wiki/pages/19464193)

## 기록과 지식 연결

[현대화 지식 v9](https://web-tech-service.atlassian.net/wiki/pages/19464193#호버-움직임은-전환과-효과-값을-함께-제한하기)에 전환과 효과 값을 구분하는 개념·프로젝트 사례·판단 기준·주의점·원본 경로를 보완했다. 원래 본문 보존과 새 근거·상위 운영 안내 경로를 재조회했다. 기존 운영 댓글은 v3로 갱신했으며 읽기 응답의 장식용 heading id가 저장 형식에서 거부된 첫 시도와 정규 HTML 복구를 구분한다. 새 지식 페이지·공통 지침·ADR은 추가하지 않았다.
