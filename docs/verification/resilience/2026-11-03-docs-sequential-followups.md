# 캐시·원격 오류·브라우저·권한 순차 점검

## 대상과 조건

2026-11-02 착수, 11-03 KST 환경에서 후속 정리. 기준 main은 `0cd27ae405b653785fd0bcbe55e507907e53fe59`,
작업 브랜치는 `codex/docs-followups-20261102`다. 아래 결과는 병합 전 로컬 검증과 당시 운영 표본이며,
새 코드의 원격 적용 결과가 아니다. 후속 CI·병합·배포 결과는 실제 리비전과 함께 별도로 기록한다.
Node 24.22.1·pnpm 12.14.0·Next 16.4.3, 합성 loopback production 서버와 현재 공개 배포를 구분한다.
기존 초안·stash·NAS 보류 설정은 변경하지 않았다.

## 재현 방법

루트에서 Node 24 도구를 사용한다. 계측 경로와 Playwright output은 저장소 밖 제한된 임시 디렉터리로 지정한다.
기존 개발 서버와 같은 포트의 서버를 임의 종료하지 않는다.

```sh
pnpm --filter docs test:article:prod \
  article-e2e/content-publication.spec.ts article-e2e/request-cause-next.spec.ts \
  --repeat-each=3 --output=/tmp/docs-followup-baseline --reporter=list
ARTICLE_CACHE_OBSERVATION_DIR=/tmp/docs-followup-cache \
  pnpm --filter docs test:article:prod article-e2e/cache-inflight.spec.ts \
  article-e2e/content-publication.spec.ts article-e2e/request-cause-next.spec.ts \
  --repeat-each=3 --output=/tmp/docs-followup-controlled --reporter=list
pnpm --filter docs test:article:prod --output=/tmp/docs-followup-full --reporter=list
pnpm --filter docs test:lib
pnpm test:repo
pnpm --filter docs lint
NODE_ENV=production DOCS_E2E_PORT=3127 pnpm --filter docs exec playwright test \
  e2e/keyboard-accessibility.spec.ts --workers=1 --retries=0 \
  --output=/tmp/docs-followup-keyboard --reporter=list
```

마지막 키보드 검사는 위 production build 후 실행한다. 기존 3001 서버는 사용하지 않는다.
운영 로그는 Vercel CLI 53.1.1에서 deployment·project를 명시하고 원문 대신 집계만 출력했다.
브라우저 검사는 새 독립 프로필과 공개 페이지만 사용했다.

## 결과와 증거

원본 artifact 상대 링크: **해당 없음**. trace·cache event·운영 로그 원문·프로필은
[공개 검수 경계](../../architecture/adr-0025-publication-boundary.md)에 따라 공개하지 않는다.
아래는 정제 집계다. 11-03 사용자가 진단·테스트 6개와 운영 문서 7개의 공개 및 검수 해시 기록,
CI·리뷰 확인 후 main 병합·배포를 승인했다. 원시 자료는 승인 대상이 아니다.

| 검사                     | 실제 결과                                                       | 해석                                                                                            |
| ------------------------ | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 변경 전 두 파일 3회 반복 | 36/36 통과                                                      | 과거 간헐 실패는 재현되지 않음                                                                  |
| 지연 origin·웹훅 대조    | 최종 42/42 통과, cache event 216·누락 0·저장 실패 0             | 명시적으로 표시한 진단 요청만 기록                                                              |
| in-flight 순서           | 후속 무효화 완료 뒤 선행 요청의 set 시작을 12회 관측            | 통제한 늦은 응답 쓰기 경로 확인. 과거 실패와 동일 원인은 미확정                                 |
| 응답 버전                | 웹훅 뒤 새 요청에서 V1 관측, 이전 요청 종료 뒤 다시 웹훅하면 V2 | 기존 검사 조건 완화가 아닌 추가 순서 진단. 게시 세대 계약 보완은 미구현                         |
| 상세 production 전체     | 180/180 통과, retry 0                                           | 새 순서 진단 2건 포함. 기존 503·console·stream 판정 유지                                        |
| 원격 요청                | 14/14 통과, 라이브러리 전체 354/354·lint 통과                   | allowlist cause code와 headers/body 단계만 추가. 인증·cause 원본 미보관                         |
| 공개 전 재검증           | 라이브러리 354/354·저장소 회귀 227/227 통과                     | 저장소 검사 최초 225/227은 sandbox loopback listen EPERM. 같은 검사를 허용 환경에서 통과        |
| 기존 키보드 production   | 두 언어·세 화면에서 12/12 통과                                  | 검사 기준·retry 미변경                                                                          |
| 별도 headed 브라우저     | OS Chrome·Playwright Firefox, 각 1280/390px의 4조건 통과        | 검색 열기·Escape 복귀·제출, 모바일 Drawer·화면 폭 변경 정리, 목차 hash·헤더 아래 제목 표시 확인 |
| 운영 로그                | 현재 Production의 최근 1시간 error 표본 0건                     | 전체 기간 무장애나 과거 2건 해소를 의미하지 않음                                                |
| 과거 로그 재조회         | PR #79의 이전 deployment는 CLI exit 1                           | 과거 fetch 실패 2건의 원인은 이번에 확정할 수 없음                                              |
| GitHub 보호              | ruleset 16880032 active·bypass 없음·required checks 5건         | 승인 수 0·code-owner review 및 last-push 승인 비활성. 사람 승인 강제가 아님                     |
| 인증·적용                | 현재 소유자 User 인증, main CODEOWNERS 404, PR #75 Draft·DIRTY  | 별도 실행 환경 필요. 보호 설정·인증은 변경하지 않음                                             |

