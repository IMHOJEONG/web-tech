# 프런트엔드 현대화의 main PR 준비

## Summary

사용자가 현재 현대화 작업의 main PR 준비를 요청했다. 기존 작업 트리를 보존하고 최신 main에서 별도 codex 브랜치를 만들어 커밋된 변경만 통합한다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83) · [현대화 판단 지식](https://web-tech-service.atlassian.net/wiki/pages/19464193)

## Changed

기준 main은 `4b3e221b`, 원본 현대화 head는 `05105c17`이다. 원본에만 있던 20커밋의 효과를 최신 main에 3-way 통합했다. main의 최신 카드 레이아웃과 보안 패치·목차·기존 지식을 유지한다. 원본 checkout의 미커밋·미추적 파일과 원시 자료는 포함하지 않는다.

검색 입력·Drawer의 실제 링크 포커스, Feed 키보드·상태·동작 줄이기·취소 신호, 본문 이미지 크기/지연 로딩과 Noto Sans KR을 포함한다. 화면 분리와 content-visibility는 측정 후 보류한 기록만 포함한다. 실제 포커스 계약을 설명하는 ADR-0035와 ADR-0031의 부분 대체·정책·목차 연결을 보완했다.

## Notes

충돌 7파일을 해결했다. docs-index-sections는 main의 간결한 링크 구조를 보존하고, API 클라이언트는 검증한 취소 입력·timeout 조합을 유지했다. 검증/작업 목차는 main과 현대화의 링크를 합쳤다. 기존 취소 지식 전문은 보존하고 후속 절만 연결했다. 공개 검수 manifest는 최종 통합 bytes와 대조한다.

이번 PR 준비의 통합 검사 결과는 다음과 같다.

- docs·vuln-radar·공용 UI의 typecheck와 lint 통과. docs Webpack 프로덕션 빌드와 vuln-radar Vite 프로덕션 빌드 통과.
- docs test:lib·vuln-radar test:lib·루트 test:repo 통과. 루트 회귀는 308개 통과, 실패·생략 0개다.
- 실제 getJson·Zod·브라우저 fetch를 사용하는 요청 취소 스크립트: Chromium·Firefox·WebKit 각 12개, 총 36개 통과. 실제 8초 헤더/본문 제한을 포함한다.
- 프로덕션 Drawer 회귀: Chromium 모바일·데스크톱 총 26개 통과. Tab/Shift+Tab·방향키·입력 Enter 전체 검색·IME·오류/빈 결과와 밝은/어두운 화면을 포함한다.
- 첫 Drawer 실행은 콘텐츠 없는 격리 입력에서 22개 통과·4개 실패했다. React 로컬 결과를 요구하는 4개였으며 기존 저장소의 합성 React fixture 1개만 임시 추가해 다시 빌드한 뒤 26개 모두 통과했다. 테스트·재시도·timeout은 바꾸지 않았다. 임시 fixture·캡처·로그는 PR에 포함하지 않는다.
- stage 포맷·문서 delta·catalog 검사 통과. publication과 실제 커밋 훅·푸시 범위 검사는 최종 bytes로 수행한다.

과거 검증 보고서의 실행 시점·표본과 위 검사를 구분한다. 11월 21~22일의 합성 성능·브라우저 기록을 이번 head의 운영 검증으로 표시하지 않는다. VoiceOver 후속 검증은 사용자 요청으로 생략한다. 과거 사용자 발화 확인 기록도 그 당시의 범위로 보존한다.

격리 브랜치 통합은 기존 브랜치 정책을 따른 절차이며 새로운 제품 개념을 추가하지 않아 별도 지식 문서를 만들지 않는다. Confluence의 기존 주제와 실제 원본/PR 링크를 갱신한다. 공통 지침의 새 로컬·원격 변경은 없다. main에 이미 반영된 지침·공개/비공개 콘텐츠 경계는 유지한다.

## Open Questions

기록 상태는 main PR 준비이며 Draft PR의 원격 CI 결과를 후속 확인한다. main 병합·운영 배포·실서비스 CWV·실기기·VoiceOver 후속은 이번 준비 범위 밖이다. 기존 PR의 종료·브랜치 삭제·원본 이력 재작성은 수행하지 않는다.

## Next

검증한 브랜치만 원격에 올리고 main 대상 Draft PR에 범위·검증·한계와 Jira·Confluence를 연결한다. 병합은 별도 사용자 승인 후 저장소의 squash 사전검사를 따른다.
