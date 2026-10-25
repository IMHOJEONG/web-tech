# vuln-radar 전체 DB 통계 회귀 검증

## 대상과 조건

2026-10-21 KST, main `527d4b054b4f70137f1fb1b896d8a11ccf392b8c`에서 분리한 `codex/vuln-radar-overview-counts`의 미커밋 변경을 검사했다. 원본 블로그 작업 트리는 수정하지 않았다. Node 24.12.0·Prisma 7.8.0·PostgreSQL 16 Alpine·Chromium 151.0.7922.34를 사용했다.

임시 로컬 PostgreSQL, 실제 컴파일된 Nest, Vite production preview, 개발 프록시와 배포 프록시 handler로 검사했다. 운영 Railway·Vercel·NAS·운영 토큰·수집 API를 사용하거나 변경하지 않았다.

## 재현 방법

저장소 루트에서 Node24·고정 lockfile 의존성과 로컬 Docker를 준비한다. 전용 작업 트리에는 `.env`와 실제 자격 증명을 복사하지 않는다.

```sh
mise exec -- pnpm install --frozen-lockfile --ignore-scripts
mise exec -- pnpm --filter vuln-radar-backend db:generate
mise exec -- pnpm --filter @web-tech/ui build
mise exec -- pnpm --filter vuln-radar-backend test --runInBand
mise exec -- pnpm --filter vuln-radar-backend test:e2e --runInBand
mise exec -- pnpm --filter vuln-radar test:lib
mise exec -- pnpm --filter vuln-radar-backend exec tsc --noEmit -p tsconfig.json
mise exec -- pnpm --filter vuln-radar typecheck
mise exec -- pnpm --filter vuln-radar-backend lint
mise exec -- pnpm --filter vuln-radar lint
mise exec -- pnpm --filter vuln-radar-backend build
mise exec -- pnpm --filter vuln-radar build
mise exec -- pnpm verify:vuln-radar:integration
```

통합 실행기는 생성한 컨테이너·포트·임시 자격 증명·서버만 사용하고 종료 시 자체 정리한다. 새 회귀 조건은 기존 3개 fixture에 40개를 추가하며, 기존 Feed 회귀와 장애 검사의 의도를 보존한다. Docker 이미지 `postgres:16-alpine`은 로컬에 있어야 한다. 자세한 안전 조건은 [기존 절차](../../runbooks/vuln-radar-local-integration-verification.md)를 따른다.

## 결과와 증거

후속 KEV 수정까지 커밋한 `99bef79`의 깨끗한 작업 트리에서도 이 통계43개·Feed25개·중복/빈 DB·새로고침 회귀를 다시 통과했다. 결과는 [공동 최종 검증](2026-10-21-vuln-radar-kev-evidence.md#커밋-완료-후-재검증)과 해당 증거의 `statistics.aggregateRegression`에서 확인한다. 아래는 초기 통계 수정 당시 결과다.

- [최종 통합 결과](../artifacts/2026-10-21T14-14-49-689Z-vuln-radar-integration.json): 23:14:49–23:15:00 KST, 15개 통과·실패0·정리6단계 성공.
- [초기 통합 결과](../artifacts/2026-10-21T14-11-58-001Z-vuln-radar-integration.json): 15개 통과. 최종 실행기에서는 제한 Feed에서 얻은 잘못된 비교 집계도 증거에 추가했다. 이전 결과를 덮어쓰지 않았다.

| 대상                      | 관측 결과                                                                        |
| ------------------------- | -------------------------------------------------------------------------------- |
| 43개 DB와 제한 Feed       | Feed25개, 전체43개·P0 31개·P1 6개·KEV36개                                        |
| 제한 Feed만 계산한 비교값 | P0 25개·P1 0개·KEV25개. 전체 통계와 다름                                         |
| 중복 KEV 권고문           | 동일 CVE에 권고문을 추가해도 KEV 취약점 개수36 유지                              |
| 브라우저1280px·390px      | 전체43 표시2곳, P0 31·KEV36·P1 6과 상위25개 표본 안내 확인                       |
| 변경 후 새로고침          | P0 하나를 P1로 바꾸자 P0 30·P1 7, 전체43·KEV36 유지                              |
| 연결된 빈 DB              | 실제 API `database`·네 지표0, seed 대체 없음                                     |
| mock 경계                 | DB 미설정은 mock으로 명시. 쿼리 오류는 단위 검사에서 전파 확인                   |
| 기존 동작                 | 인증401·상세/필터·백엔드 중단·캐시 보존·복구·토큰 미노출·브라우저 예외 검사 통과 |

백엔드 단위31개(신규5개), HTTP E2E4개, 프런트 로직10개(신규4개)가 통과했다. 두 앱 lint·typecheck·production build 및 통합 실행기 타입 검사도 통과했다. 백엔드 단위는 기존 CI `pnpm test`에 포함되며 프런트 `test:lib`는 이번에 Unit and Contract Tests job에 연결했다. Docker 통합 검사는 로컬 실행이며 CI에 새 Docker job은 추가하지 않았다.

`mise exec -- pnpm test:repo`의 저장소 도구 회귀63개, 미추적 파일을 포함한 문서 delta 검사, 변경 파일 Prettier 검사와 `git diff --check`도 통과했다. 문서 검사는 이번 작업 트리를 직접 읽는 `validate(view)`로 수행해 실제 미추적 파일을 포함했으며, HEAD 비교만으로 검사를 건너뛴 결과가 아니다. 파일을 스테이징하거나 커밋하지 않았다.

초기 오프라인 설치는 캐시에 없는 패키지로 실패해 같은 lockfile의 일반 설치로 재실행했다. Prisma generate/typecheck의 첫 실행은 캐시 파일 접근 권한으로 실패했고 승인된 재실행 및 직접 tsc 검사로 통과했다. 최초 backend lint는 삭제된 Feed 의존 경로의 미사용 helper를 발견해 제거한 뒤 통과했다. 통합 로그의 의도적인 `ECONNREFUSED`·502는 기존 서버 중단 회귀의 대조 조건이며 실제 운영 장애가 아니다.

## 한계와 후속 작업

초기 검증은 위에 명시한 미커밋 작업 트리 기준이다. 후속 사용자 요청으로 API `31ddb0a`, 화면 `c2b1d61`, 회귀·CI·증거 `1ca8352`를 로컬 커밋으로 분리하고 이 문서는 별도 문서 커밋에 포함한다. 아직 푸시하지 않아 원격 CI·배포 검증은 없다. 운영 데이터65,079개에서 집계 비용을 측정한 것은 아니다. 합성 데이터의 브라우저 검사이며 실기기·Safari·Firefox는 미검증이다. API 성공과 집계 정확성을 구분해 실제 DB 값을 대조했다.

전체 검색·Feed 서버 페이지네이션, KEV 표의 점수·대응 상태, 빈 Feed의 기존 mock 대체 정책, Overview 부분 장애는 후속 과제다. 이번에 운영 설정이나 Production Branch는 변경하지 않았다.

## 관련 문서

- [집계 계약](../../architecture/vuln-radar-overview-statistics.md)
- [작업 기록](../../worklog/2026-10/2026-10-21-vuln-radar-overview-statistics.md)
- [KAN-23](https://web-tech-service.atlassian.net/browse/KAN-23)
- [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)
