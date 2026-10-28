# 검증 보고서

- [10-28 diff 코드 블록](accessibility/2026-10-28-diff-code-block.md): Node315·브라우저22, 두 테마·실제 MDX/Shiki·원격·고대비·JS 비활성, 운영 미검증.

- [10-27 Node 24 보안 patch·CI·Docker](security/2026-10-27-node24-security-patch.md): main 기반 격리·pin/floor·amd64 이미지와 실제 Node·앱 회귀. 운영 미배포.

- [10-27 검색·응답 제한/Content-Type 결합](integration/2026-10-27-search-response-pr-integration.md): PR #64 병합·HTML 헤더의 budget 이후 설정·상한/JSON 오류 결합·원래 미커밋 보존, 이후 CI/배포는 별도 기록.

- [10-26 상세 HTML byte budget](content/2026-10-26-html-response-budget.md): 최종 렌더 UTF-8 경계·긴 코드/1000행 표·로컬 대체/원격전용 오류·목록 정상 유지, 운영 미검증.

- [10-26 원격 검색 목록 byte budget·규모별 비용](performance/2026-10-26-search-payload-budget.md): UTF-8 경고512KiB·상한1MiB 양쪽 경계, 합성9조건·끝 키워드·로컬 fallback·production162개, 운영 미검증.

- [10-26 로컬·원격 본문 검색](content/2026-10-26-remote-body-search.md): published searchText·fallback·웹훅 캐시와 실제 폼/Link 검색 동선8개 추가 후 production162개 통과, 운영 미배포.

- [10-26 상세 오류 Content-Type](content/2026-10-26-content-response-type.md): 경고 재현7개 실패→집중10개 통과, 정상 HTML·오류 JSON 및 기존 계약 유지. 운영 미배포.
- [10-25 Primary 대비·브라우저 접근성](accessibility/2026-10-25-primary-action-contrast.md): 주황 배경 유지·짙은 글자·명시적 focus, UI58개+실제 화면12개. 전체 WCAG/타 브라우저 미검증.
- [10-25 본문 H1 경고 전환](content/2026-10-25-body-h1-warning.md): 공용·로컬 CLI·원격 API의 경고/게시·원문 H1 보존 회귀, 운영 미배포.
- [10-25 나머지 의존성 보안 경고 10건](security/2026-10-25-remaining-advisories.md): main 기반 분리 패치·16개 신규 회귀·production 문서154개 성공. 감사13→3, Next는 PR #60에 유지·미배포.
- [10-25 Next.js Critical 우선 패치](security/2026-10-25-next-critical.md): Next/MDX 16.4.3·Critical 0·잔여 10건, 보안/함수 캐시·production E2E와 종료 증거 호환 보완. 작업별 커밋, 운영 미배포.

