# Overview 부분 API 장애 회귀 검증

## 대상과 조건

2026-10-22 KST, `codex/vuln-radar-overview-counts`의 `bffcf25d8d4938b41f9bc77a70b4bca7bfc90fa2` 이후 미커밋 작업 트리. Node24.12.0·pnpm11.10.0·PostgreSQL16 Alpine·실제 Nest·production Vite preview·Chromium151.0.7922.34로 검사했다. 최종 통합 실행은13:37:18–13:38:16 KST다. 실제 upstream 수집과 운영 DB는 사용하지 않았다.

## 재현 방법

저장소 루트에서 실행한다. integration은 Docker daemon·로컬 포트4310/4311·설치된 Playwright Chromium을 요구한다. 생성한 DB/서버/브라우저만 정리하고 다른 개발 서버는 종료하지 않는다. 토큰은 실행마다 생성하며 문서·증거에 쓰지 않는다.

```sh
mise exec -- pnpm --filter vuln-radar test:lib
mise exec -- pnpm --filter vuln-radar typecheck
mise exec -- pnpm --filter vuln-radar lint
mise exec -- pnpm verify:vuln-radar:integration
mise exec -- pnpm test:repo
mise exec -- pnpm validate:docs
mise exec -- pnpm format:changed:check
git diff --check
```

## 결과와 증거

| 검사                         | 결과           | 확인 범위                                                                                  |
| ---------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| frontend 순수 모델/기존 회귀 | 31개 통과      | 새 상태 분류6개 포함. 캐시0/빈 배열, 최초 실패, 재시도, 전체 오류 조건, 누락 집계의 미확인 |
| 실제 통합                    | 25개 그룹 통과 | 기존19개 유지, 부분 장애/빈 응답6개 그룹 추가. 아래 상세 조건 참조                         |
| 타입·lint                    | 통과           | frontend `tsc --noEmit`, ESLint. 통합 명령은 별도 runner 타입 검사도 선행                  |
| 빌드                         | 통과           | 실제 통합 실행에서 Nest와 production Vite를 새로 빌드. 모노레포 전체 빌드는 아님           |
| 저장소 도구                  | 63개 통과      | 기존 검증/정리/도구 회귀                                                                   |
| 문서·변경 포맷·diff          | 통과           | 변경 문서 검사, read-only 포맷 검사, `git diff --check`                                    |

최종 [통합 JSON](../artifacts/2026-10-22T04-37-18-940Z-vuln-radar-integration.json)은 기준 SHA·dirty 상태·runner SHA256·실행 조건·그룹별 결과·화면 파일명을 포함한다. runner SHA256은 `39dbe1c38fdb56a1a1289b906333e5ad090b0ec546c6bb2ecdf9f6d2befcf6fb`다. 정리6단계 모두true·정리 오류0이며, 인증값의 브라우저/번들 유출0·uncaught page error0 검사도 통과했다.

- health/status/overview/Feed/KEV/watchlist 각각의 최초 실패와 캐시 갱신 실패를1280/390px에서 검사했다. 6 API ×2 상태 ×2 폭 =24조합이며 각 조합에서 정상 패널 유지와 복구도 확인한다.
- Feed 최초 실패는 transport abort, 나머지 최초 실패는HTTP503, watchlist 갱신 실패는HTTP200의 잘못된 schema로 주입했다. 성공이 아닌 응답을0이나 빈 목록으로 바꾸지 않는다.
- 최초 실패 후 재시도 응답을 보류해 버튼 비활성화·중복 클릭 방지를 확인했다. 복구 호출은 대상1회 증가, 나머지5개 API는 증가하지 않음을 실제 브라우저 요청 횟수로 단언했다. 전체 새로고침과 단일 패널 재시도는 구분한다.
- 캐시 본문의 실제 표시 텍스트가 실패 전후 동일하며 경고와 마지막 수신 시각이 함께 보이는지 검사했다. 복구 후에는 경고를 제거한다. 갱신 성공 후 시각이 바뀔 수 있으므로 성공 후 본문 전체가 예전 텍스트와 동일해야 한다고 단언하지 않는다.
- health/status/watchlist 응답을 보류해 핵심 숫자와 KEV가 먼저 표시되는지 확인했다. 모든API의 캐시 없는 실패는 전체 오류로, 이후 수동 재시도 성공은 정상 화면으로 복구됐다.
- 정상 빈 Feed·watchlist는 별도 route fixture에서 empty/0로 표시하고 오류 안내가 없음을 확인했다. 실제 빈 DB에서는 overview 집계0과 KEV 빈 결과를 검증한다. 기존 backend는 빈 DB Feed·빈 watchlist에 mock fallback을 반환하므로 이것을 실제 빈 Feed 응답으로 보고하지 않는다.
- stale 안내가 있는1280/390px에서 문서 전체의 가로 넘침이 없음을 검사했다. KEV 표 내부 가로 스크롤은 기존 정책대로 유지한다.

