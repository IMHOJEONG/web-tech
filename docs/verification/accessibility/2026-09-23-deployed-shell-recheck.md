# 공개 배포 접근성 후속 재검증

## 대상과 조건

- 대상: `https://heap-forge.app`, 검사 시작 2026-09-23 21:54:51 KST, 약 123초.
- 테스트 코드 기준: `a3cc08d`의 기존 접근성 테스트. 이번 검색·About 변경의 운영 검증은 아니다.
- Node 24, Playwright Chromium, 390×844·1280×800. worker 1, retry 0.
- 공개 도메인의 정확한 배포 커밋은 이번 검사에서 확정하지 않았다. 재배포·캐시 삭제·webhook 호출 없이 읽기·메뉴·검색 조작만 수행했다.

## 재현 방법

[이전 보고서](2026-09-23-deployed-shell.md#재현-방법)의 임시 설정을 그대로 사용했다. baseURL은 공개 사이트이고 webServer는 없으며 테스트 파일·화면 크기·타임아웃은 동일하다.

```sh
mise exec -- pnpm --filter docs exec playwright test \
  --config=/tmp/docs-accessibility-production.config.cjs
```

## 결과와 증거

- 24개 중 20개 통과, 4개 조건부 제외, 실패·재시도 0개.
- 이전에 실패했던 라이트·다크 × 모바일·데스크톱의 포커스·대비 4개 모두 통과했다. 기대 outline은 solid 2px이며 기존 대비 기준을 완화하지 않았다.
- 본문 바로가기, 검색 Escape·포커스 복귀, 상세 main/h1, 모바일 회전 후 overlay 제거도 통과했다.
- 제외 4개는 데스크톱 프로젝트에 해당하지 않는 모바일 회전 검사다.
- [실행 결과 요약 JSON](../artifacts/2026-09-23-deployed-shell-recheck.json)은 Playwright 보고서에서 테스트명·프로젝트·상태·시간만 추출한 자료다. 이전 실패 artifact를 덮어쓰지 않았다.

## 한계와 후속 작업

현재 공개 화면에서 CSS 누락 증상은 재현되지 않았다. 어떤 배포나 캐시 변경이 해결했는지 인과관계는 확정하지 못했다. 이 확인으로 전체 WCAG 적합성, production Tooltip, 실제 스크린 리더·Safari·Firefox 검증까지 완료했다고 해석하지 않는다.

## 관련 문서

- [이전 운영 실패와 로컬 성공](2026-09-23-deployed-shell.md)
- [ADR 후속 구현과 공용 UI 준비 점검](../../worklog/2026-09/2026-09-23-adr-followup-improvements.md)
