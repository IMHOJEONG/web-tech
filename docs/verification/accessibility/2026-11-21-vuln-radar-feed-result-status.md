# Vuln Radar Feed 검색 결과 상태 검증

## 대상과 조건

2026-11-21 KST, `7f5863a2`와 로컬 변경을 비교했다. 실제 Vite `/feed`에서 합성 API 응답을 사용했다. Chromium 151.0.7922.34, Firefox 153.0, WebKit 26.5에서 한국어 UI의 390·1280px를 검사했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## 재현 방법

저장소 루트에서 `pnpm --filter vuln-radar exec vp dev --host 127.0.0.1 --port 4315 --strictPort`로 실행하고 `/api/backend/feed/search`의 응답을 Playwright로 격리한다. 초기 결과가 렌더되면 `status` 요소 참조를 저장한다. 검색어를 입력해 요청 응답을 잠시 보류하고, 대기 중과 완료 후에 같은 DOM 노드인지 검사한다. 필터·페이지 이동·뒤로 가기와 결과 0건까지 확인한다.

## 결과와 증거

- 변경 전 여섯 조건에서 갱신 중과 완료 후의 `status` 요소는 각각 초기 DOM 노드와 달랐다.
- 변경 후 여섯 조건에서 같은 `role="status"` 노드가 유지됐다. 검색이 완료되면 결과 수와 페이지, 0건이면 해당 조건의 결과 수를 전달한다. 화면의 갱신 중 문구와 페이지 정보는 기존 위치에서 읽을 수 있다.
- 검색어 입력 포커스, Enter 추가 요청 0건, 필터·다음 페이지와 뒤로 가기가 여섯 조건에서 통과했다. 앱 테스트 36개, 타입 검사·린트도 통과했다. [정제 증거와 소스 해시](../artifacts/2026-11-21-vuln-radar-feed-result-status.json)

## 한계와 후속 작업

DOM 역할과 유지 여부를 검증했다. 실제 스크린리더 발화와 발화 타이밍, 모바일 실기기, 실제 API 실패와 운영 환경은 미검증이다.

### 실제 Safari 후속 검증

`573e9595`의 결과 상태 코드와 기존 API 클라이언트 작업 트리 변경이 있는 환경에서 실제 macOS 26.6.2·Safari 26.6.2로 검사했다. 로컬 `/feed`는 실제 Vite 앱이며 Feed API는 루프백 합성 응답을 사용했다.

Safari 접근성 트리에서 `탐색 조건` 컨테이너와 이름이 `피드 검색`인 텍스트 필드를 확인했다. 빈 검색의 26건에서 `voiceover` 입력으로 전환했을 때 화면에 대기 문구가 표시됐고, 완료 후 `전체 31건 · 1 / 2 페이지`가 노출됐다. `다음`으로 이동하면 `전체 31건 · 2 / 2 페이지`와 두 번째 문서 제목이 표시됐다. `missing-fixture`는 0건 문구와 빈 결과 화면을 표시했다. 검색어를 바꾼 뒤에도 입력 포커스가 유지됐다.

VoiceOver 로터의 `랜드마크` 목록과 완료 메시지 발화는 실제 키보드로 확인할 수 있도록 준비했다. 로터에 `탐색 조건`이 있는지와 `voiceover` 입력 후 읽히는 문구를 확인 요청했다. 현재 Safari 접근성 트리에 나타난 텍스트까지 확인했다. [Apple VoiceOver 로터 안내](https://support.apple.com/ko-kr/guide/voiceover/mchlp2719/mac)

### VoiceOver 발화 누락과 재검증

사용자는 로터의 `랜드마크` 목록에서 `탐색 조건`을 찾았고, `573e9595`에서 검색 완료 후 31건과 0건이 읽히지 않았다고 보고했다. VoiceOver 유틸리티의 `라이브 영역 활성화`가 켜져 있음을 확인했다. [Apple 라이브 영역 안내](https://support.apple.com/en-asia/guide/voiceover/vo34654/mac)

로컬 수정본에서 첫 응답 전에 빈 상태 영역을 렌더하고 `aria-live="polite"`와 `aria-atomic="true"`를 명시했다. 화면에 검색 결과가 나타난 뒤에도 같은 노드를 사용한다. 세 브라우저 엔진·두 폭에서 첫 요청 응답을 지연시켜 빈 영역이 먼저 있는지 확인했다. 응답 후와 검색 31건·0건, 다음 페이지에서 노드가 유지됐고 필터·뒤로 가기·입력 포커스도 통과했다. 수정본의 실제 Safari 접근성 트리에 31건·0건 문구가 표시됐다. 수정 후 발화는 물리 키보드로 다시 확인해 달라고 요청했다. [정제 증거](../artifacts/2026-11-21-vuln-radar-feed-result-status.json) · [W3C 상태 메시지 기법](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22)

## 관련 문서

- [검색 랜드마크 검증](2026-11-21-vuln-radar-feed-landmark.md) · [작업 기록](../../worklog/2026-11/2026-11-21-vuln-radar-feed-result-status.md)
- [WCAG 상태 메시지](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) · [W3C role=status 기법](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22)
  후속 사용자 확인에서 수정본의 31건과 0건 메시지가 모두 VoiceOver로 읽혔다. 실제 발화는 사용자 보고로 통과했다. 앞선 DOM 검사와 Safari 접근성 트리 관측에 이 발화 결과를 추가한다.
