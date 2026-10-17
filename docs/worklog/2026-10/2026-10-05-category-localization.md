# 카테고리 안내와 주제 설명의 언어 일치

## Summary

카테고리 전체·상위·하위 화면의 하드코딩된 문구를 ko/en 번역으로 옮겼다. 카테고리 주소와 기술명은 유지하고 실제 글 제목·요약은 원문 언어를 유지한다.

## Changed

- category 번역 namespace에 안내·문서 수·최근 업데이트·빈 업데이트 문구를 추가했다. 영어 문서 수는 단수·복수를 구분한다.
- taxonomy의 한국어 summary를 summaryKey로 바꾸고 페이지에서 번역한다. 분류 허용 목록·URL 계산·카테고리 조회 경계는 변경하지 않았다.
- 번역 키·URL·문서 수 단위 테스트와 세 viewport의 브라우저 탐색 테스트를 추가했다.

## Notes

Node 24.12.0에서 번역·OG 캐시·카테고리 경계·본문 렌더러 단위 검사 23개를 통과했다. `typecheck:node-test`도 통과했다. 브라우저 초회는 JSON import attribute 누락으로 실행 전에 실패해 수정했다. 이후 15개 통과·3개 실패는 영어 `Documents`가 통계 라벨과 목록 라벨에 모두 일치한 selector 문제였다. 문구를 바꾸지 않고 통계 패널로 검사 범위를 좁혔다. 최종 ko/en × 세 화면 × 모바일·태블릿·데스크톱 검사 **18개 통과**(41.4초), 앱 전체 타입 검사도 통과했다. 초기 전체 타입 검사는 공용 UI 재빌드 중 결과 파일을 읽어 실패했으며 빌드 완료 후 재검증했다.

```sh
DOCS_E2E_PORT=3121 mise exec -- pnpm --filter docs test:e2e e2e/category-localization.spec.ts
mise exec -- pnpm --filter docs typecheck
```

3121 포트의 검사 서버는 원격 API 후보를 비우고 원격 목록을 끈다. 실제 기기나 운영 배포 검증을 수행한 결과는 아니다. 영어 화면의 한국어 글 제목을 번역 누락으로 취급하지 않는다. [기존 운영 관측](../../verification/security/2026-10-05-deployed-blog-smoke.md)과 로컬 수정 검증을 구분한다.

## Open Questions

운영 배포 후 ko/en 카테고리 문구 확인은 남아 있다. NAS 원문의 H1 수정은 사용자가 수행하며 프론트의 H1 자동 보정은 제외했다.

## Next

번역 변경을 독립 커밋으로 기록하고 배포 후 언어별 UI를 확인한다. OG 브라우저·Vercel 캐시 계약과 Cloudflare 조치 절차는 별도 작업으로 남긴다.
