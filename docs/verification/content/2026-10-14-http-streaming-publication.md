# HTTP 스트리밍 글의 게시 전 검증

## 대상과 조건

- 날짜: 2026-10-14 Asia/Seoul. 사용자 승인 대상은 HTTP 스트리밍 글 한 편입니다.
- 기준: origin/feature/docs의 d8c0952 위 분리된 게시 작업 트리. 다른 미완료 작업은 포함하지 않습니다.
- 원문: status published, date와 updatedAt 2026-10-14.
- 실행: Node.js 24와 TypeScript .mts. 별도 실험실의 실제 MDX 바인딩과 fixture를 검사합니다.

## 재현 방법

실험실에서 ARTICLE_SOURCE를 게시 작업 트리의 MDX 절대 경로로 지정해 pnpm typecheck:http와 pnpm test:http를 실행합니다.
게시 작업 트리에서 pnpm --filter docs test:lib, pnpm --filter docs typecheck, pnpm --filter docs lint, pnpm --filter docs build를 실행합니다.
production 모드 서버의 canonical 경로·sitemap·본문 시작/끝·반응형 그림을 Chromium으로 확인합니다.

## 결과와 증거

- 게시 작업 트리의 정확한 원문 SHA-256: `fd827b8add13507fe942b360188a4cbe31ec1d440b18974ce534f531fd8601ec`.
- 실제 MDX와 fixture의 HTTP 정상·버퍼링·취소·코드 바인딩 검사 26개 통과. 전용 타입 검사 통과.
- 앱의 렌더링·콘텐츠 관련 단위 검사 227개 통과. 앱 타입·린트와 운영용 빌드 통과.
- 운영 모드에서 HTTP 200, 본문 시작·마지막 문장, canonical·BlogPosting 게시/수정일 10-14, sitemap 포함을 확인했습니다.
- Chromium 1280/390px에서 네 도식의 디코딩·가로/세로 이미지 선택, 페이지 넘침 없음·pageerror 없음·중첩 문단 없음과 기존 백프레셔 글의 표시를 확인했습니다.
- [운영 모드 화면 측정](../artifacts/2026-10-14-http-publication-local.json), [검사 요약](../artifacts/2026-10-14-http-publication-checks.json).
- [데스크톱 그림](../artifacts/2026-10-14-http-publication-local-1280.jpg), [모바일 그림](../artifacts/2026-10-14-http-publication-local-390.jpg).

최초 분리 폴더의 타입/단위 검사는 공용 UI 패키지의 dist가 아직 없어 실패했습니다. 앱 prebuild에서 의존 패키지를 빌드한 뒤 단위·타입 검사를 재실행해 통과했습니다. 이 준비 실패를 원고 오류로 해석하지 않았습니다.

Production 배포는 이 게시 전 기록 시점에 아직 실행하지 않았습니다. 성공으로 추정하지 않습니다.

## 한계와 후속 작업

로컬 HTTP/1.1 실험의 수신·취소 결과를 Next.js·프록시·TLS·운영 환경의 정량 결과로 확대하지 않습니다. Production 배포 성공은 공개 URL과 실제 본문·그림·metadata·sitemap의 확인 뒤 판정합니다.

## 관련 문서

- [게시 작업 기록](../../worklog/2026-10/2026-10-14-http-streaming-publication.md)
- [HTTP 스트리밍 글](../../../apps/docs/category/be/node-js/http-response-streaming-lab.mdx)
