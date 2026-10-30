# 스켈레톤 기하 검사 런타임 격리

## Summary

main CI에서 재시도 통과한 데스크톱 골격 검사 2건을 조사했다. live React DOM 직접 교체와 늦은 hydration의 충돌을 로컬 교차 실행으로 재현하고 별도 정적 페이지 측정으로 보완한다. [KAN-40](https://web-tech-service.atlassian.net/browse/KAN-40), [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817).

## Changed

- 후속 설명은 [hydration·DOM 소유권 지식 문서](../../knowledge/docs-app/hydration-readiness-and-dom-ownership.md)에 두 SVG 도식으로 추가했다. HTML/폰트 준비와 영역별 연결을 구분하고, 일반적인 지연 요인과 로컬 확인 사실·원격 미확정 사항을 따로 적었다. 제품 코드/검사 기준은 추가로 바꾸지 않았다.

- 실제 서버 markup·완성 화면을 그대로 사용하되, 스크립트가 실행되지 않는 별도 셸에서 기하를 측정한다. 원본 화면의 완료·테마·오류 검사는 유지한다.
- 원본 노드 동일성·실행 차단·누락 실패 회귀와 선택적 CPU 지연/DOM 진단을 추가했다.
- 확장 검사에서 발견한 개발 CSS·폰트 재요청 대기는 로드된 CSSOM·실제 font 응답 재사용으로 분리했다. 상태/좌표/timeout 기준은 유지한다. 별도 태블릿 필터 Enter 실패는 미해결 관측으로 구분한다.
- [검증 보고서](../../verification/resilience/2026-10-27-skeleton-runtime-isolation.md)에 실패 증거·반복 결과·미검증 범위를 연결한다. [기존 로딩 정책](../../architecture/docs-loading-ux-policy.md)을 보강하며 앱 구조/공개 계약 변경은 없어 새 ADR은 만들지 않는다.

## Notes

후속 그림/설명 작업은 설치된 Next 문서와 React·CSS Font Loading·Playwright 공식 원문을 대조했다. 두 SVG의 XML 문법과 로컬 PNG 렌더를 확인하며 도식은 측정 시간표가 아님을 명시한다. 제품 코드·기존 테스트·정제 실행 artifact는 바꾸거나 재실행하지 않았다.

기준 main e8ab3bd의 별도 작업 트리에서 수행한다. 원본 NAS/H1/대비 미커밋은 건드리지 않는다. offline 의존성 설치는 누락 tarball로 실패해 frozen online 설치로 복구했고 lockfile은 변경하지 않았다. 보고서의 실제 검사 결과를 기준으로 하며, 재시도 통과를 실패 0으로 합산하지 않는다.

### 작업별 커밋·PR 준비 후속

2026-10-27 사용자 승인으로 [테스트 안정화 7a5ecae](https://github.com/IMHOJEONG/web-tech/commit/7a5ecae329d03fb0901ca5ed825b95ef5f0a094e)를 먼저 생성하고 같은 새 브랜치에 일반 push했다. 원격 SHA 일치를 확인했으며 main·다른 PR·원본 NAS/H1/대비 작업과 분리했다. 이 커밋에는 검사 도우미·회귀·로딩 정책·실행 증거를 넣고, hydration 설명·SVG는 다음 문서 커밋으로 분리했다. 공유 검증 보고서/worklog는 해당 부분만 나눠 스테이징했다.

커밋 전 핵심4개(`/feed`·`/mobile`과 격리 회귀)를 재시도0·9.4초에 재통과했다. 최종 타입·변경 파일 ESLint·실제 pre-commit 포맷/문서 검사·commit-msg 훅을 우회하지 않았다. 테스트4파일 blob은 기존 세 viewport75개·관련186개/기존12제외·CPU지연75개 검증 artifact와 일치한다. 해당 전체 표본을 이번 커밋 단계에서 다시 실행했다고 주장하지 않는다. SVG XML 문법도 재확인했다.

## Open Questions

원격 최초 attempt의 trace가 없어 정확한 DOM 변경 호출자는 미확정이다. 실제 전환과 정적 기하 검사는 다른 검사다.

## Next

Bash 재현 블록 2개의 문법 검사를 통과했다. worktree 생성 실패(exit17)와 cd 실패(exit23)를 함수 대역으로 각각 주입해 설치/테스트가 실행되지 않음을 확인했다. 실제 baseline 재생성·전체 스트레스 재실행과 구분해 당일 artifact에 추가했다.

10-28 새 리뷰의 문서 지적 두 건을 대조했다. 로딩 정책의 ‘로컬 미커밋’을 저장소 커밋/PR 반영·main 미병합으로 정정하고 production CLS 미검증을 분리했다. 기준 재현 절차는 portable mktemp·subshell·set -eu로 바꿔 준비 실패가 원본 작업 트리에서 설치/테스트로 이어지지 않게 했다. 과거 관측·테스트 소스와 검사 기준은 바꾸지 않는다.

2026-10-28 잔여 PR 정리에서 기존 #67을 중복 생성하지 않고 최신 main을 격리 브랜치에 통합했다. 목차 3개만 양쪽 링크 보존으로 해결했고 원본 15파일·필터 미커밋은 보존한다. 스켈레톤 4파일 diff는 없으며 Node 24.22.1의 75개·타입·lint가 통과했다. [후속 증거](../../verification/artifacts/2026-10-28-skeleton-main-recheck.json)를 연결하고 기존 PR head로 일반 push할 준비를 한다. main 병합·배포는 실행하지 않는다.

로컬 검증과 앞선 Jira KAN-40 댓글10030/Confluence 재조회 기록은 위 단계의 결과다. 사용자 승인에 따른 작업별 커밋·푸시 후 PR 생성과 원격 CI/리뷰 결과를 같은 이슈·Confluence·PR 본문에 연결한다. 실제 PR 병합·배포 검증·NAS 조치는 별도 승인 범위이며 이번 요청으로 병합하지 않는다. 별도 태블릿 필터 Enter 간헐 실패의 원인 확정은 후속 점검으로 남긴다.
