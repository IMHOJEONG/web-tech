# vuln-radar 운영 반영 읽기 전용 검증

## 대상과 조건

- 검증: 2026-11-10 KST, HTTP 표본은 10:55~11:07. 마지막 assertion은 11:07:36 KST.
- 기준 main: `09bf9389729fe335133873775777da5083b1b94c`.
- 대상: 공개 Vercel 도메인의 SPA 진입과 `/api/backend/*` GET, GitHub의 Vercel Production·Railway development 배포 기록.
- 추적: [KAN-15](https://web-tech-service.atlassian.net/browse/KAN-15). 기존 Preview 검증의 후속이며 이번에는 공개 운영 도메인을 확인했다.
- 배포·환경변수·토큰·DB 변경, 수집 실행, 장애 주입은 하지 않았다. 다른 작업 트리의 미커밋 파일을 보존하고 최신 main의 별도 브랜치에서 기록했다.

## 재현 방법

저장소 루트에서 인증된 GitHub CLI로 배포 기록을 확인한다. GitHub 자격 증명을 공개 API 요청에 전달하지 않는다.

```sh
gh api repos/IMHOJEONG/web-tech/commits/main --jq .sha
gh api repos/IMHOJEONG/web-tech/deployments/7646792732/statuses
gh api repos/IMHOJEONG/web-tech/deployments/7646777937/statuses
gh run list --commit 09bf9389729fe335133873775777da5083b1b94c --limit 10 --json name,status,conclusion,url
curl --max-time 20 -sS -D - https://vuln-radar-service.vercel.app/api/backend/health
```

실행한 API 대조와 동일한 조건은 아래처럼 재검사한다. 각 요청은 15초 제한·리디렉션 거절·GET만 사용한다. 결과는 시점에 따라 바뀌며, 두 응답 사이에 수집이 완료되면 통계 불일치가 발생할 수 있다. 실패를 임의로 허용하지 말고 시각을 대조한다.

```sh
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
const base = 'https://vuln-radar-service.vercel.app/api/backend/';
const read = async (path) => {
  const response = await fetch(base + path, {
    signal: AbortSignal.timeout(15000), redirect: 'error',
  });
  assert.equal(response.status, 200, path);
  return response.json();
};
const overview = await read('overview');
const status = await read('ingest/status');
const feed = await read('feed');
const kev = await read('kev');
const cards = Object.fromEntries(overview.cards.map(x => [x.id, x.value]));
assert.equal(cards['total-vulnerabilities'], status.counts.vulnerabilities);
assert.equal(cards['p0-open'], status.counts.p0);
assert.equal(cards['p1-open'], status.counts.p1);
assert.ok(cards['total-vulnerabilities'] > feed.items.length);
assert.ok(kev.items.every(x => x.epssScore === null ||
  (Number.isFinite(x.epssScore) && x.epssScore >= 0 && x.epssScore <= 1)));
assert.ok(feed.items.length > 0);
await read('vulnerabilities/' + encodeURIComponent(feed.items[0].cveId));
console.log('PASS: aggregate consistency, separate feed, KEV range, detail GET');
NODE
```

## 결과와 증거

| 항목         | 결과           | 관측                                                                                                                                                                                                                                        |
| ------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| main CI      | 통과           | [CI](https://github.com/IMHOJEONG/web-tech/actions/runs/42560157532)·[Documentation](https://github.com/IMHOJEONG/web-tech/actions/runs/42560157490)·[Push on main](https://github.com/IMHOJEONG/web-tech/actions/runs/42560156962) success |
| Vercel       | 통과           | Production deployment `7646792732`, 동일 main SHA, success                                                                                                                                                                                  |
| Railway      | 통과·기록 범위 | deployment `7646777937`, development, 동일 main SHA, success. 실행 프로세스 SHA는 health로 확인할 수 없다                                                                                                                                   |
| SPA 직접 URL | 통과·HTTP만    | `/overview`, `/feed` HTML 200                                                                                                                                                                                                               |
| read API     | 통과           | health·overview·feed·kev·ingest/status·watchlist와 CVE 상세 JSON 200                                                                                                                                                                        |
| DB 집계      | 통과·API 대조  | total 92,476, P0 326, P1 861. overview와 status 값 일치. KEV 1,769                                                                                                                                                                          |
| 목록 분리    | 통과           | Feed·KEV 각 25개, watchlist 1개. 전체 검색 성공을 의미하지 않는다                                                                                                                                                                           |
| KEV EPSS     | 통과·표본 범위 | 25개 모두 0~1 수치, null 0개. 첫 3개는 0.00621, 0.01502, 0.01157. 결측 표시 미검증                                                                                                                                                          |
| 수집 관측    | 통과·시점 표본 | completed, NVD·KEV·EPSS 연속 실패 0. 마지막 성공 2026-11-09 13:12:09 KST, 설정 간격 1,440분                                                                                                                                                 |

이 표는 시점 표본이며 전체 기간의 가용성·정확성을 보장하지 않는다.

## 한계와 후속 작업

- API는 `database` 출처를 반환했지만 DB에 직접 접속해 별도 SQL 집계하지 않았다. API 간 일치와 코드의 전체 `groupBy` 집계를 대조한 결과다.
- 마지막 성공은 표본 시점 약 21.92시간 전이다. 24시간 수집 설정과 모순되지 않으며 실제 다음 정기 실행 성공은 아직 관측하지 않았다. 다음 실행 시각을 보장하거나 실시간 서비스로 부르지 않는다.
- health의 `env: development`, `frontendOrigin: http://localhost:3000`을 관측했다. Railway 환경 이름도 development다. 운영 의도와의 일치 여부를 확인해야 한다. 프론트는 same-origin 프록시이므로 이 메타데이터만으로 CORS 장애를 단정하지 않는다. 환경변수는 조회·변경하지 않았다.
- 브라우저 렌더링·키보드·모바일 화면, API 장애 중 정상 패널 유지, 재시도 범위는 이번에 검사하지 않았다. HTML 200을 UI 정상으로 대체하지 않는다.
- 보호된 Railway 직접 API의 무인증 거절, 자격 증명 교체, KAN-32 보안 재개 조건도 이번 성공으로 해소하지 않는다.
- 후속 구현 우선순위는 전체 DB 검색·페이지네이션이다. 현재 클라이언트 필터는 전달된 25개만 검색하며 query 상태를 서버 검색으로 전달하지 않는다.
- 증거는 아래 정제 JSON에 한정한다. 원시 HTTP 본문·인증 헤더·운영 로그·사용자 식별자는 저장하지 않는다. 별도 회귀 테스트 실행·새 코드·배포는 없다.

## 관련 문서

- [정제 관측값](../artifacts/2026-11-10-vuln-radar-operational.json)
- [작업 기록](../../worklog/2026-11/2026-11-10-vuln-radar-operational.md)
- [집계 계약](../../architecture/vuln-radar-overview-statistics.md)
- [수집 관측 결정](../../architecture/adr-0016-vuln-radar-ingest-observation.md)
- [패널 장애 격리](../../architecture/adr-0017-vuln-radar-panel-failure-isolation.md)
