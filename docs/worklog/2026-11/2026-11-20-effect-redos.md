# Effect TemplateLiteral 보안 패치

## Summary

Dependabot #363의 Effect ReDoS를 최신 main 기반 별도 브랜치에서 수정했다. 직접·Prisma 간접 사본을 3.22.4로 통합하고 제한된 합성 회귀와 실제 소비자 호환을 검사했다. 이후 사용자 요청으로 작업 단위 커밋·푸시와 main 대상 PR의 CI·리뷰 확인을 진행하며 main 병합·운영 반영과 구분한다.

## Changed

- catalog 하한 `^3.22.1`과 3.x 대상 override를 추가하고 lockfile을 pnpm으로 갱신했다. 다른 패키지 버전·앱 소스·배포 설정은 유지했다.
- 보안 하한·실제 설치본·격리 동작·Prisma 설정 회귀 6개와 재현 fixture를 추가했다. 기존 저장소 테스트 명령이 새 테스트도 실행한다.
- [검증 보고서](../../verification/security/2026-11-20-effect-redos.md), 검증·월별 목차를 연결했다.
- [KAN-85](https://web-tech-service.atlassian.net/browse/KAN-85)로 기존 Hono·Next 권고와 분리했다. 기존 main의 미커밋 변경·다른 작업 트리·초안·NAS는 유지했다.

## Notes

- 구버전 두 경로의 제한 시간 초과와 수정본의 정상 종료를 대조했다. 저장소 304개·프론트 36개·백엔드 unit 67개·HTTP 12개, 양쪽 소비자 빌드·타입·lint가 통과했다. 상세 조건·감사 0건·설치 환경 복구는 보고서를 따른다.
- 재사용할 교훈은 기존 [보안 업데이트 지식](https://web-tech-service.atlassian.net/wiki/pages/19496961) v2에 추가하고 본문·근거를 재조회했다. 직접·간접 버전을 함께 확인하고, 느린 parser 뒤의 길이 필터와 동일 이벤트 루프 timeout을 방어로 오해하지 않는 기준이다. 실행 이력은 별도 [Confluence 작업 요약](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=20578306)에 기록하며 지식 본문을 복제하지 않는다.
- 기존 의존성 보안 하한 정책을 적용한 수정으로 새 아키텍처·공개 API 결정은 없어 ADR을 추가하지 않았다.
- 원시 증거는 저장소 밖에 보관하며 정제 문서 4개는 최종 파일별 공개 검수 후 승인 해시만 등록한다. 실제 커밋·PR과 CI·리뷰 결과는 기존 Jira·Confluence에 갱신한다. 존재하지 않는 원격 링크나 사전 성공 결과를 기록하지 않는다. 기존 미커밋 작업·초안·NAS는 제외한다.

## Open Questions

- 실제 공개 요청이 취약 schema에 도달하는 경로·공격 이력은 미확정이며 이번 감사·회귀만으로 노출 여부를 단정하지 않는다.

## Next

최종 공개 범위 검수 후 작업 단위로 커밋·푸시하고 main 대상 PR의 최신 head CI·리뷰를 확인한다. main 병합·운영 배포는 이번 요청 범위가 아니며, 이후 별도 승인된 main 반영과 동일 SHA 배포 뒤 Dependabot #363 재평가를 확인한다.
