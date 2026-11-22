# VoiceOver 검증 커밋과 Feed 로딩 모션 개선

## Summary

사용자가 VoiceOver로 31건·0건 발화를 확인했다. 결과를 반영한 수정 코드와 기록 5파일을 `5ef22d86`에 로컬 커밋했다. 다음 주제로 Feed 로딩 모션을 점검하고 동작 줄이기 설정을 반영했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## Changed

Feed의 Skeleton 선언 6곳을 `motion-safe:animate-pulse`로 변경했다. 실제 화면의 로딩 모션과 완료 후 검색을 검증했다. [검증 보고서](../../verification/accessibility/2026-11-21-vuln-radar-feed-loading-motion.md)

## Notes

- VoiceOver 커밋의 첫 포맷 검사 실패를 해당 기록 3파일의 포맷 정리로 해결했고 검수 해시를 다시 계산했다. 실제 커밋 훅과 커밋 범위 공개 검수·commitlint가 통과했다.
- 모션은 기존 no-preference 원칙을 추가 소비 화면에 적용한 결과다. 별도 모션 지식을 중복 생성할 필요가 없었다. 기존 VoiceOver 지식에는 사용자 발화 통과와 두 변경의 기여를 독립 검증하지 않았음을 보강했다.
- 이번 모션 수정은 로컬 미커밋이다. 공통 지침과 공개 계약 변경은 없으며 새 ADR은 필요하지 않았다.
- KAN-83 검증 표와 Confluence 운영 댓글 v21을 갱신하고 재조회했다. 별도 지식 v21의 사용자 발화 결과와 근거 링크를 재조회했고 상위 운영 안내 경로를 확인했다. [지식 문서](https://web-tech-service.atlassian.net/wiki/pages/19464193)

## Open Questions

실기기 검증은 미실행이다.

## Next

다음 기기 검증에서 동작 줄이기를 켜고 로딩 화면과 완료 후 검색을 대조한다.
