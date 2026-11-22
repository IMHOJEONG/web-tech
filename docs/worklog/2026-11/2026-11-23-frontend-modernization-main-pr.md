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

### PR #111 CI와 코드 리뷰 후속

2026-11-23 KST에 원격 head `fe88de8e`의 [CI](https://github.com/IMHOJEONG/web-tech/actions/runs/45040120701)를 확인했다. CI는 최종 실패다. responsive 모바일·태블릿·데스크톱은 각각 한·영 hydration 2개가 이전 combobox 선택자를 찾아 실패했고, article-production은 본문 검색 제출·요청 종료·legacy fragment 3개가 실패했다. 집계 Test도 실패다. lint·typecheck·단위/계약·공용 UI·오프라인·CRP·문서·컨테이너와 두 Vercel Preview는 성공했다. CodeRabbit은 Draft 자동 리뷰를 생략했다.

[등록한 리뷰](https://github.com/IMHOJEONG/web-tech/pull/111#pullrequestreview-6013143798)는 P1 hydration 선택자 갱신 누락과 P2 이미지 크기 플러그인의 과도한 배포 tracing이다. 기본 Turbopack은 동적 realpath 두 곳에 whole-project 경고를 냈으며 CI에서도 동일하다. 로컬 preview page NFT는 1,431항목·비의존성687개·테스트 파일87개를 포함했다. 앱 지침·Playwright 설정·합성 콘텐츠 서버도 들어갔다. 민감정보 유출을 관측한 결과는 아니다.

본문 production 실패를 좁혀 로컬 실행했다. 첫 6개 검사는 3통과·3실패였다. 본문 검색은 두 폭 모두 통과했고 요청 complete는 모바일 timeout·데스크톱 통과였다. 앵커 두 실패는 필요한 합성 문서가 없어 404였으므로 CI 앵커 재현으로 쓰지 않는다. 기존 합성 Node 문서1개를 임시 추가해 재빌드한 두 번째 실행에서는 두 폭 모두 reload 후 위치 조건이 실패했다. PR 도입 회귀인지 main의 기존 문제인지는 대조 검증하지 못했다. 임시 문서는 제거하고 테스트 서버3111/3112 종료를 확인했다. 재시도·timeout·제품 소스는 수정하지 않았다.

GitHub 연결 도구의 리뷰 작성403은 CLI로 처리하고 실제 두 인라인 의견과 COMMENTED 상태를 재조회한다. Jira 기존3열 표와 Confluence 운영 기록을 갱신하며, 동적 파일 경로와 배포 추적의 구분은 기존 현대화 지식 주제의 제안 상태로 정리한다. 공통 지침의 로컬/원격 변경과 새 ADR은 없다. 이 후속 기록은 로컬 미커밋이며 원격 검증 기준은 위 head다.

### 리뷰 수정과 CI 재검증

사용자가 리뷰2건과 나머지 CI 실패의 수정·검증 기록·커밋·푸시·새 head CI 확인을 요청했다. hydration 선택자와 이미지 파일 tracing을 수정하고, 교체될 fallback 입력의 값 소실·뷰포트 밖 링크의 프리페치 대기·종료 로그 저장 경쟁·초기 fragment 스크롤 누락을 분리했다. 실제 폼이 준비된 뒤 native GET 검사도 실행하도록 했다. 재시도·timeout·검증 기준은 낮추지 않았다.

[정제 검증 보고서](../../verification/integration/2026-11-23-frontend-modernization-pr-review.md)에 원인·수정·검사·한계를 연결한다. 최종 로컬/원격 판정은 해당 보고서와 Jira에 구분한다. 폰트 준비 후 위치 복구는 사용자 입력 시 취소하고, source ID·목차·일반 링크 계약은 유지한다. 필요한 public 이미지는 명시적 include로 유지하고 realpath 경계 검사도 보존했다.

기존 검색·앵커 정책의 구현 보완으로 새 ADR을 만들지 않았다. 기존 Confluence 지식 주제의 tracing 제안을 적용 상태로 보완하고, 일시적 화면과 준비된 화면의 구분·프리페치 조건·관측 완료의 판단을 기존 주제에 승격한다. 공통 지침의 새 로컬/원격 변경은 없다. 원본 checkout의 다른 변경은 보존하며 main 병합·운영 배포·VoiceOver 후속은 수행하지 않는다.

## Open Questions

리뷰와 로컬 회귀를 보완한 후 새 원격 SHA의 CI 결과를 확인한다. main 병합·운영 배포·실서비스 CWV·실기기·VoiceOver 후속은 이번 준비 범위 밖이다. 기존 PR의 종료·브랜치 삭제·원본 이력 재작성은 수행하지 않는다.

## Next

사용자 요청 범위의 수정·정제 기록만 커밋·푸시하고 새 SHA의 CI를 확인한다. 원격 결과는 PR·Jira·Confluence에서 동일 SHA로 연결한다. 병합은 별도 사용자 승인 후 저장소의 squash 사전검사를 따른다.
