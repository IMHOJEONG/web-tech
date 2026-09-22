# ADR-0006: 공용 UI의 동작 기반을 Base UI로 전환한다

## 상태와 범위

- 상태: 적용 중
- 대상: `@web-tech/ui`의 직접 사용 primitive와 저장소 내 소비 코드
- 결정일: 2026-09-22
- 최종 검토: 2026-09-22
- 적용 위치: `feature/docs` 작업 트리. 운영 배포 완료를 의미하지 않는다.

## 배경

Radix 기반 공용 UI와 cn 전환은 이미 검증된 상태다. shadcn은 신규 프로젝트 기본값을 Base UI로 변경했지만 Radix 지원을 종료하지 않았으며 기존 앱의 전환도 필수로 요구하지 않는다. 이번 선택은 장애나 보안 취약점에 대한 긴급 수정이 아니라 사용자가 요청한 장기 유지보수 방향의 변경이다.

2026-09-22 목표 보완: 사용자는 이 패키지를 다른 모노레포에서도 재사용할 공용 UI로 관리하며, 최종적으로 Base UI로 통일하려 한다. 따라서 핵심 근거는 shadcn의 기본값 추종이 아니라 공용 동작 API·접근성 검증·유지보수 기준의 단일화다. 여러 앱에서 Radix와 Base UI용 wrapper를 장기간 따로 관리하는 것을 최종 상태로 삼지 않는다. 현재 저장소 밖의 소비 모노레포는 아직 조사하거나 변경하지 않았다.

## 결정

1. 공용 Button, Badge, Collapsible, Separator, Sheet, Tooltip과 Sidebar 조합을 Base UI 1.8.0에 맞춘다. 각 primitive의 하위 경로를 import한다.
2. 공개 모듈 경로와 컴포넌트 이름, 디자인 토큰, variant, 크기를 유지한다. 전체 shadcn 기본 스타일로 덮어쓰지 않는다.
3. `asChild` 대신 `render`를 사용하며 저장소 내 호출부도 함께 변경한다. Radix API 전체를 흉내 내는 호환 계층은 만들지 않는다. 포커스 복귀는 `finalFocus`, Tooltip 지연은 `delay`로 명시한다.
4. Button처럼 클라이언트 동작을 갖는 컴포넌트와 서버에서도 실행하는 순수 variant 함수를 분리한다. 공용 UI의 dist exports와 현재 빌드 방식은 유지한다.
5. `cn`은 유지한다. Radix 아이콘, cmdk 내부 의존성과 다른 앱의 독립적인 Slot 의존성은 이번 primitive 전환 범위가 아니다.
6. 비교 기준 커밋은 `242d81a`다. 타입·UI 동작·실제 소비 앱 빌드를 통과하기 전에는 푸시하지 않는다. Activity 문제가 자동으로 해결되거나 성능이 개선된다고 가정하지 않는다.
7. shadcn 생성 설정은 `base-vega`, RSC 지원으로 맞춘다. 이후 생성되는 코드의 기준만 바꾸며 기존 스타일을 일괄 재생성하지 않는다.

### 최종 목표와 단계별 범위

위 결정의 구현 범위는 1차 전환이다. 다른 앱의 Slot과 cmdk를 이번에 유지한 것은 영구 예외가 아니라 후속 정리 대상이라는 의미다.

1. 공용 계층: 재사용할 인터랙티브 primitive를 Base UI 기반으로 제공한다. 신규 공용 컴포넌트에 Radix 기반 구현을 다시 추가하지 않는다.
2. 저장소 소비 앱: 앱별 중복 wrapper와 의존성을 조사하고 공용 API로 통합한다. 미사용 의존성은 제거하고 실제 사용은 동작 검증 후 교체한다. 전이 의존성은 상위 패키지 교체·제거로 해결하며 lockfile에서 강제로 삭제하지 않는다.
3. 다른 모노레포: 소비처·React/빌드 환경·공개 API 사용을 먼저 조사한다. 패키지 배포 방식과 버전 정책을 정하고 소비처별로 전환한다. 현재 workspace 의존성만으로 외부 모노레포 배포까지 지원된 것으로 보지 않는다.
4. 완료 판정: 대상 소비처에서 Radix 동작 primitive 직접 사용과 전이 의존성을 제거하고 타입·빌드·키보드·포커스·테마·SSR 회귀 검사를 통과한다. 임시 혼용은 작업 목록에 추적하고 전체 통일 완료로 표시하지 않는다.

여기서 통일 대상은 UI 동작 기반이다. 기본 HTML, 순수 레이아웃, 차트, 아이콘까지 Base UI 컴포넌트로 억지로 대체하지 않는다. Radix 아이콘은 동작 primitive와 구분하지만, 미사용이면 의존성 정리 대상이다. 필요한 기능이 Base UI에 없으면 다른 라이브러리를 무심코 추가하지 않고 대안과 예외 종료 조건을 별도 검토한다.

공용 패키지는 앱별 라우팅·인증·콘텐츠 조회에 의존하지 않는다. 디자인 토큰과 테마 확장 지점을 유지하고, 앱에서는 공용 컴포넌트를 조합한다. 토큰 커스터마이징과 동작 라이브러리 혼용은 서로 다른 문제다.

