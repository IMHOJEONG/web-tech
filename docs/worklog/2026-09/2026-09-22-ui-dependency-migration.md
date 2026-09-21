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

## Open Questions

Radix 통합은 내부 primitive 버전 변경을 동반하므로 cn 전환과 별개로 검증해야 한다. 최신 cn 패치는 배포 대기 정책을 충족한 뒤 다시 검토한다.

## Next

Radix 통합 후 UI·Activity·소비 앱 검사와 중복 Context·tree-shaking 영향을 확인한다. Activity 생명주기와 전체 브라우저 검증은 [백로그](../../todo/todo.md)에 따른다.
