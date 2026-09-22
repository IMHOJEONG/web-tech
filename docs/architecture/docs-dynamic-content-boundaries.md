# 문서 화면의 정적 셸과 동적 영역 경계

## 상태와 범위

- 상태: 적용 중
- 대상: docs 정적 셸과 Suspense 경계. Cache Components 활성화는 보류.
- 최종 검토: 2026-09-22

## 배경

언어별 URL만으로 요청별 경로·검색 조건 의존성이 없어지지는 않는다. 정적 셸 검증과 캐시 신선도를 별도로 평가해야 한다.

## 결정

### 원칙

언어는 URL에서 결정하고, pathname에 따른 활성 표시와 query 기반 결과는 Suspense 아래에서 계산한다.
루트 전체를 빈 fallback으로 감싸거나 `instant = false`로 정적 셸 검증을 끄지 않는다.
운영 Cache Components 활성화는 별도 결정이다.

## 도입 결정: 보류 (2026-09-18)

현재 검증된 Suspense 경계, 로딩 UI, 명시적 locale 링크만 운영 코드에 반영한다.
`next.config.mjs`에 `cacheComponents: true`를 추가하지 않고 기존 fetch 캐시와 revalidation webhook을 유지한다.
정적 셸 빌드 통과는 새 캐시 모델의 신선도와 운영 안정성까지 검증했다는 뜻이 아니다.

Cache Components는 반드시 지금 도입해야 하는 기능이 아니다. 다음 기준을 만족할 때 다시 판단한다.

1. 검증 완화 없이 전체 앱 정적 셸 빌드를 통과한다. 이 조건은 이번 시험에서 충족했다.
2. 함수 캐시 단독과 기존 모델을 동일한 조건에서 비교하고, expire: 0/max 이후 목록과 상세가 모두 최신 버전으로 수렴해야 한다.
3. 원격 장애와 복구, 연속 webhook, 동시 요청에서도 오래된 콘텐츠가 고착되지 않아야 한다.
4. 응답 시간뿐 아니라 초기 콘텐츠 노출, 레이아웃 이동, 캐시 운영 복잡도까지 비교해 실제 이점이 있어야 한다.

다음 실험은 운영 설정이 아닌 격리 앱에서 함수 캐시 단독 구조를 시험한다.
기존 fetch 캐시와 함수 캐시를 단순히 겹쳐 적용하는 방식은 현재 V3 갱신 실패가 재현되므로 채택하지 않는다.
실험 결과가 불분명하거나 성능 이점이 작으면 기존 모델을 유지한다.

## 적용 구조

- Footer: 현재 경로에 의존하지 않는 고정 링크다. 서버 locale로 URL을 완성해 Next Link에 전달하여 next-intl Link 내부의 pathname 의존을 제거한다.
- MobileBottomNav: ActiveMobileNav만 pathname을 읽는다. fallback도 같은 MobileNavItems를 사용해 링크와 크기를 유지하되 현재 항목을 표시하지 않는다.
- CategorySidebar: ActiveSidebar만 pathname을 읽는다. SidebarItems는 fallback과 실제 화면에서 공유하고, 링크는 명시적인 locale URL로 만든다.
- docs/feed: 동기 Page가 Suspense를 생성하고 비동기 DocsResults/FeedResults가 searchParams를 await한 뒤 조회한다.
- category와 docs 상세, web/mobile/ui-ux: loading.tsx로 해당 세그먼트 콘텐츠에 경계를 둔다. 공용 헤더/Footer는 이 경계 밖에 있다.
- ContentPending: 공용 디자인 토큰, common.loadingDocuments 번역, role=status, aria-busy, motion-safe 애니메이션을 사용한다.

## 대안과 영향

허브는 데이터 통계와 카드가 한 구성 요소에 묶여 있어 현재는 콘텐츠 영역 단위로 로딩한다.
따라서 허브의 hero까지 즉시 보이는 설계는 아니다. 향후 정적 소개와 동적 목록을 더 분리할 수 있다.
목록/상세에 공통 스켈레톤을 사용하므로 실제 콘텐츠 높이를 완전히 보장하지 않는다. 모바일 CLS와 스크린리더 전환은 별도 실기기 검증이 필요하다.

## 검증 기준

```sh
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs --cache-components
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs
```

첫 명령은 정적 셸 빌드와 캐시 동작을 모두 시험한다. 빌드 통과와 전체 시험 통과를 구분해야 한다.
2026-09-17 시험에서 정적 셸 빌드는 통과했지만 중첩 캐시의 max 재검증 후 V3 게시 검증은 실패했다.
이는 Suspense 경계와 별개의 캐시 신선도 문제이며, 새 모델을 운영에 활성화하지 않는 이유다.
현재 운영 모델의 전체 통합 시험은 V3 갱신 및 상세 렌더링까지 통과했다.

## 관련 문서

- [언어 URL 정책](docs-locale-url-routing-policy.md)
- [캐시 통합 시험](../runbooks/docs-content-cache-production-test.md)
