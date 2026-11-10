# vuln-radar 전체 DB 검색·페이지 회귀

## 대상과 조건

- 2026-11-10 KST, Node 24.22.1·pnpm 12.14.0. 선행 운영 문서 커밋 `5ec2afabb5e51ebde1b112cb1f194bbd6469a69a` 위의 미커밋 구현을 검사했다. 커밋만 실행한 결과가 아니다.
- 임시 PostgreSQL 16·실제 Nest·Vite+ production preview·Chromium에서 합성 데이터만 사용했다. 운영 DB·NAS·Railway·Vercel·수집 API에는 연결하지 않았다.
- 최종 통합: 13:15:49~13:17:03 KST, Chromium 151.0.7922.34. 최종 포맷 후 전체 26개를 재실행했다.
- 추적: [KAN-67](https://web-tech-service.atlassian.net/browse/KAN-67).

## 재현 방법

루트에서 아래 명령을 사용한다. `db:generate`는 타입 생성이며 DB 변경이 아니다. 통합 검사 준비·격리·정리는 [기존 runbook](../../runbooks/vuln-radar-local-integration-verification.md)을 따른다. Docker PostgreSQL 이미지와 Playwright Chromium이 필요하다.

```sh
mise exec -- pnpm --filter vuln-radar-backend db:generate
mise exec -- pnpm --filter vuln-radar-backend exec jest --runInBand
mise exec -- pnpm --filter vuln-radar-backend exec jest --config ./test/jest-e2e.json --runInBand
mise exec -- pnpm --filter vuln-radar test:lib
mise exec -- pnpm --filter vuln-radar typecheck
mise exec -- pnpm --filter vuln-radar-backend exec tsc --noEmit -p tsconfig.json
mise exec -- pnpm --filter vuln-radar lint
mise exec -- pnpm --filter vuln-radar-backend lint
mise exec -- pnpm --filter vuln-radar build
mise exec -- pnpm --filter vuln-radar-backend build
mise exec -- pnpm verify:vuln-radar:integration
```

## 결과와 증거

| 검사                     | 결과                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 프론트 모델              | 36개 통과. URL 복원·필터 변경 page 1·잘못된 값·문자 인코딩 포함                                                                            |
| backend 단위             | 67개 통과. 입력 경계·필터 결합·literal LIKE·count/page 동일 조건·transaction·빈 결과·DB 실패 포함                                          |
| HTTP                     | 12개 통과. 실제 Nest 라우팅·무인증 401·잘못된 값 400·검색 필터 전달 포함. 이 suite의 DB는 stub이며 실제 PostgreSQL 검사는 별도             |
| 타입·lint                | 두 앱 통과. 통합 실행기 타입 검사도 통과                                                                                                   |
| 빌드                     | Nest·공용 UI·Vite+ 통과. Vite+는 명시 alias 보완 후 성공                                                                                   |
| PostgreSQL·브라우저 통합 | 최종 26개 검사 그룹 통과. 기존 부분 장애·수집 상태·KEV·상세 검사도 유지                                                                    |
| 검색·페이지              | 합성 43개에서 page1 25개·page2 18개·중복 0, 기존 25개 표본 밖 CVE 검색 성공. `%`, `_`, `%_` literal 검색이 정확히 한 항목과 일치           |
| 화면                     | 1280px·390px에서 페이지 이동·마지막 다음 버튼 비활성화·검색 후 page 1·새로고침 복원·뒤로 가기 page 2·가로 넘침 없음                        |
| 장애·복구                | 실제 테스트 backend 중단 뒤 동일 조건 캐시 유지·경고·재시도 복구, 최초 접근 오류, DB 없는 검색 오류 표시. mock을 검색 결과로 표시하지 않음 |
| 정리                     | 브라우저·두 서버·DB 연결·임시 DB·임시 파일 6단계 모두 성공, cleanupErrors 없음                                                             |

최초 실패와 보완:

- 최초 모델 회귀에서 URL 배열 `page=["2"]`가 숫자로 변환됐다. primitive 문자열·숫자만 허용하도록 고친 뒤 36개 통과했다.
- 초기 HTTP 검사는 sandbox의 listen EPERM으로 실패했다. 권한 승인 후 같은 assertions로 12개 통과했다.
- Vite+의 기존 tsconfig path 해석 실패가 재현됐다. [선행 기준선](../security/2026-11-07-dependabot-advisories.md)에도 같은 실패가 있다. 경로 alias를 명시한 뒤 빌드를 통과했으며 패키지 버전은 바꾸지 않았다.
- 첫 통합 실행은 19개 통과 후 장애 요청 횟수 검사에서 실패했다. UI는 새 /feed/search를 요청했으나 검사는 기존 /feed만 감시했다. 새 요청 경로·debounce 응답 완료를 관측하고 경고와 pagination status를 구분했다. 기존 실패/복구 assertions는 유지했다.
- 테스트의 첫 항목 접근에서 strict 타입 오류도 발견해 optional 접근으로 보완했다. 런타임 통과만으로 타입 통과를 대신하지 않았다.

[정제 증거](../artifacts/2026-11-10-vuln-radar-feed-search-summary.json)에 최종 실행기 해시·실패 이력·정리 결과를 남긴다. 원시 JSON·브라우저 캡처는 공개 커밋에서 제외한다.

## 한계와 후속 작업

커밋 단계에서 공개 검수 manifest의 중복 경로를 수정하고, 합성 토큰·임시 DB URL 템플릿을 검사기가 오인하지 않는 동작 동일 표현으로 보완했다. HTTP 12개와 격리 DB/브라우저 26개를 추가 재실행해 통과했다. 이전 결과는 보존하며 추가 실행은 정제 증거의 commitRecheck로 구분한다. 커밋 재구성의 원본은 로컬 백업 ref에 보존했다.

운영 규모 검색 성능·동시 수집 중 여러 요청 간 경계·실제 모바일 기기·Safari·Firefox는 미검증이다. 새 API는 운영 배포되지 않았으며 backend 선배포가 필요하다. 전체 검색은 case-insensitive substring이며 relevance ranking·형태소·reliability 파생 문구 검색이 아니다. offset 상한과 비용은 [ADR](../../architecture/adr-0029-vuln-radar-feed-search.md)에 명시했다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-10-vuln-radar-feed-search.md)
- [운영 반영 선행 검증](../deployment/2026-11-10-vuln-radar-operational.md)
