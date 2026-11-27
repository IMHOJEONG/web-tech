# 보안 헤더 커밋과 CSP 후속 검증

## Summary

사용자가 앞선 변경을 커밋하고 다음 현대화를 요청했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)의 기존 기록을 이어간다.

## Changed

보안 헤더·정제 기록·목차·검수 manifest의9파일을34784315에 커밋했다. 실제 훅과 staged 포맷·문서·publication을 통과했고 푸시·배포하지 않았다. 다음 CSP 조사에서 Zod 코드 생성 경로를 검증하고, 계획 설명 후 Vuln Radar 브라우저 진입점에 jitless 설정을 추가했다. 후속2소스와 이번 [검증 보고서](../../verification/security/2026-11-24-csp-readiness.md)·artifact·목차는 최초 마감 시 로컬 미커밋이었다. 사용자 후속 요청으로 이 범위와 검수 해시만 커밋하며 수집기 작업은 별도로 진행한다.

## Notes

기준 부모136ef3c4의 기존503보완과 병합 후 미커밋 worklog를 보존한다. 원본 checkout은 변경하지 않는다. 새 번들의9조건과 기존36검사·타입·lint·build가 통과했고 eval 보고가 사라졌다. 진단용 CSP는 임시 서버에만 주입했다. 보고 원문·코드·서명 URL은 저장하지 않고 이벤트와 실제 전달의 범위를 구분했다.

기존 [Confluence 현대화 지식](https://web-tech-service.atlassian.net/wiki/pages/19464193#CSP-코드-생성-탐지와-필수-기능-의존성을-구분하기) v40에 코드 생성 탐지와 필수 기능 의존성의 차이·수집 경로의 판단 기준을 보완했다. 본문·공식 근거·로컬 원본 경로와 개요→운영 안내의 상위 탐색 경로를 재조회했다. Jira 기존3열 표와 운영 댓글도 갱신·재조회했으며 지식 본문과 구분한다. 코드를 생성하지 않는 공식 parser 모드의 작은 보완으로 구조·공개 계약·공용 컴포넌트 책임을 바꾸지 않아 새 ADR은 만들지 않는다. 공통 AGENTS/lockfile/의존성의 로컬·원격 변경은 없다.

## Open Questions

운영 CSP·보고 수집기·HTTPS report-to 배치·docs 프로덕션 자원·대규모 파싱 성능은 미검증이다. VoiceOver 생략을 유지한다. 로컬 커밋에 존재하는 내용을 미푸시 원격 링크로 게시하지 않는다.

## Next

사용자 요청 범위의 jitless·정제 기록을 커밋한다. 다음 단계는 보고 입력의 크기/형식·정제·집계·빈도 제한을 검증하는 수집기 구현이며 연결 후 HTTPS Report-Only 관측을 수행한다. 새 PR·main 병합·운영 배포는 실행하지 않는다.
