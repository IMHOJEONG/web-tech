# 동적 영역 분리와 정적 셸 재검증

## Summary

Footer의 불필요한 pathname 의존을 제거하고 하단 메뉴/사이드바의 활성 상태 및 검색 조건 기반 결과를 Suspense 아래로 분리했다.
정적 셸 검증을 완화하지 않은 Cache Components 전체 앱 빌드가 통과했다.

## Changed

- Footer는 서버 locale로 명시적 URL을 생성한다.
- MobileBottomNav와 CategorySidebar의 pathname 읽기를 별도 컴포넌트로 이동하고 실제 링크를 유지하는 fallback을 사용한다.
- docs/feed의 검색 조건 await와 데이터 조회를 비동기 결과 컴포넌트로 이동했다.
- category, docs 상세, web/mobile/ui-ux 콘텐츠의 loading.tsx와 번역된 공용 ContentPending을 추가했다.
- 정책: `docs/architecture/docs-dynamic-content-boundaries.md`.

## Notes

실행 명령은 정책 문서에 기록했다. 임시 앱과 모의 서버를 사용하며 실제 NAS 또는 Vercel 배포 테스트는 아니다.

- 최초 재검증에서 기존 메뉴/query 오류는 사라지고 web/mobile/ui-ux 조회 경계 오류가 드러나 해당 세그먼트도 분리했다.
- 최종 Cache Components 빌드: 컴파일 17.7초, TypeScript 4.2초, prerender 51/51 통과.
- docs/feed/category/hub가 Partial Prerender로 출력되고 next start가 실행되었다.
- 언어 URL/SEO/API/404, 최초 캐시 재사용, expire: 0 V2 반환, max stale V2 반환까지 통과.
- 전체 캐시 시험은 실패: `Background revalidation must eventually publish V3`, 실제 title=CACHE_TITLE_V2, hasV3Body=false, index=4/body=3.
- 기존 fetch 캐시 위에 함수 캐시를 겹친 실험에서 발생한 실패다. 정적 셸 통과를 캐시 신선도 보장으로 해석하지 않는다.
- 변경한 컴포넌트 lint 및 diff 공백 검사 통과.
- 기존 운영 모델 전체 통합 시험도 최종 통과: locale/SEO/인증, expire: 0, max 백그라운드 V3 갱신 및 상세 V3 렌더링.
- 운영 모델 첫 재시험은 새 CRP E2E가 참조하는 외부 예제 소스가 임시 앱에 없어 타입 검사에 실패했다. 시험 복사본에 예제 소스를 포함하도록 runner를 보완한 뒤 통과했다. 타입 검사는 제외하지 않았다.
- 운영 캐시 설정은 변경하지 않았고 instant=false는 추가하지 않았다. 커밋/푸시도 하지 않았다.
- 작업 중 별도 변경된 HTML 정규화·실험 문서·CI/패키지 파일은 건드리지 않았다.

## Open Questions

중첩 캐시의 max 갱신 시점/계층을 분리하여 검증해야 한다. 실제 브라우저의 레이아웃 이동과 접근성 점검은 미실시다.

## Next

함수 캐시 단독 구조를 완화 없는 전체 앱에서 비교 시험하고, 최신 본문이 게시되는지 확인한 뒤 운영 전환 여부를 결정한다.
