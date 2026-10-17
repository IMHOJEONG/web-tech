# 보안 동기화 후 운영 블로그 점검

## Summary

feature/docs 동기화 커밋의 CI·Vercel 성공과 실제 도메인 alias를 확인하고, 운영 Chrome의 데스크톱·모바일 기능 검사 32개를 통과했다. 기능 성공과 별개로 원격 글 H1·영어 카테고리 번역·OG 캐시 헤더 차이를 후속 과제로 남긴다.

## Changed

- [검증 보고서](../../verification/security/2026-10-05-deployed-blog-smoke.md)에 초회 실패·재검증·Runtime Logs·한계를 기록했다.
- [관측 JSON](../../verification/artifacts/2026-10-05-deployed-blog-smoke.json)은 요청 식별자·토큰·쿠키를 제외한다.
- 검증·artifact·월별 목차와 [TODO](../../todo/todo.md#dependency-security)를 갱신한다. 앱 코드와 NAS·Cloudflare 설정은 변경하지 않았다.
- 후속 점검으로 원격 API의 H1 두 개와 카테고리 번역 누락 범위를 확인했다. Vercel 직접 응답과 공개 OG 응답을 분리해 브라우저 TTL 차이를 기록했다.

## Notes

설치된 Chrome을 Playwright로 실행했으며 인앱 브라우저 초기화 오류는 앱 장애와 구분한다. 로컬 fixture가 아닌 실제 공개 목록의 두 상세를 검사했다. 최종 DOM을 기다린 정상 카테고리 검사와 원격 본문의 H1 중복도 별개로 기록한다. 후속 상세 렌더러 테스트 17개는 통과했다. Vercel의 `s-maxage` 제거는 정상이며 공개 응답의 4시간 browser TTL을 별도 과제로 남긴다. origin 인증 중 `vercel curl`이 보호 우회 토큰을 자동 생성했다. 보호를 끄지 않았고 비밀값은 저장하지 않았다. 기존 정책을 검증한 작업이므로 새 ADR은 만들지 않는다.

## Open Questions

후속 보완 중 제안했던 H1 자동 보정과 전용 테스트는 사용자 요청으로 제거했다. 원격 heading 깊이는 그대로 유지하며 `web/browser`의 `Browser 동작 원리`·`Update!` 수정은 사용자가 NAS에서 수행한다. 카테고리 번역·OG 헤더의 작업 중 변경은 별도로 유지한다.

Cloudflare의 실제 Browser Cache TTL·Cache Rules, 원격 Browser Markdown 원문과 NAS 실행 이미지 버전은 미확인이다. 영어 카테고리의 UI 번역과 게시 갱신 검증도 남아 있다.

## Next

원격 글의 제목 계층과 영어 카테고리 번역을 별도 작업으로 보완하고, 캐시 설정은 origin/CDN 계약을 확인한 후 변경한다. 커밋·push는 이번 요청에 포함하지 않는다.