최초 cache 계측은 전체 요청을 기록해 4,096건 상한에서 1개 검사가 실패했다. 상한을 늘리지 않고
`x-article-cache-probe`를 표시한 loopback 요청으로 한정해 같은 42개 검사를 재실행했다.
최초 타입 검사는 UI build와 동시에 실행해 일시적으로 UI 출력을 해석하지 못했으며, build 완료 후 같은 검사는 통과했다.
이 실패들을 앱 장애 재현으로 간주하지 않는다.

JavaScript 전체를 보류한 시험에서는 헤더 검색이 DOM에 생성되지 않아,
검색 버튼 결함 회귀로 채택하지 않고 시험용 변경을 제거했다. 현재 헤더 준비 신호를 기다리는 방식과 구분한다.
운영 브라우저에서는 본문 표시 직후 검색 입력에 실패가 있었지만, 헤더 준비를 확인한 뒤에는 검색·닫기·제출,
모바일 Drawer 포커스 복귀·화면 폭 변경 후 overlay 제거가 Chrome과 Firefox에서 통과했다.
목차의 최초 검사 실패는 한글 `href`와 URL의 인코딩된 hash를 그대로 비교한 검사기 오류였다.
동일한 디코딩과 화면별 목차 범위로 비교하자 네 조건 모두 통과했다. 제품 코드는 변경하지 않았다.
이 표본에서 pageerror·aria-hidden 경고는 각각 0건이며 전체 접근성 적합성을 보증하지 않는다.

추가 브라우저 검사기는 저장소 밖 임시 TypeScript로 실행했다. 공개 페이지의 새 프로필에서
`/ko/feed` 검색 Enter·Escape·제출 → 모바일 Drawer Escape·844px 전환 →
`/ko/docs/web/javascript-event-loop-runtime` 목차 첫 링크 순으로 진행한다.
목차는 1024px 미만에서 `article-mobile-toc`, 그 외 `aside details`로 한정하며,
`decodeURIComponent(new URL(page.url()).hash)`와 디코딩한 링크 fragment를 비교한다.
이 검사는 영구 회귀 코드의 추가가 아니라 이번 운영 표본 검사다.

## 한계와 후속 작업

- 통제한 늦은 응답 쓰기는 재현했지만 과거 V1/V2 검사가 최초 이상 상태에 진입한 계기는 미확정이다.
- 웹훅 성공만으로 모든 in-flight 응답이 배제된다고 선언하지 않는다. 게시 revision·캐시 세대 설계는 별도로 검토한다.
- 이 보고서의 cause code 검증은 로컬 구현 기준이며 Next 내부 background fetch나 과거 운영 로그를 소급 분류하지 않는다.
- Chrome은 OS 설치판, Firefox는 Playwright 동봉판의 headed 검사다. Safari·실기기·OS IME·VoiceOver/NVDA는 미검증이다.
- 별도 macOS 계정은 사용자 답변에서 미준비였다. App 키·토큰 생성, ruleset 적용, PR #75 충돌 해결·병합은 하지 않았다.
- 원시 데이터·실제 토큰은 공개하지 않는다. 승인된 최종 문서 bytes만 stage하고 검수 해시와 대조한다.

## 관련 문서

- [기존 간헐 조사](2026-11-01-publication-cache-request-cause.md)
- [macOS 계정 준비](../../runbooks/github-app-isolated-macos-account.md)
- [작업 기록](../../worklog/2026-11/2026-11-03-docs-sequential-followups.md)
- [KAN-58](https://web-tech-service.atlassian.net/browse/KAN-58) · [KAN-5](https://web-tech-service.atlassian.net/browse/KAN-5) · [KAN-6](https://web-tech-service.atlassian.net/browse/KAN-6) · [KAN-33](https://web-tech-service.atlassian.net/browse/KAN-33)
