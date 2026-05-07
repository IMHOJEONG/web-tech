# 2026-05-08 Root Landing Latest Notes Graceful Degradation

## Summary

- 루트 `/` 화면에서 remote content fetch가 실패해도 페이지 전체를 오류 화면으로 보내지 않도록 조정했다.
- `latest notes` 섹션만 비워 두지 않고, 자연스러운 안내 문구를 보여주는 방식으로 완화했다.

## Why

- 현재 루트 landing은 `Latest Notes`를 위해 remote content API를 읽는다.
- 이 API가 `401`, 네트워크 오류, TLS 오류 등으로 실패하면 홈으로 이동해도 같은 fetch가 반복되어 전역 오류 페이지가 다시 보였다.
- 홈은 서비스 첫 진입점이므로, editorial secondary section 하나 때문에 전체 화면이 죽는 경험은 피하는 편이 낫다.

## Applied

- `apps/docs/widgets/root-landing/ui/root-landing-page.tsx`
  - `getSortedPostsData()`를 `try/catch`로 감쌌다.
  - 실패 시 콘솔 로그만 남기고 `docs = []`로 내려서 홈 전체는 계속 렌더한다.
- `apps/docs/widgets/root-landing/ui/latest-notes.tsx`
  - 아이템이 없을 때 보여줄 `unavailableTitle`, `unavailableDescription` props를 추가했다.
- `apps/docs/shared/message/ko.json`
- `apps/docs/shared/message/en.json`
  - unavailable 안내 카피 추가

## Decision

- 루트 landing의 `latest notes`는 핵심 보조 섹션으로 취급한다.
- remote content fetch 실패 시:
  - 상세 페이지 / 문서 라우트는 오류 페이지로 보내도 됨
  - 하지만 루트 `/`는 살아 있어야 한다
- 따라서 홈에서는 `section-level graceful degradation`을 기본값으로 둔다.
