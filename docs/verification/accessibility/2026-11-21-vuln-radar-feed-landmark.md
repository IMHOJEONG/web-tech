# Vuln Radar Feed 검색·필터 랜드마크 검증

## 대상과 조건

2026-11-21 KST, 레이블 변경 커밋 `52167f25`와 로컬 `<search>` 변경을 비교했다. 실제 Vite `/feed` 페이지에 합성 API 응답을 제공했다. 한국어 UI의 390·1280px에서 Chromium 151.0.7922.34, Firefox 153.0, WebKit 26.5를 확인했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## 재현 방법

저장소 루트에서 `pnpm --filter vuln-radar exec vp dev --host 127.0.0.1 --port 4315 --strictPort`로 실행하고 Playwright에서 `/api/backend/feed/search`에 합성 응답을 반환했다. `/feed`의 검색 역할 수와 접근성 이름을 검사하고, 영역 안의 검색 입력·필터 그룹과 바깥의 페이지 탐색을 확인했다. Chromium에서는 CDP의 `Accessibility.getFullAXTree`로 역할과 이름을 대조했다. Tab으로 검색 입력에 도달한 뒤 검색어 입력, Enter, P1 필터, 다음 페이지 및 뒤로 가기를 검사했다.

## 결과와 증거

선행 레이블 검증의 동일 환경에서는 검색 랜드마크가 0개였다. 변경 후 여섯 조건 모두에서 기존 안내 문구 `탐색 조건`으로 이름이 붙은 검색 랜드마크가 하나 표시됐다. 검색어 입력, 우선순위·심각도·KEV 필터가 그 영역에 포함됐고 페이지 탐색은 영역 밖에 있었다. Chromium의 실제 접근성 트리에서도 `search` 역할과 이름을 두 폭에서 확인했다.

여섯 조건에서 Tab 포커스 표시, 입력 중 검색 갱신, Enter의 추가 요청 0건, 필터·페이지를 포함한 요청과 뒤로 가기가 통과했다. 앱 라이브러리 테스트 36개와 타입 검사·린트도 통과했다. [정제 증거와 소스 해시](../artifacts/2026-11-21-vuln-radar-feed-landmark.json)

## 한계와 후속 작업

Safari 앱과 VoiceOver 로터, Windows 스크린리더, 모바일 실기기와 운영 환경은 미검증이다. 합성 API 회귀는 브라우저의 입력·탐색 동작을 검증한 결과다.

## 관련 문서

- [Feed 레이블 검증](2026-11-21-vuln-radar-feed-label.md) · [작업 기록](../../worklog/2026-11/2026-11-21-vuln-radar-feed-landmark.md)
- [HTML search 요소](https://html.spec.whatwg.org/multipage/grouping-content.html#the-search-element) · [W3C 랜드마크 안내](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)
