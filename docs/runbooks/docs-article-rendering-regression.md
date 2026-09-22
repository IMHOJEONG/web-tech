# 상세 문서 렌더링 회귀 테스트

## 목적과 준비 조건

HTTP `200`, metadata 제목 또는 `.mdx-wrapper`의 존재만으로 상세 페이지가
정상이라고 판정하지 않는다. Next.js streaming 응답은 not-found 화면에서도
`200`일 수 있고, 본문 wrapper 안에 `Loading...`만 남을 수 있다.

브라우저에서 본문 고유 문장과 마지막 섹션이 실제로 보이는지 검사한다.
TOC, 관련 문서 카드 또는 HTML 내부의 번역 메시지를 본문으로 오인하지 않도록
검증 범위를 `.mdx-wrapper` 내부로 제한한다.

## 실행 순서

저장소에서 Node.js 24 환경으로 실행한다.

```bash
pnpm --filter docs exec playwright install chromium
pnpm --filter docs test:article:prod
```

명령은 production build를 새로 생성하고 `127.0.0.1:3111`의 Next.js 서버와
`127.0.0.1:3112`의 콘텐츠 fixture 서버를 실행한다. 종료 시 테스트 서버도
정리한다. 기존 서버를 재사용하지 않으며 포트가 점유되어 있으면 실패한다.
같은 checkout에서 개발 서버나 다른 build를 동시에 실행하지 않는다.

테스트가 `.next`에 fixture 환경으로 만든 build를 남기므로 이후 일반 production
서버를 실행하거나 배포할 때는 실제 환경변수로 다시 build한다.

API와 본문 URL 후보를 모두 loopback으로 지정하고 테스트용 토큰만 사용한다.
NAS와 Better Stack에는 요청하지 않는다. 원격 fixture는 목록과 본문 endpoint를
분리하므로 브라우저 `page.route()`로 서버 fetch를 흉내 내지 않는다.

## 기대 결과

| 대상          | 상세 경로                                                  | 확인할 내용                                           |
| ------------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| 로컬 data     | `/docs/web/javascript-event-loop-runtime`                  | MDX 첫 heading, 본문 문장, 마지막 참고 섹션           |
| 로컬 category | `/docs/category/fe/react/server-client-component-boundary` | 기존 누락이 발생한 canonical 상세에서 MDX 본문 완성   |
| 원격 HTML     | `/docs/web/article-e2e-remote`                             | 인증된 본문 endpoint가 반환한 고유 문장과 마지막 섹션 |
| 없는 문서     | `/docs/web/article-e2e-missing`                            | not-found heading 표시, 본문과 loading UI 부재        |

각 경로는 `/ko`, `/en`과 모바일 390px, 데스크톱 1280px 조합에서 검사한다.
이 문서의 범위는 상세 렌더링 16개와 아래 게시 갱신 4개다. 다른 spec이 추가되면
전체 suite 개수는 달라질 수 있다. 정상 문서는 직접 접근과 새로고침 모두 검증한다.
영어 route에서도 로컬 원문은 한국어이므로 UI locale과 문서 언어를 혼동하지 않는다.

정상 상세의 통과 조건:

- HTTP `200` 및 요청한 canonical URL 유지
- 본문 내부의 시작 heading, 고유 문장, 마지막 heading 및 끝 문장 표시
- metadata 제목 일치
- route skeleton과 본문 `Loading...` 제거
- not-found/error heading 및 `noindex` meta 부재
- 처리되지 않은 브라우저 JavaScript 오류 없음

원격 fixture 본문은 첫 응답에 350ms 지연을 둔다. 테스트 캐시는 3600초로
설정하여 자연 만료가 webhook 검증을 우연히 통과시키지 않게 한다. 운영 기본값
300초는 바꾸지 않는다. 이 테스트는 모든 요청의 loading 표시나 지연 시간을
보장하지 않는다. 명시적 sleep 없이 최종 DOM이 완성될 때까지 기다린다.

## 게시 후 화면 갱신

`content-publication.spec.ts`는 `/docs/web/article-e2e-publication` 전용 fixture로
다음 순서를 검증한다. 운영 파일이나 NAS 콘텐츠는 수정하지 않는다.

