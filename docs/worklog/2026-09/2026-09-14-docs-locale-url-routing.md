# 언어별 URL로 docs 화면 분리

## Summary

쿠키 기반 언어 선택 대신 `/ko`, `/en` URL을 화면 언어의 기준으로 적용했다.
페이지와 Markdown 원본을 복제하지 않는 공유 `[locale]` 구조다.

## Changed

- 화면 라우트를 `app/[locale]`로 이동하고 API/자산은 루트에 유지.
- next-intl Proxy, root params 기반 메시지 로딩, 공용 navigation 추가.
- 검색 form/router, 메뉴, 카드 링크, 상세 canonical 리디렉션에 locale 적용.
- 헤더 언어 전환 및 언어별 metadata/sitemap 추가.
- URL 정책과 유지보수 비용을 `docs/architecture/docs-locale-url-routing-policy.md`에 기록.

## Notes

- locale 경로 단위 테스트 1개 통과.
- 격리된 전체 docs 앱의 프로덕션 빌드, TypeScript 검사 통과.
- URL 우선순위/리디렉션/SEO/API/404 및 기존 캐시 통합 테스트 전체 통과.
- expire: 0 갱신 응답 119ms, max stale 응답 5ms 관측. 성능 보장 수치가 아니라 로컬 모의 서버의 이번 실행 결과다.
- 첫 실행은 테스트가 상대 Location을 절대 URL로 해석해 실패했고, 기준 URL을 지정해 해결했다.
- 기존 작업 디렉터리의 tsc는 이동 전 `.next/types/app` 참조로 실패했다. 생성물이 없는 격리 빌드는 타입 검사까지 통과했다.
- Cache Components 운영 활성화, 커밋, 배포는 수행하지 않았다.

## Open Questions

- 본문 번역 도입 여부는 별도 결정한다. 현재 영문 UI에서도 원문은 공유한다.
- 실제 모바일 브라우저의 헤더 폭과 언어 전환 시 시각적 회귀는 추가 확인이 필요하다.

## Next

- 개발 서버를 중지한 상태에서 필요하면 기존 `.next` 생성물을 정리하고 다시 실행한다.
- URL 기반 locale 구조에서 정적 셸 검증을 유지하는 Cache Components 시험을 별도로 진행한다.
