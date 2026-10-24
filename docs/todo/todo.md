# Platform Improvement TODO

이 문서는 `worklog`와 다르게, 여러 세션에 걸쳐 지속적으로 관리하는 개선 백로그입니다.

운영 규칙:

- 구현 중 새로 드러난 개선점은 이 문서에 먼저 추가합니다.
- 실제로 착수한 내용과 결정 과정은 `docs/worklog/`에 기록합니다.
- 구조적 결정으로 승격되면 `docs/architecture/` 문서로 분리합니다.

상태 표기:

- `[ ]` 아직 미착수
- `[-]` 진행 중 또는 방향 검토 중
- `[x]` 완료

우선순위:

- `P0` 현재 장애/회귀/운영 리스크
- `P1` 가까운 시일 내 반영 권장
- `P2` 품질 향상용 중기 과제

## Jira 우선 과제

2026-10-09부터 아래 등록 과제의 진행 상태·보류 사유는 Jira에서 관리한다. 이 표는 상태를 복제하지 않는 연결 목차이며, 나머지 TODO 후보는 기존 목록에서 유지한다. [이슈 추적 규칙](../process/issue-tracking.md)을 따른다.

에픽: [KAN-1 · 운영 검증과 공용 플랫폼 후속 개선](https://web-tech-service.atlassian.net/browse/KAN-1).

| 이슈                                                           | 작업                                     | 앱 라벨                               | 우선순위 / 제약                  |
| -------------------------------------------------------------- | ---------------------------------------- | ------------------------------------- | -------------------------------- |
| [KAN-2](https://web-tech-service.atlassian.net/browse/KAN-2)   | PR #36 CI·Linux 배포 검증                | docs, docs-backend, vuln-radar, infra | p1                               |
| [KAN-3](https://web-tech-service.atlassian.net/browse/KAN-3)   | 운영 glob 제거의 main 전달·braces 재검사 | docs, infra                           | p1                               |
| [KAN-4](https://web-tech-service.atlassian.net/browse/KAN-4)   | 웹 푸시 WAF·초대 세션·쿠키 검증          | docs, docs-backend, infra             | p0-gate · 활성화 전제            |
| [KAN-5](https://web-tech-service.atlassian.net/browse/KAN-5)   | Production 성능·요청 오류 관측           | docs, infra                           | p1                               |
| [KAN-6](https://web-tech-service.atlassian.net/browse/KAN-6)   | 실제 브라우저·실기기·접근성 검사         | docs, ui                              | p1                               |
| [KAN-7](https://web-tech-service.atlassian.net/browse/KAN-7)   | 공용 UI 외부 소비 앱 검증                | ui                                    | p2                               |
| [KAN-8](https://web-tech-service.atlassian.net/browse/KAN-8)   | vuln-radar 구현·테스트 기준선 점검       | vuln-radar, infra                     | p1                               |
| [KAN-9](https://web-tech-service.atlassian.net/browse/KAN-9)   | NAS 게시·웹훅·화면 새 버전 검증          | docs, docs-backend, infra             | p1 · SSH 차단으로 보류           |
| [KAN-10](https://web-tech-service.atlassian.net/browse/KAN-10) | 외부 백업과 격리 복구 리허설             | docs-backend, vuln-radar, infra       | p1 · 외부 저장소 미구축으로 보류 |

PR #36은 main `742707e`에 병합되고 feature 8개에 전달됐다. 아래 과거 보안 항목의 미완료 체크만 보고 동일 패치를 다시 구현하지 않는다. CI·실제 배포는 KAN-2, main의 잔여 운영 glob 경로는 KAN-3에서 추적한다. 작업 등록을 구현·배포 검증 완료로 간주하지 않는다.

## 2026-10-22 블로그 재점검

[KAN-29](https://web-tech-service.atlassian.net/browse/KAN-29)에서 main `4e61767`의 코드와
격리 fixture를 대조했다. 첫 분류 수정은 아래 기록처럼 로컬 구현·검증했고, 나머지는 개선 후보로 유지한다.
운영 배포 완료를 의미하지 않는다.
[재현 결과와 한계](../worklog/2026-10/2026-10-22-docs-improvement-recheck.md)를 따른다.

- [x] `P1` **canonical 경로의 분류를 공통화한다.** `web/…`, `ui-ux/…`, `mobile/…`가
      검색 section에서는 `Docs`, channel에서는 `other`로 분류되는 경계를 확인했다.
      로컬 디렉터리 이름과 공개 canonical 경로의 매핑을 하나로 정하고 `/docs` 필터·허브·Feed에 적용했다.
      관련 글은 기존 canonical URL 기반의 세부 카테고리 점수를 유지하며 회귀 검사했다.
      완료 조건: 원격 경로 세 종류와 로컬 legacy 경로의 매핑, 선행 slash·파일 확장자,
      원격/로컬 동일 route 중복 제거를 유닛·통합 검사하고, 혼합 목록 필터·허브를 두 언어와 두 화면 크기의 E2E로 검증했다.
      [로컬 구현·검증 기록](../worklog/2026-10/2026-10-22-docs-canonical-taxonomy.md).
      구현 `6f6974e`·브라우저 회귀 `3f8bf5e`로 분리했다. 원격 CI·운영 배포와 실제 운영 영향 문서 수는 별도 확인한다.
- [ ] `P1` **원격 본문 검색의 계약을 결정한다.** 현재 원격 metadata의 `content`는 비워지고
      중복 canonical route는 원격 우선이므로 본문 전용 검색어가 local-only 1건에서 원격 활성화 시 0건으로 바뀐다.
      원격 published 본문에서 검색용 텍스트를 생성·제공할지, metadata-only 검색을 명시할지 결정한다.
      검색 요청마다 모든 원격 본문을 fetch하거나 오래된 로컬 본문을 새 원격 본문과 섞지 않는다.
      완료 조건: 제목·요약·본문 전용 일치, 동일 route의 원본 선택, 갱신·draft 제외·로컬 fallback을 함께 검사한다.
- [ ] `P2` **원격 응답에 byte budget을 추가한다.** 전체 deadline·retry 0은 구현됐지만 크기 제한은 없고
      격리 fetch에서 8MiB 응답이 수락됐다. 목록과 본문의 상한을 정하고 읽는 중 누적 byte 수를 검사한다.
      완료 조건: Content-Length 누락/오류, chunk 분할·멀티바이트·상한 초과 취소,
      초과 응답의 로컬 대체와 비밀값 없는 로그를 검증한다. 실제 공격·운영 OOM을 확인한 것은 아니다.

권장 순서는 분류 일치 → 검색 계약 → byte budget이다. 이미 구현된 입력 제한·캐시·오프라인 저장을
다시 만드는 과제로 확대하지 않는다. 실기기·Safari/Firefox와 운영 Worker 갱신은 기존 검증 과제,
NAS 게시·외부 백업은 기존 사용자 보류 결정으로 유지한다.

## 2026-10-04 실행 우선순위

현재 `feature/docs` 코드와 검증 기록을 대조한 실행 목록이다. 최근 작업의 중심은 docs·docs-backend이며, 공용 UI와 vuln-radar 후속 과제도 구분해 포함한다. Dashboard·NAS 설정은 문서만으로 적용을 확정하지 않는다. 기존 세부 백로그는 아래에 보존한다.

### 현재 기준선

- 로컬·원격 콘텐츠 계약과 본문 검증, 장애 시 로컬 fallback, 검색 입력·이동 규칙, 카드 재사용, CI와 공용 UI 테스트가 구현되어 있다.
- 로컬 검색 인덱스 캐시는 배포 후 반복 조회와 정상 웹훅 후 재조회를 확인했다. NAS 원문 변경에 따른 새 버전 반영은 미검증이다. [배포 증거](../verification/cache/2026-10-04-deployed-search-index-cache.md).
- 웹 푸시는 초대 접근 제한·구독/해지·관리자 발송 MVP까지 구현했다. 기본 비활성화이며 실제 기기 수신과 운영 활성화는 남아 있다.
- 구조화 데이터와 제목 기반 OG 이미지, 성능·요청 단계 계측이 구현되어 있다. 검색 서비스 반영·실기기 성능·요청 오류 상관관계 검증은 별도다.
- 복구 정책은 제안 상태다. NAS 한 대에서 외부 백업·격리 복원·이전 이미지 복귀를 먼저 검증한다.

### 먼저 닫을 개발·운영 과제

| 순서 | 우선순위  | 작업                      | 완료 기준과 근거                                                                                                                                                                                                       |
| ---- | --------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | P1        | NAS 게시 갱신의 실제 검증 | 접근 가능한 테스트 문서에서 V1→V2 변경, 정상 웹훅, 목록·검색·상세의 새 버전 확인, 원복까지 기록. 웹훅 200과 발행 성공을 구분. [미검증 범위](../verification/cache/2026-10-04-deployed-search-index-cache.md#남은-범위) |
| 2    | P1        | NAS 외부 백업과 복원      | Markdown·이미지·설정의 복구 범위를 정하고 NAS 밖에 백업을 보관. 성공/실패 알림과 격리 복원 결과, 실제 RTO/RPO 기록. DB는 별도 복원. [정책](../architecture/platform-recovery-policy.md)                                |
| 3    | P0 조건부 | 운영 보안 게이트 확인     | 웹 푸시 공개 활성화 전 WAF·초대 세션·429·해지·Production 쿠키 검사. 기존 revalidation 보호도 확인. 현재 플래그 유지. [푸시 절차](../runbooks/docs-web-push-experiment.md)                                              |
| 4    | P1        | 게시 검증 도구 보강       | 캐시 만료 후 기대한 문서 버전/내용을 검사하고 실패 시 종료 코드로 알림. 로컬·원격 게시 경로와 로그의 비밀값 제외 검사. 아래 Code / Architecture 과제 참조                                                              |
| 5    | P1        | 성능과 오류 관측 완결     | 현재 구현으로 Production 실기기 표본·p75, 요청 ID와 단계 로그, prefetch/실제 탐색 구분, 외부 API 실패·백업 실패 알림을 확인. [측정 절차](../runbooks/docs-deployed-performance-measurement.md)                         |
| 6    | P1        | 실제 브라우저·접근성 검사 | Safari/Firefox, 실제 모바일·태블릿, OS IME, VoiceOver/NVDA에서 검색·Drawer·Tooltip·회전·스크롤·포커스 확인. 재현된 결함을 개별 수정하며 기존 headless 성공과 구분                                                      |
| 7    | P2        | 캐시 경계 추가 검사       | TTL 만료, 동시 cold 요청, 로컬 글이 바뀐 재배포, 원격 장애→복구를 검증. corpus가 커질 때 경로별 무효화와 인덱스 엔진 재검토. [ADR-0011](../architecture/adr-0011-local-search-index-cache.md)                          |

4번 게시 검증 도구는 10-08 로컬 구현·검증을 완료했다. [결과](../verification/cache/2026-10-08-content-publication-verifier.md)와 [실행 절차](../runbooks/docs-content-publication-verification.md)를 따른다. NAS 운영 발행·원복과 외부 백업·복원은 아래 사유로 추후 점검한다. 그동안 6번 로컬 검사를 진행할 수 있다. P0 조건부는 공개 활성화의 선행 조건이며 현재 악용·장애를 관측했다는 뜻은 아니다.

#### 추후 점검으로 보류한 NAS 과제

2026-10-09 사용자 결정이다. 대화의 **2번·4번**은 위 표의 순서가 아니라 각각 다음 과제를 가리킨다. 두 항목 모두 미완료·미검증 상태로 유지하며 이번 작업에서는 실행하지 않는다.

- [ ] `P1` **NAS 게시 갱신의 실제 검증(대화 2번): 보류.** 사용자가 보안 조치로 SSH를 차단했다. 이 검증을 위해 SSH를 다시 열도록 요구하거나 연결을 시도하지 않는다. 재개 조건: 사용자가 승인한 안전한 작업 경로와 시험 문서를 준비하고 점검 재개를 요청한다. 완료 조건: NAS에서 V1→V2 변경, 인증된 웹훅, 목록·검색·상세의 새 버전 확인, 원복까지 기록한다. [게시 검증 절차](../runbooks/docs-content-publication-verification.md).
- [ ] `P1` **NAS 외부 백업과 격리 복원(대화 4번): 보류.** NAS 외부 백업 저장소가 아직 없다. 재개 조건: 저장소·도구·접근 권한·암호화 및 보존 기준을 마련하고 점검 재개를 요청한다. 완료 조건: 실제 외부 백업과 성공/실패 알림, 격리 복원, 데이터·API 검증 및 실제 RTO/RPO를 기록한다. 정책 문서나 NAS 내부 복사만으로 완료 처리하지 않는다. [복구 리허설 절차](../runbooks/platform-recovery-drill.md).

### 사용자에게 추가할 기능

- **웹 푸시 완성:** 실제 내 기기의 구독·수신·클릭·해지와 NAS 재시작 유지부터 검증한다. 그 다음 published 최초 전환 감지, 중복 발송 방지, 만료 구독 정리와 재시도 기록을 추가한다. 현 파일 저장소는 단일 프로세스·20개 제한이므로 공개 확장 전 저장/큐 전략을 결정한다.
- **콘텐츠 탐색:** 인덱스 태그와 편집된 시리즈·학습 경로의 1차 구현은 아래 ADR-0012를 따른다. Mobile 실내용, 배포 혼합 목록 검사, 허브·관련 글의 분류 일관성은 후속 과제다.
- **공유 품질:** 실제 공유 미리보기의 제목·이미지·canonical, 검색 서비스의 구조화 데이터 검증을 완료한다. 코드 구현 완료와 외부 서비스 반영을 구분한다.
- **읽기 경험:** 빈/로딩/오류 화면의 복구 동작, 첫 화면 이미지의 eager/lazy 기준, 키보드와 모바일 읽기 동작을 다듬는다. 이미 있는 관련 글·이전/다음·수정일은 회귀 검사로 유지한다. 문의/뉴스레터 제거 결정을 유지하며 feedback은 별도 제품 판단이 필요하다.

### 공용 패키지와 다른 앱

- **공용 UI 외부 소비 준비:** peer 의존성·CSS export·버전과 tarball fixture의 타입·CSS·SSR·테마·포커스 1차 검증은 ADR-0013에 반영했다. 실제 외부 소비 앱과 registry 결정은 남아 있다. Base UI 전환과 외부 배포 준비는 별개다. [ADR-0006](../architecture/adr-0006-shared-ui-base-ui.md).
- **vuln-radar 기본선 재점검:** 앱별 개발 브랜치에서 실제 모듈·테스트와 [학습 TODO](../../apps/vuln-radar-backend/todo.md)를 대조한다. watchlist와 health·scoring·scheduler 테스트가 이미 있으므로 unchecked 목록을 그대로 미구현으로 간주하지 않는다.
- **vuln-radar 후속 개발:** DB 환경 분리·migration/복원, source별 freshness·retry/backoff·실패 기록을 우선 점검한다. scheduler 중복 방지는 현재 프로세스 내부이므로 replica 증가 전 공유 실행 제어를 설계한다. OSV/KISA 수집·실제 알림·SSE는 이 기본선 이후 선택한다.

### 보류와 상태 정리

- NAS 2대 HA, DB 이중화, 상시 롤링 배포, 검색 엔진·큐 도입은 복구 시간·트래픽·콘텐츠 규모를 측정한 뒤 판단한다.
- Activity는 실험 과제이며 도입 자체를 목표로 하지 않는다. root/허브 재디자인과 남은 시안 정렬은 현재 탐색 UX의 실제 문제를 확인한 뒤 착수한다.
- 전체 저장소 점검·NAS 설정·Dashboard 적용 완료를 주장하지 않는다. 이번 정리 기록은 [작업 기록](../worklog/2026-10/2026-10-04-development-backlog-review.md)을 참고한다.

## Docs Web Push

- [x] `P1` 웹 푸시 BFF에 초대 세션 접근 제한과 운영 WAF 미확인 시 fail-closed를 추가한다. [ADR-0010](../architecture/adr-0010-web-push-invitation-and-waf-gate.md), [로컬 검증](../verification/push/2026-10-03-push-access-gate.md). 운영 활성화 완료를 의미하지 않는다.
- [ ] `P0` 웹 푸시 공개 활성화 전 docs 프로젝트의 IP별 10회/60초 WAF를 게시·검증한다. 완료 조건: 로그인 갱신·올바른 프로젝트·기존 revalidation 보호·draft 확인, 초대 API 포함 429 관측과 정상 문서 이용, Production Secure 쿠키 검증. [실행 절차](../runbooks/docs-web-push-experiment.md). 그 전에는 플래그 false 유지.

- [-] `P2` 선택형 웹 푸시 MVP를 검증한다. 구독·해지 UI, NAS 저장, 관리자 테스트 발송 구현. 완료 조건: 내 브라우저 실제 수신/클릭, 재시작 유지, 해지 확인. [ADR](../architecture/adr-0009-docs-web-push-experiment.md), [실행 절차](../runbooks/docs-web-push-experiment.md).
- [ ] `P2` 일반 사용자 활성화 전에 보관 기간·자동 삭제, 실제 기기 지원, Vercel WAF, VAPID 회전과 DB/큐 필요성을 확정한다.
- [ ] `P2` 첫 published 전환만 알림으로 연결한다. 단순 수정·revalidation과 분리하고 중복 발송 방지를 검증한다.

## Recovery / Operations

- [-] `P1` Docs 성능·요청 계측을 도입한다. Speed Insights·서버 발급 ID·상세/검색 단계 로그 구현 및 로컬 production 검증. 완료 조건: Vercel 할당량 확인·활성화, Preview ID 상관관계 검증, 모바일 실제 표본 수와 p75 기록. [측정 절차](../runbooks/docs-deployed-performance-measurement.md).

- [x] `P1` 복구 목표·롤백·백업 보관·격리 리허설 기준을 문서화했다. [정책](../architecture/platform-recovery-policy.md)은 제안 상태이며 운영 적용과 구분한다.
- [ ] `P1` RTO/RPO 초안을 승인하고 NAS·DB의 백업 저장 위치, 주기, 암호화 키 복구 및 실패 알림을 설정한다. 완료 조건: 실제 성공 백업 식별자·보관 설정·알림 수신 기록 확보. 비밀값은 기록하지 않는다.
- [ ] `P1` 콘텐츠와 PostgreSQL의 첫 격리 복구 리허설을 실행한다. 완료 조건: [절차](../runbooks/platform-recovery-drill.md)에 따라 데이터·권한·API와 실제 RTO/RPO를 검증 보고서에 기록한다.
- [ ] `P1` 프론트 이전 deployment와 NAS 이전 digest 복귀를 격리 환경에서 검증한다. 완료 조건: 주요 사용자 동작·스키마 호환성·15분 관찰 통과. Production 장애를 임의로 유발하지 않는다.
- [ ] `P2` 실제 복구 결과로 롤링 배포·DB 이중화/PITR 필요성을 결정한다. 완료 조건: 중단 허용 시간·복제 지연·트래픽 전환·데이터 손실·운영 비용 비교와 실패 복귀 실험. 기능 제공 여부만으로 완료 처리하지 않는다.

## Dependency Security

- [ ] `P0` Vite+ 실험에서 보존한 기존 audit 13건은 [KAN-35](https://web-tech-service.atlassian.net/browse/KAN-35)에서 별도 처리한다. 2026-10-24 스냅샷은 critical 2·high 7·moderate 2·low 2이며 next·toml·zod·body-parser·multer·fast-uri가 대상이다. 이번 실험 커밋에 이 경고들의 보안 패치는 포함하지 않는다. 완료 조건: 착수 시 최신 main·공식 advisory·전체/production 경로 재확인, 독립 보안 브랜치의 패치·회귀·잔여 경고 검증, 승인된 PR/배포 결과 기록. 운영 악용이나 현재 배포 버전을 입증한 수치가 아니다. [당시 증거](../verification/artifacts/2026-10-24-viteplus-override-audit.json), [작업 경계](../worklog/2026-10/2026-10-24-viteplus-local-commits.md).

- [-] `P0` proxy-addr·sharp·source-map-js·seroval·KaTeX·selector parser 보안 패치를 main에 전달한다. 10-09 별도 보안 작업 트리의 패치·회귀·production 빌드를 통과했다. 완료 조건: 커밋·PR CI·main 병합·배포 브랜치 동기화·Linux 배포 검증. braces high 1개가 남아 전체 보안 조치 완료는 아니다. [검증 보고서](../verification/security/2026-10-09-security-patches.md).
- [x] `P1` main에 병합된 fast-glob 운영 경로 제거를 재검증했다. 10-18 `origin/main` `93fbf6d` 기반 production audit 0건·파일 trace/카테고리 22개를 통과했다. 개발 도구의 braces 경고 해소와 실제 배포는 별도다. [현재 결과](../verification/security/2026-10-18-handlebars-advisories.md#미해결-braces와-기존-완화-조치).
- [ ] `P2` rehype-katex·Typography의 공식 보안 의존성 지원 후 scoped override를 제거할 수 있는지 재검토한다. KaTeX 0.18.2는 이번에 검증한 임시 고정이며, 0.19 전환은 별도 수식 호환성 검증 후 결정한다. [선택 이유](../verification/security/2026-10-09-security-patches.md#패치한-패키지).

- [-] `P1` fast-uri·multer 보안 override와 lockfile을 main에 반영한다. 10-05 보안 브랜치의 로컬 회귀 검사는 통과했다. 완료 조건: PR CI·main 병합 후 Dependabot #331~#334 종료와 필요한 배포 브랜치 동기화를 확인한다. [검증 보고서](../verification/security/2026-10-05-fast-uri-multer.md).
- [x] `P0` Next.js critical advisory `GHSA-vcvr-r3jv-pc5j` 패치를 전달했다. next·@next/mdx 16.3.8의 PR #35 병합·feature 동기화·CI·운영 alias와 정상 OG PNG 3개를 확인했다. 공격 재현 또는 완전한 도달 불가능성 증명은 아니다. [구현 검증](../verification/security/2026-10-05-next-category-hardening.md), [운영 검증](../verification/security/2026-10-05-deployed-blog-smoke.md).
- [-] `P1` brace-expansion의 DoS 경고 3건을 처리한다. 10-05 작업 트리는 `^5.0.12` override와 lockfile·개발 도구 검사를 반영했고 관련 audit 경고는 사라졌다. 완료 조건: PR CI·main 및 필요한 브랜치 반영을 확인한다. [구현 검증](../verification/security/2026-10-05-next-category-hardening.md).
- [x] `P1` braces의 공개 카테고리 입력 경계를 보강했다. main·sub allowlist와 glob 비실행 회귀 검사, PR CI·운영 오류 화면/noindex·정상 카테고리 회귀를 확인했다. 패키지 취약점 자체의 해소와는 별개다. [구현 검증](../verification/security/2026-10-05-next-category-hardening.md), [운영 검증](../verification/security/2026-10-05-deployed-blog-smoke.md).
- [x] `P1` docs 직접 fast-glob 경로를 기본 파일 순회로 대체하고 카테고리·검색·revision·production trace를 검증했다. 10-09 로컬 검증 완료, Vercel 배포는 미검증. 저장소 전체 취약점 제거와 구분한다. [ADR-0014](../architecture/adr-0014-local-content-file-discovery.md), [증거](../verification/security/2026-10-09-braces-runtime-removal.md).
- [-] `P1` braces의 미출시 패치를 추적한다. 10-21에도 공식 patched version 없음·registry 최신 `3.0.3`이며 main의 docs 운영 경로는 제거됐다. ESLint·두 백엔드 ts-loader의 개발 경로에 high 1건이 남는다. 완료 조건: 출시 패치 또는 검증된 개발 의존성 제거 후 전체 audit의 해당 경고 해소. 미출시 `>=3.0.4`를 강제하지 않는다. [최신 조사](../verification/security/2026-10-21-vite-content-advisories.md).
- [-] `P1` Vite·sanitize-html·Hono·markdown-it의 공식 패치를 main 기반 별도 보안 브랜치에 반영했다. GitHub open 5건과 registry audit 11건을 구분했고 전체 audit은 braces high 1건·production은 0건이다. 남은 완료 조건: PR CI·리뷰·main 병합·GitHub #340~#343 종료·소비 앱 배포 확인. [현재 검증](../verification/security/2026-10-21-vite-content-advisories.md).
- [-] `P0` 두 NestJS 백엔드의 proxy-addr critical `GHSA-jqcg-44mw-7w3h`: 2.0.8 패치와 회귀 검사는 PR #36으로 main에 병합되고 feature 브랜치에 전달됐다. 남은 완료 조건: 실제 운영 이미지의 패치·proxy 설정과 배포 검증. 실제 악용 관측은 아님. [패치 검증](../verification/security/2026-10-09-security-patches.md).
- [-] `P1` source-map-js·sharp·seroval: PR #36에서 버전 범위와 lockfile을 갱신하고 회귀 검사 후 main·feature에 반영했다. 남은 완료 조건: Vercel/Linux의 실제 이미지·OG·런타임 의존성 확인. 조사 당시 production 5건·전체 7건은 현재 상태가 아니라 [패치 전 기록](../verification/security/2026-10-09-remaining-advisories.md)이다. [패치 결과](../verification/security/2026-10-09-security-patches.md).
- [-] `P2` KaTeX 0.18.2·postcss-selector-parser 7.1.6: 상위 범위 밖 갱신은 PR #36에서 parent-scoped override와 수식·Typography 회귀 검사를 거쳐 main·feature에 반영했다. 남은 완료 조건: 운영 화면 검증과 상위 공식 지원 시 override 재검토. [당시 대안 조사](../verification/security/2026-10-09-remaining-advisories.md), [적용 결과](../verification/security/2026-10-09-security-patches.md).

- [-] `P1` Handlebars 4.7.9 경고 3건(critical 2·moderate 1)을 main 기반 보안 브랜치에서 4.7.10으로 조치했다. 두 backend의 ts-jest 경로·패치 전/후 회귀·backend 테스트와 build·전체 audit 재검사를 완료했다. 남은 완료 조건: PR CI·main 병합 후 #337~#339 자동 종료와 필요한 배포 브랜치 전파. braces 1건은 미해결이며 악용·운영 도달성을 관측했다는 의미는 아니다. [검증 결과](../verification/security/2026-10-18-handlebars-advisories.md).

## Shared UI

- [x] `P2` UI React peer·CSS/hook export·0.1.x 버전 기준과 독립 tarball 검사를 추가했다. [ADR-0013](../architecture/adr-0013-shared-ui-external-package.md). registry 게시와 실제 외부 앱 이전은 완료가 아니다.
- [ ] `P2` 외부 소비 앱 한 곳에서 tarball·RSC·PostCSS·토큰 충돌을 확인하고 registry·인증·자동 배포 정책을 확정한다.

- [x] `P1` `test:ui`와 `test:ui:consumer`를 CI 독립 matrix에 연결한다. 09-26 작업 트리 반영과 로컬 78개 검증 완료. [검증 기록](../verification/content/2026-09-26-shared-ui-ci.md).
- [x] `P1` 공용 UI matrix를 push한 뒤 동일 SHA의 GitHub Actions 두 check 통과를 확인한다. `5dbbcc5`의 두 Shared UI 작업이 성공했다. required checks 등록은 별도 설정이다. [원격 검증](../verification/cache/2026-09-27-docs-ci-log-review.md).

- [-] `P1` 공용 UI와 모든 대상 소비 앱의 동작 기반을 Base UI로 통일한다. 1차 공용 primitive 전환은 완료했지만 전체 전환은 진행 중이다. [ADR-0006의 최종 목표](../architecture/adr-0006-shared-ui-base-ui.md)를 기준으로 관리한다.
- [x] `P1` 저장소 소유 UI의 직접 Radix 의존성과 wrapper를 정리한다. 미사용 `apps/vuln-radar`의 `@radix-ui/react-slot`, `packages/ui`의 `cmdk`·`@radix-ui/react-icons`와 catalog 선언을 제거했다. cmdk의 Dialog 전이 경로도 제거됐으며 UI 54개·production 16개·Drawer 반복 20개 검증을 통과했다. [검증 보고서](../verification/content/2026-09-22-base-ui-migration.md)를 참고한다. Prisma Studio의 전이 의존성과 외부 모노레포는 아래 별도 과제로 남긴다.
- [ ] `P2` Prisma Studio의 Radix 전이 의존성을 별도 검토한다. `prisma -> @prisma/studio-core -> @radix-ui/react-toggle` 경로가 남아 있다. 완료 조건: 실제 앱 번들·런타임 포함 여부와 상위 패키지 제거·업데이트 가능성을 확인하고 인증·DB 기능을 유지한 상태에서 처리 방향을 결정한다. 이 경로가 남은 동안 저장소 전체 Radix 의존성 제거 완료로 표시하지 않는다. Base UI로 강제 override하거나 Prisma를 임의 제거하지 않는다.
- [ ] `P2` 다른 모노레포에서 공용 UI를 사용할 배포·버전 정책과 소비처 목록을 확정한다. 완료 조건: 실제 소비 저장소, React/빌드 호환성, 패키지 전달 방식, API 변경 이행 절차를 기록하고 각 소비처에서 검증한다. 09-23 확인: `private: true`, React 일반 dependency, CSS export 부재와 앱의 저장소 상대 source 경로가 남아 있다. tarball 내용·peer 정책·외부 소비 fixture 검증 전에는 외부 재사용 준비 완료로 처리하지 않는다. [점검 기록](../worklog/2026-09/2026-09-23-adr-followup-improvements.md#공용-ui-외부-재사용-점검). 외부 모노레포는 미조사이며 자동 배포·변경하지 않는다.

- [x] `P1` Radix 유지안과 비교 후 공용 primitive를 Base UI로 전환한다. 디자인 토큰·모듈 경로를 유지하고 render·포커스·Tooltip 설명 관계를 재검증했다. 선택 이유는 [ADR-0006](../architecture/adr-0006-shared-ui-base-ui.md), 실행 범위는 [검증 보고서](../verification/content/2026-09-22-base-ui-migration.md)를 참고한다. 운영 배포 완료를 의미하지 않는다.

- [x] `P1` 공식 Radix/new-york-v4의 Sheet 닫기 옵션, Button 작은 크기, Badge 변형, Tooltip Provider 구성을 선별 반영한다. 기존 디자인 토큰 유지와 회귀 검사 결과는 [작업 기록](../worklog/2026-09/2026-09-22-shadcn-primitives-refresh.md)을 참고한다.
- [ ] `P1` Activity를 운영 UI에 도입하기 전에 Portal 생명주기 경계를 검증한다. 완료 조건: Root·Content 외부 배치와 닫힘 완료 후 숨김 방식을 비교하고, production·애니메이션·빠른 재열기에서 Overlay 제거, 스크롤 잠금 해제, 보이는 대상으로 포커스 복귀, 재진입을 확인한다. 현재 운영 장애로 확정된 항목은 아니며 [실험 결과](../verification/content/2026-09-21-activity-focus.md)가 근거다.
- [x] `P2` 공용 UI의 cn·통합 radix-ui 패키지를 단계적으로 전환했다. 공개 exports 유지, 클래스 병합·UI 46개, Activity 22개, 모바일 Drawer 4개, 소비 앱 타입 검사와 vuln-radar 빌드를 확인했다. 번들 측정 범위와 중복 Context 확인 한계는 [작업 기록](../worklog/2026-09/2026-09-22-ui-dependency-migration.md)을 참고한다.
- [-] `P2` 공용 UI 의존성 전환 후 docs의 production 동작을 확인한다. Base UI 기준 Next.js 빌드와 Drawer·필터 16개는 통과했다. production Tooltip은 미검증이며, [현재 검증 기록](../verification/content/2026-09-22-base-ui-migration.md)을 참고한다.
- [ ] `P2` 공용 Sidebar와 Tooltip의 Safari·Firefox·모바일·스크린 리더 점검을 추가한다. 완료 조건: 키보드 탐색, 닫기·복귀, 테마별 가독성 및 reduced-motion을 실제 소비 화면에서 확인한다. 현재 새 기본 컴포넌트 검사는 headless Chromium 범위다.

## Planning / Product

- [x] `P2` `/docs`에 공개 태그 query와 공개 글 기반 시리즈·학습 경로를 추가했다. [ADR-0012](../architecture/adr-0012-content-discovery-collections.md). 로컬 9개 E2E 통과이며 NAS·배포 혼합 목록은 후속 검사다.
- [ ] `P2` 실제 콘텐츠 편집 빈도에 따라 모음의 원격 계약·회차·진도 저장 필요성을 결정한다. 현재는 편집 레지스트리 방식이다.

- [x] `P1` ARIA·V8·Next.js 패키지 글의 제목/요약을 조사 기록·입문 노트·탐색 체크리스트 범위에 맞추고 용어와 근거를 보완했다. 실제 경험·결과를 추정하지 않고 미검증 범위를 명시했다. [편집·검증 기록](../verification/content/2026-09-22-content-editorial-and-canvas-hover.md).
- [x] `P2` V8의 두 버전에서 실제 바이트코드 출력을 확인했다. 재현 스크립트와 결과는 별도 로컬 `labs/v8-bytecode-lab`에서 관리하고, 블로그 글에는 개념만 남겼다.
- [ ] `P2` ARIA의 당시 재현 환경과 수정 전후 결과는 증거를 확보한 뒤 별도로 추가한다.
- [ ] `P2` Canvas headed hover는 외부 포인터 입력을 통제한 환경에서 재확인한다. 일반 버튼 대조군에도 간섭이 관측됐으며 headless 결과와 구분한다. [진단 기록](../verification/content/2026-09-22-content-editorial-and-canvas-hover.md).
- [x] `P1` 블로그 개선 로드맵을 기준 문서로 고정한다.
  - 메타데이터, 라우팅, 검색, 렌더링, 테스트, contributor guide 기준선을 정리
  - 신규 과제는 우선 `todo`에 추가하고, 운영 규칙으로 승격되면 로드맵 또는 관련 architecture/runbook 문서에 연결
  - 기준 문서: `docs/architecture/docs-blog-improvement-roadmap.md`
- [x] `P1` `docs` 앱의 정보구조를 확정한다.
  - `Feed / Web / Mobile / UI/UX / About`를 사용자-facing IA로 정의
  - `Category`는 taxonomy 허브, 허브 페이지는 탐색 단위, 상세 페이지는 학습 단위로 문서화
  - 기준 문서: `docs/architecture/docs-app-information-architecture.md`
- [x] `P1` 콘텐츠 운영 모델을 정한다.
  - local MDX는 baseline / evergreen / fallback 콘텐츠로 유지
  - remote content API는 배포 없이 갱신되는 운영형 콘텐츠로 사용
  - 글 업로드는 local authoring + explicit publish workflow로 확정
  - CMS/API direct publish는 현재 단계에서 보류
  - 기준 문서: `docs/architecture/docs-content-operating-model.md`
- [x] `P2` 검색 경험의 목표를 정의한다.
  - 검색 결과는 `/docs?q=...` 상태로 운영
  - 검색 범위는 `title / summary / taxonomy / content` 우선순위로 정리
  - empty state와 추천 검색어 정책 문서화
  - 기준 문서: `docs/architecture/docs-search-experience-policy.md`
- [x] `P1` `/feed`와 `/docs`의 실제 화면 차이를 더 분명히 만든다.
  - `/feed`는 `MainFeed` 기반 큐레이션 피드로 유지
  - `/docs`는 전용 index/search layout으로 분리
  - 기준 문서: `docs/architecture/docs-feed-and-docs-routing-policy.md`
- [x] `P1` `/web`, `/mobile`, `/ui-ux`를 상세 showcase가 아니라 채널 허브로 전환한다.
  - 세 라우트는 `HubPage` 기반 탐색 허브를 사용
  - `web`은 FE/V8 문서, `ui-ux`는 interface/system 문서, `mobile`은 empty state를 포함한 허브 구조로 운영
  - 작업 기록: `docs/worklog/2026-05/2026-05-08-channel-hub-layout-conversion.md`

## Code / Architecture

- [x] `P1` 로컬·원격 published 문서에 공용 본문 작성 검증기를 연결한다. 09-26 작업 트리에서 로컬 CLI·NestJS 목록/상세의 동일 실패 규칙과 경고 유지 확인. [검증 기록](../verification/content/2026-09-26-shared-body-validation.md).
- [ ] `P1` 새 docs-backend 이미지 배포 전에 기존 NAS 문서의 본문 규칙 위반을 점검하고, 배포 후 목록·상세 및 인증된 revalidation을 확인한다. 위반 문서는 목록에서 제외되므로 [배포 영향](../architecture/docs-content-authoring-markup-policy.md#배포-영향)을 먼저 검토한다.

- [x] `P1` article frontmatter / remote metadata 스키마를 고정한다.
  - `title`, `slug`, `summary`, `date`, `markdownPath`, `thumbnail`, `authorName`, `authorRole`, `readMinutes`, `topicLabel`, `updatedAt`, `tags`, `status`의 필수/선택 여부를 확정
  - local MDX와 remote API가 같은 의미 체계를 쓰도록 contract를 정리
  - 기준 문서: `docs/architecture/docs-blog-improvement-roadmap.md`
- [x] `P1` 상세 문서 canonical route 정책을 더 강하게 닫는다.
  - 채널 허브(`/feed`, `/web`, `/mobile`, `/ui-ux`)와 상세(`/docs/{channel}/{slug}`)의 책임을 명확히 분리
  - 상세 URL 계산에서 `markdownPath`를 canonical source로 고정하고 redirect/alias 정책을 문서화
  - 기준 문서: `docs/architecture/docs-content-routing-policy.md`
- [x] `P1` local content build-time frontmatter validation을 추가한다.
  - `published` 문서는 `title`, `slug`, `date`, `summary`를 강제
  - `draft`/`archived`는 공개 목록에서 제외하고 완화된 규칙으로 검증
  - `pnpm --filter docs validate:content`와 `prebuild` 단계에서 같은 기준을 실행
- [x] `P1` 편집용 문구가 공개 본문에 노출되지 않도록 authoring 검증을 통일한다.
  - local content validator에서 코드 예제 밖의 HTML 주석과 잘못 닫힌 주석을 hard fail 처리
  - 문서 상태는 본문 `작성중` 표현이 아니라 frontmatter `status: draft`로 관리
  - docs-backend의 published 목록/상세에도 공용 `getMarkdownBodyStyleIssues`를 연결했다. NAS 기존 글 점검과 이미지 배포 검증은 위의 별도 과제로 유지
  - 기준 문서: `docs/architecture/docs-content-authoring-markup-policy.md`
- [x] `P1` 게시 갱신 스크립트에 발행 결과 확인을 추가했다. 기대값 JSON 기반 목록·검색·상세 검사, 제한 횟수·시간과 불일치 실패 종료, POST 1회와 401/403 즉시 중단, 로그 비밀값 제외를 구현했다. 로컬 콘텐츠 34개와 production 게시 E2E 3개 통과. [검증](../verification/cache/2026-10-08-content-publication-verifier.md), [명령 이행 절차](../runbooks/docs-content-publication-verification.md). NAS 운영 발행·원복과 구분한다.
- [x] `P1` `apps/docs`의 FSD 3차 정리를 진행한다.
  - `shared/layout`, `shared/navigation` 기반 app shell을 `widgets/app-shell`로 이동
  - `app/layout.tsx`는 shell widget을 조합하는 얇은 엔트리로 정리
  - 후속으로 widget/feature/entity 경계 재점검은 별도 항목으로 계속 진행
- [x] `P1` `apps/docs`의 widget / feature / entity 경계를 한 번 더 재점검한다.
  - `toc`는 `widgets/article-toc`
  - `category`는 `entities/category`
  - `architecture-page`는 `widgets/architecture-page`
- [x] `P1` `apps/docs`의 남은 legacy `components/` 레이어를 계속 소진한다.
  - `app-sidebar`는 `widgets/category-sidebar`
  - `content-hub`는 `widgets/content-hub`
  - `hero`는 `widgets/home-hero`
- [x] `P1` `apps/docs/components/react-flow`의 최종 레이어를 확정한다.
  - 메인 hero UX 관점에서 장식 대비 효용이 낮다고 판단해 제거
  - `home-hero`는 더 직접적인 콘텐츠 preview UI로 대체
- [x] `P1` `next-intl` 기준으로 i18n 사용 방식을 통일한다.
  - `Brand`, app shell navigation, `Footer`, `Search`를 실제 메시지에 연결
  - 메시지 키는 `common / navigation / header / footer / search` namespace와 camelCase 규칙으로 정리
  - 기준 문서: `docs/architecture/docs-next-intl-usage-policy.md`
- [x] `P1` `docs` app shell의 responsive 정책을 widget 레벨까지 확장 적용한다.
  - `MainFeed`, `ArticleDetail`, `AboutUs` 내부의 `sm/md/lg` 사용 재점검
  - shell breakpoint와 content breakpoint 충돌 제거
- [ ] `P2` `MainFeed`, `HubPage`, `ArticleDetail`의 데이터 주입 방식을 정리한다.
  - curated static data와 real document data를 어디까지 분리할지 결정
- [ ] `P2` UI package build/export 전략과 소비 앱 설정을 지속 점검한다.
  - `transpilePackages`
  - build artifact usage
  - import path 안정성
- [-] `P2` local MDX와 remote HTML/markdown 렌더링 전략을 한 단계 더 통일한다.
  - 기본 방향은 renderer 단일화가 아니라 output contract 통일로 확정
  - 1차 적용: remote HTML code block을 local MDX와 같은 `.mdx-code-frame` 계층으로 normalize
  - 1.5차 적용: remote HTML code block에 client-side copy enhancer 연결
  - 2차 적용: local/remote table wrapper와 blockquote class/spacing 계약 통일
  - 3차 적용: `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]` callout marker를 output contract에 편입
  - 3.5차 적용: content style validator에 callout marker 위치/지원 범위 검증 추가
  - 후속: callout variant 확장 필요성 점검
  - remote MDX evaluation, markdown-first, HTML-only 전략은 후속 spike로 검증
  - 기준 문서: `docs/architecture/docs-article-rendering-convergence.md`

## UI / UX

- [x] `P0` 현재 공개 사이트의 접근성 토큰·포커스 규칙 누락을 재검사한다. 이전 실패 4개를 포함한 20개가 통과했고 모바일 전용 4개만 데스크톱에서 제외됐다. 증상 재검증 완료이며 캐시 원인 규명 완료는 아니다. [후속 검증](../verification/accessibility/2026-09-23-deployed-shell-recheck.md).
- [ ] `P2` 접근성 CSS 누락 재발 시 배포 커밋·원본 CSS·공개 CSS를 함께 수집해 원인을 비교한다. 현재 증상은 재현되지 않았고 과거 원인은 미확정이다. 실패 당시 증거는 [기존 보고서](../verification/accessibility/2026-09-23-deployed-shell.md)에 보존한다.
- [x] `P1` `/docs` 비활성 이전·다음 링크의 키보드 활성화를 막는다. 경계에서 href·포커스 없는 비활성 표시를 렌더링하고 정상 링크와 query 생성을 유지한다. ko/en 및 3개 화면 크기의 경계·이동 검사와 기존 필터 검사 통과. [수정과 검증](../worklog/2026-09/2026-09-23-docs-pagination-disabled-navigation.md).
- [x] `P1` UI/UX 예시 글을 실제 문서처럼 표시하지 않는다. 실제 문서만 표시하고 부족한 섹션을 숨기며, 0개 안내와 명확한 피드 이동 CTA를 제공한다. 0·1·2·7개 등을 포함한 모델 테스트와 로컬 2개 문서의 브라우저 검사를 통과했다. 운영 원격 데이터 확인은 배포 후 별도 진행한다. [작업 기록](../worklog/2026-09/2026-09-23-uiux-real-article-cards.md).
- [x] `P1` 검색 빈 상태의 번역과 본문 landmark를 통일한다. ko/en의 검색 0건·전체 문서 0건에서 제목·본문·복구 링크를 통일하고 공백 query도 같은 정책을 적용한다. 전체 0개는 서버 렌더링, 검색 0건은 브라우저로 검증했다. [작업 기록](../worklog/2026-09/2026-09-23-docs-empty-state-localization.md).
- [x] `P2` 헤더·본문 검색·직접 URL·API의 입력 정규화와 길이 정책을 공유한다. [ADR-0007](../architecture/adr-0007-search-input-contract.md)의 40 code point·NFC·공백·첫 query 정책을 적용하고 합성 IME 이벤트와 서버 경계를 검사했다. 실제 OS IME는 별도 검증 대상이다. 검색 결과 페이지네이션은 보류를 유지한다.
- [x] `P2` `DocsIndex`의 통계·섹션·페이지 이동을 역할별로 분리한다. 서버 컴포넌트 3개로 추출하고 기존 query·검색 관련도·빈 상태·페이지 이동 계약을 유지했다. [검증 기록](../worklog/2026-09/2026-09-23-adr-followup-improvements.md).
- [x] `P2` 헤더·본문 검색의 이동 방식과 로딩 표시를 통일한다. 09-26 공용 navigation hook·제출 버튼, 같은 URL·IME·pending 중복 방지를 적용했다. [로컬 검증](../verification/content/2026-09-26-search-navigation.md)은 51개 E2E·production build 통과. 10-05 [운영 검증](../verification/security/2026-10-05-deployed-blog-smoke.md)에서 모바일·데스크톱 헤더/본문 검색의 정규화·reload 없는 이동을 확인했다. 운영 실제 IME·pending 경쟁은 별도다.
- [ ] `P2` 원격 Browser 글의 제목 계층을 보완한다. API 응답에 H1 두 개가 존재한다. 완료 조건: NAS 원문 복사본의 frontmatter·본문 heading 검증, 실행 이미지 확인, 게시 갱신 후 공개 상세 H1 확인. 새 검증 이미지 배포만으로 기존 글이 제외되지 않도록 한다. [관측 근거](../verification/security/2026-10-05-deployed-blog-smoke.md).
- [x] `P2` 카테고리 UI의 ko/en 번역을 배포 후 확인한다. 로컬 E2E 18개에 이어 10-06 운영의 ko/en·전체/FE/React/Node.js·두 viewport 16개 조건을 통과했다. UI 제목·설명·최근 업데이트 번역과 문서 제목·href 유지, 가로 넘침 없음을 확인했다. 문서 수 label의 세부 운영 검사는 이번 probe 범위 밖이다. [운영 검증](../verification/security/2026-10-06-deployed-followup.md).
- [ ] `P2` OG 이미지의 브라우저 TTL 차이를 보완한다. 앱의 브라우저 1시간·Vercel 1일 헤더 분리와 프로덕션 빌드·PNG E2E 검증을 마쳤다. 10-06 최신 배포의 기존·새 query 두 공개 응답도 MISS·Age 0에서 4시간으로 관측했다. Cloudflare 설정은 미변경이다. 완료 조건: Browser Cache TTL·Cache Rules 확인 후 공개 `max-age=3600` 재검증. PNG 성공이나 전용 헤더 표시 여부만으로 완료 처리하지 않는다. [운영 검증](../verification/security/2026-10-06-deployed-followup.md)·[운영 절차](../runbooks/docs-seo-metadata-routes.md).
- [ ] `P2` JavaScript 비활성 환경의 `/docs` 스트리밍 완결성을 확인한다. 개발 서버에서 본문 대신 loading 상태가 남았다. 09-26에도 두 locale에서 재현했다. 폼 단독 native GET 통과와 구분하고 프로덕션에서도 재현되는지 확인한 뒤 progressive enhancement 지원 범위를 정한다. [검증 범위](../verification/content/2026-09-26-search-navigation.md).

- [-] `P0` `640px ~ 1023px` 구간의 shell/UI 동작을 실제 디바이스 기준으로 점검한다.
  - header
  - mobile drawer
  - bottom nav
  - article/feed spacing
  - 브라우저/기기 점검 체크리스트 추가 완료
  - 정적 breakpoint 감사 후보 식별 완료
  - `/docs`, `/feed`의 breakpoint/list 변화에 CSS 기반 motion 적용 완료
  - 1차 조치: `/docs`, channel hub, about의 빠른 다열화 지점 일부 완화
  - 2차 조치: `/docs` 모바일 검색/필터 영역의 텍스트 잘림과 가로 스크롤 발생 지점 완화
  - 3차 조치: Playwright 기반 mobile/tablet horizontal overflow smoke test 추가
  - 4차 조치: mobile footer 보조 링크 노출을 줄이고 bottom nav route 구조 정리
  - 5차 조치: `/docs` 모바일 주요 touch target 최소 크기와 focus ring 보강
  - 6차 조치: desktop TOC anchor 이동 시 sticky header와 heading 겹침 회귀 테스트 추가
  - 7차 조치: Next.js 16 기준 `middleware.ts`를 `proxy.ts` 문법으로 전환
  - 8차 조치: shell navigation visibility e2e를 mobile/tablet/desktop 기준으로 확장하고 제거된 `source` query 기준을 정리
  - 기준 문서: `docs/runbooks/docs-responsive-browser-device-checklist.md`
- [-] `P1` 루트 `/` 화면을 `141:2 Landing Page - HEAPFORGE` 기준으로 재구성한다.
  - 현재 `HeroSection` 단일 구성을 landing page 섹션 구조로 확장
  - `Hero Section`, `Thematic Foundations`, `Latest Notes`를 별도 위젯/엔티티로 분리 검토
  - 기준 문서: `docs/architecture/docs-heapforge-alignment-checklist.md`
- [x] `P1` `MainFeed` 필터 버튼에 실제 인터랙션을 연결한다.
  - `query string` 기반으로 확정
  - `/feed?topic=web|mobile|uiux` 형태로 상태를 표현
  - 기준 문서: `docs/architecture/docs-feed-filter-policy.md`
- [-] `P1` `/docs`를 검색/색인 중심 화면으로 점진 개선한다.
  - 1차: compact search panel, 추천 키워드, 섹션 요약, row형 문서 카드, 페이지네이션 반영 완료
  - 2차: `section/sort` query string 기반 필터와 정렬 UI, 필터 empty state, 카드 메타 정보 반영 완료
  - 3차: 검색 결과 화면에도 `section` 필터 적용 완료, 카드 정보 계층과 `docs-index` UI/model 분리 완료
  - source 필터/배지는 사용자-facing UI에서 제거하고 runtime log 관측 메타로 분리
  - 3.5차: 문서 썸네일, 날짜, 보조 메타 pill을 shared UI로 분리 완료
  - 4차: 모바일 터치 사용성 1차 보강 완료
  - 목표: `/feed`는 발견/큐레이션, `/docs`는 빠른 검색/탐색으로 역할을 분리
  - [x] 10-14 목록 순서·밀도 검토와 개선 전 기준선을 기록했다. 당시 구현 미착수였으며 이후 진행은 아래 단계별 항목을 따른다. [검토 보고서](../verification/accessibility/2026-10-14-docs-index-density-review.md).
  - [x] 1단계 로컬 구현·확인: 검색·결과 수·접이식 필터·현재 선택 다음에 실제 목록을 표시한다. 모바일 첫 제목은 인덱스 512px·검색 452px였다. 관련 E2E 69개(5개 제외)·목록 재검사 12개·화면 26조건 통과. 공개 배포는 미검증이다. [결과](../verification/accessibility/2026-10-19-docs-index-order-local.md).
  - [ ] 다음 2단계: 목록 뒤로 옮긴 통계·섹션 요약의 중복과 표현을 줄이고 태그·모음의 추가 접힘을 검토한다. 배치 이동은 1단계에서 반영했다. 완료 조건: 선택과 해제·query 유지·읽기 순서·키보드 접근을 보존한다.
  - [ ] 다음 3단계: 카드 padding·중복 메타·OPEN 표시를 검토한다. 완료 조건: 제목·요약의 읽기 폭 확보, 전체 카드 클릭·검색어 강조·focus와 큰 글자 사용성 유지.
  - [ ] 다음 4단계: 반응형·검색·필터·페이지 이동 회귀와 공개 배포를 확인한다. 완료 조건: 제안 목표와 기능 계약을 검증 보고서에 기록하고 로컬 통과·공개 확인을 구분한다.
- [x] `P1` footer 링크를 실제 라우트 또는 외부 링크와 연결한다.
  - `PRIVACY`
  - `TERMS`
  - `CHANGELOG`
  - `GITHUB`
- [-] `P2` empty state, loading state, error state의 시각 톤을 통일한다.
  - root landing은 remote latest notes 실패 시 페이지 전체를 죽이지 않고 섹션 단위 graceful degradation을 유지
  - 10-19 로딩은 공통 상태·막대 + 도메인별 골격으로 분리했다. 검색·필터·카드·헤더 프레임을 실제 화면과 공유하고 홈은 최근 글만 대기한다. [로딩 정책](../architecture/docs-loading-ux-policy.md), [로컬 검증](../verification/accessibility/2026-10-19-page-skeletons-local.md). 운영 CLS와 데이터 의존 높이·빈 결과는 후속 점검 대상이다.
- [-] `P2` keyboard navigation / focus ring / drawer close flow 접근성을 점검한다. 로컬 production 20개 통과와 운영 CSS 실패를 구분하며, VoiceOver/NVDA 낭독은 미검증이다. [현재 검증](../verification/accessibility/2026-09-23-deployed-shell.md).
- [-] `P2` layout/list motion 정책을 운영한다.
  - `motion-layout`, `motion-reveal` 기반으로 시작
  - `prefers-reduced-motion` 대응 필수
  - 기준 문서: `docs/architecture/docs-motion-interaction-policy.md`
- [x] `P2` React inspection tools는 development 환경에서만 로드하도록 고정한다.
  - `react-scan`, `react-grab`은 production bundle/runtime에 포함하지 않는다.
  - CDN URL은 명시 버전으로 고정한다.
  - development에서도 `DOCS_ENABLE_REACT_INSPECTION=true`일 때만 opt-in 로드한다.
  - 기준 문서: `docs/worklog/2026-08/2026-08-29-docs-article-anchor-scroll-test.md`
- [-] `P2` article detail의 읽기 보조 UX를 확장한다.
  - related posts 1차 적용 완료
  - previous / next navigation 1차 적용 완료
  - last updated badge 1차 적용 완료
  - feedback entry point
  - 기준 문서: `docs/architecture/docs-blog-improvement-roadmap.md`
- [-] `P2` 문서 카드 공통 UI 재사용 기준을 운영한다.
  - 카드 전체 레이아웃은 화면별로 유지
  - 썸네일 fallback, 날짜 포맷, read time/topic/tags 보조 메타는 shared UI로 관리
  - source는 UI 메타가 아니라 runtime log 관측 메타로 분리
  - 기준 문서: `docs/architecture/docs-document-ui-reuse-policy.md`
- [ ] `P2` 문서 썸네일 LCP 정책을 정리한다.
  - Playwright e2e 중 `/default/local-document.svg`가 LCP 후보로 감지됨
  - above-the-fold 카드 이미지에 `priority` 또는 `loading="eager"`를 적용할지 기준화
  - 모든 카드 이미지에 일괄 적용하지 말고 첫 화면 노출 이미지와 lazy 이미지 기준을 분리
  - 관련 컴포넌트: `DocumentThumbnail`, `MainCard`, `DocsIndexCard`

## Design / Design System

- [x] `P1` Figma asset 의존 화면을 모두 `public/figma/*` 또는 정식 에셋으로 이관한다.
  - `article-detail`, `ui-ux hub`에 남아 있던 Figma export 경로를 `public/editorial/*` 정식 자산 경로로 이관
  - 공용 editorial asset 상수로 묶어 재사용
- [-] `P1` `HEAPFORGE` 기준 화면과 현재 `docs` 구현의 정렬 체크리스트를 운영한다.
  - 공통 shell, `/feed`, `/about`, `article-detail`, `/category` 순으로 정렬
  - 기준 프레임: `141:676`, `141:325`, `141:470`, `141:189`, `141:2`
  - 기준 문서: `docs/architecture/docs-heapforge-alignment-checklist.md`
- [-] `P1` 디자인 토큰 사용 일관성을 높인다.
  - 하드코딩 색상, radius, shadow 제거
  - `design.md` 토큰 기준으로 치환
  - 1차 적용: `MainFeed`, `DocsIndex`, `ArticleDetail`, `AboutUs`, `Search`
  - 2차 적용: `/category` 계열, `content-hub`, category cards
- [ ] `P2` mobile/top/bottom chrome 아이콘을 Figma 자산 또는 확정 아이콘 세트로 통일한다.
- [ ] `P2` 라이트 모드/다크 모드 시안 차이를 페이지별로 점검한다.
  - `About`
  - `Feed`
  - `ArticleDetail`
- [ ] `P2` typography scale과 실제 component usage를 대조한다.
  - headline/body/label usage mismatch 정리
- [x] `P2` 검색 highlight와 excerpt의 시각 규칙을 토큰 기준으로 다듬는다.
  - `<mark>` 표현이 light/dark 모두에서 과하지 않게 보이도록 조정
  - search result card에서 title / excerpt emphasis 강도를 다시 점검
  - 기준 문서: `docs/architecture/docs-search-experience-policy.md`

## Infra / Tooling

- [x] `P2` ADR-0007의 구현·배포·검증 근거를 연결한다. 09-26 공개 검색 6개·About 8개 통과와 GitHub Production 성공 기록을 연결했다. alias 매핑 미확정 및 후속 이동 개선 미배포를 구분한다. [검증 보고서](../verification/content/2026-09-26-deployed-search-contract.md).

- [x] `P1` 요청별 스트림 종료 로그 정책을 수립한다. 문구·prefetch 여부만으로 취소를 확정하지 않고 선행 오류와 완료 상태를 함께 판정한다. [정책](../architecture/docs-request-lifecycle-logging-policy.md), [ADR-0008](../architecture/adr-0008-request-lifecycle-observability.md).
- [x] `P1` 로컬 production fixture에 요청별 계측과 판정 테스트를 추가한다. 전체 80개 통과. 상세 진단의 스트림 오류 2건을 서버 요청과 브라우저 dispatch에 연결했다. Next의 선행 오류 관측은 partial이므로 정상 취소로 단정하지 않는다. 기존 메시지는 필터링하지 않는다. [결과와 한계](../verification/cache/2026-09-24-local-request-lifecycle.md).
- [ ] `P1` Vercel Preview에서 오류 훅과 플랫폼 로그의 요청 상관관계를 검증한다. 완료 조건: 실제 지원 필드·누락 범위 기록, 캐시 ID 재사용 없음, 강제 종료와 늦은 오류의 unknown/failed 분류, 캐시·스트리밍 동작 유지 확인.
- [ ] `P2` 검증된 요청 로그를 운영 수집·집계·알림에 연결한다. 완료 조건: 보관/비용/마스킹/전달 실패 정책 확인, 실제 탐색과 prefetch 지표 분리, 테스트 알림 수신. 기존 Better Stack schema failure 연결과 구분한다.

- [x] `P1` docs 배포 브랜치의 직접 push에도 CI와 문서 검사를 실행한다. `5dbbcc5`의 Commit Messages·Lint·Typecheck·Test·Documentation과 두 Shared UI 작업이 성공했다. Vercel 배포와 CI는 별개이며 배포 차단 연동은 이번 범위가 아니다. [원격 검증](../verification/cache/2026-09-27-docs-ci-log-review.md).

- [-] `P0` `apps/docs` Vercel 운영 보안 기준을 적용한다.
  - `/api/revalidate/content`에 Production 전용 `5 requests / 60 seconds / IP` WAF rate limit 적용
  - `BLOG_CONTENT_API_TOKEN`, `BLOG_CONTENT_REVALIDATE_TOKEN`을 Sensitive 환경변수로 관리
  - Preview-only Vercel Authentication 활성화
  - Function 실패와 비정상 사용량 alert 구독
  - Dashboard 설정은 실제 적용 및 검증 전까지 완료로 표시하지 않음
  - 기준 문서: `docs/architecture/docs-vercel-platform-operations-policy.md`
- [-] `P1` `apps/docs` 실사용 성능 계측의 운영 검증을 완료한다.
  - Speed Insights·요청 단계 로그 코드는 구현되어 있다. 상단 Recovery / Operations의 계측 과제를 기준으로 실제 표본과 Dashboard 활성화를 확인
  - 서울 `icn1` Function region은 원격 NAS fetch latency 측정 후 적용 여부 결정
- [ ] `P2` Vercel 확장 운영 기능의 도입 시점을 재평가한다.
  - Log Drains, Spend Management, Rolling Releases, Deployment Checks
  - 현재는 Runtime Logs, GitHub CI, Preview 검증, Instant Rollback을 우선 사용
- [x] `P0` `docs` remote content 인증/장애 대응 운영 기준을 확정한다.
  - `BLOG_CONTENT_API_TOKEN` / `CONTENT_API_TOKEN`의 교체 주기와 회전 절차(runbook) 정리
  - `401/403`은 인증 실패로 보고 즉시 중단하며 다른 endpoint로 fallback 하지 않는 정책 유지
  - 향후 다중 endpoint 정책이 다시 필요해질 경우에도 `timeout`, `ENOTFOUND` 같은 네트워크 오류에서만 다음 후보를 시도하도록 기준 문서화
  - NAS reverse proxy가 `Authorization` 헤더를 upstream에 그대로 전달하는지 검증 절차 추가
  - `docs` 서버 재시작 누락, 배포 env 누락, backend env 누락을 빠르게 확인하는 점검 순서 정리
  - remote content 장애 시 목록/검색은 로컬 문서로 graceful degradation, 문서 상세는 동일 route 로컬 문서 fallback 후 실패하도록 정책 정리
  - source 선택 결과는 runtime log에 항상 남기되, UI에는 badge/filter를 노출하지 않음
  - 기준 문서: `docs/runbooks/content-api-auth-ops-runbook.md`
- [x] `P1` 원격 조회 retry 0·헤더/본문 전체 deadline·빈 본문 로컬 대체와 카드 이미지 실패 처리를 보강한다. [10-17~18 검증](../verification/resilience/2026-10-17-content-network-offline.md): lib 253개, 이미지 차단·오프라인 dev/production 각각 18개, 기존 상세·캐시 108개 통과. 스트림 종료 오류와 운영 배포 확인은 별개다.
- [-] `P2` 직접 저장한 공개 글의 오프라인 열람을 제공한다. [ADR-0015](../architecture/adr-0015-explicit-offline-article-snapshots.md)·정적 reader·저장/업데이트/삭제와 CI job은 기능 커밋에 반영했다. 완료 조건: 배포 후 HTTPS 저장·네트워크 차단·Worker 갱신과 Safari/Firefox·실기기 확인. 전체 검색·초안·API 보관은 범위에서 제외한다.
- [x] `P0` `docs` secret/token 수명주기 정책을 확정한다.
  - Content API, revalidation, Better Stack, Cloudflare, GHCR credential inventory 정리
  - 직접 관리하는 shared secret은 90일 회전, 공급자 token은 권한/만료 기준 적용
  - 노출, 권한 변경, 운영자 변경 시 정기 일정과 무관하게 즉시 폐기
  - `GITHUB_TOKEN`처럼 실행별 발급 token은 수동 회전 대상에서 제외
  - 단일 Content API token 구조의 무중단 회전 한계와 dual-token 개선 조건 기록
  - 기준 문서: `docs/architecture/docs-secret-token-lifecycle-policy.md`
- [x] `P0` `pnpm` catalog 도입 이후 네트워크 가능한 환경에서 `pnpm install --lockfile-only` 재검증
- [x] `P1` root `package.json`까지 catalog/버전 관리 전략을 확장할지 결정
- [x] `P1` catalog reference 정합성 검사를 스크립트나 CI 체크로 자동화
- [x] `P1` `docs`와 `web`의 공통 build/lint/typecheck 파이프라인을 Turbo 기준으로 정리
- [-] `P1` `docs` 콘텐츠 흐름의 테스트 기준을 자동화한다.
  - route normalize / path normalize 유닛 테스트 완료
  - search relevance scoring 유닛 테스트 완료
  - remote payload schema 검증 테스트 완료
  - 문서 상세 렌더링 스모크 테스트 완료
  - production 브라우저에서 로컬 data/category 및 원격 fixture의 본문 완성, loading 종료, soft 404 방지 검증 추가
  - 상세 16개 + 한국어/영어·모바일/데스크톱 게시 갱신 4개: `pnpm --filter docs test:article:prod`
  - fixture 원본 수정 → 미인증/오인증 시 기존 화면 유지 → 정상 webhook 후 목록·검색·상세 갱신 검증
  - 실행 기준: `docs/runbooks/docs-article-rendering-regression.md`
  - 검색 결과 스모크 테스트 완료
  - `test:lib` / `test:content` CI 연결 완료
  - 기준 문서: `docs/architecture/docs-blog-improvement-roadmap.md`
- [x] `P1` 검색 결과 contract를 API route까지 정리한다.
  - `/api/search` 응답에도 ranking / preview 기준을 반영할지 결정
  - server page와 API consumer가 다른 정렬/preview 규칙을 쓰지 않도록 공통화
  - 기준 문서: `docs/architecture/docs-blog-improvement-roadmap.md`
- [x] `P1` remote payload schema failure 관측 방식을 정한다.
  - parse failure를 운영 로그에 어떤 형식으로 남길지 결정
  - 필요 시 alerting 또는 error aggregation 연결 기준 정리
  - 기준 문서: `docs/architecture/docs-blog-improvement-roadmap.md`
- [ ] `P2` design asset 동기화 절차를 runbook으로 정리
  - Figma local asset export
  - `public/figma/*` 저장 규칙
- [ ] `P2` 환경별 dev/build 체크리스트를 보강한다.
  - 폰트
  - asset
  - package build
  - i18n

## Content / Editorial

- [x] `P1` About의 근거 없는 시작 날짜·직함을 제거하고 모바일 메뉴의 공유 직함 표시도 함께 제거한다. 새 날짜나 경력을 추정해 넣지 않았다. 한·영 메시지와 About 회귀 검사에 반영했다.
- [x] `P2` 푸터의 잘못된 저작권 연도와 중복 슬로건을 제거한다. `2024`를 임의의 새 연도로 바꾸지 않고 문구 전체와 한·영 `footer.tagline` 키를 제거했다. 커밋 `22e7099`, [작업 기록](../worklog/2026-09/2026-09-28-footer-brand-copy.md). 2026-10-03 현재 코드와 완료 상태를 대조했다.
- [ ] `P2` 남은 편집 메타데이터의 근거를 확인한다. 현재 라우트에서 사용되지 않는 ArticleDetail 시안과 Alex Rivers·뉴스레터 메시지는 사용 경로를 정리한 별도 변경에서 제거한다. About·푸터 점검을 전체 카피 검수 완료로 간주하지 않는다.

- [-] `P1` 양질의 기술 리소스를 category별 reading path로 확장한다.
  - 1차: Browser rendering, Network request path, Container health 기준 문서 추가
  - 빈 category는 문서가 준비되기 전까지 UI 노출을 보류
  - 2차: Testing, Observability, Security, API Design 순으로 문서 우선 작성
  - 기준 문서: `docs/architecture/docs-resource-content-roadmap.md`
- [x] `P1` contributor-facing 블로그 운영 가이드를 정리한다.
  - 새 글 추가 위치
  - frontmatter 규칙
  - 이미지 저장 규칙
  - publish 전 검증 항목
  - 기준 문서: `docs/runbooks/docs-contributor-guide.md`
- [-] `P1` landing / hero 계열 카피의 자연스러운 한국어 표현을 다듬는다.
  - 직역투 표현보다 한국어 사용자에게 자연스럽게 읽히는 문장으로 조정
  - headline, eyebrow, CTA, section title 우선 점검
  - 특히 `/` root landing과 `/about` hero의 한국어 카피를 우선 정리
  - 2026-08-10 기준 root landing / about hero / about profile 2차 정리 완료
- [ ] `P1` `Mobile` 섹션의 실제 콘텐츠 초안을 작성한다.
- [x] `P1` `UI/UX` 섹션도 상세형 static spotlight가 아니라 실제 문서 연결 구조로 확장할지 결정
  - `HubPage` 기반 채널 허브에서 시작했지만, 최종적으로는 Figma `141:189` 기준의 전용 editorial hub로 분기
  - 작업 기록: `docs/worklog/2026-05/2026-05-08-uiux-hub-figma-alignment.md`
- [-] `P2` article metadata 정책을 정리한다.
  - `/docs/{channel}/{slug}` 상세 metadata 정책 문서화 완료
  - 문서별 title/summary/canonical/OG image 연결 완료
  - `BlogPosting`과 제목 기반 OG PNG 구현: [2026-10-03 기록](../worklog/2026-10/2026-10-03-article-structured-data-og.md). 배포 후 검색·공유 서비스 검증은 남아 있음
  - 목록/허브/정적 페이지 metadata는 `docs-page-metadata-policy.md`로 별도 정책화 완료
  - `/feed`, `/docs`, `/web`, `/mobile`, `/ui-ux`, `/category` 계열 목록, 정적 안내 페이지 metadata 연결 완료
  - `/category/...` 상세 alias는 `/docs/category/...` canonical route로 redirect하도록 정책 확정
  - author
  - read time
  - category label
  - thumbnail fallback
- [ ] `P2` 태그 / 시리즈 / 상태 기반 editorial taxonomy를 확장할지 결정한다.
  - `channel` 외에 `tags`, `series`, `status(draft/published)`를 운영 메타로 승격할지 검토
  - 검색, 허브, 관련 글 추천에 재사용 가능한 구조여야 함
- [ ] `P2` 검색 및 문서 탐색 telemetry의 필요 수준을 정리한다.
  - zero-result query
  - 인기 검색어
  - 허브 진입 후 상세 클릭 흐름
  - 오래된 글 신고 또는 품질 피드백 수집 여부

## Review Queue

- [ ] `P1` `docs-responsive-policy.md` 적용 이후 shell 회귀 테스트
- [x] `P1` FSD 문서와 실제 폴더 구조의 불일치 재점검
  - 전역 font config를 `shared/config/fonts.ts`로 이동
  - import되지 않는 legacy `components/category/*` 제거
  - 기준 문서: `docs/architecture/docs-app-fsd.md`
- [ ] `P2` `apps/docs/shared/message/*.json` 키 사용 현황과 dead key 정리

## Node.js에서 운영 인프라까지 학습 로드맵

2026-10-09 사용자 요청에 따라 현재 HTTP 실험에서 생긴 질문을 다음 실험으로
이어 갑니다. 주간 기고 일정과 별개로, 각 학습 단계의 완료 날짜는 고정하지 않고
**한 번에 한 실험 초안**을 작성해 검토받습니다.
아래 상태는 자료·검증의 진행 상황이며 사용자의 학습 완료나 게시 승인을 뜻하지 않습니다.
기존 게시 글과 초안을 먼저 확장하며 같은 주제의 글을 중복 작성하지 않습니다.
이 절에서 P1은 먼저 진행할 단계, P2는 이후 심화할 단계입니다.

**현재 새 검토 대상은 4단계 이벤트 루프 학습 결과입니다.** 2026-10-11 사용자 요청으로
CPU 0/200ms를 각각 3회 실행하고 실험실 화면과 학습 문서에 반영했습니다.
2단계 HTTP 글은 10-14 사용자 승인으로 게시·운영 검증을 완료했습니다. 3단계 소켓 초안은 draft이며 게시 승인은 별도입니다. 5단계는 아직 시작하지 않았습니다.

| 순서                        | 우선순위·상태                                 | 핵심 질문                                                   |
| --------------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| 1. 스트림                   | P1 · 기존 게시 글 있음                        | 생산자가 소비자보다 빠르면 어떻게 되나요?                   |
| 2. HTTP 수신                | P1 · 게시·운영 검증 완료                      | 서버가 쓴 시점과 클라이언트가 받은 시점은 왜 다른가요?      |
| 3. 소켓·TCP                 | P1 · 소켓 관측·원문 검사 완료, 초안 검토 대기 | 같은 프로세스 안에서도 왜 운영체제를 거치나요?              |
| 4. 이벤트 루프              | P1 · 로컬 3+3회 검증·사용자 검토 대기         | CPU 작업이 타이머와 수신 콜백 실행에 어떤 영향을 주나요?    |
| 5. 버퍼·흐름 제어           | P1 · 미착수                                   | 느린 소비자에게 쓸 때 Node.js의 대기량을 어떻게 제어하나요? |
| 6. HTTP 메시지 경계         | P2 · 미착수                                   | 길이·청크로 구분하는 본문 응답의 끝은 어떻게 알까요?        |
| 7. Next.js 스트리밍         | P2 · 미착수                                   | 서버의 스트리밍이 언제 브라우저 화면에 보이나요?            |
| 8. 프록시·운영 인프라       | P2 · 미착수                                   | 중간 계층이 스트리밍을 늦추거나 바꿀 수 있나요?             |
| 9. 종료·시간 제한·장애 관측 | P2 · 미착수                                   | 응답 수신 도중 취소와 장애를 어떻게 구분하나요?             |

### 1. 스트림

- 기존 [백프레셔 글](../../apps/docs/category/be/node-js/stream-backpressure-diagnosis.mdx)의 API 동작을 이해합니다. 완료 조건: `write() === false` 이후 추가 쓰기를 멈추고 `drain` 이후 재개하는 흐름과 최종 데이터 보존을 기존 검사로 확인합니다.

### 2. HTTP 수신

- 기존 [HTTP 초안](../../apps/docs/category/be/node-js/http-response-streaming-lab.mdx)의 정상·버퍼링·취소를 각 3회 실행합니다. 전체 본문 보존, 정상 완료와 미완료 취소의 차이를 검사합니다. 실행 검증은 완료했고 10-14 사용자 승인으로 게시했습니다. [Production·공개 본문·그림·sitemap 검증](../verification/content/2026-10-14-http-streaming-publication.md#production-배포-후-확인)을 완료했습니다.

### 3. 소켓·TCP

- [소켓 초안](../../apps/docs/category/be/node-js/tcp-socket-endpoints-lab.mdx)의 서버 대기·양쪽 연결 주소와 포트를 관측했습니다. fixture와 실제 MDX를 각각 3회 실행해 클라이언트 localPort = 서버 연결 remotePort, 클라이언트 remotePort = 서버 연결 localPort = 대기 포트를 검사했습니다.
- macOS `lsof`에서 같은 프로세스의 LISTEN 1개와 ESTABLISHED 2개를 대조했습니다. 원문 바인딩·strict 타입·동작·음성 검사 11개 통과. [실행 증거와 한계](../verification/content/2026-10-10-node-socket-kernel-observation.md)를 확인합니다.
- 10-11 관리자 권한으로 한 연결의 SYN·ACK·요청/응답·양방향 FIN·최종 ACK까지 캡처했습니다. 순서 번호·ACK 대조와 drop 0을 확인했습니다. [실제 패킷 검증](../verification/content/2026-10-11-node-tcp-packet-capture.md)과 [재현 절차](../runbooks/node-tcp-local-observation.md)를 확인합니다. 커널 버퍼 크기·내부 함수는 미계측이며 사용자 검토 후 다음 단계로 진행합니다.

### 4. 이벤트 루프

- 10-11 비교 실행 완료: [실제 결과·초기 실패·한계](../verification/content/2026-10-11-node-event-loop-cpu.md), [실험실 재현 절차](../runbooks/node-event-loop-cpu-observation.md). 다음 단계는 사용자 검토·진행 요청 후 시작합니다.

- 비교: 송신자·수신자를 별도 프로세스로 준비합니다. 수신자 CPU 작업 없음 / 200ms 동안 이벤트 루프 점유를 각 3회 비교합니다.
- 관측: 수신자의 `performance.now()`와 `monitorEventLoopDelay()`로 타이머·수신 콜백 실행 시각과 루프 지연을 ms로 기록합니다.
- 완료 조건: CPU 작업 직전에 예약한 20ms 타이머는 CPU 구간이 끝난 뒤 실행되어야 합니다. 양쪽 조건의 최종 본문 해시는 같아야 합니다. 수신 콜백 시각은 함께 기록하되 패킷이 CPU 구간 중 도착했다고 추정하지 않습니다.

### 5. 버퍼·흐름 제어

- 비교: 1단계의 API 이해를 정량 비교로 심화합니다. 지연 5ms의 로컬 Writable 소비자, 총 8MiB, 조각 8KiB, `highWaterMark` 16KiB 조건에서 백프레셔 준수/무시를 각 3회 비교합니다.
- 관측: `writableLength` 최대값, 처리 시간(ms), `process.memoryUsage()`의 `rss`·`heapUsed`·`external`(bytes)을 기록합니다.
- 완료 조건: 전체 본문 해시가 같고 준수 조건의 대기량 최대값이 더 작아야 합니다. 메모리 수치는 관측값으로만 남깁니다. TCP 윈도우·소켓 큐는 별도 후속 관측입니다.

### 6. HTTP 메시지 경계

- 비교: 본문이 있는 HTTP/1.1의 `Content-Length` 응답과 `Transfer-Encoding: chunked` 응답에 동일한 고정 본문을 각 3회 전송합니다.
- 관측: HTTP 해석 전의 원시 TCP 데이터를 읽는 Node.js API인 `net.Socket`으로 누적한 응답의 길이·청크 크기·종료 청크를 확인합니다. `http` 클라이언트가 청크 구문을 제거한 최종 본문도 대조합니다.
- 완료 조건: 원시 구문이 각 메시지 형식과 맞고, 해석한 본문 해시가 두 조건에서 같아야 합니다. TCP 읽기 조각과 HTTP 청크는 일대일로 간주하지 않습니다.
- 후속 범위: 연결 재사용, HEAD·204·304 응답, 연결 종료로 본문 끝을 구분하는 응답, CONNECT는 각각의 질문으로 나눕니다. [HTTP/1.1 본문 길이 규칙](https://www.rfc-editor.org/rfc/rfc9112.html#section-6.3)을 따릅니다.

### 7. Next.js 스트리밍

- 비교: 설치 버전의 공식 가이드를 읽고, 로컬에서 운영용으로 빌드한 테스트 앱의 느린 컴포넌트를 테스트 신호로 제어합니다. 첫 실험은 데스크톱 한 크기에서 3회 진행합니다.
- 완료 조건: 테스트 신호를 해제하기 전에는 fallback(대기 중 표시)이 보이고, 해제한 뒤에는 최종 DOM(브라우저 문서 구조)의 고유 문장과 마지막 콘텐츠가 보여야 합니다. 처리되지 않은 오류와 본문 loading이 남아 있으면 실패입니다.
- 후속 범위: React Server Components(RSC) 요청 구분, 오류·취소 실험을 각각 나눕니다. 글의 모바일·데스크톱 배치는 기존 렌더링 회귀 절차로 별도 확인합니다.

### 8. 프록시·운영 인프라

- 비교: 같은 테스트 프로세스에 원본 서버·통제 가능한 로컬 프록시·클라이언트를 둡니다. 원본은 512bytes 두 조각을 300ms 간격으로 보냅니다. 프록시는 즉시 전달 / 최대 2KiB 이내에서 본문 전체를 모아 원본 응답의 끝에서만 전달하는 두 모드입니다. 직접 접속과 두 모드를 각 3회 비교합니다.
- 관측: 공통 `performance.now()`로 원본 `res.end()` 호출, 클라이언트 헤더·첫 본문·본문 완료 시각(ms)과 최종 본문 해시를 기록합니다.
- 완료 조건: 직접 접속·즉시 전달에서는 첫 본문이 원본 `res.end()` 호출 전에 보이고 전체 버퍼링에서는 이후에 보여야 하며 본문 해시는 모두 같아야 합니다. 시간 조건을 재현하지 못하면 원인과 미완료를 기록합니다.
- 후속 범위: 압축은 다음 비교에서 변수 하나로 추가합니다. 위 통제 프록시의 결과를 실제 Nginx·Vercel·CDN 설정의 동작으로 일반화하지 않습니다.

### 9. 종료·시간 제한·장애 관측

- 기존 [Timeout·Retry 글](../../apps/docs/category/be/node-js/http-timeout-retry-boundary.mdx)을 기반으로 정상 완료·명시적 취소·응답 지연에 의한 시간 제한·상대 연결 중단을 로컬 시험 서버에서 각 3회 주입합니다. 주입한 원인·요청 ID·본문 완료·종료·분류 로그를 대조합니다. 주입 원인과 분류가 같고 취소 후 타이머·연결이 정리되어야 합니다. 운영의 close만으로 원인을 단정하지 않습니다.

### 매 단계의 진행 방식

1. 이전 실험에서 설명하지 못한 질문 하나를 고릅니다. 개념·용어·작은 도식으로 먼저 설명합니다.
2. 가설과 관측 위치를 정한 뒤 `.mts`의 최소 예제와 비교 조건을 만듭니다.
   한 번에 변수 하나를 바꾸고 시각·환경·측정 한계를 기록합니다.
3. 글의 실행 코드를 로컬 테스트 저장소의 검사에 연결하고 `strict` 타입 검사와 의미 있는 동작 검사를 수행합니다.
   복제 예제만 검사하지 않습니다. 새 글에는 주제별 테스트 연결을 등록하며 테스트 저장소 정보는 공개 본문에 넣지 않습니다.
4. 기술 정확성·초보자 이해·존댓말의 각 항목을 별도 에이전트가 검토하고 지적을 반영합니다.
   필요한 수치 그래프와 도식은 실제 앱의 데스크톱·모바일에서 확인합니다.
5. **초안 하나를 사용자에게 보여 드리고 검토를 기다립니다.** 승인되지 않은 다음 글을
   연속으로 게시하지 않습니다. 새 글은 draft로 유지하며 별도 커밋·게시 승인 전에는 로컬 작업만 수행합니다.

개념 설명은 [운영체제 통신 학습 문서](../knowledge/infra-tooling/node-http-kernel-path.md),
반복 검증 절차는 [기고 검증 절차](../runbooks/docs-article-rendering-regression.md)를 따릅니다.
위 입력값은 미실행 실험의 제안 조건입니다. 실행 전에 도구·정리 절차·검사 가능성을
확인하고, 조건을 바꾸면 이유와 기대 결과를 함께 기록합니다. 처리 시간·메모리 수치를
예상 실행 결과처럼 미리 채우지 않습니다.

단계 3의 소켓 끝점 검사를 마친 뒤에만 패킷 관측 도구나 커널 계측으로 범위를 넓힙니다.