### API와 접근성 경계

| 기존 사용                                              | 전환 후 사용                                                    |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| `asChild`                                              | `render={<Element />}` 또는 `useRender`                         |
| Sheet `onCloseAutoFocus`                               | `finalFocus`에 반환할 요소 또는 기본 동작 명시                  |
| Tooltip Provider `delayDuration` / `skipDelayDuration` | `delay` / `timeout`                                             |
| Radix `data-state`·transform-origin                    | Base UI의 `data-popup-open`·시작/종료 상태·`--transform-origin` |
| 서버에서 Button 모듈의 variant 함수 호출               | `@web-tech/ui/lib/button-variants`에서 순수 함수 import         |

화면 이동은 Button에 anchor를 끼워 넣는 대신 `Link`에 `buttonVariants`를 적용한다. Base UI의 non-native Button은 버튼 키보드 동작을 부여하므로 링크의 역할과 Enter 탐색을 유지하는 것이 우선이다. Web·Mobile 주제 필터도 서버 컴포넌트로 남긴다. 옮긴 variant 클래스는 Tailwind source 경로에 포함한다.

Base UI 1.8.0으로 구성한 우리 Tooltip fixture에서 Popup의 `role="tooltip"`과 trigger의 `aria-describedby` 연결이 없음을 관측했다. 단순히 보이는지만 검사하지 않고 공용 wrapper에서 ID와 열림 상태를 공유해 설명 관계를 명시했다. 기존 설명 ID를 보존하고 닫힘·비활성·열기 취소 시 연결을 제거한다. 이는 upstream 전체 접근성에 대한 일반적 평가가 아니라 이 버전과 조합에서 확인한 보완이다.

이 Tooltip wrapper는 Root당 단일 Trigger·Content를 대상으로 한다. detached handle과 여러 trigger를 연결하는 고급 API는 노출하지 않으며, 필요해지면 ID·포커스 모델을 별도로 설계한다. 공식 구현과 다른 부분이므로 upstream 업데이트 때 역할·설명 자동 연결 여부를 다시 검토한다.

## 대안과 영향

| 기준           | Radix 유지                                                             | Base UI 전환                                                                   |
| -------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 현재 안정성    | 이미 검증한 이벤트·포커스·Portal 동작을 유지하며 변경 비용이 가장 낮다 | API와 생명주기 차이 때문에 재검증이 필요하다                                   |
| 공식 코드 추적 | shadcn의 Radix 구현을 선택해 계속 추적할 수 있다                       | shadcn 신규 기본 구현과 같은 기반을 사용해 향후 비교 방향을 맞춘다             |
| 컴포넌트 조합  | 현재 Slot·asChild 사용 코드와 맞는다                                   | render·useRender·mergeProps에 맞춰 호출부와 ref·이벤트 조합을 변경한다         |
| 스타일 유지    | 변경 없이 가능하다                                                     | 토큰은 유지할 수 있지만 상태 속성·CSS 변수·애니메이션 선택자를 바꿔야 한다     |
| 접근성         | 검증된 현재 동작이 장점이다                                            | 키보드·포커스 기능을 제공하지만 우리 조합의 접근성이 더 좋아진다는 보장은 없다 |
| 번들·성능      | 기존 fixture 측정값이 있다                                             | 이번 fixture는 더 커졌다. 실제 Next.js 경로 성능은 별도 측정이 필요하다        |

다른 대안은 일부 컴포넌트만 장기간 혼용하거나 전체 디자인까지 교체하는 것이다. 혼용은 과도기에는 가능하지만 두 API를 계속 관리해야 한다. 디자인 교체는 이번 요구와 무관하고 시각적 회귀 범위만 넓히므로 제외한다.

이번에는 직접 사용하는 primitive 수가 제한적이고 UI 회귀 테스트가 있으므로 공용 계층을 한 번에 정리하되 테스트는 순차 실행한다. 실제 사용 동작에 회귀가 남으면 완료로 처리하지 않는다. 롤백 시 primitive와 소비 코드·lockfile을 함께 복원하고 새로운 결정이 필요하면 별도 ADR로 대체한다.

재검토 조건은 키보드·스크린 리더 회귀, 실제 사용 경로의 감당하기 어려운 번들/응답 비용, upstream 추적보다 커지는 자체 보완 비용이다. 이때 Radix 유지안도 여전히 유효하다. 기존 파일을 강제 초기화하는 대신 전환 변경만 검토하여 되돌린다.

## 관련 문서

- [shadcn의 Base UI 기본값 정책](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)
- [Base UI Dialog: 포커스와 Popup API](https://base-ui.com/react/components/dialog)
- [Base UI Tooltip: Provider와 Positioner](https://base-ui.com/react/components/tooltip)
- [Base UI useRender: 컴포넌트 합성](https://base-ui.com/react/utils/use-render)
- [기존 cn·Radix 전환 기록](../worklog/2026-09/2026-09-22-ui-dependency-migration.md)
- [공용 UI 빌드 경계](ui-package-build-export.md)
- [전환 작업 기록](../worklog/2026-09/2026-09-22-base-ui-migration.md)
- [회귀 검사와 번들 관측](../verification/content/2026-09-22-base-ui-migration.md)
