# 2026-08-29 Category Detail Canonical Redirect

## Context

`/category/{main}/{sub}/{slug}`와 `/docs/...`가 같은 상세 문서를 동시에 렌더링하면 검색엔진과 공유 metadata 관점에서 중복 URL이 생긴다.

이전 page metadata 정책에서는 category 상세 alias를 보류했지만, 실제 운영 기준은 더 닫는 편이 안전하다.

## Decision

category route는 taxonomy 탐색까지만 담당한다.

- `/category`
- `/category/{main}`
- `/category/{main}/{sub}`

문서 상세 canonical은 항상 `/docs/...` 아래에 둔다.

category 기반 문서는 다음 route를 canonical로 사용한다.

```txt
/docs/category/{main}/{sub}/{slug}
```

따라서 legacy category 상세 alias는 직접 렌더링하지 않는다.

```txt
/category/fe/react/server-client-component-boundary
-> /docs/category/fe/react/server-client-component-boundary
```

## Changes

- `getDocRoutePath()`가 `category/...` fileName을 canonical docs route 후보로 사용하도록 변경했다.
- category 문서 카드 링크를 `/category/...`가 아니라 `getDocHref()` 결과로 이동하도록 변경했다.
- 검색 인덱스와 Web channel hub에서 만들어지는 category 문서 상세 링크도 `getDocHref()` 기준으로 통일했다.
- `/category/{main}/{sub}/{slug}` page는 target 문서를 찾은 뒤 `permanentRedirect(getDocHref(target))`만 수행한다.
- route helper 테스트에 category canonical route 케이스를 추가했다.

## Verification

- `getDocHref({ fileName: 'category/fe/react/server-client-component-boundary' })`는 `/docs/category/fe/react/server-client-component-boundary`를 반환해야 한다.
- category 상세 alias는 렌더링 비용을 만들지 않고 canonical docs route로 수렴해야 한다.
- 프로덕션 라우트 체크와 docs-index 테스트 픽스처도 canonical docs route를 사용해야 한다.
