# Feed 포커스 커밋과 검색 레이블 개선

## Summary

Feed 포커스 코드와 정제 기록 8파일을 `4a610395`에 로컬 커밋했다. 이어서 검색 입력 레이블과 모바일 입력 속성을 점검하고 개선했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## Changed

- 검색 입력에 한국어·영어의 보이는 레이블을 제공하고 자동 교정·대문자화·맞춤법 검사를 끄는 속성을 적용했다.
- Enter 전 검색 갱신과 Enter의 추가 요청 0건을 확인해 검색 키 힌트는 따로 지정하지 않았다. [검증 보고서](../../verification/accessibility/2026-11-21-vuln-radar-feed-label.md)

## Notes

- 포커스 커밋의 실제 훅, 커밋 범위 공개 검수, 커밋 메시지 검사가 통과했다. 공유 목차의 다른 항목과 기존 API 작업은 커밋 범위에서 제외했다.
- 레이블 변경은 세 엔진 두 폭에서 접근성 이름·포커스·검색·필터·페이지를 확인했다. 제품 코드와 검증 문서는 로컬 미커밋이다. 새 ADR과 공통 지침 변경은 없다.
- KAN-83 검증 표와 Confluence 운영 댓글 v16을 갱신하고 재조회했다. 별도 지식 v17에 입력 중 검색과 Enter 힌트의 판단 기준을 보강했다. 본문, 공식 명세 링크와 운영 안내의 상위 경로를 확인했다. [Confluence 지식 문서](https://web-tech-service.atlassian.net/wiki/pages/19464193)

## Open Questions

모바일 실제 키보드에서 시스템 설정에 따른 입력 보정과 IME 동작은 미검증이다.

## Next

모바일 검증 시 CVE ID와 제품명 입력으로 키보드 동작을 확인한다.
