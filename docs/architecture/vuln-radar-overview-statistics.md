# vuln-radar 전체 통계와 목록의 집계 계약

## 상태와 범위

- 상태: 적용 중
- 대상: vuln-radar·vuln-radar-backend Overview
- 최종 검토: 2026-10-21

main `527d4b0` 기준 로컬 구현을 작업별 커밋으로 분리했다. 푸시·병합·운영 배포는 미완료다. [KAN-23](https://web-tech-service.atlassian.net/browse/KAN-23)에서 추적한다.

## 배경

이전 Overview의 P0·P1·KEV 숫자는 `take: 25`인 Feed에서 계산했지만 전체 취약점 수는 ingest/status에서 가져왔다. 제한된 목록의 P1이 0개여도 전체 DB의 P1이 0개인 것은 아니다.

## 결정

`GET /api/overview`는 vulnerability 전체를 `priority`, `isKev`로 `groupBy`하고 `_count._all`을 합산한다. 최대 8개 그룹만 반환하며, 개별 CVE·권고문·watchlist 행을 가져오지 않는다. 하나의 SQL 집계 조회로 전체 건수와 P0·P1·KEV의 조회 시점을 맞춘다.

| 카드 ID                 | 집계 정의                        |
| ----------------------- | -------------------------------- |
| `total-vulnerabilities` | 저장된 모든 vulnerability 행 수  |
| `p0-open`               | `priority=P0`인 vulnerability 수 |
| `p1-open`               | `priority=P1`인 vulnerability 수 |
| `kev-new`               | `isKev=true`인 vulnerability 수  |

기존 카드 ID 세 개를 유지하고 전체 건수 카드를 추가한다. `kev-new`는 호환용 이름이며 신규 증가량·최근 하루 KEV 추가량이 아니다. KEV 권고문이 여러 개여도 같은 취약점을 중복 집계하지 않는다. `dataSource.reason`은 `live_read_model`이다. 이 통계는 서비스에 저장한 데이터의 현황이며 전 세계 모든 CVE나 실제 조치 완료 여부를 뜻하지 않는다.

프런트의 두 전체 건수 표시와 P0·P1·KEV 지표는 같은 Overview 응답을 우선 사용한다. 이전 백엔드에 전체 건수 카드가 없으면 기존 ingest/status의 전체 건수를 사용하지만 Feed 길이를 전체 건수로 대체하지 않는다. KEV 카드 누락 시 권고문 행 수로 대체하지 않고 `—`로 표시한다. 0은 누락이 아니므로 정상적인 집계 0을 유지한다.

`GET /api/feed`는 기존 `priority ASC, lastModifiedAt DESC` 정렬과 최대25개 제한을 유지한다. Overview 목록은 그중 일부만 표시하고 전체 통계와 표본의 차이를 안내한다. 전역 최신순 목록·전체 검색·서버 페이지네이션은 이번에 구현하지 않는다.

DB 연결이 없는 경우 기존 명시적 mock fallback을 유지한다. mock 지표도 seed 전체에서 계산하고 실 DB로 표시하지 않는다. 연결된 빈 DB의 Overview는 `database`와 네 지표 0을 반환한다. 쿼리 실행 오류는 0이나 mock으로 숨기지 않는다.

## 대안과 영향

- 제한된 Feed를 모두 읽어 합산하는 방식은 전송량·메모리·상세 조회와 집계를 결합하므로 제외했다.
- 네 번의 독립 count 조회는 단순하지만 조회 사이 수집이 진행되면 통계별 시점이 다를 수 있다. 하나의 그룹 집계로 대신했다.
- 사전 집계 테이블이나 캐시는 아직 도입하지 않는다. 실제 데이터 규모에서 조회 비용을 측정한 뒤 재검토한다. 이번 합성 표본으로 운영 성능을 보장하지 않는다.
- 공개 응답은 추가형 변경이다. 백엔드 먼저 배포한 뒤 프런트를 배포하는 순서가 안전하다. 이전 백엔드는 여전히 제한 목록 통계이므로 프런트만 배포해서 수정 완료로 판단하면 안 된다.
- 빈 DB에서 Feed를 mock으로 대체하는 기존 정책은 변경하지 않았다. Overview의 0과 예시 목록의 공존은 별도 fallback UX 과제다. KEV 점수 기본값·대응 상태 표현·부분 장애 UX도 이번 수정에 포함하지 않는다.
- 기존 Overview 통계 의미를 바로잡는 오류 수정이며 별도의 새 ADR은 만들지 않았다.

## 관련 문서

- [검증 보고서](../verification/integration/2026-10-21-vuln-radar-overview-statistics.md)
- [작업 기록](../worklog/2026-10/2026-10-21-vuln-radar-overview-statistics.md)
- [격리 통합 검증 절차](../runbooks/vuln-radar-local-integration-verification.md)
