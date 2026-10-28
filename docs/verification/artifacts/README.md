# 검증 원본 증거

- [10-28 diff 코드 블록](2026-10-28-diff-code-block.json): [검증](../accessibility/2026-10-28-diff-code-block.md)의 조건·실행 결과·중간 실패, 미커밋.

- [10-27 Node 24 보안 patch](2026-10-27-node24-security-patch.json): [보고서](../security/2026-10-27-node24-security-patch.md). 버전 경계·회귀·로컬 이미지 digest/gate hash·원본 15파일 보존·미배포 구분.

- 모바일 메뉴·카테고리 탐색: [관련 반복 원본 정제본](2026-10-27-navigation-readiness.playwright.json), [출처·해시와 전체 검사 파생 집계](2026-10-27-navigation-readiness-provenance.json). [보고서](../accessibility/2026-10-27-navigation-readiness.md). 관련90통과·36제외/전체372통과·54제외, 재시도0. 용량 초과 전체 원본은 저장소에 보관하지 않았다.

- [10-27 스켈레톤 hydration 격리 집계](2026-10-27-skeleton-hydration-isolation.json): [보고서](../accessibility/2026-10-27-skeleton-hydration-isolation.md). 분리 전후 재현·225개 무재시도 검사의 당시 로컬 집계. 원격 후속은 보고서에서 별도 연결한다.
- 스켈레톤 Playwright 원본 정제본: [baseline45](2026-10-27-skeleton-before.playwright.json), [초기 격리69](2026-10-27-skeleton-initial-isolation.playwright.json), [반복225](2026-10-27-skeleton-repeat-isolation.playwright.json). 전체 개별 결과·인라인 측정 첨부를 보존하며 [원본/정제본 해시·정제 범위](2026-10-27-skeleton-playwright-report-provenance.json)를 함께 기록한다.

- [10-27 오프라인 byte 계약·ADR 후속 검증 집계](2026-10-27-offline-byte-contract-and-adr-followup.json)

- [10-27 검색/응답 제한 PR 결합](2026-10-27-search-response-pr-integration.json): [보고서](../integration/2026-10-27-search-response-pr-integration.md). #64 공식 squash·실제 main/배포 조회·충돌 보존·검색 어댑터 전후·소스9blob·production162개.

- [10-26 상세 HTML 응답 제한](2026-10-26-html-response-budget.json): [보고서](../content/2026-10-26-html-response-budget.md). 렌더 결과 경계·길고 유효한 코드/표·선택 JSON 재검사·소스8blob·production162개·미검증 범위.

- [10-26 검색 목록 byte budget](2026-10-26-search-payload-budget.json): [성능·경계 보고서](../performance/2026-10-26-search-payload-budget.md). 합성9조건 raw/gzip·순위 비용·소스11blob·회귀·초기 실패, 운영 corpus 미사용.

