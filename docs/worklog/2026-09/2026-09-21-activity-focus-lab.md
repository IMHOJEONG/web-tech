# Activity와 Sheet 포커스 별도 실험

## Summary

Activity 숨김을 Dialog 닫힘 또는 실제 unmount와 동일하게 취급할 수 있는지 별도 브라우저 실험으로 확인했다. 운영 UI와 공개 콘텐츠 상태는 변경하지 않았다.

## Changed

- docs 앱에 `test:activity-lab`, 전용 Playwright·TypeScript 설정, React fixture와 8개 시나리오를 추가했다.
- Strict Mode off/on, 실제 unmount, 숨겨진 대상 focus, cleanup focus, Sheet 포털 잔존과 외부 배치 대안을 비교했다.
- [검증 보고서](../../verification/content/2026-09-21-activity-focus.md)에 실제 관측, 초기 실패, 검증 범위와 재실행 명령을 정리했다.
- 런타임 의존성·환경 변수·배포 라우트를 추가하지 않았다. 기존 Sheet 구현도 수정하지 않았다.

## Notes

전용 타입 검사와 브라우저 검사 16개가 통과했다. 문제 동작 재현도 기대값에 포함하므로 운영 접근성이 모두 통과했다는 뜻은 아니다. 상세 결과와 원본 JSON은 검증 보고서에서 연결한다.

이번 실험은 구조 도입을 확정하는 정책이 아니므로 ADR을 추가하지 않았다. 운영 코드에 Activity와 Overlay 배치를 도입할 때 기존 ADR 및 실제 애니메이션 동작을 다시 검토한다.

## Open Questions

실제 애니메이션과 production React에서도 외부 배치 대안이 같은 결과를 내는지, 순차 닫힘 방식과 비교했을 때 어떤 UX가 적절한지 확인이 필요하다.

## Next

사용자 검토 후 지원 브라우저·보조 기술과 애니메이션 조건을 추가한다. 검증 범위를 구분해 포커스 심화 글에 반영할지 결정한다.
