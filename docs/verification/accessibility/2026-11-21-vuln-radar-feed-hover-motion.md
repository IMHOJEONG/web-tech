# Feed 카드·버튼 hover 모션 검증

## 대상과 조건

2026-11-21 KST에 `e4e7dbf9`와 로컬 수정을 비교했다. 실제 Vite `/feed`에 합성 API 응답을 제공했다. Chromium 151.0.7922.34·Firefox 153.0·WebKit 26.5, 390·1280px, 일반·동작 줄이기를 조합한 각 12조건을 검사했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## 재현 방법

Playwright에서 Feed 결과 카드, 비활성 우선순위 버튼과 첫 요청 실패 뒤의 `다시 시도`에 포인터를 올린다. 색상 전환이 끝난 뒤 요소의 위쪽 좌표와 색상 계산값을 비교한다. 우선순위 버튼을 선택해 검색 결과를 확인하고, 다시 시도할 때 합성 응답을 성공으로 바꿔 Feed 복구를 확인한다.

## 결과와 증거

변경 전에는 두 모션 설정에서 카드와 버튼이 각각 1px 이동했다. 이동과 위치 전환을 `motion-safe`에 걸고 기본 전환은 `transition-colors`로 지정했다. 변경 후 일반 모드에서는 세 요소가 각각 1px 이동했고, 동작 줄이기에서는 모두 0px였다. 12조건 모두에서 색상 피드백, 필터 적용과 오류 후 재시도에 따른 Feed 복구를 확인했다. 타입 검사와 린트도 통과했다. [정제 증거](../artifacts/2026-11-21-vuln-radar-feed-hover-motion.json)

## 한계와 후속 작업

동작 줄이기 설정은 브라우저에서 에뮬레이션했다. 네이티브 Safari 앱, 모바일 실기기, 실제 API와 운영 환경은 미검증이다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-21-vuln-radar-feed-hover-motion.md)
- [선행 로딩 모션 검증](2026-11-21-vuln-radar-feed-loading-motion.md)
