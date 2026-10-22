# vuln-radar 전체 통계와 Feed 표본 분리

## Summary

Overview의 P0·P1·KEV 숫자가 최대25개 Feed 결과에 제한되던 문제를 수정했다. 전체 DB 집계와 목록을 분리하고 실제 로컬 PostgreSQL·브라우저 회귀를 통과했다. 기준 main `527d4b0`, 브랜치 `codex/vuln-radar-overview-counts`다.

## Changed

- Overview는 우선순위·KEV 여부별 한 번의 그룹 집계로 전체 건수·P0·P1·KEV를 계산한다. 기존 카드 ID를 유지하고 전체 건수를 추가한다.
- 프런트 통계를 동일 Overview 응답에 연결하고 목록이 상위25개 중 일부임을 한글·영문으로 안내한다. KEV에 권고문 행 수를 대입하던 fallback을 제거했다.
- 신규 백엔드5개·프런트4개·통합2개 회귀를 추가했다. 프런트 로직 검사를 기존 CI job에 연결했다.
- [집계 계약](../../architecture/vuln-radar-overview-statistics.md), [실행 결과](../../verification/integration/2026-10-21-vuln-radar-overview-statistics.md)와 원본 증거를 추가했다.

## Notes

별도 작업 트리 `/tmp/web-tech-vuln-stats-20261021`에서 기존 블로그 변경·TCP 관련 작업·이전 Preview 보고서를 보존했다. .env·운영 토큰은 복사하지 않았다. 회귀는 임시 로컬 DB만 사용하고 생성한 자원을 정리했다. 단순 통계 의미 오류 수정으로 판단해 새 ADR은 강제하지 않고 공개 집계 계약을 문서화했다.

Jira 생성 첫 요청은 시간 초과됐지만 추적 ID로 재검색해 미생성을 확인한 뒤 재시도해 [KAN-23](https://web-tech-service.atlassian.net/browse/KAN-23)을 만들었다. 결과 3열 표를 댓글에 저장하고 검토 중으로 전환했다. [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira) v31에 변경 이유·로컬 검증과 미배포 범위를 연결하고 두 원격 기록을 재조회했다. 저장소 파일은 아직 로컬 상태이므로 존재하지 않는 GitHub 문서 URL을 만들지 않는다. 저장소 도구 회귀63개·문서 링크/템플릿·변경 파일 포맷·diff 검사도 통과했다.

## Open Questions

운영 규모에서 집계 쿼리 비용 측정과 빈 Feed의 기존 mock fallback UX는 남아 있다. 새 전체 집계를 확인하려면 backend 반영이 필요하며 frontend만 배포해서 완료로 판단하지 않는다.

## Next

후속 사용자 요청으로 API·화면·회귀/CI·문서를 작업별 로컬 커밋으로 분리했다. API `31ddb0a`, 화면 `c2b1d61`, 회귀/CI·합성 증거 `1ca8352`이며 문서는 이 별도 문서 커밋에 포함한다. 각 커밋은 staged 포맷·문서 검사 및 commitlint 훅을 통과했다. 푸시·PR·배포는 요청하지 않아 수행하지 않았다.

다음 우선순위인 KEV 점수·대응 상태 표현은 별도 작업으로 진행한다. 이 통계 커밋에 해당 후속 코드나 기존 블로그 변경을 섞지 않는다. 병합 후 Railway backend·Vercel Preview를 같은 변경 기준으로 검증하고 Production 전환 여부는 별도 결정한다.
