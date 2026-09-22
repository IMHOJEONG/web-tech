# Docs Shell Responsive Regression

## Context

`feature/docs` 브랜치에서 responsive policy 적용 이후 shell 회귀 테스트 상태를 다시 점검했다.

최근 source badge/filter를 사용자 화면에서 제거했기 때문에, responsive QA 문서와 e2e 경로에 남아 있던 `source` query 기준도 함께 정리할 필요가 있었다.

## Changes

- `desktop-navigation` test id를 top navigation wrapper에 추가했다.
- `mobile-nav-drawer-trigger` test id를 mobile drawer trigger에 추가했다.
- Playwright shell navigation test를 mobile, tablet, desktop viewport별로 확장했다.
- horizontal overflow smoke test에서 제거된 `source` query를 더 이상 사용하지 않도록 변경했다.
- responsive browser/device checklist의 확인 경로와 motion 확인 예시를 현재 `/docs` query 정책에 맞게 갱신했다.

## Regression Criteria

- `< 640px`에서는 mobile drawer trigger와 bottom nav가 보이고 desktop navigation은 숨겨져야 한다.
- `640px ~ 1023px`에서는 desktop navigation이 보이고 mobile drawer와 bottom nav는 숨겨져야 한다.
- desktop에서는 desktop navigation과 footer utility links가 보이고 mobile shell affordance는 숨겨져야 한다.
- `/docs?section=web&sort=latest`는 horizontal overflow 없이 렌더링되어야 한다.

## Notes

이번 변경은 UI 동작을 바꾸기보다 회귀 테스트의 관측 지점을 명확히 하는 작업이다.
테스트용 `data-testid`는 사용자에게 노출되는 시각 스타일에는 영향을 주지 않는다.

## Follow-up

Playwright 실행 중 Next.js가 `/default/local-document.svg`를 LCP 이미지 후보로 감지했다.
테스트 실패는 아니지만, 문서 카드 썸네일이 첫 화면에 노출되는 경우 `priority` 또는 `loading="eager"` 적용 기준을 별도로 정리할 필요가 있다.

이 항목은 `todo.md`의 `문서 썸네일 LCP 정책` 후속 작업으로 남긴다.
