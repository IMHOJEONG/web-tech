# 검색 Drawer·자동완성 로컬 검증

## 대상과 조건

- 2026-11-14 KST, main `42a26e371c88f74844ad28d5bc9fc5a46482bfbf` 기준 `codex/docs-search-drawer-20261114` 미커밋 작업 트리.
- Node24.22.1·pnpm12.14.0·Next16.4.3·Playwright Chromium. 원격 문서 인덱스를 끈 로컬 서버에서만 검사했다.
- 한/영·라이트/다크, 390px 모바일·1280px 데스크톱과 320~1280px 폭 sweep·확대 글꼴 검사를 구분한다. 실제 모바일 OS 키보드 검증은 아니다.

## 재현 방법

루트의 잠금 파일로 의존성과 공용 UI·콘텐츠 계약을 준비하고 원격 인덱스를 끈 docs 서버를 실행한다. 예시 포트는 비어 있는 값을 사용하며 기존 서버를 종료하지 않는다.

```sh
pnpm --filter docs test:lib
pnpm --filter docs typecheck
pnpm --filter docs lint
DOCS_E2E_PORT=3041 pnpm --filter docs test:e2e \
  e2e/search-drawer.spec.ts e2e/search-navigation.spec.ts \
  e2e/header-clarity.spec.ts e2e/keyboard-accessibility.spec.ts \
  e2e/search-query-policy.spec.ts e2e/shell-focus-contrast.spec.ts \
  e2e/header-font-preference.spec.ts \
  --project chromium-mobile --project chromium-desktop --workers 1 --reporter list
# Production 빌드는 사용자 개발 서버와 빌드 출력이 겹치지 않을 때 준비한다.
# 이미 준비한 Production 빌드를 별도 포트로 검사하며 사용자 서버는 유지한다.
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false pnpm --filter docs build
NODE_ENV=production DOCS_E2E_PORT=3043 pnpm --filter docs test:e2e \
  e2e/search-drawer.spec.ts e2e/search-navigation.spec.ts e2e/search-query-policy.spec.ts \
  --project chromium-mobile --project chromium-desktop --workers 1 --reporter list
# 사용자 후속 신고: 입력창이 아닌 목록 링크의 포커스에서 방향키·Enter 확인
DOCS_E2E_PORT=3041 pnpm --filter docs test:e2e \
  e2e/search-drawer.spec.ts e2e/keyboard-accessibility.spec.ts \
  --workers 1 --reporter list
# 별도 합성 원격 fixture 검증: 실제 NAS 호출이 아님
pnpm --filter docs test:article:prod article-e2e/body-search-navigation.spec.ts \
  --workers 1 --reporter list
```

## 결과와 증거

| 단계                 | 실제 결과              | 해석                                                                                               |
| -------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| 초기 집중            | 6통과·2실패            | 오류 안내와 제출 버튼이 화면 밖. max-w-xl이80px로 해석된 실제 레이아웃 결함                        |
| 폭 수정 후 집중      | 8통과·2실패            | 레이아웃 결함은 복구됐지만 진입 animation 중 bbox를 즉시 측정한 테스트가 실패                      |
| 중간 넓은 회귀       | 56통과·8실패·기존4skip | 진입 animation 측정 및 수화 전 비활성 버튼에 Enter를 보내던 검사. 이 결과를 성공으로 덮어쓰지 않음 |
| 최종 집중            | 22통과                 | 두 폭의 자동완성·IME·오류·경합·키보드·실제 라이트/다크 결과 확인                                   |
| 최종 dev 회귀        | 64통과·기존4skip       | 한/영·두 테마·두 폭·확대 글꼴·입력/이동/접근성. 모바일에서는 기존 desktop 전용 sweep4개 제외       |
| 라이브러리·타입·lint | 369통과·타입/lint 성공 | 응답 경계5개 회귀 포함. control 문자 정규식 lint 경고는 같은 의미의 문자 비교로 보완               |
| Production build     | 성공                   | 앱·새 API·타입·34개 정적 페이지 생성. 기존 글2개의 placeholder-like 경고는 별개로 남음             |
| 최초 Production 회귀 | 35통과·5실패           | 폭390.0000038px의 엄격 비교1건과 태그 prefetch를 중복 제출로 센4건                                 |
| 요청 분류 재현       | 대상4개 실패           | 실제 제출1건, 추가 tag URL들의 next-router-prefetch=1을 분리 관측. 제품의 재제출로 단정하지 않음   |
| 최종 Production 회귀 | 40통과                 | 요청 목적지·prefetch 구분과1px 기하 허용오차 후 두 폭에서 재검증                                   |

