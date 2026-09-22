# 상세 페이지 스트리밍 shell 공간 유지

## Summary

헤더가 늦게 들어오며 본문이 65px 내려가고, 짧은 loading UI가 긴 본문으로 교체되며
푸터가 화면 밖으로 밀리던 CLS 원인에 대응했다.

## Changed

- locale layout에서 Header 전체를 감싸던 Suspense를 제거.
- Header 내부로 Suspense를 이동해 sticky/border/background/65px 높이의 외곽은 항상 유지.
  `shrink-0`으로 flex 부모에 의한 높이 축소도 방지한다.
- `ArticlePageShell`: 일반 docs 및 category 상세에서 `min-height: calc(100svh - 4.0625rem)`을
  로딩 전후 동일하게 유지해 초기 푸터가 첫 화면 안으로 올라오는 것을 방지한다.
- `ArticleContentGrid`: 실제 본문과 skeleton의 열/패딩/간격을 공유한다.
- `ArticlePending`: 목록 카드 대신 TOC/제목/문단 골격, 번역된 status,
  reduced-motion을 고려한 pulse를 사용한다.
- category 상세에도 자체 loading boundary를 추가한다.

콘텐츠 표시 지연, opacity 숨김, 강제 고정 본문 높이는 도입하지 않았다.
짧은 문서는 최소 화면 높이만큼 여백이 생길 수 있다. 긴 문서는 자연스럽게 늘어난다.

## Validation

- `mise exec -- pnpm exec tsc --noEmit` (apps/docs): 통과.
- 전용 dev 서버: 127.0.0.1:3109, remote index/API 비활성화.
- 브라우저 테스트: 7 passed, 2 skipped.
- 390×844, 768×1024, 1280×800에서 docs/category 상세를 각각 검사.
  현재 category 예제 URL은 canonical `/ko/docs/category/fe/react/server-client-component-boundary`로
  redirect되므로 category layout 자체의 브라우저 렌더링 검증은 아니다. 최종 docs shell을 검증했다.
- FCP 이후 관측 가능한 shell의 헤더 높이 65px 및 footer top >= viewport height 확인.
- desktop TOC 클릭 시 타깃 제목이 sticky header 아래로 이동하는 기존 테스트 통과.
  이 TOC 테스트의 mobile/tablet 2개 제외는 기존 의도에 따른다.

```sh
# 저장소 루트
mise exec -- pnpm --filter docs exec tsc --noEmit
# 아래 명령은 apps/docs 디렉터리에서 실행한다.
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false BLOG_CONTENT_API_BASE_URL='' BLOG_CONTENT_API_BASE_URL_INTERNAL='' BLOG_CONTENT_API_BASE_URL_PUBLIC='' mise exec -- pnpm exec next dev --port 3109 --hostname 127.0.0.1
# 별도 터미널, apps/docs 디렉터리
DOCS_E2E_PORT=3109 mise exec -- pnpm exec playwright test e2e/article-shell-stability.spec.ts e2e/article-anchor-scroll.spec.ts --workers=1
```

기존 개발 서버를 종료하지 않았으며 검증용 서버만 종료한다.

## Notes

16ms 간격 DOM geometry 테스트는 전 프레임 CLS를 측정하는 테스트가 아니다.
원격 응답 지연을 강제로 삽입한 production streaming 테스트도 이번에는 실행하지 않았다.
따라서 배포 CLS=0을 보장한다고 해석하지 않는다. 폰트 교체 등 작은 이동은 별도로 남을 수 있다.

## Open Questions

느린 원격 응답/캐시 miss/한국 모바일 환경에서의 실제 CLS 및 short article 여백 UX는
배포 후 추가 확인이 필요하다.

## Next

배포 후 `trace-deployed-rendering.cjs`로 value=1의 header/footer 이동 재현 여부 확인.
이전 폰트 preload 최적화와 분리해서 CLS/LCP를 비교한다.
