# Handlebars 취약점 3건 패치와 braces 재조사

## Summary

기본 브랜치 경고 4건을 조사했다. 두 백엔드의 ts-jest가 사용하는 Handlebars 3건은 4.7.10으로 조치했고, 공식 패치가 없는 braces 1건은 미해결로 구분한다. [검증 결과](../../verification/security/2026-10-18-handlebars-advisories.md)에 전후 audit과 근거를 남겼다.

## Changed

- 최신 `origin/main` `93fbf6d` 기반 `codex/security-dependabot-20261018`에서 기존 Handlebars override와 lockfile만 갱신했다.
- 기존 `scripts/security-dependencies.test.mjs`에 두 백엔드의 생성자 조회·변조 AST·inline script 경계 회귀 6개를 추가했다. 기존 CI의 저장소 테스트에 자동 포함된다.
- TODO의 현재 main 운영 glob 제거 상태와 Handlebars 패치·braces 미출시 사실을 구분했다. 과거 검증 결과는 덮어쓰지 않았다.
- `feature/docs`의 TCP 초안·도식·목차와 기존 조사 커밋은 이 브랜치에 포함하지 않았다.
- [PR #39 리뷰](https://github.com/IMHOJEONG/web-tech/pull/39#discussion_r4307316320)에 따라 검증 문서에 임시 작업 트리 기반의 패치 전후 설치·동일 테스트·복구 절차를 보완했다. 준비 오류와 기대한 실패를 구분하도록 종료 코드와 테스트 개수도 검사한다.

## Notes

새 검사 6개는 패치 전 모두 실패하고 패치 후 모두 통과했다. 저장소 43개, 두 백엔드 단위 검사와 docs-backend E2E 34개·두 백엔드 build, 전체 lint·타입·catalog와 production 파일 trace/카테고리 22개를 통과했다. 전체 audit은 high 1개로 종료 코드 1, production은 0개로 종료 코드 0이다. 명령·환경·정제한 증거는 검증 보고서에서 확인한다.

pnpm store SQLite 접근 오류는 승인된 실행으로 의존 경로를 다시 확인했다. 설치 script는 생략하고 필요한 build/generate만 명시 실행했다. 취약점 회귀는 무해한 fixture를 사용했으며 RCE나 운영 DoS 공격을 실행하지 않았다. 새 아키텍처 결정은 없고 기존 ADR-0014를 유지한다.

리뷰 후 문서 명령을 그대로 실행해 4.7.9의 실패 6개와 4.7.10의 통과 6개를 재현하고 임시 작업 트리를 정리했다. 로그 해시는 기존 artifact에 추가했다. 기존 TCP 작업 23개 파일은 해시가 같았다. 기존 패치 커밋의 CI 전체 성공·CodeQL 탐지 0건과 후속 문서 커밋의 CI 재검증을 구분한다.

## Open Questions

braces 공식 패치와 상위 개발 도구의 지원 시점은 미정이다. 미출시 버전 강제나 비공식 backport는 추가하지 않았다. PR 병합과 배포·경고 자동 종료도 아직 검증하지 않았다.

## Next

재현 절차 보완을 별도 커밋으로 PR #39에 푸시하고 해당 리뷰를 해결 처리한 뒤 새 커밋의 CI·CodeQL을 확인한다. 병합 후 기본 브랜치 경고의 실제 감소와 필요한 feature 브랜치 동기화를 확인한다. 잔여 braces 과제는 별도로 유지한다.
