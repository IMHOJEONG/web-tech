# jitless 커밋과 CSP 보고 수집기 구현

## Summary

사용자가 jitless 변경·검증 기록의 커밋과 CSP 수집기의 정제·크기·빈도 제한 구현을 요청했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)의 기존 작업을 이어간다.

## Changed

앞선2소스·정제 기록·목차·검수 manifest의9파일을 f7a7bd4f에 로컬 커밋했다. 실제 훅·commitlint·staged 검사를 통과했고 푸시하지 않았다. 이후 기존 공통 API 패키지의 server subpath와 두 앱의 /api/csp-report를 구현했다. [ADR-0038](../../architecture/adr-0038-csp-report-collector.md), [운영 계약](../../runbooks/csp-report-collector.md), [검증](../../verification/security/2026-11-24-csp-report-collector.md)에 범위·절차·증거를 분리한다. 수집기 후속은 최초 마감 시 로컬 미커밋이었으며, 2026-11-25 사용자 요청으로 이 소스·정제 기록·목차·검수 해시만 커밋한다.

## Notes

legacy/batch 형식을 구분하고 고정된 그룹·건수만 출력한다. 요청16KiB·batch10개·읽기2초/16,384회·인스턴스60초/60요청을 제한한다. 본문 읽기 전 예약과 동시 요청·취소·오류의 정제도 검증한다. IP bucket·원문 URL·코드 표본·사용자별 상태는 저장하지 않는다. CSP·Reporting-Endpoints 헤더나 운영 배포는 적용하지 않는다.

첫 가이드 원격 CLI 조회는 거부돼 앞서 읽은 로컬 security 가이드와 설치 Next 문서·공식 MDN/Vercel 자료로 계속했다. 읽기 전용 원격 서비스 설정은 바꾸지 않았다. 의존성 연결의 첫 offline 동기화는 임시 store에 cache가 없어 실패했으며, 도구의 후속 cache 동기화는 다운로드0으로 완료됐다. worktree .git을 디렉터리로 가정한 prepare 경고는 설치 성공으로 보고하지 않는다. 실제 공통 Git 훅이 커밋 전후 검사를 실행한 결과와 구분한다. lockfile은 workspace 링크6행만 추가돼 외부 버전 변화가 없다.

초기 전체 회귀의2실패는 기존 body-parser 테스트의 socket EPERM으로 같은 검사에 로컬 접속을 허용해 복구했다. 최초 HTTP 브리지의 취소/중복close 오류는 검사기에서 수정했다. API package 기존 모듈 계약을 유지하면서 새 진입점을 .mts로 명시했다. 기존 병합 후 worklog·원본 checkout의 다른 변경은 보존한다. 최종 루트373개(수집기34개 포함)·HTTP20조건·세 workspace 타입/변경 lint·문서 delta를 통과했다. 테스트로 시작한 Next 서버의 cwd/PID를 확인해 SIGTERM으로 종료하고3217 LISTEN 없음을 재조회했다. 브리지·probe 서버와 브라우저도 종료했다.

새 공개 endpoint·공통 처리·보안/보관 경계는 ADR로 남긴다. 재사용할 판단 기준은 기존 [Confluence 현대화 지식](https://web-tech-service.atlassian.net/wiki/pages/19464193#CSP-보고-수집기의-정제와-자원-예산-경계) v41에 승격했다. 본문·공식 근거·로컬 원본 경로와 개요→운영 안내의 실제 상위 경로를 재조회했다. Jira 기존3열 표와 운영 댓글v44의 커밋·후속 상태도 저장 후 확인했으며 지식 본문과 구분한다. AGENTS 공통 지침의 새 로컬·원격 변경은 없고 외부 패키지 추가도 없다.

## Open Questions

HTTPS report-to 배치·실제 Vercel Preview/Production 라우팅·플랫폼 전역 제한/접근 로그·운영 수집은 미검증이다. 인스턴스 메모리 제한을 전역 방어로 확대 해석하지 않는다. VoiceOver 후속은 사용자 요청으로 생략한다.

## Next

사용자 요청 범위의 수집기 소스·정제 검증을 커밋한다. 배포 전 플랫폼 제한과 HTTPS 실제 전송을 검증하고 수집기 준비가 확인된 뒤 Report-Only 연결로 진행한다. 푸시·새 PR·main 병합·운영 배포는 실행하지 않는다.
