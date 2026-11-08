# 태블릿 필터 간헐 실패 후속 안정화

## Summary

main `d04a7da`의 별도 작업 공간에서 PR #88의 tablet/ko 정렬 클릭 실패를 조사했다. 실제 로딩 골격을 완성 화면으로 오인하는 selector를 통제 재현했고 테스트의 준비 조건을 강화했다. 기존 보완 PR #71이 미병합이라는 사실을 확인했으며 앱 결함 수정이나 이미 배포한 보완의 회귀로 표현하지 않는다.

후속 사용자 요청으로 기존 PR #71의 이력을 보존해 최신 main과 통합하고, 기존의 더 강한 회귀는 남긴 채 닫힌 fallback 검사를 별도로 추가한다. 기존 공개 문서·정제 집계 JSON의 재검수와 이번 코드·정제 문서의 작업별 커밋·푸시도 승인받았다. main 병합·운영 배포는 이번 범위가 아니다.

전체 이력 검사에서 정책 이전4개 커밋이 차단돼 그대로 푸시하지 않았다. 추가 사용자 승인으로 옛 head의 로컬 보관 ref를 만들고 최신 main 위에 검수된 같은 파일·회귀를 새 커밋으로 재구성한다. 정확한 옛 head에 대한 lease 갱신만 승인받았으며 main·다른 원격 브랜치·검사 규칙은 변경하지 않는다.

## Changed

- `visibleDocsIndexFilters`를 완성 결과가 있는 main으로 제한하고 필터의 실제 open을 확인한다.
- 선택 칩 수·정렬 문구·포커스·키보드 닫힘 등 기존 계약을 더 엄격하게 검사한다.
- 실제 응답 bytes를 유지하고 완료 segment만 보류하는 helper와 ko/en 회귀를 추가했다. DOM 직접 교체·강제 클릭·고정 sleep은 사용하지 않는다.
- [검증 보고서](../../verification/resilience/2026-11-08-docs-tablet-filter-readiness.md)와 역할별 목차를 추가했다. 앱·공통 설정·검사 기준·공개 승인 manifest는 변경하지 않았다.

## Notes

- [KAN-42](https://web-tech-service.atlassian.net/browse/KAN-42)를 재사용하고 [Confluence 후속 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=15925302)을 연결했다. 기존 페이지 본문·미게시 편집과 이전 댓글 이력은 보존한다.
- 수정 전 통제 회귀1개 실패, 수정 후 태블릿8개·ko/en 세 viewport의 핵심120회·관련75개가 통과했다. 관련6개 skip은 기존 모바일 전용 조건이며 새 skip·retry·timeout 완화는 없다. 범위가 겹치므로 독립 테스트 총수로 합산하지 않는다.
- docs 타입·변경 테스트4개의 ESLint 통과. package manager·lockfile과 CI timeout·retry·skip은 유지했다.
- 반복 중 native details의 hydration attribute mismatch 경고를 별도로 관측했다. 결과 DOM 준비와 React hydration 완료는 다르며 console 오류0이나 제품 경고 해결까지 완료했다고 주장하지 않는다.
- 기존 PR의 더 강한 회귀와 결합한 핵심180회·관련81개도 재시도 없이 통과했다. 관련6개 skip은 기존 모바일 전용 조건이다. 이는 앞선 main 조사본120회·관련75회와 다른 통합본 검사이며 중복 합산하지 않는다. 옛 head `e8c6fff8`은 `codex/archive-pr71-before-rebuild-20261108`로 보관한다.
- 실제 원격 API·NAS·토큰을 사용하지 않는다. 원시 로그·error-context·캡처는 checkout 밖에 보관하고 공개 artifact로 추가하지 않는다.
- 재구성한3커밋을 PR #71에 푸시했고 첫 head `12a0a3a`의22개 원격 검사는 모두 성공했다. CodeRabbit의 유효한 문서 의견1건에 따라 격리 worktree에서 red용 한 줄 변경·green 전 복원을 명시하고 두 실패→같은 두 통과를 재검증했다. 상세 조건과 한계는 검증 보고서에 남긴다. 후속 문서 커밋의 새 CI·리뷰는 별도로 확인한다.
- 구조·데이터 흐름·공개 계약·공용 UI 책임은 달라지지 않아 새 ADR은 만들지 않는다. 테스트의 준비 판정과 기존 검증 강화 범위다.

## Open Questions

원래 CI에서 DOM 교체를 일으킨 특정 호출자는 trace 부재로 미확정이다. PR #71 통합·푸시는 완료했으며 native details hydration 경고는 별도 후속이다.

## Next

재현 절차 보완도 재검수·해시 갱신 후 별도 커밋으로 일반 fast-forward 푸시하고 새 head의 원격 CI·CodeRabbit을 확인한다. 비조상 예외는 앞선 PR #71 갱신1회에만 적용했으며 반복하지 않는다. 운영 배포·NAS 변경은 하지 않으며 기존 다른 작업의 미커밋 문서4개·조사본·stash는 원래 위치에 보존한다.
