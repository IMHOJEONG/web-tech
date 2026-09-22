# ARIA 중복 콘텐츠 정리

## Summary

동일 본문을 가진 ARIA 문서 중 UI/UX 글을 대표로 유지하고 React 카테고리 복제본을 archived로 보관했다.

## Changed

대표 URL은 `/docs/ui-ux/blocked-aria-hidden`이다. `category/fe/react/test.mdx`는 삭제하지 않고 공개 목록에서 제외했다. Next.js redirects에 이전 상세 경로 4개와 ko/en 변형을 등록했다. 언어 없는 URL은 대표 경로로 이동한 뒤 기존 locale 정책을 따른다.

## Notes

저장소 루트에서 실행했다.

```sh
mise exec -- pnpm --filter docs test:article:prod
mise exec -- pnpm --filter docs test:lib
```

로컬 production 검사 44개, 단위 테스트 131개가 통과했다. 새 브라우저 테스트는 308 상태, locale 및 query 보존과 대표 글 본문 표시를 검사한다. 단위 테스트는 archived 복제본의 파서 반환값이 null이고 대표 문서가 공개 상태로 파싱되는지 확인한다.

게시 갱신 테스트에서 기존 destination stream closed early 로그도 관측했다. 이 작업은 해당 로그의 원인을 해결한 것이 아니다. 실제 운영 배포는 미검증이며 fixture 환경의 .next는 배포 전 다시 빌드해야 한다. 커밋·푸시는 하지 않았다.

## Open Questions

원격 서버에도 같은 복제본이 있으면 별도로 정리해야 한다. 이번 변경은 로컬 문서에만 적용했다.

## Next

배포 후 이전 URL과 공개 목록을 확인한다. [점검 결과](../../verification/content/2026-09-20-local-content-review.md)의 중복 1쌍에 대한 로컬 조치다.
