# main 기준 vuln-radar 통합 검증

## Summary

main d4a89c0에서 codex/vuln-radar-integration-verification을 만들고 실제 프론트·백엔드를 격리 DB로 검증했다. 최종 통합 시나리오 13개가 통과했다. 앱 런타임·기존 배포 브랜치는 수정하지 않았다.

## Changed

- [TypeScript 검증 도구](../../../scripts/verify-vuln-radar-integration.mts)·[전용 타입 설정](../../../tsconfig.vuln-integration.json)과 루트 verify:vuln-radar:integration 명령을 추가했다.
- DB·Prisma·Nest·Vite production preview·Chromium과 배포 프록시 함수의 로컬 호출을 검사했다.
- 절차는 [runbook](../../runbooks/vuln-radar-local-integration-verification.md), 결과·한계는 [보고서](../../verification/integration/2026-10-19-vuln-radar-local-integration.md), 원본 데이터·캡처는 보고서의 artifact로 분리했다.
- 역할별 목차·월별 목차를 갱신했다. 앱 tsconfig·의존성·lockfile·CI는 변경하지 않았다.

## Notes

- 통합 13개·백엔드 단위 26개·프론트 모델 6개·저장소 도구 테스트 45개가 통과했다. 두 앱 빌드·타입·린트도 성공했다. 상세 증거는 검증 보고서에 유지한다.
- 초기 ts 모듈 경고를 도구만 mts로 지정해 해소했다. 루트 전체 ESM 전환이나 Nest decorators에 erasableSyntaxOnly를 적용하지 않았다.
- 별도 PostgreSQL의 합성 데이터만 사용했다. database 출처 assertion으로 mock fallback을 실제 DB 성공으로 오인하지 않게 했다.
- 실제 서버 중단과 연결된 proxy 오류를 검사했으며 일반 운영 오류를 무시하는 기준으로 삼지 않는다.
- 토큰·비밀번호를 증거에서 제외했고 임시 자원을 정리했다. 기존 배포 브랜치와 보관 초안은 유지한다.
- 합성 오류 토큰의 패턴 검사 오탐을 짧은 시험 문자열로 해소했다. 생성 JSON의 포맷을 맞추되 파싱된 측정 데이터가 바뀌지 않았음을 확인했다. 최종 문서·포맷·비밀정보 패턴 검사도 통과했다.
- 초기 범위는 로컬 검증·문서화였다. 이후 사용자 요청에 따라 이 통합 검증 작업만 커밋·push하고 main 대상 PR로 제출한다. 기존 배포 브랜치·보관 초안·별도 정리 기록 브랜치는 포함하지 않는다. 운영 전환은 수행하지 않는다.

## Open Questions

실제 upstream 수집·운영 DB migration·Vercel 플랫폼·타 브라우저는 미검증이다. CI 연결 여부는 별도 과제다.

## Next

PR의 CI·리뷰를 확인한 뒤 main 반영 여부를 결정한다. 이 통합 도구는 아직 CI에 연결하지 않았으므로 로컬 결과와 원격 CI 결과를 구분한다. 운영 검증은 Production Branch·백엔드 이미지 SHA·환경변수를 확인하고 별도 승인된 범위에서 진행한다.
