# 상세 문서 본문 렌더링 회귀 검증

## Summary

로컬 category 문서가 목록에는 있지만 상세 loader 탐색에서 누락되는 문제가
있었다. HTTP `200`만 확인하면 streaming not-found를 놓치며 wrapper 표시만
확인해도 내부 loading 상태를 정상으로 오인할 수 있었다.

## Changed

- production build와 로컬 원격 API fixture를 사용하는 Playwright 구성 추가
- 로컬 data/category, 원격 HTML, 없는 문서의 실제 DOM 검증
- 한국어/영어, 모바일/데스크톱의 16개 조합 및 정상 상세 새로고침 검사
- 본문 고유 문장/끝 섹션, loading 종료, 오류 화면 부재와 pageerror 확인
- `test:article:prod` 실행 명령과 CI 연결

실행 방법과 한계는 [상세 렌더링 검증 runbook](../../runbooks/docs-article-rendering-regression.md)에 기록한다.

## Notes

- Node.js 24에서 TTL 300초 기준 production 브라우저 테스트 16개 통과 (build 포함 27.5초)
- 추가 TypeScript 파일 ESLint 및 `git diff --check` 통과
- 원격 본문은 목록 응답에 포함하지 않고 Bearer 인증된 별도 endpoint에서 제공
- 초기 테스트의 TTL 0 설정은 정적 생성 경고를 유발해 운영 기본 300초로 조정

## Open Questions

실제 NAS 및 Vercel 환경의 검증은 별도로 필요하다.

## Next

후속 [게시 갱신 검증](2026-09-19-content-publication-browser-test.md)에서
목록·검색·상세 갱신을 추가했다. 현재 테스트의 실행 조건은 runbook을 따른다.
