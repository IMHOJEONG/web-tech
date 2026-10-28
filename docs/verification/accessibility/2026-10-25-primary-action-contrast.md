# 주황 primary 동작의 대비와 브라우저 접근성

## 대상과 조건

2026-10-25 KST, `codex/docs-content-motion-20261023` HEAD `ddce1ec34d287732d4dc0661fa2db5e2ad1d8a40`와 기존 미커밋 작업 트리를 사용했다. Node24.12.0·Playwright1.62.1·설치된 Chromium headless shell revision1234다. 원격 콘텐츠 호출을 비활성화한 로컬 앱으로 운영 토큰·원격 장애와 분리했다. 커밋·배포 검증은 아니다.

검사 대상은 공용 primary Button·작은 Button·기본/링크 Badge, `.ds-button-primary`, 실제 `/ko` CTA와 기존 헤더·검색 접근성이다. 공용 토큰 소비처인 선택된 필터·페이지 번호의 모든 조합을 직접 검사한 것은 아니다.

## 재현 방법

저장소 작업 트리 루트에서 공용 UI를 먼저 빌드한다. 브라우저 검사와 동시에 같은 UI의 dist를 지우고 다시 빌드하지 않는다.

```sh
mise exec -- pnpm --filter @web-tech/ui build
mise exec -- pnpm --filter docs exec tsc -p tsconfig.ui-e2e.json
mise exec -- pnpm --filter @web-tech/ui typecheck
mise exec -- pnpm --filter docs exec playwright test --config=playwright.ui.config.ts primary-contrast.spec.ts primitives.spec.ts cn.spec.ts --reporter=json
mise exec -- pnpm --filter docs exec playwright test primary-action-contrast.spec.ts shell-focus-contrast.spec.ts --reporter=json
```

실제 앱 검사는 이미 실행한3001 서버를 사용했다. `dev:e2e` 실행 시 `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false`와 콘텐츠 API base URL3종의 빈 값을 명시했다. 운영 `.env`의 실제 값은 출력하지 않았다.
격리 UI fixture도 앱과 같은 단색 body를 사용하며 실제 React/Button/Badge·공용 CSS를 번들링한다. 테스트 전용 스타일로 primary 글자색이나 focus를 대신 구현하지 않는다.

[대비 측정 helper](../../../apps/docs/ui-e2e/helpers/solid-contrast.ts)는 computed color를 브라우저 Canvas로 sRGB 변환해 `color-mix`·alpha와 대상 opacity를 합성한다. 그라데이션/이미지와 ancestor opacity는 지원하지 않아 명시적으로 오류를 낸다. 전환 완료를 기다리고 임계값은 반올림하지 않는다. 이 helper를 모든 배경에 적용할 수 있다는 의미는 아니다.

## 결과와 증거

수정 전 동일 Chromium에서 라이트·다크 모두2.6401026446:1이 나와4.5 기준 검사가 실패했다. 공용 UI 단독 primary 버튼은 outline-style이 none이었다. 브랜드 배경을 유지하고 primary foreground를 `#fff7ed`에서 `#171717`로 바꿨다. primary 동작에는 명시적2px/offset3px outline과 forced-colors `Highlight`를 추가했다.

| 항목                         | 실제 결과                                                                                               | 판정      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- | --------- |
| 기본 primary 텍스트          | Light/Dark6.3958:1                                                                                      | 통과      |
| 공용 Button/링크 Badge hover | Light7.0114:1·Dark5.3264:1                                                                              | 통과      |
| 실제 CTA hover/focus 텍스트  | Light6.0106:1·Dark5.9725:1                                                                              | 통과      |
| 공용 primary focus outline   | Light17.9278:1·Dark16.9109:1, 2px/offset3px                                                             | 통과      |
| 실제 CTA focus outline       | Light16.2399:1·Dark15.5596:1                                                                            | 통과      |
| UI 회귀                      | Light/Dark58개, 실패·skip·flaky0                                                                        | 통과      |
| 실제 블로그·셸               | 390/768/1280px × 두 테마, CTA6개+셸6개                                                                  | 12개 통과 |
| 키보드·강제 색상             | 실제 Tab 이동·Enter/Space 활성화·disabled 건너뛰기·링크 이동, primary/CTA/링크 Badge의 시스템 Highlight | 통과      |
| 코드 검사                    | UI build/typecheck, UI E2E typecheck, 변경 테스트/공용 UI 파일 ESLint                                   | 통과      |

수정 전 실패·최종 computed 측정값과58개 테스트 목록은 [artifact](../artifacts/2026-10-25-primary-action-contrast.json)에 있다. [모바일 Dark](../artifacts/2026-10-25-primary-contrast-mobile-dark.png)와 [Desktop Light](../artifacts/2026-10-25-primary-contrast-desktop-light.png)는 실제 로컬 페이지에서 키보드 포커스한 캡처다. 이 표의 표시는 요약용 반올림이며 판정은 원래 수치를 사용했다.

초기 시도는 macOS sandbox의 Chromium 실행 거절, fixture의 gradient 감지, 전환 중 색 측정, 개발 서버 prebuild와 UI 검사 사이의 dist 재생성 경합이 있었다. 허용된 로컬 실행·실제 앱과 같은 단색 배경·전환 완료 대기·빌드 종료 후 순차 재검사로 분리했다. 초기 실패를 서비스 장애 또는 최종 통과로 숨기지 않는다.

