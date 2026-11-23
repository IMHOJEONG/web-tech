# Feed 로딩 Skeleton 모션 검증

## 대상과 조건

2026-11-21 KST, `5ef22d86`와 로컬 변경을 비교했다. 실제 Vite `/feed`에서 합성 API 응답을 지연했다. Chromium 151.0.7922.34·Firefox 153.0·WebKit 26.5, 390·1280px와 일반·동작 줄이기 설정을 조합한 12조건을 실행했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## 재현 방법

로컬 Vite 페이지에서 Playwright로 초기 Feed API 응답을 보류한다. 로딩 중 Skeleton 18개의 크기와 `animation-name`을 조회한다. 응답을 완료한 뒤 Skeleton이 사라지고 검색 입력·결과가 동작하는지 확인한다. 임시 검증 실행기는 저장소 밖에 보존했다.

## 결과와 증거

변경 전에는 모든 조건에서 Skeleton 18개의 `pulse`가 실행됐다. 변경 후 일반 모드의 6조건에서는 18개가 실행되고 동작 줄이기의 6조건에서는 모두 `none`이었다. 모든 조건에서 크기를 유지했고 응답 완료 후 검색 입력과 결과 갱신이 통과했다. 타입 검사·린트·포맷 검사도 통과했다. [정제 증거](../artifacts/2026-11-21-vuln-radar-feed-loading-motion.json)

## 한계와 후속 작업

실제 Safari 앱·모바일 실기기와 운영 환경은 미검증이다. 동작 설정은 브라우저 에뮬레이션을 사용했다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-21-vuln-radar-feed-loading-motion.md)
- [선행 VoiceOver 검증](2026-11-21-vuln-radar-feed-result-status.md#voiceover-발화-누락과-재검증)
