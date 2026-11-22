# 본문 공통 목차 UI/UX 검증

## 대상과 조건

- 검증일: 2026-11-14 KST.
- 기준 main: `b4caa565e05164422e3f257c33f131b7858c649a`. 기능 브랜치는 `codex/docs-toc-ux-20261114`이며 운영 반영과 구분한다.
- 최초 로컬 검사는 커밋 생성 전의 미커밋 작업 트리에서 수행했다. 이후 UI는 `886dfd52fb6e87d1239e3b76151802cd20d9bff0`, 목차 회귀는 `cad86ba927f860ed2a0f551e6d25b015e94cf82a`, 가이드·예제는 `b382b96a9b553a2450c028842b43cbf0edf9e89b`에 기록했다. 아래 358개 결과는 이 최초 로컬 검사에 해당한다.
- 원격 검증: head `b382b96a9b553a2450c028842b43cbf0edf9e89b`의 [PR #91 CI](https://github.com/IMHOJEONG/web-tech/actions/runs/43593721582)가 통과했다. 제목 위치 테스트의 CI 편입 후속 로컬 검사는 마지막 절에서 별도로 기록한다.
- 환경: Node 24.22.1, pnpm 12.14.0, Next 개발 서버와 Playwright Chromium. 로컬 문서만 사용하고 원격 콘텐츠 조회는 껐다.
- 화면: 390×844, 768×1024, 1280×800. 라이트/다크, reduced-motion, 24px root 글자 검사를 포함한다. 실제 기기와 브라우저 확대율 검사와는 다르다.
- 기존 진단 문서·미커밋·stash와 다른 작업 트리는 변경하지 않았다. 테스트 출력·화면은 저장소 밖 비공개 임시 폴더에 두며 공개 artifact는 추가하지 않는다.

## 재현 방법

저장소 루트에서 고정한 도구 버전을 사용한다.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @web-tech/ui build
pnpm --filter docs typecheck
pnpm --filter docs exec eslint widgets/article-toc/model/active-heading.ts widgets/article-toc/model/use-active-heading.ts widgets/article-toc/ui/toc.tsx widgets/article-toc/ui/toc-links.tsx widgets/article-toc/ui/toc-summary.tsx widgets/article-detail/ui/article-content-layout.tsx e2e/article-toc-navigation.spec.ts --max-warnings 0
node --experimental-strip-types --test apps/docs/lib/article-toc-active-heading.test.ts
DOCS_E2E_PORT=3064 pnpm --filter docs test:e2e article-toc-navigation.spec.ts article-anchor-scroll.spec.ts journal-design.spec.ts --workers=2 --retries=0 --output=/private/tmp/docs-toc-ux-results
```

포트 3064는 사용하지 않는 로컬 포트로 바꿀 수 있다. 마지막 output 경로는 checkout 밖이어야 한다. 공용 설정·의존성 버전·훅·검사 기준은 바꾸지 않는다.

## 결과와 증거

| 검사                             | 결과                                       | 범위                                                                                                       |
| -------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 순수 위치/앵커 함수              | 6개 통과                                   | 잘못된 percent escape, 한글/번호 ID, 경계/역방향 스크롤, 마지막 구간, 1000개 제목·입력 보존                |
| docs 타입                        | 통과                                       | 공용 콘텐츠 계약 build 후 전체 타입 검사                                                                   |
| 변경 코드 lint                   | 통과                                       | 오류·경고 0건                                                                                              |
| 최초 브라우저 실행               | 서버 시작 실패                             | 샌드박스의 localhost listen EPERM. 앱 테스트 결과와 구분                                                   |
| 승인 후 첫 36개 브라우저 검사    | 29개 통과·4개 화면 범위 조건 skip·3개 실패 | reduced-motion CSS의 transition-property는 none이나 duration 값은 0.15초. 새 duration 0초 검사 실패를 보존 |
| 모션 지속 시간 보완 후 같은 검사 | 32개 통과·4개 화면 범위 조건 skip·실패 0건 | transition-none과 duration-0을 함께 명시. 검사 기준/timeout/retries는 유지                                 |
| 별도 라이트/다크 화면 확인       | 4개 통과                                   | 390×844와 1280×900의 문서 가로 넘침 0px. 모바일 다크 펼침과 데스크톱 라이트 이동 후 화면을 직접 확인       |

새 테스트는 실제 본문에서 현재 항목과 hash를 확인하고, 수동 스크롤이 hash를 바꾸지 않는지 검사한다. 모바일은 선택 후 닫힘·제목 focus, Escape의 summary 복귀를 확인한다. 기존 번호 heading 링크·헤더 가림·목록 탐색 검사를 함께 유지한다.

4개 skip은 데스크톱 전용 앵커 검사 2개와 모바일 전용 목록/닫기 검사 2개가 해당하지 않는 화면에서 제외된 결과다. 최초에는 순수 함수 6개를 `widgets/article-toc/model/active-heading.test.ts`에서 별도 실행했으며 당시 `test:lib`에 포함되지 않았다. 현재 재현 명령은 PR 리뷰 보완으로 이동한 `lib` 경로를 사용한다.

로컬 확인 서버는 원격 조회를 끈 채 포트 3064에서 실행했다. `/ko/docs/web/javascript-event-loop-runtime`에서 스크롤과 모바일 펼침을 확인할 수 있다. 사용자 검토용 서버이며 production 빌드 검증을 대체하지 않는다.

## 한계와 후속 작업

- 현재 위치는 화면 픽셀 기반 안내이며 읽기 완료율이나 사용자가 실제 읽었다는 지표가 아니다.
- 실제 NAS 원격 API, production 빌드/배포, Safari/Firefox·실기기·스크린리더 검사는 미실행이다. 공유 컴포넌트를 쓴다는 이유로 원격 운영까지 통과했다고 표시하지 않는다.
- 첫 CSS 실패는 실제 움직임 관측이 아니라 계산된 duration 값에 대한 실패였다. 보완 뒤 동일 검사에서 통과했다.
- 로컬 화면은 사용자가 확인했고 목차 UI·가이드·예제 코드의 공개 검수 후 작업별 커밋·푸시를 승인했다. main 병합·배포·NAS 변경은 이번 승인 범위가 아니다.

## 작성 가이드 후속 검증

2026-11-14 같은 기준에서 사용자가 로컬 화면 확인을 완료한 뒤 작성 가이드와 합성 예제를 추가했다. production 코드 동작은 추가로 바꾸지 않았다.

```sh
pnpm --filter docs typecheck:node-test
pnpm --filter docs exec node --experimental-strip-types --test lib/article-toc-guide.test.ts
pnpm --filter docs test:lib
pnpm --filter docs validate:content
pnpm --filter docs exec eslint lib/article-toc-guide.test.ts widgets/article-toc/examples/toc-options.ts --max-warnings 0
```

- 예제 전용 4개와 이를 포함하는 `test:lib` 358개 모두 통과했다. 예제 옵션은 실제 `Toc` props를 참조하며 `typecheck:node-test`에도 포함된다.
- 실제 합성 Markdown의 H2~H4 6개, 고유 ID/본문 일치, 코드 펜스 안 제목 제외, draft 유지, 모바일 공통 필터와 원격 H1 제외·기존 ID 보존·H5 미추출을 검증했다. NAS 실문서 테스트는 아니다.
- 콘텐츠 23개는 통과했으나 Brotli·TCP 글의 기존 placeholder 표현 경고 2개는 유지했다. 실제 글을 이번 가이드 범위에서 수정하지 않았다.
- 초기 전용 검사 1개는 `gray-matter`의 YAML 엔진 호환성으로 실패했다. 가이드 검사에서만 이를 새로 사용한 것이므로 실제 로컬 파서와 같은 `vfile-matter`로 바꿔 재검증했다. 의존성·공통 설정은 변경하지 않았다.
- 예제는 `docs/examples`의 비공개 기본 제외 규칙을 변경하지 않고 위젯의 `examples` 아래 합성 fixture로 분리했다. 실제 콘텐츠 수집 대상인 `data`/`category`에 추가하지 않았다.

## 공개 검수와 커밋 전 재검증

사용자가 이번 목차 구현·회귀·작성 가이드와 합성 예제만 공개 검수 후 커밋·푸시하도록 승인했다. 소스와 최종 문서 내용을 확인했고 원시 trace·캡처·로그·실제 NAS 응답·자격 증명·기존 진단 작업은 포함하지 않는다. 공개 문서와 합성 예제 Markdown의 최종 bytes를 검수 해시로 기록한다. 합성 예제의 `draft`는 블로그 미게시 상태이며 공개 Git에서 비공개라는 뜻이 아니다.

같은 명령을 재실행해 라이브러리 358개, 위치 판정 6개, 브라우저 32개 통과·화면 범위 조건 4개 skip을 확인했다. 브라우저 retries는 0을 유지했다. docs 타입 검사도 통과했다. 원격 CI·배포 검증은 아직 수행하지 않았다.

현재 설치된 로컬 훅은 포맷·문서·commitlint이며 pre-push 훅은 없는 상태다. 공통 훅을 이번 작업에서 변경하지 않고 공개 인덱스·커밋 메시지·전송 범위 검사를 명시적으로 실행한다. 이는 전역 훅 설치나 서버 측 강제 적용 완료를 뜻하지 않는다.

## PR 리뷰 보완 검증

PR #91 리뷰에서 위치 판정 6개가 표준 CI 대상에서 빠진 점과 검증 기준 커밋의 불명확함을 확인했다. 테스트를 `lib/article-toc-active-heading.test.ts`로 옮겨 기존 `lib/*.test.ts` 및 Node 테스트 타입 검사에 편입했다. 검사 수·assertion·공통 설정·CI 정의는 완화하거나 변경하지 않았다.

후속 검사는 `b382b96a9b553a2450c028842b43cbf0edf9e89b` 위에 테스트 위치와 이 정제 문서만 보완한 **미커밋 작업 트리**에서 실행했다. `pnpm --filter docs test:lib`는 기존 358개와 위치 판정 6개를 합친 364개 모두 통과했고, 해당 테스트 ESLint도 통과했다. 이 후속 결과를 앞선 SHA에서 실행한 것처럼 소급 기록하지 않는다. 보완 커밋의 원격 CI와 main 병합·Production 배포는 이후 실제 SHA로 Jira·Confluence에 연결한다.

## 2026-11-20 후속: 항목 내 텍스트 세로 정렬

기준 main `2728665e5c8aca9496471fda100999c3f8dda0b6` 위의 별도 `codex/docs-toc-alignment-20261120` 미커밋 수정본이다. 공개 운영 글의 Chromium DOM을 390·768·1280px 폭에서 읽기 전용으로 측정했다. 같은 계층의 텍스트 시작 좌표는 일치했지만 모바일·태블릿 한 줄 항목의 텍스트 박스 중심이 링크 박스 중심보다 4px 위에 있었다. `min-height: 44px`·24px line-height·위아래 padding 각 6px에 `align-items: flex-start`가 적용돼 남는 8px이 아래에만 놓인 결과다. 글꼴의 광학적 중심이나 모든 기기의 픽셀을 일반화한 측정은 아니다.

`TocLinks`의 `items-start`를 `items-center`로 바꾸고 색·padding·최소 높이·계층별 들여쓰기·앵커 동작은 유지했다. 실제 NAS·비공개 원문·키 없이 기존 합성 입력 생성기에서 테스트가 쓰는 문서 2개만 빈 경로에 생성해 확인했다. 처음 전체 corpus 생성은 기존 디렉터리 보호 검사에서 쓰기 전에 차단됐으며 이를 우회하거나 기존 문서를 이동하지 않았다. 준비가 되지 않은 첫 서버 실행은 중지했으며 제품 assertion 실패로 분류하지 않는다. 완료 후 두 생성 파일의 bytes 일치를 확인해 정리했다.

```sh
DOCS_E2E_PORT=3076 DOCS_CONTENT_SOURCE=legacy pnpm --filter docs test:e2e article-toc-navigation.spec.ts --workers=2 --retries=0 --output=/private/tmp/docs-toc-alignment-results-20261120
pnpm --filter docs exec eslint widgets/article-toc/ui/toc-links.tsx e2e/article-toc-navigation.spec.ts --max-warnings 0
```

브라우저 명령에는 기존 합성 corpus의 event-loop·Brotli 문서가 필요하다. CI는 기존 준비 단계를 사용하며, 로컬에서는 생성기의 `syntheticDocumentSource`를 쓰되 대상이 없음을 먼저 검사하고 기존 파일을 덮어쓰지 않는다. 생성·검사 입력은 게시 대상이나 콘텐츠 이전이 아니다.

기본 root 16px·큰 글자 24px에서 새 정렬 검사 6개와 기존 목차 검사를 합쳐 **20개 통과·1개 화면 범위 skip**, 실패·retry 0개, 31.6초였다. skip은 기존 데스크톱의 모바일 Escape 검사다. 각 링크/텍스트 박스 중심 차이 1px 이하·모바일 44px/데스크톱 36px의 rem 비례 최소 높이·동일 계층 시작선·H3 들여쓰기·가로 넘침을 검사했다. 라이트/다크·앵커·현재 항목·스크롤·Escape·reduced-motion의 기존 검사도 유지했다. 변경 코드 lint는 경고 0개로 통과했고 테스트 파일 포맷만 정리했다.

공통 설정·검사 timeout/retry·기존 미커밋·stash·콘텐츠 lock은 변경하지 않았다. Safari/Firefox·실기기·광학적 글꼴 중심 검증과 원격 CI·커밋·푸시·배포는 미실행이다. 원시 화면·로그는 저장소 밖에 두며 공개 검수 해시는 갱신하지 않는다. [후속 작업 기록](../../worklog/2026-11/2026-11-20-toc-row-alignment.md)을 따른다.

이후 사용자가 로컬 합성 문서 화면을 확인하고 이번 코드·회귀와 정제 문서 3개만 공개 검수·작업별 커밋·푸시하도록 승인했다. 검증 시점의 미실행 범위는 위와 같이 보존하며, 실제 커밋·푸시 결과는 연결된 작업 기록·KAN-72에서 구분한다. 3076 미리보기 서버 종료와 합성 입력 2개 정리를 확인했다. 새 원시 자료·실제 글·공통 설정은 포함하지 않고 PR 생성·병합·배포는 하지 않는다.

## 관련 문서

- [작성·연결 가이드](../../runbooks/docs-article-toc-guide.md)
- [목차 공통화 경계](../../architecture/docs-document-ui-reuse-policy.md)
- [작업 기록](../../worklog/2026-11/2026-11-14-article-toc-ux.md)

## 병합·Production 후속 확인

2026-11-14 KST 사용자 승인에 따라 [PR #91](https://github.com/IMHOJEONG/web-tech/pull/91)을 squash 병합했다. 병합 전 마지막 head는 `1a5e27d2dc309b1da90424457b04e40da9527918`, 실제 main 병합 SHA는 `42a26e371c88f74844ad28d5bc9fc5a46482bfbf`다. 검증 보고서의 앞선 미배포 표시는 각 실행 시점의 기록이며 이 후속 결과와 구분한다.

- 리뷰 2건은 수정·회귀 후 해결했다. 연결 도구의 쓰기 403은 기존 GitHub CLI 인증으로 재시도하고 실제 저장 결과를 확인했다.
- 최종 메시지 전체와 head를 `pnpm pr:squash`로 사전 검사한 뒤 같은 인수의 `--merge`로 병합했다. 메시지 SHA-256은 `2495116938cc846186781c3cf89cbadef422392088d0f6c660765d669bc00ffa`다.
- 재리뷰는 공식 CodeRabbit 앱의 한도 초과였다. 체크 `132447037608`은 같은 head·App 347564·정확한 한도 제목/summary를 만족해 기존 예외 정책을 적용했다. `reviewPerformed: false`이며 재리뷰 통과로 표시하지 않는다. 다른 CI·보안 검사는 성공했고 미해결 스레드는 없었다.
- 같은 main SHA의 [CI](https://github.com/IMHOJEONG/web-tech/actions/runs/43595500214), [문서 검사](https://github.com/IMHOJEONG/web-tech/actions/runs/43595500273), [CodeQL](https://github.com/IMHOJEONG/web-tech/actions/runs/43595500173)이 모두 성공했다.
- 같은 main SHA의 Vercel docs 배포를 CLI 53.1.1로 조회해 운영 도메인 연결·target `production`·상태 `READY`를 확인했다. Preview 성공만으로 대체하지 않았으며 개별 provider 배포 ID는 이번 정제본에서 생략한다.
- 최초 PR Preview는 일반 요청의 302 Location이 Vercel `/sso-api`인지 확인한 뒤 공식 인증 경로로 목차·본문을 조회했다. 로컬 프로젝트 연결이 없던 첫 인증 조회는 확인 요구로 중단됐고, 저장소 밖 임시 연결에서 재시도했다. 새 프로젝트·환경변수·접근 보호 설정은 변경하지 않았다.

운영 화면은 기존 `article-toc-navigation.spec.ts`를 임시 Playwright 설정으로 실행했다. 정적 서버 실행을 제외하고 baseURL만 `https://heap-forge.app`으로 바꿨으며 390×844·768×1024·1280×800, timeout 30초·expect 5초·workers 2·retries 0·trace off를 유지했다.

```sh
pnpm --filter docs exec playwright test --config=/private/tmp/docs-toc-production-20261114.config.mts
```

이 config와 실행 결과는 저장소 밖 임시 자료이며 공개 파일로 추가하지 않았다. 재현하려면 같은 환경의 임시 config에서 기존 spec과 위 조건을 연결해야 한다.

| 운영 검사           | 관측 결과                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 목차 브라우저 회귀  | 14개 통과·데스크톱에서 모바일 전용 Escape 1개 skip. 라이트/다크, 실제 위치 표시, hash, focus, 큰 글자, 모션 감소 확인 |
| 주요 공개 경로      | Feed·목록·검색·Web·Mobile·UI/UX·About·영문 Feed·robots·sitemap 10개 모두 200. 응답 본문을 끝까지 수신                 |
| 비인증 revalidation | 토큰 없는 POST 401. 정상 토큰이나 캐시 만료는 사용하지 않음                                                           |
| 배포 Runtime Logs   | 같은 배포의 최근 20분 error·5xx 조회 각각 0건. 전체 기간 무장애 증명은 아님                                           |

이 후속 절은 사용자가 승인한 **로컬 정제 기록**이다. 병합 이후 새 커밋·푸시와 공개 검수 해시 갱신은 하지 않는다. 원시 응답·로그·캡처는 포함하지 않으며 NAS·기존 미커밋·stash도 변경하지 않았다. 실제 기기·Safari/Firefox·스크린리더 검증은 여전히 미실행이다.
