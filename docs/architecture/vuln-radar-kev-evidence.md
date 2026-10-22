# KEV 표의 점수·우선순위 표시 계약

## 상태와 범위

- 상태: 적용 중
- 대상: vuln-radar·vuln-radar-backend KEV 목록과 Overview 표
- 최종 검토: 2026-10-21

[KAN-24](https://web-tech-service.atlassian.net/browse/KAN-24)의 구현을 API·화면·회귀·문서 단위로 분리했다. 이전 전체 통계 수정 KAN-23의 네 커밋과 구분해 같은 main 대상 PR에 포함한다. 병합·운영 적용은 완료되지 않았다. 게시 상태와 PR 연결은 Jira·Confluence에서 확인한다.

## 배경

이전 표는 KEV 항목과 제한된 Feed25개를 CVE로 결합했다. Feed에 없으면 점수를0.5·심각도를high로 채웠고 P0~P3에서 대응 상태 문구를 만들었다. 실제 점수가 없거나 대응 이력을 저장하지 않아도 값·진행 상태가 있는 것처럼 보였다. KEV가 비어 있거나 조회에 실패하면 일반 Feed까지 KEV 표에 표시했다.

## 결정

- `GET /api/kev`가 각 항목의 vulnerability에서 nullable `epssScore`를 직접 읽어 반환한다. Feed 목록에 들어가는지는 점수 표시와 관계없다. 실제0은0, null은 미확인이다.
- 프런트는0~1 범위만 받는다. 이전 API가 필드를 생략해도 호환되며 임의 값이나 Feed 점수로 보충하지 않고 미확인으로 표시한다. 실제 제공된0.5 자체를 금지하는 것은 아니다.
- 점수 열 이름은 `EPSS (0–1)`이다. [FIRST 공식 FAQ](https://www.first.org/epss/faq)에 따르면 EPSS는 향후30일의 실제 악용 확률을 추정하는0~1 값이며, 환경·영향까지 고려한 완전한 위험 점수는 아니다. 여기서는 DB에 저장된 값만 표시하며 최신 관측 시점을 보장하거나 CVSS·심각도·percentile로 바꾸지 않는다.
- 알 수 없는 값에는 숫자·막대·추정 심각도를 표시하지 않는다. 0점 막대의 너비는0이며 기존 최소12% 보정을 제거한다. 작은 유효 값도 고정 소수점3자리로0에 가깝게 숨기지 않고 최대 유효숫자6개로 표시한다.
- 상태 열을 우선순위로 바꾸고 실제 P0~P3를 표시한다. `Escalated`, `Investigating`, `Monitoring`, `Queued`는 더 이상 만들어내지 않는다. 대응 상태 저장 기능을 새로 구현한 것은 아니다.
- 표는 KEV 응답만 사용한다. 중복 권고문은 CVE 단위로 합쳐 최대6개를 보여주고 일반 Feed로 대체하지 않는다. 연결된 DB의 KEV가 없으면 `database + items: []`로 반환한다. DB 미설정의 기존 명시적 mock fallback은 유지한다.
- 빈 목록·불러오기 실패·로딩을 구분한다. 표의 source badge는 Overview 집계가 아닌 해당 KEV 응답의 출처를 표시한다.

## 대안과 영향

Feed join은 임시 편의였지만 실제 KEV와 Feed의 조회 범위가 달라 신뢰할 수 없었다. nullable 필드의 API 추가는 기존 필드를 제거하지 않으며 새 프런트는 구버전 응답을 미확인으로 수용한다. 실제 값을 표시하려면 backend를 먼저 반영하는 것이 좋다.

KEV API는 기존 권고문 최대25개 제한을 유지한다. 표시 단계 중복 제거가 전체 DB의 서로 다른 CVE6개를 항상 반환한다는 뜻은 아니다. 서버 페이지네이션·수집 최신성/EPSS 관측일·실제 대응 이력·다른 패널의 부분 장애·모바일 카드 전환은 별도 과제다. 이번 오류 수정에는 새 ADR을 강제하지 않고 계약을 기록했다.

## 관련 문서

- [검증 결과](../verification/integration/2026-10-21-vuln-radar-kev-evidence.md)
- [작업 기록](../worklog/2026-10/2026-10-21-vuln-radar-kev-evidence.md)
- [전체 통계와 표본 집계 계약](vuln-radar-overview-statistics.md)
