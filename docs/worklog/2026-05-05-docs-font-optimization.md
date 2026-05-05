# Worklog: 2026-05-05 Docs Font Optimization

## Summary

- `docs` 앱의 한글 본문 폰트를 `Pretendard` variable font로 적용
- `Space Grotesk` display 폰트는 유지하되 `woff2` 자산으로 최적화
- 배포본 전체 폴더 대신 실제 사용하는 폰트 파일과 라이선스만 `public/fonts`에 남김

## Changed

- `apps/docs/app/layout.tsx`
- `apps/docs/app/css/global.css`
- `apps/docs/app/css/mdx.css`
- `apps/docs/public/fonts/PretendardVariable.woff2`
- `apps/docs/public/fonts/SpaceGroteskVariable.woff2`
- `apps/docs/public/fonts/Pretendard-LICENSE.txt`
- `apps/docs/public/fonts/SpaceGrotesk-LICENSE.txt`
- `docs/worklog/2026-05-05-docs-font-optimization.md`

## Notes

- `Pretendard`는 한국어 전체 범위와 기본 라틴/구두점 범위를 유지한 `woff2` variable 자산으로 변환했다.
- `Space Grotesk`는 UI/헤딩에 필요한 라틴 중심 범위만 포함한 `woff2` variable 자산으로 변환했다.
- 기존 `apps/docs/public/Pretendard-1.3.9`와 `apps/docs/public/Space_Grotesk` 전체 배포 폴더는 제거했다.
- 최종 public 폰트 자산 크기는 약 `1.7MB` 수준으로 정리됐다.
