# 원격 문서에 공용 본문 작성 규칙 적용

## Summary

사용자 지정 순서의 2번을 적용했다. CI 연결 변경만 `af6f171`로 먼저 커밋하고, 본문 검증은 별도 미커밋 작업으로 진행했다.

## Changed

- 로컬 본문 규칙을 공용 계약 패키지의 순수 TypeScript 함수로 옮기고 로컬 CLI는 파일·frontmatter 어댑터로 남겼다.
- NestJS의 published 파싱 경로에 같은 검사를 연결해 목록과 상세에 일관되게 적용했다. warnings와 failures의 경계는 유지했다.
- HTML 주석 코드 예시, 긴 펜스·틸드, 공개 제외·재수정·오류 응답 비노출 회귀 테스트를 추가했다.
- [정책](../../architecture/docs-content-authoring-markup-policy.md)과 contributor guide에 기존 NAS 글의 배포 영향을 명시했다. 기존 작성 규칙의 구현 보강이므로 별도 ADR은 만들지 않았다.

## Notes

[검증 보고서](../../verification/content/2026-09-26-shared-body-validation.md)에 실행 명령·결과와 초기 실패 수정 내역을 남겼다. NAS 파일이나 배포 이미지는 변경하지 않았다. 다른 미커밋 계측·사용자 변경은 보존했다.

## Open Questions

실제 NAS 글의 위반 여부와 반복 요청 시 검사 비용·경고량은 배포 전후 별도 확인해야 한다.

## Next

다음은 4번 검색 제출 방식 통일 검토, 이후 5번 ADR 배포 검증 근거 연결이다. 본문 검증은 새 백엔드 이미지 배포 및 기존 revalidation을 거쳐야 운영에 적용된다.