### Figma 대응

[Light 보드](https://www.figma.com/design/1G0NGpk3l75cOnCCZr2J6q?node-id=10-185)와 [Dark 보드](https://www.figma.com/design/1G0NGpk3l75cOnCCZr2J6q?node-id=83-312)의 onPrimary primitive를 같은 `#171717`로 바꿨다. primary Focus/InvalidFocus Button·링크 Badge8개 master에2px/offset3px 외곽선을 추가했다. 라벨이 짧은 인스턴스에서도 맞도록 STRETCH 제약을 보정했고, 각 보드4개 인스턴스의 기하를 재조회해 오류0개였다. 두 Button 영역의 수정 후 렌더와 실제 모바일 화면을 확인했다.
이는 앞선 Dark 견본에서 확인한 대비 한계에 대한 후속 수정이다. 앞선 “Light 그대로 보존”은 당시 작업의 결과이며, 이번에는 승인된 primary foreground와 outline을 Light에도 의도적으로 적용했다. 공식 매핑·라이브러리 게시·추가 결제는 없다. 이전 Figma 작업 기록은 로컬 미커밋으로 보존하며 이번 코드·검사 커밋과 분리한다.

## 한계와 후속 작업

Chromium의 위 대상에 대한 회귀이며 전 사이트 WCAG 인증이나 전체 자동 axe 검사 결과가 아니다. Safari/Firefox·실기기·VoiceOver/NVDA·다른 버튼 variant·이미지/그라데이션 배경·모든 필터 조합은 미검증이다. disabled의 흐린 텍스트는 비활성 요소 예외와 기능 검사를 구분했다. Next 전체 production 빌드·원격 CI·배포는 실행하지 않았다.

일반 작은 글자4.5:1과 의미 있는 비텍스트 상태 표시3:1 기준은 [W3C Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)·[Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)을 따른다. [Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)의 목적을 실제 키보드 동작과 함께 확인했다. 다른 색상·variant의 대비는 별도 점검한다.

## Main 기반 PR 분리·후속 검증

원래 모션 브랜치를 main과 비교하면41개 파일이 포함돼, 최신 main `4e80275`에서 새 `codex/docs-primary-contrast-20261025` 브랜치에 이번 커밋만 옮겼다. 분리한 코드 커밋은 `2902044779b81a884206bbd0efbe282c910a2af1`이다. 코드/테스트7개는 원래 `d660f4bc`와 동일하며 목차3개만 main의 최신 항목을 유지하도록 충돌을 해결했다. 다른 모션·최근 글 문구·미디어·초안은 포함하지 않았다.

main의 lockfile 그대로 frozen 설치하고 깨끗한 코드 커밋에서 공용 UI 전체68개(외부 설치 소비자·Sidebar hydration 포함)와 실제 블로그12개, 총80개를 다시 통과했다. UI build/typecheck·UI E2E 타입과 변경 파일 ESLint도 통과했다. 실제 앱 검사는 별도3123 포트를 사용하고 종료했으며, 사용자가 보고 있던 기존3001 서버는 건드리지 않았다.

```sh
mise exec -- pnpm install --frozen-lockfile --ignore-scripts
mise exec -- pnpm --filter @web-tech/ui build
mise exec -- pnpm --filter docs exec playwright test --config=playwright.ui.config.ts --reporter=json
DOCS_E2E_PORT=3123 mise exec -- pnpm --filter docs exec playwright test primary-action-contrast.spec.ts shell-focus-contrast.spec.ts --reporter=json
```

새 표본·테스트 목록·대비 값은 같은 artifact의 `mainBasedPrVerification`에 별도 보존한다. 앞선70개와 캡처는 원래 작업 트리에서의 결과로 유지하며 main 검증으로 바꾸지 않는다. 이 후속 검사도 Chromium이며 production 빌드·운영 배포·전체 WCAG 인증은 아니다. 원격 CI는 PR의 같은 head SHA에서 별도로 확인한다.

## 관련 문서

### 2026-10-28 병합 후 기록 연결

대비 소스는 PR #63으로 main `c1e2850cbfdf50bd7761729b32d1af5ffe045596`에 반영됐다. 당시 CI·공개 CSS·Production 연동 관측은 [작업 기록의 병합 실행 결과](../../worklog/2026-10/2026-10-25-primary-action-contrast.md#승인된-병합-실행-결과)에 보존했다. 숫자 7314181802·7314175335는 [별도 API 재조회](../artifacts/2026-10-28-primary-deployment-identifiers.json)로 GitHub Deployment ID임을 확인했다. Vercel 자체 배포 ID나 현재 Production 재검증으로 혼동하지 않는다. 이번 정리는 실행 코드·디자인 토큰을 다시 바꾸지 않으며 전체 WCAG·실기기 검증도 아니다.

- [토큰 사용 정책](../../architecture/docs-design-token-usage-policy.md#primary-대비-기준)
- [작업 기록](../../worklog/2026-10/2026-10-25-primary-action-contrast.md)
- [KAN-36](https://web-tech-service.atlassian.net/browse/KAN-36)
