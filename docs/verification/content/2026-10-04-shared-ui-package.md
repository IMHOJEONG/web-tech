# 공용 UI 외부 패키지 검증

## 대상과 조건

- 날짜: 2026-10-04, Asia/Seoul
- 기준: feature/docs `52b3017` 위 작업 트리. 기존 미커밋 변경 포함이며 배포 SHA가 아니다.
- Node 24.12.0, pnpm 11.10.0, TypeScript 6.0.3, React/React DOM 19.2.6, Tailwind 4.2.4.
- 공용 UI는 workspace 밖 독립 임시 프로젝트에 tarball을 설치한다. 운영 API·토큰·NAS는 사용하지 않는다.

## 재현 방법

루트에서 Node 24·설치된 의존성·Playwright Chromium이 필요하다. tarball 검사는 registry 접근을 요구하며 설치 스크립트를 비활성화한다.

```sh
mise exec -- pnpm --filter docs test:ui:package
mise exec -- pnpm --filter docs test:ui
mise exec -- pnpm --filter docs test:ui:consumer
mise exec -- pnpm --filter docs lint
mise exec -- pnpm --filter @web-tech/ui lint
mise exec -- pnpm --filter @web-tech/ui typecheck
mise exec -- pnpm validate:catalog
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false BLOG_CONTENT_API_BASE_URL= BLOG_CONTENT_API_BASE_URL_INTERNAL= BLOG_CONTENT_API_BASE_URL_PUBLIC= DOCS_BETTER_STACK_SOURCE_TOKEN= DOCS_BETTER_STACK_INGESTING_URL= mise exec -- pnpm --filter docs build
```

## 결과와 증거

- 통과: 독립 tarball의 React 단일 인스턴스·타입·브라우저 bundle·CSS·SSR. workspace UI 원본을 bundle에 포함하지 않는다. 패키지 버전 일치 검사 추가 후에도 재실행을 통과했다.
- 통과: 공용 UI 브라우저 64개. 신규 tarball 검사는 light/dark에서 기본 크기·토큰·Enter·Tooltip 설명·Sheet 닫기와 포커스 복귀·pageerror 부재를 확인한다.
- 통과: 기존 production UI 소비 회귀 16개. 한/영·라이트/다크 허브와 모바일 Drawer·reduced-motion·포커스 복귀를 확인했다.
- 통과: docs·공용 UI lint. 검사 도구의 lint 표현식 경고는 명시적 if로 수정한 뒤 통과했다.
- 통과: UI 자체 타입 검사. 처음에는 Node 스크립트 타입 누락으로 실패했으나 브라우저 설정에 Node 전역을 추가하지 않고 스크립트 전용 tsconfig로 분리한 뒤 통과했다.
- 통과: docs production 빌드. Next.js 16.3.4, frontmatter·본문 16개 검사, 타입·33개 static page 생성 완료. 운영 API를 비활성화한 범위다.
- 통과: catalog 11개 manifest·문서 변경 검사와 diff 공백 검사. 문서 검사는 기존 문제의 증가 여부를 확인하며 전체 과거 문제 해결을 의미하지 않는다.

## 한계와 후속 작업

실제 registry 게시·외부 앱 이전은 미실행이다. CSS는 소비 앱의 Tailwind v4와 전역 스타일 수용이 필요하다. 독립 fixture는 타입·bundle·SSR·Chromium 범위다. 외부 Next.js RSC, Safari/Firefox·스크린 리더는 보장하지 않는다.

## 관련 문서

- [패키지 결정](../../architecture/adr-0013-shared-ui-external-package.md)
- [UI 작업 기록](../../worklog/2026-10/2026-10-04-shared-ui-package.md)