레이아웃은 Drawer 한정 36rem 최대 폭으로 고쳤다. 테스트는 실제 애니메이션 완료 기하를 polling하고, 이미 있는 수화 전 비활성 상태가 해제된 뒤 키보드를 보낸다. timeout 증가·강제 클릭·새 skip은 추가하지 않았다.

의도적 503은 오류 안내와 재시도로 검사하며, 게이트로 늦춘 이전 응답이 새 query의 결과를 덮어쓰지 않는지 확인한다. IME는 합성 composition 이벤트의 보완 검증이다. 결과 목록은 실제 로컬 API와 합성 응답을 구분해서 확인한다.

Production의 추가 요청은 `/docs?q=component&tag=...`의 prefetch이고 실제 제출 `/docs?q=component`와 다르다. 중복 제출 검사는 정확한 목적지와 비-prefetch 요청만 보류·집계하며, 예상과 다르면 경로·RSC/prefetch만 진단에 남긴다. 이 변경으로 버튼 비활성·중복 Enter/submit·history·폭 유지 assertion을 삭제하지 않았다. 기하 비교는1px 이내 브라우저 소수점 오차만 허용한다.

artifact 상대 링크는 해당 없음이다. 원시 실패 context·캡처는 저장소 밖 비공개 로컬에 두며 별도 공개 정제 artifact를 만들지 않았다. 이 표는 집계이며 원시 실행 파일을 대신하지 않는다.

### 목록 포커스 방향키 후속 신고

사용자 신고 후 입력창이 아니라 첫 문서 링크에 포커스를 주고 ArrowDown을 보냈다. 수정 전 단일 데스크톱 재현은 두 번째 링크가 inactive 상태로 남아 실패했다. 기존 입력창 키보드 검사는 이 경로를 포함하지 않았으며 앞선 통과를 이 문제의 부재로 해석하지 않는다.

목록 링크의 방향키 처리와 onFocus 선택 동기화를 추가하고 선택 테두리·배경을 강화했다. 수정 후 모바일·태블릿·데스크톱의 Drawer·키보드 집중 검사는 **36개 통과**했다. 위/아래 이동·양 끝 순환·aria-selected·Enter 실제 상세 이동·Escape 복귀를 포함한다. 타입·lint도 통과했고 사용자 개발 서버는 종료하지 않았으며 `/ko/docs` HTTP200을 확인했다. 사용자 기존 브라우저 탭은 도구 초기화 오류로 직접 검사하지 못했고, 이 결과는 별도 Playwright 브라우저 검증이다.

앞선 Production40개와 합성 원격 본문 검색8개는 이 목록 포커스 수정 **전** 코드의 통과 결과다. 원격 본문에만 있는 검색어의 Drawer 미리보기·명시 제출도 확인했다. 조합 중 명시적으로 닫은 뒤 다시 열 때 입력 제한과 조회가 복구되는 검사도 포함했다. 목록 포커스 수정 후 Production 빌드·원격 fixture 검사는 재실행하지 않았다. 사용자 개발 서버의 빌드 출력을 덮지 않기 위해 최신 수정 검증은 개발 모드로 한정한다.

## 한계와 후속 작업

- 초기 로컬 검증 단계에서는 커밋·푸시·원격 CI·배포·실제 NAS 연결 검증을 하지 않았다. 11-15 후속의 공개·CI 범위는 아래에 구분한다. 의존성은 frozen lockfile 설치이며 새 패키지는 추가하지 않았다.
- 네이티브 IME·모바일 주소창/소프트 키보드·실기기·Safari·Firefox는 후속 검증이 필요하다. 타입·lint·로컬 Chromium 통과를 이를 대신하는 결과로 쓰지 않는다.
- debounce·최대8개 응답·클라이언트8초 취소는 서버 부하 제한·강제 중단·WAF rate limit을 보장하지 않는다.
- 설치 prepare는 worktree의 `.git` 파일을 폴더로 가정해 hook 설치 경고를 냈다. 이번에는 커밋하지 않으며 향후 커밋 전 훅 적용 상태·공개 승인을 별도로 검증해야 한다.

