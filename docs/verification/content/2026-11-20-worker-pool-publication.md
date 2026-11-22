# 워커 풀 원고의 운영 발행 검증

2026-11-21 기록 정리: 아래 초안 상태·실행·서버 유지·발행 결과는 11-20 당시 관측이다. 이번에는 정제 기록만 대조하며 원문·원시 자료를 복사하거나 실험·브라우저·게시·배포를 다시 실행하지 않는다.

## 대상과 조건

2026-11-20 KST, 공개 HTTP 관측 10:54–10:55. 콘텐츠 `e07988e9cf6a899d750445b1cf14d7e10d1aca8d`, 앱 main `4dedd86e6ddddd12d36cd40cde1cd30d2edec5af`. [PR #102](https://github.com/IMHOJEONG/web-tech/pull/102)와 [KAN-65](https://web-tech-service.atlassian.net/browse/KAN-65). 당시 Vercel Production의 READY·운영 alias·main SHA를 각각 확인했다.

## 재현 방법

다른 세션과 원고 보존본을 대조하고 기존 본문을 유지한 채 게시 메타만 변경했다. 실제 MDX8개 코드 조각을 추출해 복제본과 대조하고 strict 타입·실행·HTTP 포화/재접수를 검사했다. 격리된 앱 작업 트리에서 발행 lock 한 파일만 변경하고 실제 콘텐츠 18편·자산15개를 검수 SHA로 준비해 Production 빌드했다.

`pnpm --filter docs test:content`는 합성 fixture용 legacy 환경, 실제 준비·빌드는 private-git 환경에서 검사했다. 렌더러·heading 회귀를 별도 실행했다. 공개 ko/en URL과 sitemap을 curl로 읽고 Chromium 1280px·390px에서 본문·목차·도식을 확인했다.

## 결과와 증거

- [공개 글](https://heap-forge.app/ko/docs/category/be/node-js/worker-pool-queue-limit)과 en 경로는 모두 HTTP200이며 각 canonical·설명·BlogPosting·H1 한 개·index 허용을 확인했다. 본문 시작·끝은 로컬 검증본과 일치했고 결과표2개·도식2개, 503 조건과 기존 실험 수치가 표시됐다.
- [사이트맵](https://heap-forge.app/sitemap.xml)은 HTTP200이며 ko/en 글 URL이 각각 정확히 한 번 포함된다. 전체 URL은58개다. 한국어 목록에도 새 글이 표시됐다.
- 두 viewport에서 가로 넘침·목차 대상 누락은 없었다. 실제 HTTP 절 목차 클릭 후 제목은 상단 약96px에 위치했다. 모바일 목차가 접히는 동작과 로컬 코드23줄 펼침도 확인했다.
- 원문 바인딩·실행3개, 콘텐츠51개·렌더러/heading28개 통과. 실제 발행본18편·검수 자산15개 준비와 Production 빌드 성공. 기술·독자 이해·존댓말의 다중 검수에서 게시 차단 문제가 없었다.
- PR의 모든 검사·리뷰를 확인하고 운영 리비전 변수 미설정을 대조했다. 환경·키 변경 없이 리뷰를 해결하고 squash 메시지 사전검사를 통과했다. 병합 SHA의 [CI](https://github.com/IMHOJEONG/web-tech/actions/runs/44653821134), CodeQL44653820519·Documentation44653821212 모두 성공했다. 인증 콘텐츠 CI를 새로 활성화한 결과는 아니다.
- [정제 관측 자료](../artifacts/2026-11-21-worker-pool-publication-summary.json)

## 한계와 후속 작업

처음 합성 CLI에 private-git 환경을 상속해51개 중1개가 실패했고 환경을 분리해 재검사했다. 초기 응답의 빈 MDX wrapper만 읽던 임시 검사기는 React 스트리밍의 해당 Suspense 본문을 읽도록 보완했다. 이를 원문 누락으로 판단하지 않았다. Python urllib의403은 curl·브라우저 성공과 구분했으며 클라이언트별 응답 차이의 근본 원인은 미확정이다.

실기기·지속 부하와 새 성능 수치 측정은 미실행이다. 기존 두 글의 placeholder-like warning은 유지했다. HTTP200·오류 로그 부재만으로 성공을 판정하지 않았다. 새 운영 계약은 없고 기존 검증 기준을 재적용했으므로 별도 ADR·지식 페이지는 만들지 않았다. 기존 미커밋·지침·다른 원고는 발행 커밋에 포함하지 않았다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-20-worker-pool-publication.md)
- [비공개 Git 발행 절차](../../runbooks/docs-private-git-content.md)