1. 목록, 검색, 상세에서 V1을 읽어 캐시를 채운다.
2. 원본 서버만 V2로 바꾸고 API의 V2 응답을 확인한다. 세 화면은 여전히 V1이다.
3. 토큰 누락, 잘못된 토큰, Content API 읽기 토큰으로 webhook을 호출하면
   모두 401이며 세 화면의 V1은 유지된다.
4. 별도의 정상 revalidation 토큰으로 호출하면 200과 `revalidated: true`를
   반환한다. 성공/실패 응답은 모두 `private, no-store`다.
5. 이미 열린 상세 DOM은 여전히 V1이다. 새로고침과 다음 페이지 요청에서
   제목, 요약, 본문 마지막 문장까지 V2가 표시된다.
6. V2 요약 검색은 결과가 있고 V1 요약 검색은 결과가 없다.

한국어/영어와 모바일/데스크톱 4개 조합으로 실행한다. 상태를 바꾸는 fixture는
단일 worker가 소유하며 테스트 전후에 원본과 캐시를 초기화한다. 제어 endpoint는
loopback 테스트 서버에만 있고 Next.js 운영 route에는 추가하지 않는다.
첫 페이지 노출을 고정하기 위한 2099년 날짜도 테스트 데이터에만 사용한다.

이 검증은 실제 DOM을 대상으로 한다. upstream 요청 횟수와 `expire: 0`/`max`
차이는 [캐시 통합 테스트](docs-content-cache-production-test.md)로 별도 확인한다.
열린 탭의 자동 갱신이나 기존 Router Cache의 모든 client navigation을 보장하지 않는다.

## 스트림 조기 종료 진단

`destination stream closed early`는 캐시 실패 여부와 따로 확인한다. 기본 테스트는
원래 prefetch 동작을 유지한다. 아래 옵션은 테스트 프로세스에만 적용된다.

```bash
ARTICLE_STREAM_TRACE=1 pnpm --filter docs test:article:prod content-publication --project=article-mobile --grep 'ko:'
ARTICLE_STREAM_TRACE=1 ARTICLE_DISABLE_PREFETCH=1 pnpm --filter docs test:article:prod content-publication --project=article-mobile --grep 'ko:'
```

첫 명령은 동일 origin의 document/fetch 요청 시작·완료·실패와 prefetch 여부를 기록한다.
원본 헤더, 토큰, query 값, 응답 본문은 출력하지 않는다. 두 번째 명령은 prefetch 헤더가
있는 요청만 서버에 보내지 않고 테스트 브라우저에 204로 응답하는 진단 대조군이다.
일반 페이지 요청과 webhook은 그대로 실행하지만 실제 prefetch 기능 검증은 아니므로
이 모드의 통과를 정상 회귀 결과로 대체하지 않는다. 두 명령은 순차 실행한다.

두 모드 모두 route interception을 사용한다. interception이 브라우저 HTTP 캐시를
비활성화하므로 평소 성능과 비교하지 않는다. 옵션 없이 실행하면 interception과 진단
로그가 모두 꺼진다. 운영 앱의 prefetch나 서버 오류 필터는 바꾸지 않는다.

`ERR_ABORTED`인 prefetch와 실제 document 실패를 구분하고, 화면 이동 시점과 서버
로그를 대조한다. 취소와 관련 없는 본문 실패·지속 timeout은 별도 장애로 조사한다.
이 메시지를 전역 catch나 로그 필터로 일괄 숨기지 않는다.

## 실패 대응과 복구

`apps/docs/test-results`의 screenshot, error context와 Playwright trace를 확인한다.
본문 assertion 실패는 로컬 탐색 누락, 원격 본문 반환 실패 또는 Suspense
미완료를 의미할 수 있다. timeout만 늘리기 전에 실제 DOM과 서버 로그를 확인한다.

```bash
pnpm --filter docs exec playwright show-trace test-results/<failed-test>/trace.zip
```

CI의 `Docs production article rendering tests` 단계에서 같은 명령을 실행한다.
실제 Vercel/NAS 연결, WAF, 배포 환경의 timeout은 이 fixture 기반 테스트가
보장하지 않는다. 실제 배포의 webhook과 화면 반영은 별도 운영 검증 대상이다.

## 관련 검증

- [게시 갱신 브라우저 실행 결과](../verification/cache/2026-09-19-content-publication-browser-test.md)
