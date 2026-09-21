# 공용 UI의 cn·Radix 의존성 전환

## Summary

공식 shadcn API 반영을 `550afd9` 기준 커밋으로 보관한 뒤, 디자인과 공개 import 경로를 유지하며 의존성을 단계적으로 전환한다. 먼저 cn만 교체해 검사하고 별도 커밋한 뒤 Radix 통합 패키지를 검증한다.

## Changed

### cn 단계

- `@web-tech/ui/lib/utils`는 그대로 두고 공식 `cn` 패키지를 재노출한다. 소비 컴포넌트의 import 변경은 필요 없다.
- UI 패키지의 직접 clsx·tailwind-merge 의존성만 제거한다. docs·vuln-radar 및 다른 라이브러리의 사용은 유지한다.
- `catalog:ui`에 cn 0.3.0을 정확한 버전으로 고정한다. 초기 최신 후보 0.3.2는 설치 도구가 minimumReleaseAgeExclude 예외를 자동 추가했으므로 제외하고, 해당 예외도 삭제했다. 0.3.0 설치에는 예외가 필요 없었다.
- 전환 전 clsx·tailwind-merge 결과를 기준으로 15개 클래스 병합 호환성 시나리오를 추가했다. 모든 임의 클래스 조합의 호환성을 증명하는 검사는 아니다.

공식 기준은 [cn 수동 마이그레이션](https://github.com/shadcn-ui/cn#existing-shadcnui-project)과 [Radix 통합 패키지 안내](https://ui.shadcn.com/docs/changelog/2026-02-radix-ui)다. 이번 전환에는 Base UI나 디자인 토큰 교체를 포함하지 않는다.

### Radix 단계

- cn 전환을 `34a3e7b`로 분리한 뒤, 공용 UI의 개별 primitive 의존성 5개를 `radix-ui@1.6.7`로 통합했다. 아이콘 패키지와 다른 앱의 직접 의존성은 유지한다.
- 기존 공개 exports와 dist 기반 빌드를 유지한다. 현재 CommonJS 출력에서 루트 `radix-ui` import는 쓰지 않는 primitive까지 번들에 포함했다. 공식 패키지가 제공하는 `radix-ui/dialog`, `radix-ui/slot`, `radix-ui/tooltip` 등 하위 경로를 사용해 해결했다.
- Slot은 namespace의 `Slot.Root`를 사용한다. Dialog 1.1.23, Slot 1.3.3, Tooltip 1.2.16, Collapsible 1.1.20, Separator 1.1.15로 갱신됐다.
- 테스트 번들에 CommonJS 통합 진입점과 사용하지 않는 Select·DropdownMenu·NavigationMenu가 포함되지 않는지 회귀 검사를 추가했다.
- 테스트 fixture에서 react-context는 1.2.2 한 경로로 관찰됐다. cmdk 등 다른 소비 경로에는 이전 primitive가 남으므로 저장소 전체의 중복 제거를 보장하거나 강제 override하지 않는다.

## Notes

Node 24 환경에서 저장소 루트 기준으로 실행했다.

```sh
mise exec -- pnpm install --no-frozen-lockfile
mise exec -- pnpm --filter docs test:ui
mise exec -- pnpm --filter docs test:activity-lab
mise exec -- pnpm --filter @web-tech/ui typecheck
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter vuln-radar typecheck
```

cn 단계 결과:

- UI 검사 44개 통과: 클래스 병합 15개가 light/dark 프로젝트에서 각각 실행되고, 실제 Tailwind UI 검사 14개가 실행된다.
- Activity·Sheet 22개 통과. 문제 동작을 기대값으로 기록한 특성 검사도 포함하므로 Portal 문제 해결을 의미하지 않는다.
- 공용 UI 빌드와 전용 테스트 타입 검사, UI·docs·vuln-radar 타입 검사 통과.
- lockfile에 다른 앱의 의존성 갱신은 없으며, minimumReleaseAgeExclude 예외를 남기지 않았다.

cn의 속도나 서비스 번들 크기 개선은 측정하지 않았으며 보장하지 않는다. 기존 디자인 토큰은 그대로 유지했다. 기존 helper에도 있던 사용자 정의 클래스 분류 한계까지 이번 작업에서 수정한 것은 아니다.

Radix 단계에서도 위 타입 검사 3개를 통과했다. UI 검사는 번들 검사 2개가 더해져 46개, Activity 검사는 22개가 통과했다. 추가 검증 명령은 다음과 같다.

```sh
mise exec -- pnpm --filter docs exec playwright test e2e/mobile-drawer-close.spec.ts --project=chromium-mobile --workers=1
mise exec -- pnpm --filter vuln-radar build
mise exec -- pnpm --filter @web-tech/ui build
mise exec -- pnpm --filter docs exec node scripts/measure-shared-ui-bundle.ts
mise exec -- pnpm --filter @web-tech/ui exec eslint components/ui/{badge,button,collapsible,separator,sheet,sidebar,tooltip}.tsx lib/utils.ts --max-warnings 0
mise exec -- pnpm --filter docs exec eslint scripts/measure-shared-ui-bundle.ts ui-e2e/primitives.spec.ts --max-warnings 0
```

- 실제 docs 모바일 Drawer 4개 통과: light/dark 및 reduced-motion 조합에서 닫기 버튼과 포커스 복귀 확인.
- 변경 파일 ESLint와 vuln-radar 프로덕션 빌드 통과. Vite의 향후 native config loader 관련 기존 확장자 경고는 남아 있다.
- UI 빌드가 dist를 재생성하므로 UI·Activity 검사와 소비 앱 빌드는 순차 실행한다. 동시에 실행했을 때 발생한 dist 누락은 순차 재실행으로 해소했다.
- docs는 타입 검사와 개발 서버 기반 모바일 검사까지 확인했다. 이번 Radix 단계에서 Next.js 프로덕션 빌드, Safari·Firefox·스크린 리더 검사는 실행하지 않았다.

동일한 `ui-e2e/fixtures/primitives.tsx`를 esbuild의 production minify 설정으로 측정했다. 전체 fixture에는 기존 아이콘·모션 등의 의존성도 포함된다. 아래 값은 실제 Next.js 페이지 번들 크기가 아니다.

| 구성                                | Minified bytes | Gzip bytes |
| ----------------------------------- | -------------: | ---------: |
| cn 교체 후 개별 Radix 패키지        |      3,171,788 |    774,674 |
| 통합 패키지 루트 import             |      3,387,901 |    833,437 |
| 통합 패키지 하위 경로 import (최종) |      3,178,391 |    776,364 |

루트 import는 기준보다 gzip 58,763 bytes 증가했다. 하위 경로 사용 후 증가분은 1,690 bytes, 약 0.22%로 줄었다. 이 결과에 따라 ESM 빌드·export 전환까지 작업 범위를 넓히지 않았다. 측정 스크립트는 현재 checkout의 값만 재현하므로 이전 값과 비교할 때는 해당 의존성과 빌드 산출물을 함께 맞춰야 한다.

## Open Questions

Activity 안의 열린 Sheet를 숨기면 Portal이 남는 동작은 새 Radix에서도 재현된다. 테스트 통과를 문제 해결로 해석하지 않는다. 최신 cn 패치는 배포 대기 정책을 충족한 뒤 다시 검토한다.

## Next

Next.js 프로덕션 빌드 확인과 Activity 생명주기·전체 브라우저 검증을 이어간다. 후속 범위는 [백로그](../../todo/todo.md)에 따른다.
