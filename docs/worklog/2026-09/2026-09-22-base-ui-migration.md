# 공용 UI의 Base UI 전환

## Summary

Radix 유지와 Base UI 전환을 비교한 뒤 공용 UI의 직접 primitive를 Base UI 1.8.0으로 전환했다. 필수 업그레이드나 성능 최적화가 아니라 shadcn의 새 기본 구현과 유지보수 방향을 맞추는 결정이다. 근거와 재검토 조건은 [ADR-0006](../../architecture/adr-0006-shared-ui-base-ui.md)에 기록했다.

## Changed

- 사용자 목표를 보완했다. 다른 모노레포에서도 재사용할 공용 UI의 동작 기반을 Base UI로 통일하는 것이 최종 목표다. 1차 구현 범위와 최종 완료 조건을 ADR에 구분하고 소비 앱의 잔여 의존성·외부 배포 정책을 TODO로 추가했다.

- Button, Badge, Collapsible, Separator, Sheet, Tooltip, Sidebar와 docs 소비 코드를 함께 전환했다. 기존 모듈 경로와 디자인 토큰을 유지하고 `asChild` 호출부는 `render`로 변경했다.
- 탐색 링크는 순수 `buttonVariants`로 꾸며 서버 렌더링과 링크 의미를 유지한다. 이동한 클래스의 Tailwind source 경로를 추가했다.
- Sheet 포커스 복귀와 Activity fixture를 `finalFocus`로 변경했다. 시작/종료 상태와 Tooltip 위치 지정은 Base UI API를 사용한다.
- Tooltip은 단일 trigger용 접근성 설명 연결을 보완하고 취소·비활성·제어 상태 회귀 검사를 추가했다.
- shadcn 설정은 `base-vega`로 변경했다. cn과 Lucide 아이콘은 유지한다. 1차 전환에서 남겼던 미사용 Radix Slot·Radix 아이콘·cmdk는 아래 후속 작업에서 제거했다.
- 재현 가능한 `test:ui:consumer` 명령으로 Next.js production Drawer·필터 검사를 저장했다. 외부 콘텐츠와 로그 전송은 이 테스트에서 비활성화한다.

## Notes

### 잔여 의존성 정리 후속 작업

사용자 요청에 따라 실제 의존 경로를 조사한 뒤 미사용 `@radix-ui/react-slot`, `@radix-ui/react-icons`, `cmdk`의 manifest·catalog 항목을 제거하고 pnpm으로 lockfile을 갱신했다. 공용 export, 정적·동적 import를 검색했으며 공개 글의 Radix 설명과 과거 검증 기록은 변경하지 않았다.

Prisma Studio가 가져오는 Radix Toggle·Slot은 별도 전이 경로로 남는다. 인증·DB 도구를 무리하게 제거하거나 override하지 않고 후속 과제로 분리했다. 전체 모노레포의 Radix 제거 완료를 의미하지 않는다.

프로덕션 재검사에서 Drawer의 다음 프레임 포커스 복귀와 동기 assertion 사이의 경합을 발견했다. 테스트는 Drawer에 인접한 Base UI focus guard만 중간 상태로 허용하고, 1초 이내 내부 복귀를 polling하여 확인하도록 수정했다. Tab과 Shift+Tab 양방향 각각 15회를 검사하며 단순 sleep 또는 실제 배경 요소 포커스 허용으로 우회하지 않는다. 실패와 재검사 결과는 [검증 보고서](../../verification/content/2026-09-22-base-ui-migration.md)에 남긴다.

이번 후속 검사에서 UI 54개, production 소비 화면 16개, Drawer 5회 반복 20개가 통과했다. frozen install·catalog 검사와 UI·docs·vuln-radar 타입 검사, vuln-radar 빌드, 수정 테스트 lint도 통과했다. 다른 저장소 전환은 실행하지 않았다.

1차 전환에서는 UI 54개, Activity 22개, production 소비 화면 16개가 통과했다. UI·docs·vuln-radar 타입 검사와 docs·vuln-radar 빌드, 변경 코드 lint도 통과했다. Activity 검사와 번들 측정은 후속 의존성 정리 단계에서 재실행하지 않았다. 명령·범위·번들 관측값은 [검증 보고서](../../verification/content/2026-09-22-base-ui-migration.md)에 보관한다.

테스트용 번들은 기존 Radix보다 커졌다. Activity 내부 Portal 잔존도 그대로 재현되므로 이번 변경을 해당 문제의 해결로 보지 않는다. 기존 미커밋 검증 기록은 유지했으며 이 작업에서 커밋·푸시·배포하지 않았다.

## Open Questions

production Tooltip, Safari·Firefox·스크린 리더 검증과 실제 경로 번들 비용은 후속 점검이 필요하다. Base UI에서 설명 관계를 자동 제공하게 되면 자체 Tooltip 보완을 축소할 수 있는지 검토한다.

## Next

Prisma Studio의 전이 의존성이 실제 앱 번들·런타임에 포함되는지 확인하고, 외부 소비 모노레포의 배포·버전 정책을 정한다. 변경 단위 리뷰 후 커밋하며, Activity 도입 전 생명주기 검증과 다른 브라우저 검사는 [공용 UI 백로그](../../todo/todo.md)를 따른다.
