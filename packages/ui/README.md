# @web-tech/ui

Base UI 기반 React 컴포넌트와 HEAP-FORGE 디자인 토큰. Node.js 24+, React/React DOM 19.2.6 이상 20 미만, Tailwind CSS 4.1.18+를 지원 범위로 둡니다. React 18과 Tailwind 3은 미지원입니다.

## 설치와 스타일

현재 `private: true`를 유지하며 registry 자동 게시를 하지 않습니다. 저장소 루트에서 `pnpm --filter @web-tech/ui pack --out /tmp/web-tech-ui-0.1.0.tgz`를 실행하고 다른 프로젝트에서 해당 tarball을 설치합니다. React와 React DOM은 소비 앱이 같은 버전으로 설치해야 합니다.

```sh
pnpm add /tmp/web-tech-ui-0.1.0.tgz react@19.2.6 react-dom@19.2.6
pnpm add -D tailwindcss@^4.1.18 @tailwindcss/postcss@^4.1.18
```

Tailwind v4 PostCSS 설정을 사용하는 소비 앱의 전역 CSS에서 한 번 import합니다.

```css
@import "@web-tech/ui/styles.css";

/* 필요하면 앱의 토큰을 이후에 덮어씁니다. .dark로 다크 테마를 선택합니다. */
:root {
  --primary: #f97316;
}
```

이 entry는 Tailwind base, 공통 토큰·유틸리티·애니메이션 및 패키지 dist의 `@source`를 포함합니다. 별도 `@web-tech/tailwind-config` 설치나 저장소 상대경로는 필요 없습니다. 스타일을 원하지 않는 기존 소비 앱은 import하지 않아도 됩니다. 전역 body 스타일 영향은 도입 전에 비교해야 합니다. 기존 docs 앱의 CSS는 이번에 변경하지 않습니다.

```tsx
import { Button } from "@web-tech/ui/components/button";
import { buttonVariants } from "@web-tech/ui/lib/button-variants";
import { useIsMobile } from "@web-tech/ui/hooks/use-mobile";
```

## 컴포넌트 생성

저장소 개발 전용 명령입니다. 루트에서 실행합니다.

```sh
pnpm --filter @web-tech/ui run generate:component --args "Notice Card"
pnpm --filter @web-tech/ui build
```

`components/ui/notice-card.tsx`에 `NoticeCard`를 생성합니다. 영어 문자로 시작하고 문자·숫자·공백·하이픈·밑줄을 사용하는 이름만 허용합니다. 경로 구분자·빈 이름·숫자로 시작하는 이름은 생성 전에 거부하며, 기존 파일을 덮어쓰지 않습니다. 이름은 PascalCase, 파일명은 kebab-case로 변환하고 출력 파일의 경로별 Prettier 설정을 적용합니다.

빌드 후 `@web-tech/ui/components/notice-card`로 소비합니다. 현재 wildcard export를 사용하므로 생성기가 `package.json`에 source export를 추가하지 않습니다. `.tsx` 템플릿은 포맷·타입 검사 대상으로 유지하고, 생성기의 Node API는 별도 scripts tsconfig에서 검사합니다. 생성기·테스트는 tarball의 공개 파일 목록에 포함하지 않습니다.

```sh
pnpm --filter @web-tech/ui test:generator
pnpm --filter @web-tech/ui typecheck
```

생성기 테스트는 임시 워크스페이스에서 실제 CLI, 생성 코드 포맷·빌드·타입·SSR, 입력 검증, 기존 파일 보존을 확인합니다. 실제 UI 소스에 테스트 컴포넌트를 추가하지 않습니다. 패키지 `test`에도 연결되어 기존 `turbo test`/CI 테스트 단계에서 실행됩니다.

## 버전과 검증

초기 계약 버전은 `0.1.0`입니다. `0.x`에서 공개 API·peer 범위·기본 토큰의 호환되지 않는 변경은 minor, 호환되는 수정은 patch로 올립니다. 내부 파일 경로는 공개 API가 아닙니다. registry와 소비처가 확정되기 전 공개 게시·자동 release는 하지 않습니다. 변경은 main에 병합한 뒤 feature 브랜치로 전파하고, 외부 소비 프로젝트는 별도로 버전을 선택해 갱신합니다.

`prepack`은 JS·타입·CSS를 빌드하고 `files`는 dist와 README만 포함합니다. React/React DOM은 peer이므로 소비 앱의 인스턴스를 공유합니다. CSS는 side effect로 보존하며 JS subpath exports는 기존 경로를 유지합니다.

저장소 루트에서:

```sh
pnpm --filter docs test:ui:package
pnpm --filter docs test:ui
```

첫 명령은 workspace 밖의 임시 폴더에 tarball을 설치하여 React 인스턴스·타입·브라우저 bundle·Tailwind CSS·SSR을 검사합니다. 두 번째는 기존 UI 검사와 tarball의 라이트/다크·키보드·Tooltip·Sheet 검사를 실행합니다. 실제 외부 앱의 Next.js/Vite 설정과 Safari·스크린 리더는 별도 검증입니다.