- [10-24 PR #59 기준선 리뷰 수정·회귀](integration/2026-10-24-pr59-baseline-fixes.md): 명시 ref·고정 SHA 공유, 실제 커밋 후 회귀 9개·전체129개, 원래 그래프/Babel 대조 재현과 정리 실패/후속 성공 보존.

- [10-24 PR #59 CI·CodeQL·리뷰 점검](integration/2026-10-24-pr59-ci-review.md): CI 13개·CodeQL 통과, 커밋 후 HEAD 자기 비교 재현과 미해결 리뷰 구분, Vercel Linux 빌드 로그 확인.

- [10-24 Vite+ 호환성 보완·override 정리](integration/2026-10-24-viteplus-dependency-remediation.md): PostCSS 강제 제거·Babel/nanoid 범위 보완, peer 0건·Next production/화면·외부 UI 소비자 통과. 기존 audit·Linux/배포는 별도.

- [10-24 Vite+ peer·lockfile 소비자 영향](integration/2026-10-24-viteplus-peer-lockfile-impact.md): 별칭 버전 경고·optional 연결·PostCSS 범위 불일치, 기준 main 오프라인 대조와 소비자 검사.

- [10-24 vuln-radar Vite+ 로컬 실험](integration/2026-10-24-vuln-radar-viteplus.md): CLI·프록시 7개와 기존 통합 25개, 기존 도구 유지. peer·보안 경고와 배포 미검증 범위 구분.

- [10-22 CodeQL High #38 제목 검사 ReDoS](security/2026-10-22-codeql38-heading-redos.md): 긴 입력 격리 회귀·기존 판정 호환·로컬/NestJS 소비자 검증. main·NAS 운영 해소는 별도.

- [10-22 Overview 부분 API 장애 격리](integration/2026-10-22-vuln-radar-partial-failures.md): 최초 실패·캐시 갱신 실패·대상 재시도·보조 요청 대기·전체 실패/복구의 로컬 회귀.

- [10-22 수집 상태와 조회 주기 분리](integration/2026-10-22-vuln-radar-ingest-status.md): 실제 실행 관측·소스별 조회/원본 날짜·구버전 미확인과 로컬 회귀. 운영 배포·영속 이력은 별도.

- [10-21 KEV 실제 점수·우선순위](integration/2026-10-21-vuln-radar-kev-evidence.md): Feed 밖0/null/0.125·구버전/503·빈 DB·중복 행 등 로컬 통합16개 통과. 운영 배포는 미검증.

- [10-21 vuln-radar 전체 DB 통계](integration/2026-10-21-vuln-radar-overview-statistics.md): 43개 DB·25개 Feed, 중복 KEV·빈 DB·두 화면·새로고침과 기존 장애 회귀15개 통과. 운영 미배포.

- [10-22 squash 최종 메시지 사전검사](resilience/2026-10-22-squash-merge-preflight.md): main 이력 보존·실제 footer 재현·병합 요청 격리 회귀. pnpm12 전환 PR #55와의 역할 구분.

- [10-22 pnpm12 툴체인·서명 검증](integration/2026-10-22-pnpm12-toolchain.md): 앱 lock 유지·설치 실패 경계·전체 검사·두 backend 이미지 검증, 운영 교체는 별도.

- [10-22 CI 증거 보관·이동 계측](resilience/2026-10-22-navigation-evidence-retention.md): busy 변화·응답 수신 완료와 보고서/trace 보관. 로컬 회귀와 새 원격 업로드 검증을 구분.

- [10-21 KAN-22 상세 이동 실패](resilience/2026-10-21-kan22-offline-navigation.md): 정상 RSC 전달 지연·HTTP 503 대조군, 오프라인 22개·반복 18개와 CI 집계 64조합 검증. 당시 CI 지연 원인·수정 후 원격 검증은 미확정/미완료.

- [10-21 PR #51 CRP 타이밍 비교](performance/2026-10-21-crp-navigation-timing.md): 기준 페이지 지연으로 기존 판정의 오판 재현, 동일 문서 계측과 음성 대조군, 로컬 100개 통과·원격 미검증.

- [10-21 Vite·콘텐츠 의존성 패치](security/2026-10-21-vite-content-advisories.md): GitHub 5건·audit 11건 조사, 공식 패치와 전후 회귀, production 0건·전체 braces high 1건 잔여 구분.

- [10-21 TCP 소켓 문서 게시 검증](content/2026-10-21-tcp-publication.md): 사용자 게시 승인, 실제 원문 14개·production 공개 경로·이미지·검색·목록 확인. 원격 CI·운영 반영은 별도 단계.

- [10-20 TCP 초안·도식 재검증](content/2026-10-20-tcp-draft-recheck.md): 당시 draft 보존·원문 14개와 네 화면 확인. 게시 승인은 10-21 후속 기록에서 구분.

- [10-16 다음 TCP 소켓 초안 준비](content/2026-10-16-tcp-draft-preparation.md): 원문 실행·패킷 도식·다중 검토의 과거 기록.

- [10-20 블로그 main Production 전환](deployment/2026-10-20-docs-main-production-transition.md): CI·Preview·Production 스테이징 후 공개 도메인 검증, 기존 feature/docs·초안 보존.

- [10-19 vuln-radar 통합 검증](integration/2026-10-19-vuln-radar-local-integration.md): 격리 PostgreSQL·실제 Nest·Vite preview·배포 프록시 함수·Chromium 13개 통과. 운영 수집·배포 미검증.

- [10-19 PR #40 CI 시간 초과 조사](cache/2026-10-19-pr40-ci-timeout.md): 단계별 시간 비교, job 예산 분리와 다크 테마 검사 race 보완. 수정 후 원격 CI는 미검증.

- [10-19 페이지별 스켈레톤 로컬 검증](accessibility/2026-10-19-page-skeletons-local.md): 실제 서버 골격·완성 화면의 기하 비교와 검색·피드 회귀. 운영 CLS는 미검증.

- [10-27 스켈레톤 런타임 경합](resilience/2026-10-27-skeleton-runtime-isolation.md): live DOM 교체와 hydration 충돌 재현·별도 측정 페이지, 기존 검사 기준 유지.

- [10-19 문서 목록 우선 배치 로컬 검증](accessibility/2026-10-19-docs-index-order-local.md): 목록 위치·선택 해제·검색/페이지 이동 회귀, 69개와 재검사 12개·화면 26조건 통과. 공개 배포 미검증.

- [10-18 Handlebars 패치·기본 브랜치 경고 4건](security/2026-10-18-handlebars-advisories.md): Handlebars 3건 조치·전후 회귀와 audit, braces 공식 패치 미출시·개발 경로 잔여 구분.

- [10-18 CI 스트림 조기 종료 8건](cache/2026-10-18-stream-termination-investigation.md): 문서 교체와 실제 Link 클릭 비교, 실제 장애 분리와 과거 CI 판정 한계.

- [10-17 콘텐츠 네트워크·오프라인 저장](resilience/2026-10-17-content-network-offline.md): 재시도·본문 지연·로컬 대체와 명시적 저장, 완전 오프라인 열람 검증. 운영 배포 미검증.

- [10-14 문서 인덱스·검색 목록 밀도 검토](accessibility/2026-10-14-docs-index-density-review.md): 공개 네 조건의 개선 전 기준선. UI 구현·개선 후 검증 미착수.

- [10-14 모바일 문서 H1 크기](accessibility/2026-10-14-mobile-article-title.md)

- [10-14 HTTP 스트리밍 게시 검증](content/2026-10-14-http-streaming-publication.md)

- [10-14 수요일 기고 점검](content/2026-10-14-weekly-article-maintenance.md): 게시 canonical·실제 본문·metadata·sitemap·두 화면과 예제 통과, 기존 draft 진행 상태 보강. 재배포 없음.

- [10-11 이벤트 루프 CPU 비교](content/2026-10-11-node-event-loop-cpu.md): 독립 송신자·수신자, CPU 0/200ms 각 3회와 실제 그래프. 초기 측정 실패와 보강을 구분합니다.

- [10-11 큰 기본 글자 헤더 보완](accessibility/2026-10-11-header-font-preference.md): 로컬 관련 E2E 33개와 운영 헤더 핵심 조건 통과. 운영 전체 탐색은 로드 시간 초과가 남아 별도로 기록.

- [10-11 로컬 TCP 캡처 재실행](content/2026-10-11-node-tcp-packet-capture.md): 이전 포트 불일치를 해결하고 실제 12행·순서 번호·양방향 FIN·커널 drop 0을 확인했습니다.

- [10-10 Node.js 소켓·운영체제 관측](content/2026-10-10-node-socket-kernel-observation.md): 실제 MDX·fixture 각 3회, 소켓 상태 조회. SYN·ACK 캡처는 권한 문제로 미완료.

- [10-04 태그·읽기 모음](content/2026-10-04-content-discovery.md): 태그·모음과 반응형 탐색 검증. 운영 혼합 목록 미검증.

- [10-04 공용 UI 외부 설치](content/2026-10-04-shared-ui-package.md): 독립 tarball·테마·포커스 검증. registry 게시·실제 외부 앱 미검증.

실제로 실행한 시험과 측정 결과를 보관합니다. 현재 정책은 [architecture](../architecture/README.md), 실행 절차는 [runbooks](../runbooks/README.md), 구현 변경 이력은 [worklog](../worklog/README.md)에서 확인합니다.

## 성능과 화면 안정성

- [10-10 코드 접기 UI/UX와 10-11 배포 확인](accessibility/2026-10-10-code-block-usability.md): 3개 엔진 432개 조건·개발 페이지 12개·배포 24개 조건·Chromium 자체 확대 28개 조건 통과. 기본 글자 32px·폭 500px에서 헤더 클릭 영역 충돌. 설치 브라우저 메뉴·실기기는 미검증.

- [10-03 로컬 검색 인덱스 캐시](cache/2026-10-03-local-search-index-cache.md): 요청 간 재사용·인증 만료·미발행/삭제·장애 복구·전체 앱 빌드, 운영 배포 미검증.

- [10-03 검색 인덱스 비용](performance/2026-10-03-search-index-cost.md): 로컬 읽기·파싱, 합성 순위 계산 증가, Production 단계 로그 3개. 캐시 도입은 보류.

- [10-03 Production 계측 연결](performance/2026-10-03-production-observation.md): 응답 UUID와 Runtime Logs 단계 연결, Speed Insights 스크립트 확인. 실제 사용자 수집은 미검증.

- [09-23 공개 배포 접근성 재검증](accessibility/2026-09-23-deployed-shell-recheck.md): 20개 통과·4개 조건부 제외. 이전 CSS 누락 증상은 현재 재현되지 않으며 원인은 미확정.

- [09-23 코드·UI/UX 현황 분석](accessibility/2026-09-23-docs-code-ux-review.md): 빌드 재검증, 반영된 화면과 개선 후보 구분.

- [09-23 배포 접근성 점검](accessibility/2026-09-23-deployed-shell.md): 키보드 이동 통과, 포커스 CSS 누락 확인과 미검증 범위.

- [09-19 로컬 문서 읽기 중복 제거](performance/2026-09-19-local-document-reads.md): 요청 내 파일 읽기 공유와 요청 간 재읽기 검증.

- [09-19 상세 렌더링 회귀 검증](performance/2026-09-19-article-production-regression.md): 상세 16개 통과, 스트리밍 검사 2개 실패. 동시 변경을 정리한 후 재검증 필요.

| 보고서                                                                                                 | 대상                                     |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| [09-19 Sticky header 운영 검증](performance/2026-09-19-docs-sticky-header-deployment-verification.md)  | 긴 글 스크롤, TOC 위치, 12회 성능 재측정 |
| [09-19 CLS 배포 검증](performance/2026-09-19-docs-cls-deployment-verification.md)                      | 셸 교체와 초기 레이아웃 안정성           |
| [09-18 레이아웃 이동·텍스트 지연 진단](performance/2026-09-18-docs-layout-shift-text-lcp-diagnosis.md) | 수정 전 원인 및 폰트 차단 비교           |
| [09-18 성능 기준선](performance/2026-09-18-deployed-performance-measurement.md)                        | 최초 배포 측정 기록                      |

재현 절차: [배포 성능 측정](../runbooks/docs-deployed-performance-measurement.md), [브라우저·기기 점검](../runbooks/docs-responsive-browser-device-checklist.md).

## 캐시와 정적 셸

- [10-08 게시 결과 검증 CLI](cache/2026-10-08-content-publication-verifier.md): 웹훅 성공과 실제 목록·검색·상세 반영 구분, 모의 14개·production 3개. NAS 운영 발행 미검증.

- [10-04 배포 검색 인덱스 캐시](cache/2026-10-04-deployed-search-index-cache.md): 새 Production SHA·검색 5회와 Runtime Logs, 미인증 웹훅 401. NAS 게시 갱신은 미검증.

- [09-27 docs CI 로그 재검토](cache/2026-09-27-docs-ci-log-review.md): 같은 SHA의 CI·배포 성공과 별개로 남은 hydration 및 스트림 종료 경고를 분리했다.

- [09-26 로컬 요청 계측 재검증](cache/2026-09-26-request-lifecycle-recheck.md): 80개 회귀 통과, prefetch 스트림 오류 2건의 요청 연결 재확인과 unknown 유지.

- [09-24 로컬 요청 생명주기 계측](cache/2026-09-24-local-request-lifecycle.md): HTTP 종료·오류 판정, Next 요청 ID 분리, 서버 오류와 요청의 상관관계.

- [09-24 스트림 조기 종료 재조사](cache/2026-09-24-stream-cancellation.md): prefetch 전달·대체·재전달 3회 비교, 페이지 요청 실패 없음과 운영 미검증 범위.

- [09-19 Next.js 체크리스트 1차 검증](cache/2026-09-19-nextjs-checklist-phase-one.md): production suite·캐시 통과와 미검증 범위, 서버 스트림 오류 기록.
- [09-19 게시 갱신 브라우저 검증](cache/2026-09-19-content-publication-browser-test.md): webhook 이후 목록·검색·상세 DOM과 인증 경계.
- [09-16 언어 URL 전환 후 정적 셸 검증](cache/2026-09-16-docs-static-shell-verification.md): 당시 운영 모델 통과, Cache Components 전체 앱 실패. 이후 조치와 구분하여 읽습니다.
- 재현 절차: [캐시 프로덕션 통합 시험](../runbooks/docs-content-cache-production-test.md).
- 테스트 도입 및 변경 과정은 [9월 작업 기록](../worklog/2026-09/README.md)에 유지합니다.

## 콘텐츠

- [09-26 공개 배포 검색 계약 재검증](content/2026-09-26-deployed-search-contract.md): 검색 6개·About 8개 통과, GitHub Production 기록과 alias 확인 한계.

- [09-26 검색 이동 통일 검증](content/2026-09-26-search-navigation.md): reload 없는 검색·중복 제출·history·로딩 51개 E2E와 빌드, 무-JavaScript 한계.
- [09-26 로컬·원격 공용 본문 검증](content/2026-09-26-shared-body-validation.md): 공용 규칙·로컬 어댑터·NestJS 목록과 상세의 공개 차단, NAS 배포 미검증.

- [09-26 공용 UI CI 연결 검증](content/2026-09-26-shared-ui-ci.md): fixture 62개·production 소비 화면 16개 통과, 원격 Actions 미검증 범위.

- [09-22 콘텐츠 편집과 Canvas hover 진단](content/2026-09-22-content-editorial-and-canvas-hover.md): 글 4개 보완과 일반 버튼 대조군·headless 비교.

- [09-22 이벤트 루프 예제 검증](content/2026-09-22-event-loop-example.md): 본문 예제를 Chrome에서 10회 반복 검증.

- [09-22 공용 UI main 기준 분리 검증](content/2026-09-22-shared-ui-main-baseline.md): 블로그 변경 없이 공용 UI만 적용한 브랜치 검사.

- [09-22 Base UI 전환 검증](content/2026-09-22-base-ui-migration.md): 공용 UI·Activity·production 소비 화면과 번들 비용.

- [09-21 Activity 포커스 실험](content/2026-09-21-activity-focus.md): DOM·Effect 보존, Sheet 포털 잔존과 외부 배치 비교.

- [09-20 공개 글 독해 검토](content/2026-09-20-content-readability-review.md): 로컬 공개 글 10개의 설명 흐름과 편집 우선순위.
- [09-20 로컬 콘텐츠 재점검](content/2026-09-20-local-content-review.md): 15개 변환, 이미지 참조, ARIA 본문 중복 확인.

## 웹 푸시

- [10-03 초대 접근 제어](push/2026-10-03-push-access-gate.md): 미인증 BFF 거부·세션 위조/만료·모바일·초대 인증 후 실제 Chrome 수신과 해지. 운영 WAF는 미적용.

- [10-03 로컬 실제 연동](push/2026-10-03-local-web-push.md): Chrome 네이티브 구독·FCM 발송·서비스 워커 수신·알림 생성·해지. OS 배너와 NAS/Vercel은 미검증.

## 의존성 보안

- [10-09 패치 전 잔여 취약점 조사](security/2026-10-09-remaining-advisories.md): `c574bbd`에서 production 5건·전체 7건 관측. 후속 PR #36의 패치 결과와 현재 운영 상태는 별도로 구분한다.

- [10-09 braces 운영 경로 제거](security/2026-10-09-braces-runtime-removal.md): 라이브러리 216개·production 4개·파일 trace 통과. 개발 braces와 다른 audit 경고는 남아 있음.

- [10-09 잔여 의존성 보안 패치](security/2026-10-09-security-patches.md): 6개 패치·전이 의존성 회귀·빌드 통과, main 기준 braces high 1개 잔여. 병합·배포는 미검증.

- [10-06 배포 후속 점검](security/2026-10-06-deployed-followup.md): 카테고리 번역 16개 조건 통과, 공개 OG 4시간 TTL·원격 H1·braces 알림은 미완료.

- [10-05 운영 블로그 점검](security/2026-10-05-deployed-blog-smoke.md): 배포 alias·32개 기능 검사·source 로그 확인, 원격 H1·카테고리 번역·OG 캐시 계약은 후속 과제.

- [10-05 Next.js 패치·카테고리 입력 경계 검증](security/2026-10-05-next-category-hardening.md): Next.js 16.3.8·brace-expansion 5.0.12, glob 비실행 검사와 잔여 braces 경고.
- [10-05 잔여 취약점 조사](security/2026-10-05-remaining-advisories.md): production 경고 2건, 카테고리 입력의 glob 해석과 braces 패치 미출시 확인.
- [10-05 fast-uri·multer 보안 업데이트 검증](security/2026-10-05-fast-uri-multer.md): main 기준 override·lockfile 갱신, 회귀 검사 통과와 별도 잔여 취약점 5건. 병합·배포는 미검증.

## 원본 증거

- [10-03 문서 구조화 데이터와 OG 이미지](seo/2026-10-03-article-sharing.md): 프로덕션 빌드·82개 회귀·PNG 응답 검증.

[artifacts 목록](artifacts/README.md)에서 JSON 측정값을 찾을 수 있습니다. 각 결과의 환경·표본·한계는 연결된 보고서와 함께 확인해야 합니다. 이 폴더의 결과만으로 현재 배포가 통과했다고 판단하지 않습니다.

보고서 작성과 이동 기준은 [문서 역할과 구조](../process/documentation-organization.md)를 따릅니다.