화면 증거: [갱신 실패1280](../artifacts/2026-10-22T04-37-18-940Z-vuln-radar-partial-stale-1280.png), [갱신 실패390](../artifacts/2026-10-22T04-37-18-940Z-vuln-radar-partial-stale-390.png), [복구1280](../artifacts/2026-10-22T04-37-18-940Z-vuln-radar-partial-recovered-1280.png), [복구390](../artifacts/2026-10-22T04-37-18-940Z-vuln-radar-partial-recovered-390.png). JSON이 참조하는 기존 Feed·KEV·수집 상태 화면도 함께 보존했다. 데스크톱·모바일 화면을 실제로 열어 안내와 본문 배치를 점검했다.

### 실패와 재검증

1. 첫 실행은 runner 타입 검사에서 endpoint tuple의 undefined 인덱스 오류로 중단했다. `as const`로 보완했고 이 단계는 브라우저를 실행하지 않아JSON이 없다.
2. [13:30 실행](../artifacts/2026-10-22T04-30-57-094Z-vuln-radar-integration.json):5그룹 통과 후 최초 실패 재시도 중 버튼이 사라져 실패. Query가 fetch 시작에 error를 초기화하므로 마지막 오류 시각으로 안내를 유지하도록 수정했다.
3. [13:32 실행](../artifacts/2026-10-22T04-32-34-466Z-vuln-radar-integration.json):6그룹 통과 후 줄바꿈을 포함한 `innerText`와 경고까지 포함한 전체 `textContent` 비교가 실패. 제품의 데이터 소실이 아니라 검증 대상/정규화 오류였다. 경고와 실제 본문을 나눠 `useInnerText`로 보존 여부를 비교했다.
4. [13:33 실행](../artifacts/2026-10-22T04-33-27-682Z-vuln-radar-integration.json):당시24그룹 통과. 이후 빈 결과·모바일 문구·가로 넘침 단언을 보강했다.
5. [13:35 실행](../artifacts/2026-10-22T04-35-08-469Z-vuln-radar-integration.json):20그룹 통과 후 빈 DB가 빈 Feed를 반환한다는 잘못된 기대에서 실패했다. repository의 기존 mock fallback을 확인하고 실제 빈 DB 집계와 주입한 빈 응답 UI를 분리했다.
6. 최종13:37 실행:25그룹 모두 통과. 실패한 선행 실행을 최종 통과 수에 합산하지 않았다. 모든 실제 실행에서 생성 자원 정리6단계는 통과했다.

## 한계와 후속 작업

부분 HTTP503·transport 실패·schema 오류와 응답 대기는 browser route로 주입한다. 실제 프록시·Nest·격리 DB는 사용하지만 Railway 자체 장애를 재현한 것은 아니다. 실기기·Firefox/Safari·운영 배포·원격 CI는 미검증이다. Query 메모리 캐시 유지 검증이지 인터넷 완전 단절 시 영속 오프라인 지원 검증은 아니다. 임의로 캐시 만료 기간·수집 동작·서버 fallback 정책을 변경하지 않았다.

위 로컬 실행 당시 KAN-26 네 커밋을 보존했고 KAN-27은 미커밋이었다. 이후 사용자 요청으로 KAN-27 화면(`40fe090`)·회귀(`c46ad6a`)·문서/증거를 커밋으로 분리했다. KAN-26·KAN-27만 PR #54에 푸시한 뒤 새 head의 CI·CodeQL 결과를 [KAN-27 검증 댓글](https://web-tech-service.atlassian.net/browse/KAN-27?focusedCommentId=10016)에 실행 URL·SHA와 함께 별도 기록한다. 이 로컬 증거를 원격 CI·main 병합·운영 배포 성공의 근거로 사용하지 않는다.

## 관련 문서

- [결정](../../architecture/adr-0017-vuln-radar-panel-failure-isolation.md)
- [작업 기록](../../worklog/2026-10/2026-10-22-vuln-radar-partial-failures.md)
- [선행 수집 상태 검증](2026-10-22-vuln-radar-ingest-status.md)
