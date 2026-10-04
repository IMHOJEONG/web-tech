# ADR-0013: 공용 UI의 외부 소비 계약을 tarball로 검증한다

## 상태와 범위

- 상태: 적용 중
- 대상: @web-tech/ui의 의존성·CSS export·버전·배포 전 검사
- 결정일: 2026-10-04
- 최종 검토: 2026-10-04
- 적용 위치: feature/docs 작업 트리. registry 게시와 실제 외부 앱 이전은 미실행이다.

## 배경

Base UI 전환은 외부 재사용을 보장하지 않는다. React 일반 dependency, CSS export 부재, workspace 상대 source 경로가 외부 설치의 React 중복·스타일 누락 위험으로 남아 있다.

## 결정

1. React·React DOM을 `>=19.2.6 <20` peer로 두고 로컬에서는 dev dependency로 설치한다. Tailwind는 v4 peer, PostCSS 도구는 dev dependency다. Node 24·React 19·Tailwind 4가 현재 지원 범위다.
2. JS·타입 subpath를 유지하고 hook과 `@web-tech/ui/styles.css` export를 추가한다. 기존 앱 CSS는 변경하지 않는다.
3. CSS는 shared-styles에서 빌드 시 복사한 토큰, Tailwind, 애니메이션, dist 상대 `@source`를 포함한다. 소비 앱은 Tailwind v4 PostCSS 설정이 필요하나 private tailwind-config나 레포 상대 경로는 필요 없다. 전역 body/base 스타일 영향은 도입 시 비교한다.
4. 기본 버전은 `0.1.0`이며 0.x 공개 계약의 비호환 변경은 minor, 호환 수정은 patch다. `private: true`를 유지하고 registry 선택·인증·자동 release 없이 tarball 설치부터 지원한다. main 병합 후 feature 브랜치 전파는 별도 승인된 작업이다.
5. prepack에서 JS·타입·CSS를 빌드하고 dist와 README만 포장한다. CSS side effect를 명시하고 원본이 없는 declaration map은 제거한다. 기존 CommonJS 방식은 유지하며 root barrel을 새로 만들지 않는다.
6. workspace 밖 독립 폴더에 tarball을 설치한다. React 단일 인스턴스·타입·브라우저 bundle·CSS·SSR과 라이트/다크·키보드·Tooltip·Sheet 포커스를 검사한다. 새 browser suite는 기존 `test:ui` CI에 자동 포함된다. 검사에는 네트워크가 필요하고 임시 폴더를 정리한다.

## 대안과 영향

소스 export는 외부 앱이 TS/alias 경로를 알아야 한다. 사전 생성된 전체 CSS는 Tailwind 설치를 줄이지만 preflight 중복과 앱 유틸리티·테마 변경 비용이 있다. 현재는 기존 JS 빌드와 소비 앱의 Tailwind 생성을 유지한다. 자동 registry 게시보다 실제 소비 계약 검증을 먼저 한다.

fixture 성공은 모든 외부 Next.js/Vite 앱과 스크린 리더 검증을 의미하지 않는다. 실제 소비처의 RSC 경계·PostCSS·토큰 충돌을 추가 확인한 뒤 registry와 배포 정책을 확장한다.

## 관련 문서

- [Base UI 전환](adr-0006-shared-ui-base-ui.md)
- [기존 빌드 전략](ui-package-build-export.md)
- [설치·버전·검사 명령](../../packages/ui/README.md)
- [검증 결과](../verification/content/2026-10-04-shared-ui-package.md)
- [작업 기록](../worklog/2026-10/2026-10-04-shared-ui-package.md)
- [Tailwind 외부 source 등록](https://tailwindcss.com/docs/detecting-classes-in-source-files)
