# 게시 글 세 편의 주간 운영 검증

## 대상과 조건

- 실제 관측: 2026-10-28 09:12~09:14 Asia/Seoul. 예약 시각 09:00과 구분한다.
- 로컬 기준: `61a778c5d7b083aec8bfd671c65523494921d5c9`, macOS·Node.js 24.22.1·Chromium 390/1280px.
- 공개 대상: 백프레셔, HTTP 스트리밍, TCP 소켓의 게시 원문 세 편.
- 원래 추적: [KAN-18](https://web-tech-service.atlassian.net/browse/KAN-18). 2026-10-29 [KAN-51](https://web-tech-service.atlassian.net/browse/KAN-51)에서 보존 커밋 `d511f1f`의 주간 기록을 정제해 분리했다.
- 이 보고서 이관은 새 브라우저·운영·실험 검사를 실행한 결과가 아니다. 당시 원시 로그와 캡처는 비공개 사본에 보존하고 개인 경로·원시 화면을 공개 커밋에 복사하지 않았다.

## 재현 방법

당시 [정기 점검 절차](../../runbooks/docs-article-rendering-regression.md)에 따라 canonical URL의 본문·metadata·sitemap·이미지 decode와 두 화면 폭을 확인했다. HTTP 200만으로 성공을 판단하지 않았다.

### 비공개 실험의 재현 경계

아래는 별도 로컬 실험 공간에서 실행했던 명령이며 **이 checkout에서는 재현할 수 없다**. 루트와 각 workspace에 같은 이름의 스크립트가 없으므로 저장소 루트에서 실행하면 missing-script 오류가 난다. 실험 공간의 실제 경로와 비공개 원본은 공개하지 않는다.

```bash
pnpm typecheck:http
pnpm test:http
pnpm test:sockets
```

당시 실험을 다시 실행하려면 Node.js 24.22.1·pnpm, 위 세 스크립트와 의존성이 정의된 별도 실험실 manifest·lockfile·fixture·테스트 소스, 대조할 당시 게시 MDX가 필요하다. HTTP·TCP 테스트에는 loopback listen 권한도 필요하다. 이 준비물이 없는 공개 checkout만으로 아래 표의 HTTP 26개·백프레셔 9회·TCP 14개 결과를 재생산할 수 있다고 안내하지 않는다.

백프레셔 MDX의 실제 TypeScript 세 블록을 추출하여 strict 타입과 각 3회 동작을 확인했다. TSX 블록은 원문이 설명한 개념 구조이며 독립 앱 실행 대상으로 집계하지 않았다. 소켓 원문과 테스트 복제본을 대조하고 게시 원문의 EOF 회귀를 별도로 실행했다.

### 공개 저장소에서 실행할 수 있는 별도 검사

저장소 루트에서 Node.js 24.22.1·pnpm 12.14.0과 루트 lockfile의 의존성을 준비한 뒤 다음 명령으로 실제 렌더링 회귀를 실행할 수 있다. Chromium 설치에는 네트워크가 필요하며, 3111·3112 포트가 비어 있어야 한다. 같은 checkout의 개발 서버나 build를 중지하고 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm --filter docs exec playwright install chromium
pnpm --filter docs test:article:prod
```

이 명령은 [렌더링 회귀 절차](../../runbooks/docs-article-rendering-regression.md)의 production build·fixture 기반 본문/metadata/이동 검사를 실행한다. **비공개 HTTP·소켓 실험이나 10-28 공개 도메인 검증의 대체 명령은 아니다.** 10-29의 문서 보완에서는 명령과 manifest의 연결만 확인했으며 이 브라우저 검사를 새로 실행하지 않았다.

## 결과와 증거

[정제 집계](../artifacts/2026-10-28-weekly-maintenance-summary.json)는 원본 기록에서 필요한 수치와 실패·성공 구분만 옮긴 것이다. 원시 로그와 캡처를 그대로 재현한 artifact가 아니다.

| 항목               | 당시 관측                                                                                               | 판정         |
| ------------------ | ------------------------------------------------------------------------------------------------------- | ------------ |
| 공개 상세·metadata | 세 글 × 두 폭에서 HTTP 200, H1 하나, 본문 시작/끝·canonical/OG·설명·BlogPosting 날짜 일치, noindex 없음 | 통과         |
| sitemap            | 공개 세 글 포함, 당시 미승인 Brotli 초안 미포함                                                         | 통과         |
| 레이아웃·그림      | 가로 넘침·중첩 문단·pageerror 0, HTTP 그림 4개·TCP 그림 2개 decode                                      | 통과         |
| HTTP 예제          | 원문 바인딩·정상/버퍼링/취소·fixture·strict 타입 26개                                                   | 통과         |
| 백프레셔 예제      | 실제 TS 세 블록 strict 타입, 9회 정상 실행                                                              | 통과         |
| TCP 복제본         | 최초 원문 바인딩 6개 중 1개 실패 후, 복제 파일을 게시 원문과 맞춰 전체 14개 통과                        | 실패 후 통과 |
| 게시 원문 EOF      | 기존 회귀 2개                                                                                           | 통과         |

최초 TCP 불일치는 게시 원문의 오류가 아니라 로컬 복제본의 오래된 입력 대기 코드였다. 해당 파일만 동기화했으며 기대값이나 원문 일치 검사를 완화하지 않았다. 공개 본문 수정·재업로드는 하지 않았다.

초기 Chromium·소켓 실행은 권한 제한으로 실패했고 허용된 환경에서 재실행했다. 임시 검사기의 의존성·경로 가정 오류도 실행 준비 실패로 구분했다. 이를 서비스 장애로 해석하지 않았다.

당시 Production 목록은 main `e2126a40c02694d968f62ce0e236ec0945a57d7b`의 `READY`였다. 목록 조회와 공개 도메인 본문 검사는 다른 증거이며 새 배포는 하지 않았다.

## 한계와 후속 작업

- Chromium viewport 표본이며 실기기 Safari·다른 브라우저·모든 게시 글을 보장하지 않는다.
- 관리자 패킷 재캡처, 원격 콘텐츠 API 복구, 알림, 운영 런타임 패치 적용은 당시 검증하지 않았다.
- 정상 `drain` 실행 결과를 조기 종료 경로의 보장으로 확대하지 않는다. [KAN-47](https://web-tech-service.atlassian.net/browse/KAN-47)의 별도 검토가 남아 있다.
- Brotli는 관측일인 10-28에는 draft였다. 이후 [PR #76](https://github.com/IMHOJEONG/web-tech/pull/76)으로 published가 됐으며, 과거 draft 관측을 현재 게시 상태로 오해하지 않는다.
- 원시 개인 경로·캡처를 제외한 기록 이관이며 이번에 전체 검사를 재실행한 것이 아니다.

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-28-weekly-article-maintenance.md)
- [TCP 게시 검증](2026-10-21-tcp-publication.md)
- [Brotli 게시 검증](2026-10-29-brotli-publication.md)
