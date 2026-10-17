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

## Production 배포 후 확인

- 게시 커밋 `d5d94542019d14b6d1bfd0992a3027cc11b3ca55`를 feature/docs에 푸시했습니다.
- [Production 상태](../artifacts/2026-10-14-http-publication-production.json): READY, 배포 ID `dpl_DthEUB4yJ9hG6MW7TadE19kKwA9S`. 최초 [배포·CI 관측](../artifacts/2026-10-14-http-publication-deployment.json)은 BUILDING과 CI 진행 중 상태를 보존합니다.
- 2026-10-14 12:56 KST에 시작한 [공개 페이지 확인](../artifacts/2026-10-14-http-publication-public.json): HTTP 200, canonical, 본문 시작·마지막 문장, 게시일 10-14와 sitemap 포함을 확인했습니다.
- 네 도식은 모바일/데스크톱의 대응 이미지를 실제로 디코딩해 표시했습니다. 두 폭에서 페이지 넘침·중첩 문단·pageerror가 없고 기존 백프레셔 글도 200으로 표시됩니다.
- [공개 데스크톱](../artifacts/2026-10-14-http-publication-public-1280.jpg), [공개 모바일](../artifacts/2026-10-14-http-publication-public-390.jpg).
- [게시 글](https://heap-forge.app/ko/docs/category/be/node-js/http-response-streaming-lab). 이 후속 결과는 배포 후 로컬에 추가한 기록입니다. 배포를 증명하기 위해 동일 글을 다시 푸시하지 않았습니다.

- [최종 CI 결과](../artifacts/2026-10-14-http-publication-ci.json): CI 6개 작업과 Documentation 모두 성공했습니다.

## 모바일 후속 확인

사용자 질문으로 2026-10-14 공개 글을 Chromium 320/390/430px에서 다시 확인했습니다.
[실제 측정](../artifacts/2026-10-14-http-mobile-followup.json): 세 폭 모두 200, 제목은 38.4px·3줄이며 header 아래에서 시작합니다. 코드 22줄을 펼친 뒤에도 프레임이 화면 안에 있고 페이지 가로 넘침·pageerror가 없습니다. 복사 버튼의 존재만 확인했으며 이번 후속 검사에서 클립보드를 다시 검사하지 않았습니다. 실기기·Safari 검증은 아닙니다.

[첫 화면](../artifacts/2026-10-14-http-mobile-top390.jpg)과 [펼친 코드](../artifacts/2026-10-14-http-mobile-code390.jpg)를 저장했습니다. 첫 긴 코드가 서버 구현일 것이라는 검사기의 잘못된 가정으로 [초기 검사](../artifacts/2026-10-14-http-mobile-checker-initial-failure.json)가 실패했습니다. 실제 첫 긴 블록은 readResponse였고, 표시된 본문과 프레임을 검사하도록 수정해 통과했습니다. 글·서비스 코드는 변경하지 않았습니다.
