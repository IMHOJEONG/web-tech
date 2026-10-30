# 모바일 메뉴와 카테고리 탐색 검사 동기화

## Summary

PR #66의 잔여 flaky 2건을 조사하고 지연 조건으로 재현했다. 앱 동작을 바꾸거나 재시도를 늘리지 않고 키보드 입력 준비와 라우트 commit을 각각 기다리도록 수정했다.

## Changed

- shell focus/contrast: SSR-disabled drawer의 enabled 확인 후 Enter, 기존 초점·대비 검사 유지.
- category localization: 클릭 전 탐색 대기를 등록하는 `followLink`, 기존 URL·번역된 제목 검사 유지.
- JavaScript·RSC 응답 보류를 이용한 회귀 검사와 원래 실패 방식의 음성 대조 추가.
- [검증 보고서](../../verification/accessibility/2026-10-27-navigation-readiness.md)에 원격 CI 관측과 로컬 재현·한계를 구분했다.

## Notes

- 기준 head `edd297a`, 현재 로컬 수정이며 커밋·푸시·배포하지 않았다.
- 관련 검사90통과·36제외, 전체 반응형372통과·54제외, 모두 실패·flaky·재시도0. 저장소156개, 앱 타입·변경 파일 lint·문서 delta 검사도 통과했다. 원본 정제본과 해시는 검증 보고서에서 연결한다.
- ADR 검토: 기존 결정 유지. ADR-0003·0005 및 로딩 UX 정책의 제품 책임·계약 변화가 없는 테스트 수정이다.
- [KAN-39](https://web-tech-service.atlassian.net/browse/KAN-39) 요약 댓글10029와 [기존 Confluence 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817) v168에 결과·미검증 범위를 기록하고 재조회했다. Jira 3열 표·이전 실패 이력과 Confluence 기존 본문 보존을 확인했다. 미푸시 문서를 원격 링크로 만들지 않았다.

## Open Questions

CI 최초 실패 당시 hydration·서버 응답의 정확한 지연 분해는 보관 로그만으로 확정할 수 없다. 통제한 재현과 동일하다고 과장하지 않는다.

## Next

사용자 승인 후 커밋·푸시 및 새 PR head의 무재시도 CI를 확인한다. 전체 원본은 용량 정책상 로컬 임시 보관만 가능하므로 장기 증거가 필요하면 접근 제어된 CI artifact로 보관한다.