## 2026-11-15 PR #92 후속

기준은 최초 공개 head `d863c21f9724386f285005cdfc1021d659798abf`와 그 후속 미커밋 보완이다. 최초 head의 CI 실행 `43604678477`, Documentation·CodeQL·GitGuardian·CodeRabbit 체크와 Vercel Preview는 성공했다. 다만 CodeRabbit이 남긴 실제 인라인 3건은 미해결이므로 성공 체크만으로 병합하지 않았다.

| 검사                             | 실제 결과              | 판단                                                                     |
| -------------------------------- | ---------------------- | ------------------------------------------------------------------------ |
| 수정 전 반복 query·같은 URL 제출 | 데스크톱3개 실패       | A→B→A에서 과거 선택 복원, 한/영 같은 URL 제출 후 Drawer 잔류 재현        |
| 수정 전 공백 문서 경로           | 단위1개 실패           | 단일 공백 href 때문에 전체 응답 검증 실패 재현                           |
| 첫 넓은 회귀                     | 78통과·6실패           | 같은 URL 제출 뒤 닫힌 입력을 찾는 기존 테스트 조건을 보완                |
| 재열기 포함 중간 회귀            | 76통과·8실패           | 닫기에서 정규화 입력을 덮는 제품 결함6개와 389.999969px의 폭 비교2개     |
| 최종 회귀                        | 84통과                 | 모바일·태블릿·데스크톱, 입력·history·중복 제출·IME·키보드·오류·경합 유지 |
| 라이브러리·정적 검사             | 370통과·타입/lint 성공 | 공백/기존 encoding/한글 경로, 엄격한 응답 검증 유지                      |

요청 결과는 query 문자열만이 아니라 새 요청 세대로 구분한다. 같은 URL의 제출 결과를 이동 훅에서 식별해 Drawer만 닫고, 조합 중이 아닌 입력을 닫기에서 재설정하지 않는다. 새 URL 이동의 pending 안내와 기존 중복 제출 차단은 유지한다. 폭 비교는 앞서 상한에 적용한 것과 같은1px 이내 소수점 오차만 하한에도 허용한다. timeout 증가·강제 클릭·새 skip은 없다.

```sh
DOCS_E2E_PORT=3041 pnpm --filter docs test:e2e e2e/search-drawer.spec.ts \
  --grep 'repeated query|same-query' --project chromium-desktop --workers 1
pnpm --filter docs exec node --experimental-strip-types --test \
  --test-name-pattern='space-containing' lib/search-suggestions.test.ts
DOCS_E2E_PORT=3041 pnpm --filter docs test:e2e \
  e2e/search-drawer.spec.ts e2e/search-navigation.spec.ts \
  e2e/search-query-policy.spec.ts e2e/keyboard-accessibility.spec.ts \
  --workers 1 --reporter list
pnpm --filter docs test:lib
pnpm --filter docs typecheck
pnpm --filter docs lint
```

최초 Preview 배포 `dpl_7VSsfTitXxxLndg2amQzLDLUTjY3`는 같은 head·READY 상태다. 비인증 요청은 Vercel SSO 진입점으로302였고, 이를 확인한 뒤 공식 인증 요청의 React 검색 결과6개·본문 필드 제외를 확인했다. 프로젝트 Root Directory `apps/docs`·Node24도 확인했다. 후속 수정의 원격 CI·리뷰·main 병합·Production 배포는 이 로컬 결과와 별도로 확인해야 한다. 사용자 개발 서버·기존 초안·stash·NAS는 변경하지 않았다.

## 관련 문서

- [ADR-0031](../../architecture/adr-0031-docs-search-drawer.md)
- [작업 기록](../../worklog/2026-11/2026-11-14-search-drawer.md)
