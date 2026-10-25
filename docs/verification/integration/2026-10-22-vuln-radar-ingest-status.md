# 수집 실행·소스 상태와 화면 조회 주기 검증

## 대상과 조건

2026-10-22 KST, `codex/vuln-radar-overview-counts`의 PR #54 head `32c86f80d1ed8e4934bcce602f8007f191271363` 이후 미커밋 작업 트리다. pnpm12 별도 브랜치와 무관하며 이 작업 트리는 pnpm11.10.0·Node24.12.0을 사용한다. PostgreSQL16 Alpine·실제 Nest·production Vite preview·Chromium151.0.7922.34로 검사했다.

운영 Railway/NAS·운영 DB·실제 외부 수집·실제 토큰·배포는 사용하지 않았다. 실행 이력은 process-local1차 구현이고 DB 영속화는 아니다.

## 재현 방법

[격리 통합 절차](../../runbooks/vuln-radar-local-integration-verification.md)의 준비 조건을 따른다. 저장소 루트에서 실행한다.

```sh
mise exec -- pnpm --filter vuln-radar-backend test --runInBand
mise exec -- pnpm --filter vuln-radar-backend test:e2e --runInBand
mise exec -- pnpm --filter vuln-radar-backend exec tsc --noEmit -p tsconfig.json
mise exec -- pnpm --filter vuln-radar-backend lint
mise exec -- pnpm --filter vuln-radar test:lib
mise exec -- pnpm --filter vuln-radar typecheck
mise exec -- pnpm --filter vuln-radar lint
mise exec -- pnpm test:repo
mise exec -- pnpm verify:vuln-radar:integration
mise exec -- pnpm validate:docs
```

통합 실행기는 독립 DB와 임시 자격 증명을 만들고 scheduler·시작 시 sync를 비활성화한다. 실제 GET 계약을 읽되 성공·부분 실패·구버전의 화면 대조는 브라우저 route로 합성 status를 주입한다. unit에서는 collector와 DB 쓰기를 mock해 실제 실행 추적을 검사한다. 실제 upstream 장애를 일으킨 테스트나 실제 source ingest는 아니다.

## 결과와 증거

[최종 통합 증거](../artifacts/2026-10-22T03-20-18-441Z-vuln-radar-integration.json)는12:20 KST 시작, `workingTreeDirty=true`이며19개 assertion 그룹 통과·실패0·생성 자원 정리6단계 성공이다. [1280px 상태 패널](../artifacts/2026-10-22T03-20-18-441Z-vuln-radar-ingest-1280.png)과 [390px 상태 패널](../artifacts/2026-10-22T03-20-18-441Z-vuln-radar-ingest-390.png)은 합성 부분 실패를 보여준다.

| 검사               | 결과                                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| backend 단위       | 13개 suite·48개 통과. 소스 fetch 성공과 DB 반영 성공 분리, partial·primary 실패·DB 쓰기 실패, 기존 성공 보존, 동시 실행409·해제, 빈 EPSS 대상 건너뛰기    |
| frontend 로직      | 25개 통과. 화면60초/수집1440분 분리, 원본이 오래돼도 성공을 실패로 추정하지 않음, 구버전·재시작 미확인, 확인 권장/진행/실패 구분, 날짜·상대시간 한영 표시 |
| HTTP               | 6개 통과. 새 status의 scope·unknown·null 성공 시각·소스3개, 인증 없는401 유지. 기존 health·overview·KEV·feed 검사 포함                                    |
| 실제 DB read       | 최근 DB 레코드가 있어도 sync 실행이 없으면 status의 전체 성공은 null·unknown. GET은 수집을 실행하지 않음                                                  |
| 브라우저 주기·상태 | 1280/390px에서 화면1분·수집1440분,9시간 전 성공의 완료 표시, EPSS 실패/연속3회, 구버전의 전체·소스 미확인, 잘못된 조회 날짜의 미확인 처리                 |
| 기존 회귀          | 전체 DB43개/Feed25개, KEV0/null/0.125·중복/구버전/503·빈 DB, 프록시·인증·중단/복구·브라우저 토큰 미노출·uncaught pageerror 검사 유지                      |
| 타입·lint·build    | 두 앱 lint·typecheck 통과. 통합 실행 중 Nest compile·Vite production build 통과. 모노레포 전체 build는 미실행                                             |
| 저장소 도구        | 63개 통과. pnpm12 도구 테스트는 이 브랜치에 포함하지 않음                                                                                                 |

첫 HTTP 실행은 샌드박스의 `listen EPERM`으로 모든6개가 요청 전에 실패했다. 포트 사용 승인을 받은 뒤 같은 명령·코드로 재실행해6개 통과했다. 기능 실패나 서명 오류로 분류하지 않는다.

앞선 [초기 통합](../artifacts/2026-10-22T03-07-51-567Z-vuln-radar-integration.json), [종료 시각 표시 보강 후 통합](../artifacts/2026-10-22T03-12-52-599Z-vuln-radar-integration.json), [잘못된 날짜 대조 추가 후 통합](../artifacts/2026-10-22T03-14-31-143Z-vuln-radar-integration.json)도19개씩 통과했으며 해당 시점의 화면·증거를 보존했다. 최종 실행에는 서버가 허용하는 소수 단위 수집 주기1.5분의 UI 호환도 추가했다. 원문 에러를 새 status observation에 넣지 않는 단위 검사를 추가했으나, 기존 의도한 장애 대조군의 서버 경고/오류 로그까지0이라고 주장하지 않는다.

## 한계와 후속 작업

[소수 주기 호환 검사 시점](../artifacts/2026-10-22T03-17-40-548Z-vuln-radar-integration.json)도19개 통과했다. 이후 합성 부분 실패 fixture의 최근 실행 종료와 이전 전체 성공 시각을 다르게 고정하고 브라우저에서 대조한12:20 실행을 최종 화면 증거로 사용한다. 이는 제품의 시각 기록 버그 수정이 아니라 합성 fixture와 화면 검사의 보완이다.

현재 서버 프로세스에서 관측한 이력만 제공한다. 재시작 시 미확인으로 초기화되며 여러 replica 사이의 공통 이력·분산 락·지속 실패 알림은 없다. 수동·scheduler 중복 방지는 같은 프로세스 범위다. DB 영속화는 migration·보관·실패 기록 정책과 함께 후속 설계한다.

설정 주기의 두 배는 확인 권장 기준이지 수집 장애 판정이 아니다. 판정에는 server `checkedAt`을 사용해 기기 시계 차이를 줄이며 원본 날짜는 기준으로 쓰지 않는다. 브라우저가 비활성 상태거나 인터넷이 끊기면 화면 polling이 매분 완료된다고 보장하지 않는다. 일부 API 실패의 패널별 처리(개선4번)는 이번에 바꾸지 않았다.

검증 후 사용자 요청으로 backend·화면·연동 회귀·문서/증거를 독립 커밋한다. 검증 시점은 위의 미커밋 작업 트리이며, 푸시·원격 CI·main 병합·배포는 하지 않았다. 이전 head의 CI 성공과 이번 변경 검증을 혼동하지 않는다. 실기기·Firefox/Safari·운영 source 정확성은 미검증이다.

## 관련 문서

- [ADR-0016](../../architecture/adr-0016-vuln-radar-ingest-observation.md)
- [작업 기록](../../worklog/2026-10/2026-10-22-vuln-radar-ingest-status.md)
- [KAN-26](https://web-tech-service.atlassian.net/browse/KAN-26)
