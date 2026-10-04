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

## 버전과 검증

초기 계약 버전은 `0.1.0`입니다. `0.x`에서 공개 API·peer 범위·기본 토큰의 호환되지 않는 변경은 minor, 호환되는 수정은 patch로 올립니다. 내부 파일 경로는 공개 API가 아닙니다. registry와 소비처가 확정되기 전 공개 게시·자동 release는 하지 않습니다. 변경은 main에 병합한 뒤 feature 브랜치로 전파하고, 외부 소비 프로젝트는 별도로 버전을 선택해 갱신합니다.

`prepack`은 JS·타입·CSS를 빌드하고 `files`는 dist와 README만 포함합니다. React/React DOM은 peer이므로 소비 앱의 인스턴스를 공유합니다. CSS는 side effect로 보존하며 JS subpath exports는 기존 경로를 유지합니다.

저장소 루트에서:

```sh
pnpm --filter docs test:ui:package
pnpm --filter docs test:ui
```

첫 명령은 workspace 밖의 임시 폴더에 tarball을 설치하여 React 인스턴스·타입·브라우저 bundle·Tailwind CSS·SSR을 검사합니다. 두 번째는 기존 UI 검사와 tarball의 라이트/다크·키보드·Tooltip·Sheet 검사를 실행합니다. 실제 외부 앱의 Next.js/Vite 설정과 Safari·스크린 리더는 별도 검증입니다.
