# 본문 목차 가이드 예제

[작성·연결 가이드](../../../../../docs/runbooks/docs-article-toc-guide.md)의 합성 예제다. 블로그 콘텐츠 폴더와 분리되어 있으며 게시용 글·실험 원시 자료가 아니다.

- [article.md](article.md): H2~H4, 언어가 있는 코드 펜스, 참고 자료를 포함한다. `draft`를 유지한다.
- [toc-options.ts](toc-options.ts): 실제 `Toc` props와 타입을 맞춘 데스크톱/모바일 옵션이다. 별도 목차 구현이 아니다.
- [회귀 테스트](../../../lib/article-toc-guide.test.ts): 실제 파일을 읽어 본문 규칙·로컬 앵커·원격 추출 범위·옵션 타입을 검사한다. 명령은 작성·연결 가이드에서 관리한다.

이 파일들을 `apps/docs/data`나 `category`로 옮기면 공개 콘텐츠 검수 대상이 달라진다. 자동 게시하지 않는다.
