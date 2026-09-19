# 긴 문서에서 sticky 헤더 이탈 수정

## Summary

body의 고정 높이를 제거해 sticky header가 문서 끝까지 유지되도록 수정했다.

## Changed

- `app/[locale]/layout.tsx`: body의 `size-full`을 `w-full`로 변경.
- `min-h-screen`, flex column, 헤더 65px/shrink-0, 상세 shell 최소 높이는 유지.
- `e2e/article-sticky-header.spec.ts`: 맨 위/중간/맨 아래/다시 맨 위에서
  header top=0, height=65, 가로 넘침 없음 확인.
- 기존 TOC 테스트에도 header top=0 및 height=65 검증 추가.
  이전에는 음수 header bottom 기준으로도 제목 위치 검사가 통과할 수 있었다.

## Cause

body `height:100%`는 viewport만큼의 높이를 만들고 긴 콘텐츠는 body 밖으로 넘쳤다.
sticky가 부모 영역의 끝을 만나면서 화면 밖으로 밀려났다.
width와 minimum height만 유지하면 body 높이가 콘텐츠에 맞춰 늘어난다.
헤더를 fixed로 바꾸거나 본문에 추가 top padding을 넣을 필요가 없다.

## Validation

전용 local dev 서버 3109, remote index/API 비활성화 상태에서 검증했다.

- 수정 전: 새 desktop 테스트 실패. 기대 header top=0, 실제 -121px.
- 수정 후: Chromium mobile 390×844 / tablet 768×1024 / desktop 1280×800.
- 10 passed, 2 skipped. 제외 항목은 desktop 전용 TOC의 mobile/tablet 실행이다.
- 초기 shell 헤더/푸터 공간 유지 테스트도 함께 통과.
- `tsc --noEmit`: 통과.

```sh
# apps/docs 디렉터리, 3109의 전용 local server가 실행된 상태
DOCS_E2E_PORT=3109 mise exec -- pnpm exec playwright test e2e/article-sticky-header.spec.ts e2e/article-anchor-scroll.spec.ts e2e/article-shell-stability.spec.ts --workers=1
mise exec -- pnpm exec tsc --noEmit
```

전용 검증 서버는 종료했다. 다른 작업의 변경은 수정하지 않았다.

## Notes

실제 운영 페이지는 아직 수정 전이다. 로컬 dev 검증은 production streaming/실물 Safari
검증을 대체하지 않으며 배포 후 같은 깊은 스크롤 좌표를 확인해야 한다.

## Open Questions

실물 모바일 browser chrome 변화와 긴 원격 문서에서의 sticky/CLS는 배포 후 재확인한다.

## Next

배포 후 scrollY=1500 및 TOC 하단 이동에서 header top=0/bottom=65를 확인하고
초기 CLS가 다시 커지지 않았는지 측정한다.
