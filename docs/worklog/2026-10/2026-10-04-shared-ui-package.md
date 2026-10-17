# 공용 UI 외부 설치 계약

## Summary

React peer 의존성, CSS·hook export와 0.1.0 계약 및 독립 tarball 소비 검사를 추가했다. [ADR-0013](../../architecture/adr-0013-shared-ui-external-package.md)을 기준으로 공개 게시 없이 검증한다.

## Changed

- JS 빌드를 유지하고 공통 토큰 CSS와 package-relative source를 산출물에 넣었다.
- 포장 범위·CSS side effect·declaration map·prepack을 정리했다.
- Node 빌드 스크립트는 전용 tsconfig로 검사해 브라우저 컴포넌트 타입 범위와 분리했다.
- 독립 소비 프로젝트의 React·타입·CSS·SSR과 브라우저 포커스·테마 검사를 추가했다. 기존 Shared UI CI가 새 테스트를 포함한다.

## Notes

기존 앱 CSS를 일괄 교체하지 않았다. private 설정과 Node 24 기준을 유지했다. registry 게시·외부 앱 수정·새 인증 정보는 없다. [검증 보고서](../../verification/content/2026-10-04-shared-ui-package.md)에 실행 결과를 기록한다.

## Open Questions

실제 소비 프로젝트와 registry·자동 배포는 미확정이다. 외부 앱 설정과 스크린 리더는 추가 검사 대상이다.

## Next

별도 승인 후 main 반영과 feature 전파를 진행한다. 외부 앱 한 곳에 tarball을 도입해 RSC·토큰 충돌을 확인한다.
