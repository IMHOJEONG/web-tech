# 공용 UI 생성기의 빌드·포맷 계약 정리

## Summary

2026-10-14에 feature/docs의 도구·포맷 커밋을 `b9f3246`까지 정상 푸시한 뒤, 공용 UI 생성기를 현행 컴포넌트 빌드·export 구조에 맞췄다. 생성기 코드·검사·문서를 별도 로컬 커밋으로 묶고, 기존 다른 세션의 초안·preview·증거는 제외해 보존한다. 이번 커밋의 푸시·원격 CI는 별도다.

## Changed

- 기존 `src/<name>.tsx` 생성과 source export 문자열 append를 제거했다. `components/ui/<kebab-case>.tsx`를 만들고 기존 `./components/*` dist export를 사용한다.
- Glimmer 포맷터가 읽기 어렵게 처리하던 `component.hbs`를 유효한 `component.tsx` 템플릿으로 교체했다. `GeneratedComponent` 이름과 표시 텍스트를 치환하고 생성 경로의 Prettier 설정을 적용한다. 기존 샘플 JSX의 렌더링 의미는 유지한다.
- 이름 검증을 prompt와 action에 모두 적용해 CLI bypass에서도 잘못된 입력을 파일 action 전에 차단한다. 기존 파일은 add action의 기본 보호를 유지한다.
- Prettier를 UI 개발 의존성으로 명시했다. 기존 catalog 버전 3.8.3을 재사용하며 lockfile은 UI importer 3줄만 변경한다. 런타임 의존성·다른 버전은 바꾸지 않았다.
- 생성기·템플릿·Node 테스트를 scripts tsconfig에서 검사하고 React 소스 tsconfig에서 `turbo`를 제외했다. UI build의 기존 include·exclude·JSX runtime 설정은 변경하지 않았다.
- TypeScript 생성기 회귀 테스트 5개와 UI의 `test`/`test:generator`를 추가했다. 기존 CI의 `pnpm test`가 Turbo의 UI test task를 실행하는 연결이며 새 워크플로는 추가하지 않았다.
- [UI 사용법](../../../packages/ui/README.md)에 저장소 개발용 생성 명령·이름 규칙·소비 경로·검사 범위를 추가했다. 버전·공개 export·실제 앱 화면은 그대로이므로 새 ADR은 작성하지 않았다.

## Notes

Node 24.12.0, TypeScript 6.0.3, Prettier 3.8.3과 설치된 Turbo/@turbo/gen에서 검사했다. 저장소 루트 명령:

```sh
mise exec -- pnpm --filter @web-tech/ui test:generator
mise exec -- pnpm --filter @web-tech/ui typecheck
mise exec -- pnpm --filter @web-tech/ui lint
mise exec -- pnpm --filter @web-tech/ui build
mise exec -- pnpm test:repo
```

- 생성기 검사 5개 통과. 임시 워크스페이스에 이름 4개를 실제 @turbo/gen으로 생성해 포맷·빌드·dist export 로드·타입 소비·SSR을 검사했다. 긴 이름의 줄바꿈도 포함한다. 별도 실제 `turbo gen` 명령으로 자동 워크스페이스 탐색을 검증했다.
- 잘못된 이름 5개와 기존 파일 충돌에서 nonzero 종료, 파일·manifest 보존을 확인했다. 실제 작업 트리에 샘플 컴포넌트는 추가하지 않았으며 임시 폴더는 검사 후 제거한다. 설치된 의존성은 임시 fixture에 링크하여 사용한다.
- UI의 React/Node 타입 검사·lint·build 통과. 실제 소비 앱의 브라우저 E2E·새 배포는 실행하지 않았다. 생성 코드 SSR 검사를 전체 공용 UI의 접근성·시각 회귀 검증으로 해석하지 않는다.
- repo 테스트 37개 통과. Turbo dry run에서 `@web-tech/ui#test`가 `pnpm test:generator`를 실행함을 확인했다. 명시적 Prettier 검사·`git diff --check`와 이번 변경 11개만 담은 임시 Git 인덱스의 포맷·문서 검사를 통과했다. 임시 검증 당시 실제 스테이징은 비어 있었고 임시 인덱스는 제거했다. 독립 커밋 전에 생성기 5개·repo 37개 테스트를 재실행했다.
- 전체 포맷 경고는 26개에서 25개로 줄었다. 나머지 초안·증거는 포맷하지 않았다. 시작 시 미커밋 파일 130개의 hash를 비교했을 때 129개가 동일했고, 작업 기록 목차만 이번 링크를 추가해 의도적으로 변경했다.
- 최초 CLI fixture는 `--config`에 파일 경로를 전달했다. 설치된 @turbo/gen이 이를 destBasePath로도 해석해 ENOTDIR가 발생했다. 실제 사용자 명령과 같은 자동 워크스페이스 탐색으로 수정한 뒤 재검사했다.
- Node 전용 `node:module`/`node:path`를 추가하면서 React 소스 검사에 섞인 생성기의 타입 오류를 관측했다. Node 도구와 React 소스의 검사 경계를 분리하고 두 검사를 모두 통과시켰다. 검사 실패를 숨기거나 Node 타입을 전체 UI에 추가하지 않았다.
- 오프라인 `pnpm install`로 개발 의존성을 연결했다. 다운로드 0개이며 기존 lockfile의 공급망 검사·deprecated 경고를 숨기지 않았다.
- 이전 커밋 `b9f3246588c5cd7ae706f4dff47f6b3f2f3e83d9`의 [CI](https://github.com/IMHOJEONG/web-tech/actions/runs/38561331719)와 [Documentation](https://github.com/IMHOJEONG/web-tech/actions/runs/38561331910)은 성공했다. 이번 생성기 커밋의 원격 CI 성공을 의미하지 않는다.

## Open Questions

출력은 시작용 컴포넌트 예제이며 실제 기능·접근성·디자인 책임은 개발자가 작성한다. 생성기 파일은 배포 tarball의 API가 아니다. GitHub push에서 기본 브랜치의 High 취약점 1건이 안내됐으나 이번 생성기 작업에서 조사·조치하지 않았다.

## Next

푸시 요청 시 원격 UI test task와 타입 검사를 확인한다. 포맷터 교체·Oxfmt 비교는 이 수정과 분리된 실험으로 유지한다. 이전 [CSS·HTML 정리](2026-10-14-css-html-format-cleanup.md)의 템플릿 후속 과제를 수행한 기록이다.
