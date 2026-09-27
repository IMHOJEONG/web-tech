# Docs CI 로그와 배포 동작 후속 점검

## Summary

`feature/docs` 배포 뒤에도 남은 스트림·hydration 로그를 실패/경고/미분류로 구분하고, 실제 배포 상호작용을 점검했다.

## Changed

- CI·배포 검증 기록에 hydration 경고 재현 한계와 모바일/데스크톱 상호작용 결과를 추가했다.
- 모바일 drawer 종료 뒤 header·main의 `aria-hidden`이 남지 않는 E2E 회귀 검사를 추가했다.

## Notes

- drawer 회귀 테스트는 4 passed. 배포에서 Web 필터 이력·새로고침과 헤더/본문 검색 경로가 정상 동작했다.
- `The destination stream closed early.` 8건은 요청별 증거가 없어 `unknown`으로 유지한다. hydration 경고도 작은 로컬 테스트에서 재현되지 않아 확정 원인이나 수정 완료로 표기하지 않는다.
- [검증 기록](../../verification/cache/2026-09-27-docs-ci-log-review.md)에 명령과 제약을 남겼다.
- 후속 A/B 계측에서 RSC prefetch 활성 시 상세 스트림 오류 2건, Playwright에서 prefetch를 차단했을 때 0건을 확인했다. 이는 로컬 fixture의 연관성 증거이며 운영의 종료 주체까지 확정하지 않는다.
- 설치된 Playwright의 caret 숨김 코드와 Base UI modal의 `aria-hidden` 적용 코드를 확인해 두 hydration 경고의 DOM 변경 주체를 분리했다.

## Open Questions

- 전체 CI 부하에서 drawer 상호작용과 페이지 hydration의 선후 관계는 무엇인가?
- 검색 input의 `caret-color` 차이는 스크린샷 처리와 직접 관련이 있는가?

## Next

- 요청별 계측을 Preview에서 실행해 스트림 종료 원인을 분류하고, hydration 경고가 반복되면 해당 시점의 DOM·이벤트 타임라인을 수집한다.
