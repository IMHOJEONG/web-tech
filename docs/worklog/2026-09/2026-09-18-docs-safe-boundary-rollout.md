# 검증된 경계 분리 반영과 Cache Components 도입 보류

## Summary

검증된 동적 영역 분리와 로딩 UI만 기능 커밋으로 반영하고 Cache Components 도입은 보류한다.

## Changed

Footer의 pathname 의존 제거, 하단 메뉴/사이드바의 활성 상태 분리, docs/feed 결과 경계와 콘텐츠 loading.tsx를 포함한다.
격리 테스트에 필요한 CRP 예제 소스 복사 보완도 포함하되 CRP 자체 기능/CI 변경은 포함하지 않는다.
도입 판단 기준은 `docs/architecture/docs-dynamic-content-boundaries.md`에 기록했다.

## Notes

2026-09-17 검증에서 기존 운영 모델 전체 통합 시험과 변경 컴포넌트 lint가 통과했다.
Cache Components 시험은 정적 셸 빌드만 통과했고, 중첩 캐시의 max 이후 V3 게시에 실패했다.
운영 next.config.mjs 및 캐시 정책은 변경하지 않는다. 이번 작업은 커밋까지만 수행하고 푸시/배포는 별도로 진행한다.
별도 작업의 CRP E2E, CI, package.json, 콘텐츠와 원격 HTML 정규화 변경은 보존하고 제외한다.

## Open Questions

새 모델이 캐시 신선도와 실제 사용자 경험에서 기존 모델보다 나은지 아직 입증되지 않았다.

## Next

격리 환경에서 함수 캐시 단독 구조를 비교한다. 전체 검증 전 운영에 활성화하지 않는다.
