# 웹 현대화 후속: 보안 헤더와 CSP 준비

## Summary

사용자가 main 병합 후 현대화를 계속 반영하도록 요청했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)를 재사용하고, 남은 후보인 CSP를 조사한 뒤 작은 보안 헤더2개를 먼저 적용하는 계획을 설명했다.

## Changed

최신 main b841d21a에서 codex/modern-web-security-headers-20261123 브랜치를 만들고 docs next.config.mjs·vuln-radar vercel.json에 nosniff와 Referrer 정책을 명시했다. [검증 보고서](../../verification/security/2026-11-23-web-security-headers.md)·정제 artifact·역할별 목차를 추가한다. 기존 병합 후 worklog와 원본 checkout의 변경51개는 보존하며 이번 범위에 포함하지 않는다.

## Notes

Next 실제 경로 검증·config ESLint와 세 엔진/두 앱 설정/전후12조건이 통과했다. 기존 오프라인 CSP·캐시를 유지했다. 보고서에 공개 응답 차단과 로그인 리디렉션·첫 실행기 상호운용 오류·검증 범위를 분리했다. 원시 응답·서명 URL·개인 경로는 저장하지 않았다.

재사용할 교훈은 인증/차단 페이지와 앱 응답을 구분하고 CSP와 작은 보조 헤더의 효과를 구분하는 기준이다. 기존 [Confluence 현대화 지식](https://web-tech-service.atlassian.net/wiki/pages/19464193#보안-헤더의-효과와-실제-앱-응답을-구분해-검증하기)을 갱신하고 본문·근거·상위 탐색 경로를 재조회했다. Jira 기존3열 표와 운영 기록을 연결하며 별도 중복 페이지를 만들지 않는다. 두 헤더를 명시하는 작은 보완으로 구조·렌더링·공용 컴포넌트 책임은 바꾸지 않아 새 ADR은 만들지 않는다. AGENTS 공통 지침 변경은 없다. 최초 검증 시점에는 미커밋·미푸시·미배포였다.

## Open Questions

실제 앱 응답·프로덕션 MIME·Vercel 라우팅은 배포 후 확인한다. CSP 위반 수집 경로와 인라인/외부 자원 목록·Trusted Types 호환성은 미검증이다. VoiceOver 후속 생략을 유지한다.

## Next

2026-11-24 사용자 요청으로 보안 헤더2설정·정제 기록·목차·검수 해시만 커밋한다. 커밋 전 부모는136ef3c4이며 기록된 두 설정의 소스 해시가 일치한다. 기존503검사 보완 커밋과 병합 후 worklog는 보존한다. CSP는 수집기와 정적 렌더링 영향을 검증한 다음 Report-Only 관측으로 이어간다. 이번 요청만으로 새 PR·main 병합·운영 배포를 실행하지 않는다.