- [10-26 본문 검색 사용자 동선](2026-10-26-remote-body-search-navigation.json): [후속 보고서](../content/2026-10-26-remote-body-search.md#실제-검색-제출카드-이동-production-e2e-후속). 실제 폼·카드 Link·뒤로 가기·빈 결과 복귀8조건, 전체 production162개 통과와 최초 테스트 가정 오류 기록.

- [10-26 본문 검색 캐시 E2E](2026-10-26-remote-body-search-cache-e2e.json): [후속 보고서](../content/2026-10-26-remote-body-search.md#본문-검색웹훅-캐시-production-e2e-후속). 로컬 production154개·대상6개 재검사, source hash·JSON 단계 결과·초기 타입 오류와 후속 성공.

- [10-26 원격 본문 검색](2026-10-26-remote-body-search.json): [보고서](../content/2026-10-26-remote-body-search.md). 소스 hash·공용/백엔드/docs/저장소 회귀·요청 수·초기 실패와 후속 성공, 운영 미검증.

- [10-26 상세 오류 Content-Type 전후](2026-10-26-content-response-type.json): [검증 보고서](../content/2026-10-26-content-response-type.md). 실제 adapter 경고 재현과 수정 후 경고0·응답 계약 대조.
- [10-25 Primary 대비 측정](2026-10-25-primary-action-contrast.json)·[Mobile Dark](2026-10-25-primary-contrast-mobile-dark.png)·[Desktop Light](2026-10-25-primary-contrast-desktop-light.png): [검증 보고서](../accessibility/2026-10-25-primary-action-contrast.md). 수정 전 실패·computed 대비·브라우저 회귀·Figma outline 재조회.
- [10-25 H1 동일 입력 전후 판정](2026-10-25-body-h1-warning.json): [검증 보고서](../content/2026-10-25-body-h1-warning.md). 기준 main의 차단 2개와 수정본의 경고 1개 대조, 운영 미배포.
- [10-25 UI·전송 계약 분리](2026-10-25-ui-transport-contract.json): [보안 PR 후속 검증](../security/2026-10-25-remaining-advisories.md#승인된-ui전송-검사-분리). 로컬 44개 통과·본문 표시 중 pending·200 이후 중단·완료 대조. 실제 중단 호출자 해소를 뜻하지 않음.

- [10-25 두 보안 PR 결합 감사·회귀](2026-10-25-security-combined.json): [통합 검증](../security/2026-10-25-remaining-advisories.md#승인된-main-병합과-결합-검증). Next main 병합 후 전체/production audit 0건·회귀 153개·production E2E 154개, PR #61 병합 전 로컬 증거.

- [10-25 나머지 보안 경고 감사·그래프](2026-10-25-remaining-advisories.json): [보고서](../security/2026-10-25-remaining-advisories.md). main 감사13→3·대상10건 제거·패치 전후 회귀, Next PR #60과 분리·운영 미배포.
- [10-25 Next 패치 audit·그래프 범위](2026-10-25-next-critical-audit.json), [초기 E2E 실패·종료 trace](2026-10-25-next-e2e-before-compatibility.json): [보안 검증](../security/2026-10-25-next-critical.md). Critical 0·잔여 10건과 144/154 초기 결과를 보존하며 로컬 실행·미배포다.

- [10-24 명시 main 그래프 재현](2026-10-24T12-22-01-870Z-viteplus-lockfile-impact.json), [동일 baseline 소비자 대조](2026-10-24T12-22-21-670Z-viteplus-consumer-control.json), [CLI 정리 실패](2026-10-24T12-22-04-534Z-vuln-radar-viteplus.json), [CLI 재실행 성공](2026-10-24T12-23-21-834Z-vuln-radar-viteplus.json): [PR #59 후속 검증](../integration/2026-10-24-pr59-baseline-fixes.md). 실제 비밀값·운영 데이터·Railway 배포 없음.

- [10-24 최종 CLI 8개](2026-10-24T07-08-35-791Z-vuln-radar-viteplus.json), [수정 후 그래프](2026-10-24T07-01-06-763Z-viteplus-lockfile-impact.json), [Babel 오류 해소 대조](2026-10-24T07-05-39-300Z-viteplus-consumer-control.json), [통합 25개](2026-10-24T07-03-22-206Z-vuln-radar-integration.json), [audit 잔여](2026-10-24-viteplus-override-audit.json): [보완 보고서](../integration/2026-10-24-viteplus-dependency-remediation.md). 원격 배포 없음.

- [10-24 Vite+ 연결 그래프](2026-10-24T06-22-13-436Z-viteplus-lockfile-impact.json), [기준 main 소비자 대조](2026-10-24T06-25-28-202Z-viteplus-consumer-control.json): [검증 보고서](../integration/2026-10-24-viteplus-peer-lockfile-impact.md). offline/frozen 기준선·동일 Babel 오류와 내장 Babel 성공, PostCSS 범위 불일치. 배포 검증 아님.

- [10-24 Vite+ CLI·경계 검사](2026-10-24T05-34-00-240Z-vuln-radar-viteplus.json), [기존 화면 통합](2026-10-24T05-30-25-335Z-vuln-radar-integration.json), [audit 요약](2026-10-24-viteplus-dependency-audit.json): [검증 보고서](../integration/2026-10-24-vuln-radar-viteplus.md). 합성 데이터·로컬 실행만 포함. 초기 실패·후속 통과·미해결 경고는 보고서에서 구분한다.

- [10-22 부분 API 장애 최종 통합](2026-10-22T04-37-18-940Z-vuln-radar-integration.json): [검증 보고서](../integration/2026-10-22-vuln-radar-partial-failures.md). 25개 그룹·정리6단계 통과. 합성 데이터이며 선행 실패 증거는 보고서에 연결한다.

- [10-22 수집 상태 최종 통합](2026-10-22T03-20-18-441Z-vuln-radar-integration.json): [검증 보고서](../integration/2026-10-22-vuln-radar-ingest-status.md). 19개 그룹·정리6단계 통과. 실제 upstream 수집과 운영 검증은 제외한다.

- [10-21 통계·KEV 깨끗한 커밋 최종 검증](2026-10-21T14-58-06-277Z-vuln-radar-integration.json): [보고서](../integration/2026-10-21-vuln-radar-kev-evidence.md#커밋-완료-후-재검증). 99bef79·workingTreeDirty=false, 통합16개·정리6단계 통과. [KEV1280px](2026-10-21T14-58-06-277Z-vuln-radar-kev-1280.png)·[KEV390px](2026-10-21T14-58-06-277Z-vuln-radar-kev-390.png)·[Feed1280px](2026-10-21T14-58-06-277Z-vuln-radar-feed-1280.png)·[Feed390px](2026-10-21T14-58-06-277Z-vuln-radar-feed-390.png). 합성 데이터만 포함하며 파일명은 UTC다.

- [10-21 KEV 최종 통합](2026-10-21T14-35-59-158Z-vuln-radar-integration.json): [보고서](../integration/2026-10-21-vuln-radar-kev-evidence.md). nullable 실제 점수·구버전/범위 오류/503 대조군 포함16개 통과. [KEV1280px](2026-10-21T14-35-59-158Z-vuln-radar-kev-1280.png)·[KEV390px](2026-10-21T14-35-59-158Z-vuln-radar-kev-390.png)·[Feed1280px](2026-10-21T14-35-59-158Z-vuln-radar-feed-1280.png)·[Feed390px](2026-10-21T14-35-59-158Z-vuln-radar-feed-390.png). 합성 데이터만 표시한다.
- [10-21 KEV 초기 통합](2026-10-21T14-34-05-141Z-vuln-radar-integration.json): 16개 통과. [Feed1280px](2026-10-21T14-34-05-141Z-vuln-radar-feed-1280.png)·[Feed390px](2026-10-21T14-34-05-141Z-vuln-radar-feed-390.png).

- [10-21 vuln-radar 통계 최종 통합](2026-10-21T14-14-49-689Z-vuln-radar-integration.json): [보고서](../integration/2026-10-21-vuln-radar-overview-statistics.md). 합성 DB43개·Feed25개·통합15개·정리6단계 통과. [1280px Feed](2026-10-21T14-14-49-689Z-vuln-radar-feed-1280.png)·[390px Feed](2026-10-21T14-14-49-689Z-vuln-radar-feed-390.png)는 기존 탐색 회귀 화면이며 집계 비교값은 JSON에 있다.
- [10-21 초기 통계 통합](2026-10-21T14-11-58-001Z-vuln-radar-integration.json): 통합15개 통과. [1280px](2026-10-21T14-11-58-001Z-vuln-radar-feed-1280.png)·[390px](2026-10-21T14-11-58-001Z-vuln-radar-feed-390.png). 파일명은 UTC다.

- [10-22 CI 증거 보관·이동 계측](2026-10-22-navigation-evidence-retention.json): [검증 보고서](../resilience/2026-10-22-navigation-evidence-retention.md). 전체 34개·반복 36개와 의도적 실패 trace 생성, 실제 busy·헤더/본문 수신 샘플·소스 해시. 새 원격 업로드는 미검증.

- [10-21 공개 검색 선택자 조사](2026-10-21-public-search-selector-investigation.json): [보고서](../resilience/2026-10-21-kan22-offline-navigation.md#공개-검색-실패의-원인-분리). 한국어 버튼 이름 충돌·두 브라우저 전체 흐름 20개 성공과 [재현 도구](../../../apps/docs/scripts/verify-public-search.ts).

- [10-21 KAN-22 병합 후 결과](2026-10-21-kan22-postmerge-verification.json): [검증 보고서](../resilience/2026-10-21-kan22-offline-navigation.md#pr-52-main-병합-후-확인). main 527d4b0 CI·Production·HTTP 성공과 초기 공개 검색 검사 실패를 구분. 검색 실패 해석은 후속 선택자 조사로 정정.

- [10-21 KAN-22 이동 비교](2026-10-21-kan22-offline-navigation.json): [검증 보고서](../resilience/2026-10-21-kan22-offline-navigation.md). main 첫 방문·재방문과 지연·503 대조군, 반복·집계 회귀와 소스 해시. 원래 CI 지연 원인은 미확정.

- [10-21 CRP navigation 비교 측정](2026-10-21-crp-navigation-timing.json): [검증 보고서](../performance/2026-10-21-crp-navigation-timing.md). 원격 105.5ms 실패·로컬 기준 응답 지연 대조군·최종 100개 반복 결과와 소스 해시.

- [10-21 콘텐츠 의존성 audit](2026-10-21-security-content-audit.json): [보안 보고서](../security/2026-10-21-vite-content-advisories.md). 전체 11건→braces high 1건·production 0건, 원격 경고 종료와 구분.

- [10-21 TCP EOF 전후 재현](2026-10-21-tcp-eof-regression.json), [회귀 검사기](2026-10-21-tcp-eof-regression.test.mts), [후속 원문 검사](2026-10-21-tcp-publication-source-tests-eof.txt), [후속 공개 화면](2026-10-21-tcp-publication-local-eof.json): [게시 리뷰 보완](../content/2026-10-21-tcp-publication.md#리뷰-후-eof-회귀와-재검토). 이전 timeout과 새 EOF 종료·포트 정리, 정상 Enter 경로를 구분.

- [10-21 TCP 게시 로컬 화면](2026-10-21-tcp-publication-local.json), [원문 검사](2026-10-21-tcp-publication-source-tests.txt), [실행 검사기](2026-10-21-tcp-publication-check.mts): [게시 보고서](../content/2026-10-21-tcp-publication.md). production 모드·두 locale·6개 화면·검색·사이트맵과 실제 MDX 검사. 운영 배포와 구분.

- [10-21 TCP 모바일 도식](2026-10-21-tcp-packet-390.jpg), [데스크톱 본문](2026-10-21-tcp-top-1280.jpg): 같은 게시 로컬 검증의 실제 화면.

- [10-20 TCP 재검증](2026-10-20-tcp-recheck.json), [원문 테스트](2026-10-20-tcp-recheck-source-tests.txt): [당시 보고서](../content/2026-10-20-tcp-draft-recheck.md). 초기 HTTP 상태 가정 실패와 후속 본문 판정을 보존.

- [10-16 TCP 후속 글 요약](2026-10-16-tcp-followup-summary.json), [질문 제거 확인](2026-10-16-tcp-tone-check.json): [초안 이력](../content/2026-10-16-tcp-draft-preparation.md).

- [10-16 TCP 보강 원문 검사](2026-10-16-tcp-enrichment-source-tests.txt), [화면](2026-10-16-tcp-enrichment-ui.json), [초안 원문 검사](2026-10-16-tcp-draft-final-source-tests.txt), [초안 화면](2026-10-16-tcp-draft-ui.json): 같은 초안 준비 기록의 실제 증거.

- [10-20 PR #47 병합 후 운영 검증](2026-10-20-pr47-postmerge-production.json): [보고서](../deployment/2026-10-20-docs-main-production-transition.md#pr-47-병합-후-운영-검증). main 693d4e4 CI·Production·HTTP·Chromium·로그와 초안 보존 집계.

- [10-20 블로그 main Production 전환](2026-10-20-docs-main-production-transition.json): [검증 보고서](../deployment/2026-10-20-docs-main-production-transition.md).

- [10-20 KST 깨끗한 커밋의 통합 검증](2026-10-19T15-15-59-845Z-vuln-radar-integration.json): [보고서](../integration/2026-10-19-vuln-radar-local-integration.md). 9fee886·workingTreeDirty=false, 통합 13개·정리 6단계 성공. [1280px](2026-10-19T15-15-59-845Z-vuln-radar-feed-1280.png)·[390px](2026-10-19T15-15-59-845Z-vuln-radar-feed-390.png). 파일명은 UTC.

- [10-19 PR #46 정리 보완 재검증](2026-10-19T14-58-50-231Z-vuln-radar-integration.json): [보고서](../integration/2026-10-19-vuln-radar-local-integration.md). 통합 13개·정리 6단계 성공. [1280px](2026-10-19T14-58-50-231Z-vuln-radar-feed-1280.png)·[390px](2026-10-19T14-58-50-231Z-vuln-radar-feed-390.png).

- [10-19 vuln-radar 최종 13개 통합 검사](2026-10-19T14-01-56-387Z-vuln-radar-integration.json): [보고서](../integration/2026-10-19-vuln-radar-local-integration.md). 실제 DB·API·프록시·브라우저, 토큰 미포함·정리 결과.
- 이전 실행: [9개](2026-10-19T13-48-55-854Z-vuln-radar-integration.json), [10개](2026-10-19T13-50-20-622Z-vuln-radar-integration.json), [11개](2026-10-19T13-51-52-193Z-vuln-radar-integration.json), [13개 도입](2026-10-19T13-54-02-394Z-vuln-radar-integration.json).
- 최종 화면: [1280px](2026-10-19T14-01-56-387Z-vuln-radar-feed-1280.png), [390px](2026-10-19T14-01-56-387Z-vuln-radar-feed-390.png). 이전 화면: [1280px](2026-10-19T13-54-02-394Z-vuln-radar-feed-1280.png), [390px](2026-10-19T13-54-02-394Z-vuln-radar-feed-390.png). 모두 합성 데이터만 표시.

- [10-19 페이지별 스켈레톤 로컬 측정](2026-10-19-page-skeletons-local.json): [검증 보고서](../accessibility/2026-10-19-page-skeletons-local.md). 서버 골격 66표본의 기하·모션·넘침과 검사 시도별 결과. production CLS와 구분한다.
  - 캡처: [모바일 목록](2026-10-19-skeleton-docs-mobile-light.png), [모바일 UI/UX](2026-10-19-skeleton-uiux-mobile-light.png), [데스크톱 피드](2026-10-19-skeleton-feed-desktop-dark.png).

- [10-19 문서 목록 순서 로컬 측정](2026-10-19-docs-index-order-local.json): [검증 보고서](../accessibility/2026-10-19-docs-index-order-local.md). 기본·검색의 네 대표 화면과 추가 조건·검사 요약. 캡처는 같은 보고서에 연결했다.

- [10-18 Handlebars 보안 audit](2026-10-18-handlebars-security-audit.json): [검증 보고서](../security/2026-10-18-handlebars-advisories.md). 전체·production audit 전후, 무해한 회귀·build 결과와 로그 해시. PR #39 리뷰 후 임시 작업 트리 재현 결과도 포함.

- [10-18 스트림 종료 주체 재조사](2026-10-18-stream-cause-reinvestigation.json): [재조사 보고서](../cache/2026-10-18-stream-termination-investigation.md#종료-주체와-선행-오류-재조사). 상대편/서버 종료 순서·upstream 결과·실패한 초기 대조군과 최종 검증.

- [10-18 이동 검사 역할 정리](2026-10-18-navigation-test-contracts.json): [검증 보고서](../cache/2026-10-18-stream-termination-investigation.md#검사-역할-분리와-의도-보존). 기존 assertion·direct/reload 보존 비교와 Link·직접 URL 역할별 결과.

- [10-18 실제 Link 이동 비교](2026-10-18-prefetch-navigation-comparison.json): [후속 비교 보고서](../cache/2026-10-18-stream-termination-investigation.md#실제-link-클릭과-문서-교체-비교). ko/en·두 화면·세 이동 방식의 3회 반복, 서버 완료와 문서 유지 증거.

- [10-18 스트림 종료 조사](2026-10-18-stream-termination-investigation.json): [검증 보고서](../cache/2026-10-18-stream-termination-investigation.md). CI 8건·로컬 요청별 순서·대조군·원본 로그 해시. 취소 추정과 확정을 분리합니다.

- [10-18 기존 상세·캐시 production 결과 발췌](2026-10-18-article-production-results.txt): [네트워크·오프라인 검증](../resilience/2026-10-17-content-network-offline.md#기존-상세캐시-production-회귀). 테스트 108개 통과와 남은 스트림 오류 12회를 별개로 기록합니다.

- [10-17 콘텐츠 네트워크·Worker 검사](2026-10-17-content-network-tests.txt), [10-18 production 오프라인 브라우저 검사](2026-10-18-offline-production-browser.txt): [검증 보고서](../resilience/2026-10-17-content-network-offline.md). 모의 원격 실패와 실제 Chromium의 저장·연결 차단을 구분합니다.

- [10-14 인덱스·검색 목록 도달 거리 기준선](2026-10-14-docs-index-density-baseline.json): [밀도 검토 보고서](../accessibility/2026-10-14-docs-index-density-review.md). 공개 사이트 네 조건의 실제 값 발췌, 개선 목표와 구분.

- [10-14 모바일 제목 실제 측정](2026-10-14-mobile-title-local.json), [공개 사이트 측정](2026-10-14-mobile-title-public.json), [Production 상태](2026-10-14-mobile-title-production.json): [제목 검증](../accessibility/2026-10-14-mobile-article-title.md).

- [10-14 HTTP 글 모바일 후속 확인](2026-10-14-http-mobile-followup.json): [게시 보고서의 모바일 절](../content/2026-10-14-http-streaming-publication.md#모바일-후속-확인). 320/390/430px의 실제 제목·코드 펼침, 실기기 검사 아님.

- [10-14 HTTP 글 Production](2026-10-14-http-publication-production.json), [공개 본문·그림 검사](2026-10-14-http-publication-public.json): [배포 후 확인](../content/2026-10-14-http-streaming-publication.md#production-배포-후-확인).

- [10-14 HTTP 글 게시 준비](2026-10-14-http-publication-checks.json), [운영 모드 화면](2026-10-14-http-publication-local.json): [게시 검증 보고서](../content/2026-10-14-http-streaming-publication.md).

- [10-14 공개 글 검사](2026-10-14-weekly-published.json), [실행 예제](2026-10-14-weekly-published-examples.json), [초안 화면 검사](2026-10-14-weekly-drafts.json), [Production·검사 요약](2026-10-14-weekly-checks.json): [주간 보고서](../content/2026-10-14-weekly-article-maintenance.md). 화면과 초기 부분·실패 증거는 보고서에 연결했습니다.

- [10-11 헤더 배포 후 검사](2026-10-11-header-deployed-check.json): [헤더 보고서의 배포 확인](../accessibility/2026-10-11-header-font-preference.md#배포-후-확인-2026-10-11-23시-kst). CI·배포·핵심 확대 통과와 전체 운영 load 시간 초과를 구분한다.

- [10-11 이벤트 루프 검사·소스 해시](2026-10-11-event-loop-checks.json): [실험 보고서](../content/2026-10-11-node-event-loop-cpu.md)의 실행 버전과 검사 요약입니다.

- [10-11 이벤트 루프 화면 검사](2026-10-11-event-loop-ui.json), [1280px](2026-10-11-event-loop-1280.jpg), [670px](2026-10-11-event-loop-670.jpg), [390px](2026-10-11-event-loop-390.jpg): [검증 보고서](../content/2026-10-11-node-event-loop-cpu.md). 실제 POST·재시도·403/409/405와 모의 오류를 구분합니다.
- [10-11 필드명 보강 전 원본 실행](2026-10-11-event-loop-cpu-before-contract-fix.json), [초기 화면 선택자 실패](2026-10-11-event-loop-ui-initial-failure.txt), [모바일 보강 전 검사](2026-10-11-event-loop-ui-before-mobile-layout.json): 같은 보고서의 이전 증거입니다.

- [10-11 이벤트 루프 6회 측정](2026-10-11-event-loop-cpu.json), [실제 첫 표본 그래프](2026-10-11-event-loop-timeline.svg), [초기 실패](2026-10-11-event-loop-initial-failure.txt): [검증 보고서](../content/2026-10-11-node-event-loop-cpu.md).

- [10-11 헤더 기본 글자 회귀 요약](2026-10-11-header-font-regression.json), [32px 수정 화면](2026-10-11-header-font32-fixed.png): [헤더 보완 보고서](../accessibility/2026-10-11-header-font-preference.md). 로컬 실행과 native 설정의 관측값이며 사용자 프로필은 변경하지 않았다.

- [10-11 소켓 초안 원문 재검사](2026-10-11-tcp-source-recheck.txt): [캡처·문서 반영 보고서](../content/2026-10-11-node-tcp-packet-capture.md). fixture·실제 MDX 각 3회와 strict 타입·실패 사례 11개 통과.

- [10-11 실제 TCP 캡처](2026-10-11-tcp-packets.txt), [패킷·소켓 번호 대조](2026-10-11-tcp-capture-observed.json): [검증 보고서](../content/2026-10-11-node-tcp-packet-capture.md). 12개 캡처·커널 drop 0, OS 식별자는 정리한 소켓 사본에서 제외했습니다.

- [10-11 첫 불완전 캡처](2026-10-11-tcp-capture-initial-incomplete.json), [두 번째 불완전 캡처](2026-10-11-tcp-capture-second-incomplete.json): [같은 실행의 소켓·캡처 대조 보고서](../content/2026-10-11-node-tcp-packet-capture.md). 시작 메시지를 실제 패킷 관측과 구분하며 OS 식별자는 제외했습니다.

- [10-11 브라우저 자체 확대 측정값](2026-10-11-native-browser-zoom.json), [400% 화면](2026-10-11-native-zoom400.png), [기본 글자 설정 측정값](2026-10-11-native-font-preference.json), [큰 기본 글자 헤더](2026-10-11-native-font32-header.png): [코드 접기 보고서의 설정 대조](../accessibility/2026-10-10-code-block-usability.md#후속-브라우저-자체-확대와-기본-글자-설정-대조). 사용자 Chrome 설정은 수정하지 않았다.

- [10-11 배포 코드 접기 측정값](2026-10-11-deployed-code-blocks.json), [확대된 모바일 헤더 겹침](2026-10-11-enlarged-mobile-header.png): [코드 접기 보고서의 배포 후속 확인](../accessibility/2026-10-10-code-block-usability.md#2026-10-11-배포-후속-확인).

- [10-11 배포 헤더 비교 측정값](2026-10-11-deployed-header-baseline.json), [기본 크기](2026-10-11-header-font100.png), [글자 200%](2026-10-11-header-font200.png): 같은 보고서의 기본 화면 10개 조건·확대 4개 조건 비교. 실제 브라우저 zoom이 아님.

- [10-10 코드 접기 측정값](2026-10-10-code-block-usability.json), [확대 시 하단 겹침](2026-10-10-code-footer-200-percent.png): [검증 보고서](../accessibility/2026-10-10-code-block-usability.md).

- [10-10 코드 접기 수정 후 측정값](2026-10-10-code-block-usability-fixed.json), [겹침 보완 캡처](2026-10-10-code-footer-200-percent-fixed.png): 같은 보고서의 수정 후 재검증. 수정 전 증거와 분리.

- [10-10 소켓 실험 원문 검사](2026-10-10-tcp-socket-tests.txt), [화면 검사](2026-10-10-tcp-socket-preview.json), [캡처 접근 상태](2026-10-10-tcp-capture-access.json): [보고서](../content/2026-10-10-node-socket-kernel-observation.md).

- [10-09 잔여 취약점 실행 요약](2026-10-09-remaining-advisories.json): audit 집계·registry 패치 확인·상위 범위, 비밀값 제외.

- [10-09 braces 운영 경로 제거 요약](2026-10-09-braces-runtime-removal.json): 파일·digest 대조와 production trace·잔여 audit, 인증값·원문 제외.

- [10-08 게시 검증 CLI 실행 요약](2026-10-08-content-publication-verifier.json): 로컬 stale/인증 경계와 production 갱신 확인. 인증값·원문 제외.

- [10-09 보안 패치 후 production·전체 audit 응답](2026-10-09-security-patch-audit.json): main 기준 braces high 1개, 두 검사 모두 종료 코드 1. [검증 보고서](../security/2026-10-09-security-patches.md).

- [10-06 번역·OG 배포 후속 관측값](2026-10-06-deployed-followup.json): 카테고리 16개 조건과 공개 OG 응답, 인증정보 제외.

- [10-05 운영 블로그 관측값](2026-10-05-deployed-blog-smoke.json): 초회 실패·최종 32개 기능 검사·식별자를 제외한 source/렌더링 관측.

- [10-04 정상 웹훅 이후 조회 발췌](2026-10-04-after-revalidation.json): 원문 변경 없는 재조회·로그 확인, 식별자 제외.

- [10-04 배포 검색 인덱스 캐시 측정 발췌](2026-10-04-deployed-search-index-cache.json): 요청·배포 식별자 제외.

- [10-03 웹 푸시 초대 접근 제어](2026-10-03-push-access-gate.json)

- [10-03 로컬 웹 푸시 실제 연동](2026-10-03-local-web-push.json)

- [10-05 보안 갱신 후 전체 audit 원본](2026-10-05-security-audit.json): 잔여 braces high 1개, 종료 코드 1. [검증 보고서](../security/2026-10-05-next-category-hardening.md).

- [09-26 공개 배포 검색 계약 검사 요약](2026-09-26-deployed-search-contract.json)

- [09-26 요청별 계측 재검증 집계·발췌](2026-09-26-request-lifecycle-recheck.json)

- [09-24 요청별 스트림 계측 집계·발췌](2026-09-24-request-lifecycle.json)

- [09-24 스트림 취소 대조 실험 집계·발췌](2026-09-24-stream-cancellation.json)

- [09-23 공개 배포 접근성 재검증 요약](2026-09-23-deployed-shell-recheck.json)

- [09-23 문서 페이지 이동 후속 관측값](2026-09-23-docs-pagination-check.json)

- [09-23 코드·UI/UX 브라우저 관측값](2026-09-23-docs-code-ux-review.json)

- [09-23 로컬 production 접근성 결과](2026-09-23-local-production-shell-playwright.json)
- [09-23 로컬 production CSS와 계산값](2026-09-23-local-production-shell-css.json)

- [09-23 배포 접근성 Chromium 결과](2026-09-23-deployed-shell-playwright.json)
- [09-23 배포 접근성 Firefox·WebKit 결과](2026-09-23-deployed-shell-cross-browser.json)

- [Activity 포커스 실험](2026-09-21-activity-focus.json)

[검증 보고서 목록](../README.md)

- [Next.js 체크리스트 1차 결과 요약](2026-09-19-nextjs-checklist-phase-one.json)

JSON은 특정 시점의 측정값입니다. 실행 환경과 해석은 보고서 및 runbook을 함께 읽습니다. 인증 토큰·개인정보는 저장하지 않습니다.

- [2026-10-03-article-sharing.json](2026-10-03-article-sharing.json): SEO 검증 실행 결과 요약.

- [2026-09-19-local-document-reads.json](2026-09-19-local-document-reads.json)

- [2026-09-18-after-font-preload.json](2026-09-18-after-font-preload.json)
- [2026-09-18-deployed-performance.json](2026-09-18-deployed-performance.json)
- [2026-09-18-font-browser-smoke.json](2026-09-18-font-browser-smoke.json)
- [2026-09-18-rendering-trace.json.gz](2026-09-18-rendering-trace.json.gz) (원본 JSON 무손실 압축)
- [2026-09-19-cls-deployment-verification.json](2026-09-19-cls-deployment-verification.json)
- [2026-09-19-sticky-header-deployment-verification.json](2026-09-19-sticky-header-deployment-verification.json)
