# Vuln Radar Feed 검색 레이블과 입력 설정 검증

## 대상과 조건

2026-11-21 KST, 포커스 개선 커밋 `4a610395`와 레이블·입력 설정의 로컬 변경을 비교했다. Chromium 151.0.7922.34, Firefox 153.0, WebKit 26.5에서 390·1280px의 한국어 `/feed`를 검증했다. 각 버전의 실제 Vite 페이지에 합성 Feed API 응답을 제공했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## 재현 방법

저장소 루트에서 `pnpm --filter vuln-radar exec vp dev --host 127.0.0.1 --port 4315 --strictPort`로 실행하고 Playwright에서 `/api/backend/feed/search`를 가로채 합성 응답을 반환한다. 빈 입력을 접근성 이름으로 찾고 `Synthetic-ID`를 입력한다. 결과가 바뀐 뒤 Enter를 누르고 포커스, 결과와 추가 요청 수를 대조한다. 변경 후 Tab으로 포커스와 2px outline을 확인하고 P1 필터, 다음 페이지와 뒤로 가기를 재검사한다.

## 결과와 증거

기존 입력은 숨겨진 `<label>`로 접근성 이름을 제공했다. 화면에 보이는 설명은 입력 전 placeholder였으며 값을 쓰면 사라졌다. 변경 후 `피드 검색` 레이블은 빈 입력과 값을 넣은 상태에서 모두 보이고, 입력의 접근성 이름으로도 연결됐다. `autocorrect="off"`, `autocapitalize="none"`, `spellcheck="false"`가 실제 DOM에 반영됐다.

변경 전후 여섯 조건 모두 Enter를 누르기 전에 결과가 바뀌었고 Enter는 추가 요청을 만들지 않았다. 입력으로 검색 결과가 갱신되는 동작에 맞춰 검색 키 힌트를 지정하지 않았다. 변경 후 포커스 표시, P1 필터, 요청 페이지 번호와 브라우저 뒤로 가기도 여섯 조건에서 통과했다. 앱 라이브러리 테스트 36개와 타입 검사·린트가 통과했다. [정제 증거와 소스 해시](../artifacts/2026-11-21-vuln-radar-feed-label.json)

## 한계와 후속 작업

실기기의 가상 키보드·IME, 영어 UI 런타임, Safari 앱과 운영은 미검증이다. 영어 레이블은 메시지 사전에 포함됐다. 이 변경의 브라우저 회귀는 합성 API 응답을 사용했다. 실제 DB 통합 26그룹은 선행 포커스 커밋의 검증 결과다.

## 관련 문서

- [Feed 포커스 검증](2026-11-21-vuln-radar-feed-focus.md) · [작업 기록](../../worklog/2026-11/2026-11-21-vuln-radar-feed-label.md)
- [W3C 레이블과 안내 기준](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html) · [HTML 키보드 힌트 명세](https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-enterkeyhint-attribute)
