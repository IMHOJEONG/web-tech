# 2026-05-11 Docs ESM 패키지 타입 지정

## 요약

- `apps/docs/package.json`에 `"type": "module"`을 추가했다.
- 이로써 `next.config.mjs`가 `lib/expressive-code-options.js`를 import할 때 발생하던 `MODULE_TYPELESS_PACKAGE_JSON` 경고를 없앨 수 있다.
- 변경 범위는 `docs` 앱 패키지에만 한정되며, `.js` helper 파일이 일관되게 ESM으로 해석되도록 맞췄다.

## 파일

- `apps/docs/package.json`
