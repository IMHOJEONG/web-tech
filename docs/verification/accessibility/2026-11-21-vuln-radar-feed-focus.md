# Vuln Radar Feed 검색 입력의 키보드 포커스 검증

## 대상과 조건

- 2026-11-21 KST에 `9c55b335`와 로컬 변경을 기준으로 실제 `/feed` 라우트를 검사했다. 변경 범위는 검색 입력의 포커스 스타일이다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)
- Vite+ 1.4.0의 실제 페이지와 컴파일된 CSS를 사용했다. 브라우저 검증에서는 Feed 검색 API를 합성 응답으로 격리했다. Chromium 151.0.7922.34, Firefox 153.0, WebKit 26.5에서 390·1280px의 일반 모드를 실행했고, Chromium과 Firefox에서 같은 폭의 강제 색상 에뮬레이션을 추가했다. 변경 전후 각 10조건이다.
- Modern Web Guidance의 `accessibility`와 `forms`를 대조했다. 기본 모드에는 기존 `radar-primary`, 강제 색상에는 시스템 `CanvasText`를 적용했다. 두 모드에서 2px 실선과 2px 간격을 사용한다.

## 재현 방법

저장소 루트에서 `pnpm --filter vuln-radar exec vp dev --host 127.0.0.1 --port 4315 --strictPort`로 실행한다. 프록시는 로컬 격리 주소를 사용하고, Playwright에서 `/api/backend/feed/search` 응답을 합성 데이터로 처리했다. `Tab`으로 검색 입력에 도달한 뒤 `:focus-visible`, `outline`, `border-color`, `box-shadow`의 계산값을 확인한다. 변경 후 `Tab`·`Shift+Tab`으로 이동을 확인하고, 검색어 입력 → P1 필터 선택 → 다음 페이지 → 뒤로 가기 순서로 응답과 URL을 대조한다.

```sh
pnpm --filter vuln-radar test:lib
pnpm --filter vuln-radar typecheck
pnpm --filter vuln-radar lint
pnpm verify:vuln-radar:integration
```

## 결과와 증거

| 확인 항목           | 관측 및 판정                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 변경 전 포커스      | 모든 조건에서 Tab으로 입력에 도달했다. outline은 없었다. 강제 색상에서는 그림자가 사라졌고, Chromium은 포커스 테두리 색이 바뀌었지만 Firefox는 유지됐다.                  |
| 변경 후 포커스      | 10조건 모두에서 2px 실선과 2px 간격을 확인했다. 일반 모드는 테마 색, 강제 색상은 테스트 팔레트의 `CanvasText`와 같은 검정으로 표시됐다.                                   |
| 강제 색상 후보 비교 | Firefox의 `Highlight` 값은 이 테스트의 흰 `Canvas`에 대해 2.94:1이었다. `CanvasText`를 사용한 최종 구현은 두 엔진의 에뮬레이션에서 흰 `Canvas`와 검정 outline을 확인했다. |
| 검색·필터·페이지    | 최종 10조건에서 Tab 왕복, 검색 입력 후 포커스 유지, P1 필터, 다음 페이지의 요청·URL과 뒤로 가기를 확인했다. 페이지 예외는 없었다.                                         |
| 앱 검사             | 라이브러리 테스트 36개, 타입 검사, 린트 통과.                                                                                                                             |

최종 소스에서 임시 PostgreSQL·Nest·프록시·Chromium을 연결한 통합 검사 26그룹이 통과했다. 실제 API를 사용하는 Feed 검색, 필터와 페이지네이션이 포함된다. 기존 API 클라이언트와 통합 실행기의 로컬 변경도 들어 있는 작업 트리에서 실행했다. 임시 컨테이너와 프로세스 정리를 확인했고 원시 캡처와 실행 결과는 저장소 밖에 보관했다. [정제 증거와 대상 소스 해시](../artifacts/2026-11-21-vuln-radar-feed-focus.json)

## 한계와 후속 작업

강제 색상 결과는 브라우저 에뮬레이션에서 선택된 팔레트 기준이다. Windows 실기기, 실제 Safari 앱, 모바일 실기기와 운영 환경은 미검증이다. WebKit의 검증 범위는 일반 모드다.

## 관련 문서

- [프런트엔드 현대화 감사의 선택 후보](2026-11-21-frontend-modernization-audit.md#유지선택보류-항목)
- [Feed 검색 ADR](../../architecture/adr-0029-vuln-radar-feed-search.md) · [로컬 통합 검증 절차](../../runbooks/vuln-radar-local-integration-verification.md)
- [이번 작업 기록](../../worklog/2026-11/2026-11-21-vuln-radar-feed-focus.md)
- [W3C 포커스 표시 기준](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible) · [CSS 강제 색상](https://www.w3.org/TR/css-color-adjust-1/) · [CSS 시스템 색](https://www.w3.org/TR/css-color-4/#css-system-colors)
