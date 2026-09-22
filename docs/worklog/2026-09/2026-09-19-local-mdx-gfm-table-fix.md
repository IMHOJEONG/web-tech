# 로컬 MDX 상세의 GFM 표 렌더링 수정

## Summary

상세 화면에서 Markdown 표의 파이프와 구분선이 일반 문장으로 표시되는 문제를 수정했다. 원문이나 CSS가 아니라 런타임 MDX 파서의 GFM 플러그인 누락이 원인이었다.

## Changed

`apps/docs/lib/render-article-content.ts`의 `evaluate()` 옵션에 기존 의존성인 `remark-gfm`을 연결했다. `next.config.mjs`의 MDX 설정은 별도 런타임 평가에 자동 전달되지 않는다. 원격 HTML 경로와 Shiki 설정은 변경하지 않았다.

회귀 테스트는 하이라이팅 활성/비활성 두 경우에 table/thead/tbody, 행 수, 셀의 inline code와 strong, TOC 유지를 검사한다. 실제 `critical-rendering-path-diagnosis.mdx`의 리소스 비교 표도 검사한다.

## Notes

수정 전 신규 테스트 3개 실패, 기존 7개 통과로 재현했다. 수정 후 전체 lib 테스트 130개와 앱 타입 검사가 통과했다. 브라우저 시각 검사와 production build는 이번 변경에서 실행하지 않았다.

저장소 루트에서 재현:

```sh
mise exec -- pnpm --filter docs exec node --experimental-strip-types --test lib/render-article-content.test.ts
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs typecheck
```

## Open Questions

GFM 파싱 외에 좁은 화면의 표 가로 스크롤과 다크 모드 시각 검사는 별도 확인 대상이다.

## Next

배포 후 해당 글에서 표가 실제 테이블로 표시되는지 확인한다. 커밋과 푸시는 아직 하지 않았다.
