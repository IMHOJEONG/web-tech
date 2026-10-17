# 게시 글 정기 점검과 다음 HTTP 스트리밍 초안

## Summary

기존 수요일 오전 9시(Asia/Seoul) 자동 실행에 게시 글 검증과 재현 오류의
최소 수정·재게시 절차를 추가했다. 다음 글은 사용자 검토용 draft로 작성했다.
새 글의 스테이징·커밋·푸시·게시를 수행하지 않았다.

## Changed

- 자동 실행 `heapforge-2`를 갱신했다. 게시 글 수정 권한과 새 글 검토 승인을 구분했다.
- [HTTP 응답 스트리밍 초안](../../../apps/docs/category/be/node-js/http-response-streaming-lab.mdx)에
  req/res, 청크, 소켓, 응답 이벤트, Next.js 연결 설명과 실제 `.mts` 로그를 작성했다.
- [게시 글 점검 절차](../../runbooks/docs-article-rendering-regression.md)를 기존 문서에 추가했다.
- 기술 정확성·독자 관심도·존댓말 어투의 세 에이전트 검토를 반영했다.
  보조 코드 구분, 타입 실행과 검사 차이, 실험 변경 안내와 검증 범위를 보강했다.

## Notes

- 2026-10-08 01:31 KST 관측: 기존 backpressure 글과 sitemap 모두 HTTP 200.
  응답 HTML의 article 내부에서 첫 heading과 마지막 고유 문장·참고 링크를 확인했다.
  sitemap의 한국어 canonical URL 포함을 확인했다. 재게시할 오류는 이 범위에서 발견하지 않았다.
- 초안의 `.mts`를 추출해 Node.js v24.12.0에서 실행했다. 첫 조각 24ms,
  두 번째 조각 326ms에 수신되었고 상태 코드와 합친 본문 assertion이 통과했다.
- 초안 MDX를 앱의 `renderArticleContent`로 평가하고 시작·끝 섹션,
  흐름 카드 markup 및 중첩 p 부재를 확인했다.
- 콘텐츠 frontmatter/style 검사 18개 파일 통과.
- 추출 예제의 strict TypeScript 검사 통과. CLI는 `--ignoreConfig`,
  `--types node`, 앱의 `@types` 경로를 사용했다.
- [정제한 실행 증거](../../verification/artifacts/2026-10-08-http-response-streaming.json).
- 공개 페이지 브라우저 모바일/데스크톱 화면, 최신 Vercel 배포 상태는 이번 작업에서
  미검증이다. HTML 확인을 화면 검사 완료로 표시하지 않았다.
- 로컬 소켓 실행과 공개 URL 접근은 샌드박스 제한 이후 승인된 실행으로 확인했다.
- 공개 계약·공용 컴포넌트·데이터 흐름 변경이 없어 ADR 추가 대상이 아니다.

## Open Questions

새 HTTP 스트리밍 글의 내용과 난이도에 대한 사용자 검토를 기다린다.

## 후속 실험실 연결과 설명 보강

사용자 요청으로 기존 로컬 전용 `streaming-backpressure-lab`에 `.mts` 예제와
streaming/buffered 각 3회 검사, 전용 타입 설정을 추가했다. 실험실 위치는
`/Users/coder/Desktop/project/labs/streaming-backpressure-lab`이다. 실험 원본은
서비스 저장소에 복제하지 않고 실험실의
`docs/verification/2026-10-08-http-response.md`와 artifact에서 관리한다.

두 모드의 헤더 flush 시점을 맞춰 본문의 첫 수신을 비교했다.
전용 타입 검사, 실험실 전체 `tsc --noEmit`, 6회 실행 검사가 통과했다.
글에는 실행 명령, 관측 표와 제한을 연결하고 세부 설명을 보강했다.

추가 설명 우선순위를 기술·독자 관점의 두 에이전트로 분석했다.
반영한 항목은 end의 마지막 본문 쓰기와 연결 재사용 구분, UTF-8/출력 형식,
write/finish 실제 로그 해석, 상태 200과 본문 완료의 차이, 헤더 전송 후 변경 불가,
애플리케이션 청크와 패킷 경계 구분이다. 후속 후보는 다음과 같다.

1. 첫 조각 뒤 클라이언트 취소: 정상 close와 완료 전 close를 비교하고 원인 증거를 연결한다.
2. Next.js production 브라우저: 서버 로그, Network 수신, fallback 교체를 함께 관찰한다.
3. 프록시·압축 및 느린 소비자: 실제 전송 계층과 backpressure를 별도 조건으로 비교한다.

후속 사용자 요청으로 첫 번째 후보인 연결 취소 실험을 추가했다.
`scripts/http-response-cancel.mts`는 첫 줄 수신 후 명시적으로 연결을 끊고,
부분 본문·client complete=false·end 부재·server finish 부재·완료 전 close와
타이머 정리 실행을 확인한다. 전용·전체 타입 검사와 정상 6회/취소 3회 검사가 통과했다.
실험실의 `docs/verification/2026-10-08-http-cancel.md` 및 artifact에 결과를 보관했다.

첫 검사에서는 PASS 요약의 `no server finish`를 실제 이벤트로 오인해 실패했다.
이벤트 행의 정규식으로 수정한 뒤 재실행했다. 기술 검토에서도 같은 검사 오류를
확인했으며, 실제 운영 원인을 close만으로 단정하지 않는 범위 제한을 유지했다.
초안에는 실행 명령·실제 취소 로그·정상/취소 비교와 비동기 작업 정리 설명을 추가했다.

Next.js 브라우저 표시와 프록시/느린 소비자 후보는 아직 미검증이다.
실험실과 서비스 저장소 모두 커밋·푸시하지 않았다.

## Next

새 글은 draft로 유지한다. 검토 의견을 반영하고 명시적인 게시 승인을 받은 뒤
렌더링과 배포 검증을 완료한다. 다음 정기 실행에서는 기존 게시 글의 화면 검사도 수행한다.
