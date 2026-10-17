# 수요일 게시 글 점검과 기존 초안의 진행 상태 대조

## 대상과 조건

- 관측 날짜: 2026-10-14 Asia/Seoul. 자동 실행 예정 시각과 실제 관측 시각을 구분합니다.
- 기준: `feature/docs`, `d8c0952`의 미커밋 작업 트리. 다른 작업의 변경은 포함하지 않았습니다.
- 공개 대상: [백프레셔 글의 한국어 canonical URL](https://heap-forge.app/ko/docs/category/be/node-js/stream-backpressure-diagnosis).
- 기존 검토 대상: HTTP 스트리밍·TCP 소켓 초안. 둘 다 `status: draft`입니다.
- 환경: macOS, Node.js v24.12.0, Chromium 1280×900 / 390×900. 모바일 viewport이며 실기기는 아닙니다.
- 코드 검사: 실제 게시 MDX의 TypeScript 세 블록, HTTP·소켓의 기존 원문 바인딩과 fixture. 새 글은 생성하지 않았습니다.

## 재현 방법

[정기 점검과 원문 검사 절차](../../runbooks/docs-article-rendering-regression.md)를 따릅니다.
공개 페이지·sitemap은 Playwright로 요청하고 실제 `.mdx-wrapper` 본문을 읽었습니다.
본문 마지막 문장을 화면으로 이동해 표시 여부도 확인했습니다. metadata와 흐름도 배치를 함께 읽었습니다.

HTTP·소켓 실험실에서 `pnpm typecheck:http`, `pnpm test:http`, `pnpm test:sockets`를 실행했습니다.
원문에 연결된 `.mts` 추출·strict 타입·각 3회 동작과 누락·중복·순서 오류 거부 검사를 재사용했습니다.
게시 MDX는 실제 세 TypeScript 블록을 임시 `.mts`로 추출해 strict 타입과 각 3회 실행을 확인했습니다.
보조 함수에는 본문 보존·완료 assertion을 붙이고 pipeline에는 고정 입력 파일을 제공해 gzip 해제 결과를 대조했습니다.
Next.js TSX 한 블록은 본문에서 명시한 개념 구조이며 독립 앱 실행 대상이 아닙니다. 누락된 블록을 성공으로 건너뛴 것이 아닙니다.

`pnpm --filter docs validate:content`로 frontmatter·콘텐츠 스타일을 검사했습니다.
정지된 개발 서버를 포트 3001에 임시로 시작해 두 draft preview의 실제 MDX를 확인했습니다.
공개·초안 브라우저 검사기는 `/private/tmp/heapforge-weekly-20261014/`에서 실행한 점검용 파일입니다.
반복 절차의 원본은 위 runbook이며 이 임시 검사기를 서비스 코드에 추가하지 않았습니다.

## 결과와 증거

### 기존 게시 글

공개 브라우저 검사는 **2026-10-14 10:27 KST**에 시작했습니다. 각 화면의 정확한 시각은
[공개 글 측정 JSON](../artifacts/2026-10-14-weekly-published.json)에 있습니다.

| 조건                | 관측 결과                                                                                | 판정 |
| ------------------- | ---------------------------------------------------------------------------------------- | ---- |
| 공개 응답·canonical | 두 viewport 모두 200, canonical과 OG URL이 한국어 글 주소와 일치                         | 통과 |
| 실제 본문           | 첫 heading과 마지막 고유 문장, 마지막 문장의 화면 표시 확인                              | 통과 |
| metadata            | 제목·설명·H1 1개·BlogPosting·게시일 10-01·수정일 10-06을 원문과 대조                     | 통과 |
| sitemap             | 200, 게시 canonical 포함, HTTP/TCP draft slug 미포함                                     | 통과 |
| 그림·배치           | Readable→Transform→Writable 3개 카드, 데스크톱 가로·모바일 세로, 그림과 페이지 넘침 없음 | 통과 |
| 브라우저 오류       | 두 viewport의 pageerror 없음                                                             | 통과 |
| 실행 예제           | 실제 TS 세 블록 strict 타입, 각 3회 실행, 느린 Writable 출력과 gzip 본문 보존 대조       | 통과 |

- [데스크톱 화면](../artifacts/2026-10-14-weekly-published-1280.jpg), [모바일 화면](../artifacts/2026-10-14-weekly-published-390.jpg).
- [게시 예제의 실제 출력·원문 해시](../artifacts/2026-10-14-weekly-published-examples.json): 정상 실행 9회.
- [최초 게시 예제 검사의 부분 결과](../artifacts/2026-10-14-weekly-published-examples-partial.json): 보조 함수 3회까지만 성공한 기록입니다.
  검사기가 실제 `drain` 대신 `drained`를 기대해 중단됐습니다. 글 오류가 아니며 선택 문자열을 바로잡고 9회 재검증했습니다.

Vercel CLI의 최신 Production 목록은 `READY`, commit `d8c09527f8cb9195aa16258fee9b2bec916ee818`,
branch `feature/docs`였습니다. 조회 결과에서 계정 식별자·작성자 이메일을 제외한
[점검 요약](../artifacts/2026-10-14-weekly-checks.json)을 보관했습니다.
최신 URL은 `https://web-tech-642ctbic8-hojeong-ims-projects.vercel.app`입니다.
Production 목록 상태와 공개 본문 관측을 구분하며 새 배포를 실행하지 않았습니다.
CLI의 `--json`은 지원하지 않아 도움말의 `--format json`으로 조회했습니다.

### 기존 draft 보강

기술 정확성·독자 이해·존댓말 검토에서 두 초안의 “이벤트 루프 실험은 미실행” 문장이
[10-11 완료된 별도 TCP 실험](2026-10-11-node-event-loop-cpu.md)과 충돌하는 것을 찾았습니다.
CPU 0/200ms 각 3회가 완료됐다는 사실을 반영하고 이 글의 HTTP·소켓 예제 자체의 관측 범위와 분리했습니다.
HTTP 코드 조립 안내의 중복과 TCP의 local/remote 조사를 정리하고 `updatedAt`을 10-14로 갱신했습니다.
실행 코드·도식은 바꾸지 않았으며 새 draft를 중복 생성하지 않았습니다.

- 최종 HTTP 바인딩·fixture 검사 26개 통과, [소켓 최종 원문 검사](../artifacts/2026-10-14-weekly-socket-final.txt) 11개 통과. HTTP 전용 타입 검사도 통과했습니다.
- frontmatter·스타일 검사 19개 파일 통과. 최종 원문 SHA-256은 점검 요약에 있습니다.
- [개발 preview 측정](../artifacts/2026-10-14-weekly-drafts.json): 두 글·두 viewport, 본문과 갱신된 후속 실험 설명,
  noindex·그림 디코딩·넘침·중첩 문단·pageerror 검사.
- [초기 preview 선택자 실패](../artifacts/2026-10-14-weekly-drafts-initial-failure.json): 중첩 코드 접기의 summary까지
  여러 개 선택해 실패했습니다. 직접 자식 summary를 선택하도록 좁혀 재검증했습니다.
- [HTTP 데스크톱](../artifacts/2026-10-14-weekly-http-response-streaming-lab-1280.jpg), [HTTP 모바일](../artifacts/2026-10-14-weekly-http-response-streaming-lab-390.jpg),
  [TCP 데스크톱](../artifacts/2026-10-14-weekly-tcp-socket-endpoints-lab-1280.jpg), [TCP 모바일](../artifacts/2026-10-14-weekly-tcp-socket-endpoints-lab-390.jpg).

최초 로컬 HTTP·소켓 실행은 샌드박스의 `listen EPERM`으로 실패했습니다. 공개 fetch 도구와
샌드박스 DNS 조회도 실패했습니다. 허용된 환경에서 재실행한 성공과 구분하며 이 제한을
게시 글 결함이나 서비스 장애로 해석하지 않았습니다.

## 한계와 후속 작업

이번 주간 점검에서 게시 원문의 재현 오류를 발견하지 않아 재업로드하지 않았습니다.
표본은 한국어 게시 글 한 편·Chromium 두 폭이며 다른 글·번역·실기기·다른 브라우저 전체의
정상 보장은 아닙니다. metadata 확인이 검색 엔진 등록·노출 성공을 뜻하지 않습니다.
원격 콘텐츠 API의 복구, Better Stack 알림, 실제 Next.js production 스트리밍 성능은 검증하지 않았습니다.
오류 로그 부재로 이를 정상 판정하지 않습니다.

새 글의 사용자 검토 대기는 기존 상태입니다. 두 글을 draft로 유지했고 스테이징·커밋·푸시·원격 게시는 하지 않았습니다.
버퍼 정량 비교와 Next.js 화면 표시 실험은 미실행이며 이번 자동 실행에서 다음 학습 단계로 넘어가지 않았습니다.

## 관련 문서

- [이번 작업 기록](../../worklog/2026-10/2026-10-14-weekly-article-maintenance.md)
- [HTTP 초안](../../../apps/docs/category/be/node-js/http-response-streaming-lab.mdx)
- [소켓 초안](../../../apps/docs/category/be/node-js/tcp-socket-endpoints-lab.mdx)
