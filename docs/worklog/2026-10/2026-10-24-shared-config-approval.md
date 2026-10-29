# 공통 설정 사람 승인 게이트와 AI 권한 분리 준비

## Summary

사용자가 GitHub 승인 게이트 + AI 전용 신원 방식을 선택했다. 공개 GitHub.com에서는 임의 pre-receive 대신 CODEOWNERS와 서버 branch ruleset을 사용한다.
현재는 로컬 구현·회귀 완료이며 원격 강제화와 AI 인증 분리는 아직 완료하지 않았다.

## Changed

- `.github`에 보호 경로 원본·CODEOWNERS·비활성 추가 ruleset과 read-only 검사 workflow를 추가했다.
- TypeScript 검사 CLI와11개 회귀, 전용 타입 설정을 추가했다. CLI는 활성화/승인/우회 API를 제공하지 않는다.
- [정책](../../process/shared-configuration-approval.md)·[ADR](../../architecture/adr-0022-shared-configuration-approval.md)·[사람이 수행할 전환 절차](../../runbooks/ai-github-identity-isolation.md)를 연결하고 AGENTS 지침을 보완했다.
- 기존 블로그 작업은 원래 트리에 두고 최신 main16c51e9 기준 별도 `codex/shared-config-approval-20261024`에서 작업했다.
- App 등록 후 [신원 분리 절차](../../runbooks/ai-github-identity-isolation.md)에 새 일반 계정/VM·독립 clone·커넥터/개인키/발급기 경계와 실제 완료 조건을 추가했다. OS 계정/키를 생성한 것은 아니다.

## Notes

정책11개 포함 저장소119개·전용 타입 검사를 통과했다. 포맷/문서 검증과 초기 실패·원격 조회 한계는 [검증 보고서](../../verification/security/2026-10-24-shared-config-approval.md)에 연결한다.
Jira [KAN-33](https://web-tech-service.atlassian.net/browse/KAN-33)은 검토 중이며 [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817)에 로컬/미적용 범위를 기록한다.
Jira3열 댓글10022와 Confluence v84를 재조회했다. 표 헤더 문단·스마트 링크의 서버 정규화 외 기존 본문 보존과 미완료 상태를 대조했다.
기존 main CI 규칙·사람 OAuth/개인키·다른 세션 로그인은 바꾸지 않았다. 커밋·푸시·PR·배포는 하지 않았다.
후속 사용자 보고는 `web-tech-github-app` 등록·설치 완료/키 미생성이다. 현재 gh로 App 공개 조회404·설치 목록403을 관측했고 실제 권한은 확인하지 못했다. [후속 점검](../../verification/security/2026-10-24-shared-config-approval.md#app-등록-후-신원-분리-준비-점검)을 따른다.
후속 정책 회귀11개·변경 포맷·문서 delta13개를 통과했다. 사용자는 별도 macOS 일반 계정 방식을 선택했으며 계정 생성·전환은 사람 실행 대기다.
후속 Jira 댓글10022의3열 표·선택 결과와 Confluence v92의 선택 결과·기존 본문 보존을 재조회했다.

### 2026-10-29 복원본 재검증과 로컬 커밋 범위

사용자가 복원한 공통 설정 승인 작업만 검증하고 커밋하도록 승인했다. 기반은 기존 `16c51e9`이며 다른 브랜치의 변경·미리보기 글·동기화 복구 기록은 포함하지 않는다. 최신 main을 병합하거나 원격으로 푸시하는 작업은 아니다.
main `0da7979`에서 ADR-0019가 원격 본문 검색에 사용된 것을 확인해 최초 커밋 전에 이 결정의 번호를 ADR-0022로 바꾸고 정책 경로·CODEOWNERS·검사 fixture·문서 링크를 함께 수정했다. 결정 내용과 비활성 ruleset은 유지한다.
Node24.22.1에서 정책11개, 같은 기반·변경 파일을 대조한 별도 의존성 복제본에서 저장소119개(실패·skip0), 전용 strict 타입 검사를 통과했다. 원래 작업 트리는 임시 정리 영향으로 개발 도구가 불완전해 최초 전체 검사가 의존성 누락으로 실패했다. 기존 공유 폴더는 건드리지 않고 같은 lockfile을 frozen/ignore-scripts로 별도 설치했으며, 원래 node_modules 링크를 보관한 뒤 이 작업 트리의 개발 도구 연결만 복구했다. 최초 네트워크 차단 설치는 중단했고 허용된 재실행은1394개 캐시를 재사용해 다운로드 없이 끝났다. 토큰·워크스페이스 package/lockfile은 변경하지 않았다.
`--check`는 성공하고 비활성 템플릿의 `--audit-ruleset`은 예상대로 exit1을 반환했다. 상세 조건은 [검증 보고서의 재검증](../../verification/security/2026-10-24-shared-config-approval.md#2026-10-29-복원본-재검증)을 따른다. 과거 원격 조회 기록은 새 검증으로 간주하지 않는다. 커밋 훅의 포맷·문서·commitlint 검사를 유지하며 푸시·PR·운영 규칙 활성화는 수행하지 않는다.

## Open Questions

AI 전용 App 등록은 사용자 보고로 완료했으나 실제 권한은 미검증이다. 선택한 macOS 일반 계정에서 관리자 credential을 공유하지 않는 환경 준비가 필요하다.
최소 승인1명은 일반 PR에도 적용되며 사람 작성 PR의 자기 승인은 불가능하다. 신원 분리 전에 원격을 활성화하면 단독 작업자를 잠글 수 있다.

## Next

사람이 macOS 일반 계정을 생성·전환하고 새 clone과 관리자 연결 부재를 확인한 뒤 별도 발급기에서 개인키·단기 installation token 연결을 준비한다. 실제 App 최소 권한·관리자 경로 차단 확인 뒤 정책을 main에 반영하고 추가 ruleset을 활성화하며 별도 테스트 저장소에서 거절/승인 회귀를 수행한다.
