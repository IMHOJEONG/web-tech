# JavaScript 현대화 후보 검증과 항목별 지식 관리

## Summary

사용자가 제시한 Modern Web Guidance 5개 지점을 실제 소스·표준과 대조하고, 시간 제한·배열 복사·외부 Promise 완료 제어를 각각 독립 문서로 정리했다. 개선 후보 4건과 Set 변환 오탐 1건을 구분했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)의 후속 작업으로 기록하며 이전 apps/docs 스캔 이력은 보존한다.

## Changed

- 저장소 구현 해설: [취소·시간 제한](../../knowledge/infra-tooling/javascript-abort-timeout.md), [배열 복사·정렬](../../knowledge/infra-tooling/javascript-copying-arrays.md), [Promise 완료 제어](../../knowledge/infra-tooling/javascript-promise-with-resolvers.md). 개념·배경·원리·프로젝트 사례·판단 기준·주의점·원본 근거와 재검토 조건을 분리했다.
- 재사용 지식: Confluence의 [취소·시간 제한](https://web-tech-service.atlassian.net/wiki/pages/20676655), [배열](https://web-tech-service.atlassian.net/wiki/pages/20119630), [Promise](https://web-tech-service.atlassian.net/wiki/pages/20250653). [기존 상위 주제](https://web-tech-service.atlassian.net/wiki/pages/19464193) 하위에 두고 탐색 링크를 추가했다. 로컬 해설 전문을 복제하지 않고 개념·판단 요약과 실제 원격 소스를 연결했다.
- 검증 원본: [재현 스크립트](../../../scripts/verify-modern-javascript-guidance.mjs), [검증 보고서](../../verification/integration/2026-11-20-modern-javascript-guidance.md), [정제 JSON](../../verification/artifacts/2026-11-20-modern-javascript-guidance.json). 지식·검증·artifact·월별 목차를 갱신했다.

## Notes

- 기준 HEAD는 `c6465f48c96aef681a42de77a584b25e69fd8525`, 작업 브랜치는 `feature/modern-web-guidance`다. 시작 시 다른 작업의 미커밋·미추적 파일이 있었으며 삭제·되돌리기·스테이징 없이 보존했다.
- Node 24.22.1·TypeScript 6.0.3의 합성 16조건이 통과했다. 상세 결과와 한계는 검증 보고서가 원본이다. 격리한 lib 진단을 실제 프로젝트 전체 타입 실패로 확대하지 않았다.
- 재현 스크립트는 예제 경로가 저장소 ignore 대상인 점을 확인해 기존 검증 도구들과 같은 `scripts/`에 배치했다. 공통 ignore 정책은 변경하지 않았다.
- 지식 승격 대상: 배열과 iterable의 차이, 시간 제한 오류 이유, Promise executor와 외부 setup의 예외 차이는 다음 교체 작업에도 재사용할 판단 기준이다. 진행 댓글과 별도 주제 문서로 나눴다.
- 문서 구조 검사: 인덱스 대신 작업 트리 view를 기존 `validate()`에 전달해 문서 11개의 구조·상대 링크·목차·artifact 오류 0건을 확인했다. 선택 파일 12개 Prettier와 `git diff --check` 통과. 검토 소스 8파일의 해시 일치·인덱스 미변경도 확인했다.
- 지식 문서 저장 확인: 주제 3개와 상위 페이지의 게시 버전 2 본문·근거·재현 검사 경로·탐색 링크를 재조회했다. 각 주제의 ancestors에서 운영 안내 → 웹 현대화 판단 → 개별 주제의 경로를 확인했다.
- 작업 기록은 Jira 댓글 `10120`을 갱신한 뒤 HTML로 재조회했다. `항목 | 상태 | 결과 및 남은 작업`의 실제 표·헤더와 주제 링크 3개를 확인했으며 기록 대기는 없다. 기존 댓글 `10116`과 이슈의 검토 중 상태는 보존했다.
- `search-company-knowledge`로 기존 Jira·Confluence 주제를 찾고 Modern Web Guidance `js`와 WHATWG·ECMAScript·TypeScript 공식 자료를 대조했다. 애플리케이션 구조·데이터 흐름·공개 계약·공용 컴포넌트 책임은 변경하지 않아 새 ADR은 추가하지 않았다.
- 공통 지침: 기존 AGENTS·문서화/이슈 추적 규칙을 적용했으며 이번 작업에서 지침 자체는 수정하지 않았다. 로컬 문서·검사 스크립트는 미커밋·미푸시이고 원격 Git·main·배포 반영은 없다.

## Open Questions

- 실제 API를 채택할 때의 지원 브라우저·오류 메시지 계약·각 스크립트 타입 진입점은 구현 범위에서 다시 확인해야 한다.

## Next

- 코드 적용 요청이 있으면 항목별 상태를 제안에서 실제 적용으로 바꾸는 별도 변경과 소비처 회귀 검사를 수행한다. 문서 작성만으로 앱 적용 완료를 표시하지 않는다.
