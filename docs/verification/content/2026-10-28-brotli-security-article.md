# Node.js Brotli 보안 초안의 근거·예제·화면 검증

## 대상과 조건

- 날짜: 2026-10-28 Asia/Seoul. Node 보안 공개일 10-21, Vercel 안내 게시일 10-26과 확인일을 구분합니다.
- 기준: `codex/squash-merge-preflight`, HEAD `61a778c5d7b083aec8bfd671c65523494921d5c9` 위의 미커밋 작업입니다. 별도 ADR 거버넌스 변경과 기존 글은 보존했습니다.
- 대상: [새 MDX](../../../apps/docs/category/be/node-js/node-brotli-runtime-security.mdx), [SVG 원본](../../../apps/docs/public/diagrams/node-brotli-waf-boundary.svg)과 PNG.
- macOS, Node.js v24.22.1, Brotli 버전 문자열 1.2.0, TypeScript 6.0.3, Next.js 16.3.8, Playwright Chromium입니다. 320/390/1280px 라이트와 390px 다크의 개발 preview 4조건이며 실기기가 아닙니다.
- [KAN-44](https://web-tech-service.atlassian.net/browse/KAN-44), [기존 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)에 로컬-only 범위를 연결합니다. 운영 패치 작업 KAN-43과 별개이며 해당 과제를 완료하거나 운영 복구로 확대하지 않습니다.

## 재현 방법

로컬 실험실 `/Users/coder/Desktop/project/labs/streaming-backpressure-lab`의 `brotli-article-source.json`과 `scripts/brotli-article-source.test.mts`를 연결했습니다. fixture는 `scripts/brotli-runtime-check.mts`이고, `pnpm test:security:brotli`로 MDX 2개 조각의 조립·개수·순서·fixture 동일성, 두 프로그램의 strict 타입과 각 3회 실행을 검사합니다. 전용 `typecheck:security:brotli` 명령도 등록했으며 이번 실행에서는 정식 테스트 안의 타입 검사를 사용했습니다.

저장소에서 `pnpm --filter docs validate:content`를 실행했습니다. 개발 서버는 `pnpm --filter docs dev --hostname 127.0.0.1`로 시작했습니다. [로컬 초안](http://127.0.0.1:3001/ko/preview/category/be/node-js/node-brotli-runtime-security)의 실제 MDX 컴포넌트·본문·그림·noindex를 `/private/tmp/brotli-article-20261028/ui.mts`로 관측했습니다.

## 결과와 증거

| 항목           | 결과                                                                                              | 증거                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 공식 근거      | Node High 등급·노출 조건, 수정 릴리스 세 개, Brotli 상위 수정과 Vercel 보호 범위를 대조           | [근거 목록·해시](../artifacts/2026-10-28-brotli-article-checks.json) |
| 실제 원문 코드 | strict 타입 2개와 fixture/원문 각 3회 정상 입력 실행, 잘못된 바인딩·성공 출력 거부 포함 11개 통과 | [검사 출력](../artifacts/2026-10-28-brotli-article-source-tests.txt) |
| 관측값         | Node 24.22.1·Brotli 1.2.0, 원본 624바이트·압축 54바이트·복원 일치                                 | 같은 출력의 6회 결과. 공격 재현 아님                                 |
| 콘텐츠         | 20개 frontmatter·스타일 검사 통과                                                                 | [콘텐츠 출력](../artifacts/2026-10-28-brotli-article-content.txt)    |
| 개발 화면      | 네 조건에서 HTTP 200·noindex·H1 1개·첫/마지막 본문·이미지 decode 통과                             | [화면 관측](../artifacts/2026-10-28-brotli-article-ui.json)          |
| 표시 오류      | 페이지 넘침 0·중첩 문단 0·pageerror 없음, SVG 텍스트가 캔버스 안에 표시                           | 같은 JSON의 측정값                                                   |

[모바일 첫 화면](../artifacts/2026-10-28-brotli-article-top-390.jpg), [모바일 다크 도식](../artifacts/2026-10-28-brotli-article-diagram-390-dark.jpg), [데스크톱 도식](../artifacts/2026-10-28-brotli-article-diagram-1280.jpg)을 시각 확인했습니다.

콘텐츠 검사는 기존 게시 TCP 글의 placeholder-like 경고 한 건을 함께 출력했습니다. 새 글의 오류는 아니며 이번 범위에서 기존 게시 글을 수정하지 않았습니다. `pass`와 기존 경고를 구분합니다.

기술 정확성·독자 이해·존댓말을 세 에이전트가 검토했습니다. 대표 입력 경로로 한정하고 정상 예제가 실제 앱 경로나 공격 차단을 검증하지 않음을 명시했습니다. 새로 시작한 node 명령과 기존 운영 프로세스 확인을 구분했습니다. WAF 그림은 일반적 보호 보장으로 읽히지 않도록 Vercel의 알려진 패턴 차단 규칙 대상으로 좁혔고, 외부 서버 응답을 별도 경로로 표시했습니다. 최종 재검토에서 필수 수정은 없었습니다.

초기 이미지 수정 뒤 개발 이미지 최적화 캐시가 이전 문구를 보여 주는 것을 실제 화면에서 발견했습니다. 새 글의 미게시 도식 파일을 최종 `node-brotli-waf-boundary` 경로로 정리하고 SVG·PNG를 함께 생성한 뒤 화면을 재검사했습니다. 위 증거는 갱신된 도식이 표시된 최종 결과입니다. 앱의 캐시 정책이나 기존 게시 이미지를 변경하지 않았습니다.

외부 기록은 Confluence v175와 Jira 댓글 10035를 재조회해 확인했습니다. Jira 댓글은 3열 표이며 중복 없이 총 1개입니다. KAN-44는 사용자 검토 대기로 검토 중 상태를 유지하고, KAN-43이나 운영 배포 완료 상태를 바꾸지 않았습니다.

### 사용자 요청 후 아키텍처 보강

2026-10-28 후속 요청에 따라 단순한 입력 경로 그림을 두 장으로 확장했습니다. 초기 한 장의 검증 증거는 위 기록으로 보존하고, 현재 본문은 아래 최종 자산을 참조합니다.

- [서비스·런타임 아키텍처 SVG](../../../apps/docs/public/diagrams/node-brotli-service-runtime-architecture.svg): 외부 사용자·외부 API, 요청 WAF, 앱·HTTP 클라이언트, JavaScript API/바인딩과 프로세스 내부 네이티브 디코더를 구분합니다. 조건부 해제는 점선입니다.
- [배포 아키텍처 SVG](../../../apps/docs/public/diagrams/node-brotli-runtime-deployment.svg): 개발 PC·CI·직접 관리 이미지/서버·관리형 플랫폼·새 프로세스 기동·기존 프로세스 종료 여부와 실제 요청 처리 프로세스 확인을 구분합니다. 한 서비스가 두 환경을 병행할 수 있으며 특정 서비스의 실측 배치도는 아닙니다.
- 도식 폭은 최대 44rem으로 넓혔고 두 PNG를 모바일·데스크톱에서 디코딩했습니다. 320/390/1280px 라이트와 390px 다크, SVG 글자 경계·본문 시작/끝·noindex·넘침·중첩 문단·pageerror 검사 통과. [후속 화면 JSON·원문/자산 해시](../artifacts/2026-10-28-brotli-architecture-ui.json), [서비스 모바일](../artifacts/2026-10-28-brotli-architecture-service-390.jpg), [배포 모바일](../artifacts/2026-10-28-brotli-architecture-deployment-390.jpg), [서비스 데스크톱](../artifacts/2026-10-28-brotli-architecture-service-1280.jpg).
- 실행 코드는 변경하지 않았고 기존 MDX 바인딩·fixture의 strict 타입과 정상 실행 등 [11개 검사](../artifacts/2026-10-28-brotli-architecture-source-tests.txt)를 최종 원문 해시로 다시 통과했습니다. [콘텐츠 검사](../artifacts/2026-10-28-brotli-architecture-content.txt)는 기존 TCP 경고를 제외하고 같은 20개 통과입니다.
- 다중 에이전트 검토에서 WAF를 차단 보장 대신 알려진 패턴 대상 규칙으로 표현하고, 두 배포 환경의 병행 가능성과 기존 프로세스 종료 여부 확인을 반영했습니다. 최종 기술·독자·어투 검토는 통과했습니다.

로컬 3001 포트의 기존 개발 서버를 재사용했습니다. 최초 샌드박스 curl 실패 뒤 시작을 시도했으나 EADDRINUSE여서 중복 서버를 띄우거나 기존 서버를 종료하지 않았습니다. 공용 패키지 준비 중 일시적인 모듈 조회 오류 뒤 최종 preview는 HTTP 200·실제 본문과 두 그림으로 재확인했습니다. 인앱 브라우저의 기존 초안 탭도 새로고침해 새 본문과 두 이미지의 접근성 트리를 확인했습니다.

후속 외부 기록은 Confluence v178의 기존 구역 보존과 Jira 댓글 10035의 실제 3열 표·댓글 총 1개를 재조회했습니다. 기록 대기 항목은 없습니다.

후속 변경도 draft·미커밋입니다. 운영 패치·재배포나 공격 재현은 수행하지 않았고 기존 게시 글과 다른 미커밋 작업은 보존했습니다.

### 사용자 요청 후 버퍼·제어 흐름과 실제 C 코드 보강

고정 8바이트 임시 입력 배열과 정상 입력 부족·수정 전 형식 오류·수정 후 오류 전파를 비교하는 그림 두 장을 추가했습니다. 질문형 소제목은 사용자의 기존 선호에 맞춰 설명형으로 썼습니다. 실제 메모리 배치나 특정 인접 필드 손상, 공격 성공을 관측한 그림이 아닙니다.

- [버퍼 구조 SVG](../../../apps/docs/public/diagrams/node-brotli-buffer-boundary.svg), [정상/오류 비교 SVG](../../../apps/docs/public/diagrams/node-brotli-decoder-flow-comparison.svg), [모바일 버퍼](../artifacts/2026-10-28-brotli-decoder-buffer-390.jpg), [모바일 흐름](../artifacts/2026-10-28-brotli-decoder-flows-390.jpg).
- C 발췌 5개와 diff 1개는 저장소 `google/brotli`의 부모 `34f020fa9daba975747b29885314c2545b7aa040`와 수정 `0ed4268a4401abcb4472096340477cf4af7d1a2b`에 고정했습니다. 상태 구조체·매크로 정의·한 바이트 보충·형식 오류 결과·상태 전파를 [읽기 전용 소스 snapshot](../artifacts/2026-10-28-brotli-decoder-sources.json)의 경로·행·SHA-256과 대조합니다. GitHub 연결 도구로 파일을 읽었고 commit permalink·파일 라이선스를 확인했습니다. 저작권·허가문을 포함한 [MIT 전문](../../../apps/docs/public/licenses/brotli-MIT.txt)을 함께 두고 본문에서 연결했습니다.
- 실험실의 새 `brotli-decoder-source.json`과 `scripts/brotli-decoder-source.test.mts`를 기존 `test:security:brotli` 명령에 연결했습니다. C/diff 누락·중복·미등록·잘못된 조건/길이/오류 전파·소스 hash/commit 변조를 거부합니다. C 발췌는 줄 연결 기호·들여쓰기만 정규화하며 부분 코드라 컴파일하지 않습니다. 정상 입력 TS의 strict 타입·fixture/원문 각 3회 실행과 합쳐 [16개 검사](../artifacts/2026-10-28-brotli-decoder-source-tests.txt)를 통과했습니다. [새 검사 자체의 strict 타입](../artifacts/2026-10-28-brotli-decoder-test-types.txt)도 종료 코드 0입니다.
- [최종 화면 JSON·원문 및 자산 해시](../artifacts/2026-10-28-brotli-decoder-ui.json): 320/390/1280px 라이트와 390px 다크의 네 조건에서 전체 그림 4개 decode, SVG 글자 경계, 코드 블록 11개, 본문·noindex·가로 넘침·중첩 문단·pageerror를 확인했습니다. MIT 텍스트의 HTTP 200·허가문도 대조했습니다. [모바일 C 코드](../artifacts/2026-10-28-brotli-decoder-code-390.jpg)를 시각 확인했습니다.
- [콘텐츠 검사](../artifacts/2026-10-28-brotli-decoder-content.txt)는 20개 통과이며 기존 TCP 글의 placeholder-like 경고는 그대로입니다. 본문에서 영문 괄호 뒤 조사 때문에 `**`가 그대로 표시되던 강조 세 곳을 원문에서 정리하고 화면 재검사했습니다. 공용 렌더러나 기존 게시 글은 바꾸지 않았습니다.

최초 diff 대조는 편집 과정에서 줄 앞 공백 두 칸이 달라 실패했습니다. 검사를 느슨하게 바꾸지 않고 표시 코드를 고정 원문의 들여쓰기와 맞춘 뒤 재실행했습니다. 다중 검토에서는 질문형 소제목, 정상 추가 입력이 항상 완료되는 듯한 단정, ‘영구적’ 표현과 false 변환의 적용 범위를 바로잡았습니다. 최종 기술·독자 이해·존댓말 재검토는 통과했습니다.

후속 기록은 Confluence v179의 새 요약·이전 구역 보존과 Jira 댓글 10035의 실제 3열 표·총 1개·16개 검사 내용을 재조회했습니다. 기록 대기는 없습니다.

이번 검증은 정상 TS 실행과 실제 원문 대조입니다. 악성 압축 입력·취약 바이너리·메모리 손상·공격 성공을 실행하지 않았고, 공식 Node 바이너리의 디버그 빌드 플래그까지 확인했다고 주장하지 않습니다. 스테이징·커밋·푸시·게시는 하지 않았습니다.

### 사용자 요청 후 글의 흐름과 기술 깊이 재편집

서론은 `package.json` 갱신과 Node.js 내장 디코더의 차이로 시작하고, 본론은 노출 경로 → 디코더 정상 수명주기 → 오류 분류 실패 → 수정 코드 → 운영 반영 순서로 재구성했습니다. 마지막에는 앱의 해제 경로 추적, 로컬 정상 입력 확인, 실제 운영 프로세스 확인의 역할을 구분합니다. AI처럼 보이던 질문형·반복형 제목과 안전 문구를 줄였으며 `readMinutes`를 14로 조정했습니다.

기존 고정 소스 snapshot과 공식 Node.js/Vercel 공지를 다시 대조해 비트 리더의 부분 읽기와 64비트 전제, 버퍼 보충·소진 후 초기화, 블록 길이 읽기 실패 시 상태 복원, safe 내부 경로의 반환값 오분류, 조건부 인덱스 8 쓰기, `BROTLI_BOOL`에서 `BrotliDecoderErrorCode`로의 계약 변경과 디코더 오류 결과 매핑을 보강했습니다. 길이 7에서 시작하는 설명은 재현 결과가 아닌 조건부 가정이며 JavaScript 예외 형태와 실제 메모리 손상은 주장하지 않습니다. C·TS 블록과 기존 그림은 변경하지 않았습니다.

- [최종 원문/fixture·고정 C 발췌 16개 검사](../artifacts/2026-10-28-brotli-editorial-source-tests.txt), [콘텐츠 검사](../artifacts/2026-10-28-brotli-editorial-content.txt), [최종 4조건 화면·원문 해시](../artifacts/2026-10-28-brotli-editorial-ui.json): 코드 원문 strict 타입·정상 입력 실행, C/diff 소스 대조, noindex·본문 처음/끝·H2 흐름·도식 4개·코드 11개·넘침과 pageerror를 확인했습니다. 기존 TCP 글의 placeholder-like 경고는 이번 초안과 별개로 남아 있습니다.
- [모바일 서론](../artifacts/2026-10-28-brotli-editorial-top-390.jpg), [모바일 C 원인](../artifacts/2026-10-28-brotli-editorial-code-390.jpg), [데스크톱 서론](../artifacts/2026-10-28-brotli-editorial-top-1280.jpg)을 검토했습니다. 실기기가 아닌 Chromium viewport입니다.
- 세 에이전트가 기술 정확성·초보자 이해·존댓말을 검토했습니다. 정상 예제가 실제 앱의 입력 경로를 증명하는 것으로 읽히지 않게 결론을 바로잡고, 노출 조건과 마지막 기술 결론을 명확히 한 뒤 재검토를 통과했습니다.

Confluence v183의 후속 구역과 이전 기록 보존, Jira 댓글 10035의 실제 3열 표·댓글 수 1을 재조회했습니다. 초안은 사용자 검토 대기이며 스테이징·커밋·푸시·게시하지 않았습니다. 운영 패치·실제 악성 입력·공격 성공은 검증하지 않았습니다.

### 사용자 요청 후 참고자료·저작권 및 초보자 재검토

공식 자료와 학습 자료를 글 끝에 목적별로 정리하고, C 코드 원본 파일의 Google Inc. 저작권 고지와 Brotli Authors의 프로젝트 MIT 라이선스를 분리했습니다. 매크로 발췌의 편집 범위와 [라이선스 전문](../../../apps/docs/public/licenses/brotli-MIT.txt)을 명시하며 직접 제작한 개념도와 외부 자료를 구분합니다. 앞으로 새로 쓰거나 본문·예제를 갱신하는 글에도 출처·저작권을 표시하도록 [앱 기고 지침](../../../apps/docs/AGENTS.md)을 보강했습니다. 기존 게시 글에 이 지침을 소급 적용했다고 주장하지 않습니다.

기술·독자 이해·존댓말 다중 검토에서 실질적인 보강 대상으로 HTTP의 `Accept-Encoding`/`Content-Encoding` 차이와 자동 해제의 구현별 차이, 스트리밍 내부 구현을 JavaScript 스트림 API만의 노출로 일반화하지 않는 점, 공식 지원이 끝난 Node.js 20 계열과 공급자 유지보수 빌드의 차이를 선정했습니다. 공식 Node.js 보안 공지·릴리스, Vercel 안내, Node.js 스트림·zlib API, RFC 9110·7932 및 고정 Brotli 커밋을 대조했습니다. 서론은 영향과 조치를 별도 문단으로 나눴습니다. 원문 코드·그림은 수정하지 않았습니다.

- [최종 원문 및 코드 바인딩 16개 검사](../artifacts/2026-10-28-brotli-references-source-tests.txt): 정상 입력 TS 실행과 고정 C/diff 발췌 대조·누락 거부. 부분 C나 악성 입력은 실행하지 않았습니다.
- [최종 네 화면 조건·원문 해시](../artifacts/2026-10-28-brotli-references-ui.json): 320/390/1280px 라이트·390px 다크, 본문·도식 4개·코드 11개·참고자료 링크 8개·라이선스 응답·noindex·넘침·pageerror 확인. [모바일 참고자료](../artifacts/2026-10-28-brotli-references-links-390.jpg), [모바일 서론](../artifacts/2026-10-28-brotli-references-top-390.jpg)을 확인했습니다.
- [콘텐츠 검사](../artifacts/2026-10-28-brotli-references-content.txt)는 20개 통과입니다. 이전 TCP 게시 글의 placeholder-like 경고 1건은 그대로이며 이번 초안 오류가 아닙니다. 앱 지침의 Prettier 검사도 통과했습니다.

후속 기록은 Confluence v184의 새 요약과 이전 구역 보존, Jira 댓글 10035의 실제 3열 표·댓글 수 1을 재조회했습니다. 기록 대기는 없습니다.

정상 입력 기능 확인과 정적 소스 대조는 CVE 악용 차단이나 운영 패치 적용 검증이 아닙니다. 운영 장애 주입, 공격 입력, 외부 서비스 설정 변경은 하지 않았고 draft·미커밋 상태로 사용자 검토를 기다립니다.

### 배포된 main의 코드 블록과 함께 로컬 확인

사용자 요청에 따라 `git fetch origin main`으로 최신 `0da7979b1d43c80ed28873a66fa9be222b2534d4`를 가져왔습니다. 기존 브랜치 `codex/squash-merge-preflight`는 HEAD `61a778c5d7b083aec8bfd671c65523494921d5c9`에서 main과 양방향으로 갈라져 있고 기존 문서 변경도 겹치므로 pull·병합·rebase로 기존 작업을 바꾸지 않았습니다.

main의 detached 임시 작업 트리 `/private/tmp/heapforge-main-preview-20261028`에 초안 MDX·사용 중인 그림 네 개·MIT 라이선스의 복사본을 두고 `127.0.0.1:3047`에 별도 개발 서버를 시작했습니다. 브라우저에서 원본과 복사본의 본문 해시 일치, 초안 noindex와 HTTP 200, 실제 diff의 삭제/추가 행 구분과 원문 복사, 모바일 390px 라이트·다크와 데스크톱 1280px 라이트를 확인했습니다. [검사 결과](../artifacts/2026-10-28-brotli-main-preview.json), [모바일 화면](../artifacts/2026-10-28-brotli-main-preview-390.jpg), [데스크톱 화면](../artifacts/2026-10-28-brotli-main-preview-1280.jpg)을 보관했습니다. 기존 작업 트리에서 시작 전 변경 파일 67개의 해시가 복사·서버 확인 직후 그대로임을 확인했습니다. 기존 3001 서버도 유지합니다.

최초 pnpm 오프라인 설치는 샌드박스에서 기존 캐시에 접근하지 못해 실패했고, 권한이 허용된 재실행은 972개 패키지를 다운로드 없이 설치했습니다. `prepare`의 git hook 설치는 임시 작업 트리의 `.git`이 파일이라 `ENOTDIR` 메시지를 냈으나 설치 명령은 0으로 종료했고 미리보기와는 별개입니다. 첫 복사 검사에서는 검사기가 마지막 줄바꿈을 제외한 기대값을 만들어 실패했으므로 원문 줄바꿈을 보존하도록 검사기를 수정해 통과했습니다. 제품 코드나 테스트 기준은 수정하지 않았습니다.

Confluence v191의 후속 구역과 이전 기록, Jira 댓글 10035의 3열 표·댓글 수 1을 재조회했습니다.

3047은 확인 시점의 복사본입니다. 이후 원본 초안의 수정이 이 복사본에 자동으로 반영되지는 않습니다. 원래 작업 트리는 아직 최신 main을 병합한 상태가 아니며, 새 커밋·푸시·게시·운영 배포는 하지 않았습니다.

## 한계와 후속 작업

공격 입력·PoC·메모리 손상·명령 실행·운영 서버 차단 시험은 수행하지 않았습니다. 정상 압축/복원 성공은 CVE 패치 검증이 아닙니다. 수정 반영의 근거는 공식 Node 릴리스이며 Brotli 숫자 문자열 하나로 판정하지 않습니다.

현재 애플리케이션의 실제 요청·fetch 해제 경로나 공급자 런타임·WAF 적용·운영 재배포는 미검증입니다. 예제는 짧은 직접 생성 입력만 사용합니다. 새 런타임 설치·배포·유료 기능 활성화도 하지 않았습니다.

새 글은 draft이며 스테이징·커밋·푸시·게시하지 않았습니다. 기존 TCP 글과 ADR 거버넌스 변경을 포함하지 않았습니다. 앱 구조·공개 계약·공용 컴포넌트 책임 변경이 없어 ADR은 추가하지 않았습니다. 사용자 내용 검토가 다음 단계입니다.

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-28-brotli-security-article.md)
- [기고 검증·preview 절차](../../runbooks/docs-article-rendering-regression.md)
