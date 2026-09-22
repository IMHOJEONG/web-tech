# 배포 화면 헤더·TOC 검사 정리

## Summary

미커밋 배포 화면 점검 스크립트의 스크롤 검증을 검토하고, 실행 환경에 맞는 lint 설정을 보완했다.

## Changed

- 모바일/데스크톱과 두 문서에서 위·중간·끝·다시 위의 헤더 위치와 가로 넘침을 기록한다.
- TOC 이동은 양수인 실제 헤더 하단을 기준으로 검사한다.
- 누락 표본, 헤더 이탈, 가로 넘침, TOC 가림은 종료 코드 1로 처리한다.
- `SHELL_OUTPUT`으로 결과 저장 경로를 지정할 수 있다.
- 해당 CommonJS CLI에만 Node/브라우저 globals와 `SHELL_OUTPUT` lint 허용을 적용했다.
- [기존 운영 측정 보고서](../../verification/performance/2026-09-19-docs-sticky-header-deployment-verification.md)의 표 포맷만 정리했다. 측정값은 변경하지 않았다.

## Notes

스크립트의 `node --check`와 ESLint는 통과했다. 이번 커밋 검토 중에는 운영 사이트에
브라우저 요청을 보내지 않았으며 기존 보고서의 수치를 새 측정 결과로 취급하지 않는다.
헤더 65px 기준은 현 디자인 계약이다. 디자인이 바뀌면 검사 기준도 함께 검토해야 한다.

## Open Questions

실물 Safari 및 현재 배포 버전의 재측정은 별도 작업이다.

## Next

배포 후 점검이 필요할 때 아래 명령을 실행한다. 실제 공개 페이지를 요청하며 기본
결과 파일은 `/tmp/heap-forge-cls-shell-check.json`이므로 이전 결과를 보존하려면 경로를 바꾼다.

```sh
mise exec -- pnpm --filter docs exec node scripts/verify-deployed-article-shell.cjs
```
