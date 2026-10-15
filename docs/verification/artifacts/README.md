# 검증 원본 증거

- [10-14 인덱스·검색 목록 도달 거리 기준선](2026-10-14-docs-index-density-baseline.json): [밀도 검토 보고서](../accessibility/2026-10-14-docs-index-density-review.md). 공개 사이트 네 조건의 실제 값 발췌, 개선 목표와 구분.

- [10-14 모바일 제목 실제 측정](2026-10-14-mobile-title-local.json), [공개 사이트 측정](2026-10-14-mobile-title-public.json), [Production 상태](2026-10-14-mobile-title-production.json): [제목 검증](../accessibility/2026-10-14-mobile-article-title.md).

- [10-14 HTTP 글 모바일 후속 확인](2026-10-14-http-mobile-followup.json): [게시 보고서의 모바일 절](../content/2026-10-14-http-streaming-publication.md#모바일-후속-확인). 320/390/430px의 실제 제목·코드 펼침, 실기기 검사 아님.

- [10-14 HTTP 글 Production](2026-10-14-http-publication-production.json), [공개 본문·그림 검사](2026-10-14-http-publication-public.json): [배포 후 확인](../content/2026-10-14-http-streaming-publication.md#production-배포-후-확인).

- [10-14 HTTP 글 게시 준비](2026-10-14-http-publication-checks.json), [운영 모드 화면](2026-10-14-http-publication-local.json): [게시 검증 보고서](../content/2026-10-14-http-streaming-publication.md).

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
