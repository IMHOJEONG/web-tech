# 공용 UI의 shadcn 업데이트 범위 점검

## Summary

포커스 글과 Activity 실험을 각각 커밋한 뒤, 현재 `@web-tech/ui`와 공식 shadcn의 Radix/new-york-v4 소스를 비교했다. 전면 덮어쓰기보다 Sheet의 작은 API 개선부터 선별 반영하는 방향을 제안한다. 이번 점검에서는 공용 UI 구현이나 의존성을 변경하지 않았다.

## Changed

확인 기준은 2026-09-21에 열어 본 공식 문서 및 main 브랜치 소스다. 아래 URL의 main 내용은 이후 바뀔 수 있다.

| 대상          | 확인한 차이                                                                                  | 후속 우선순위                                                            |
| ------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Sheet         | 공식은 showCloseButton 옵션을 제공하지만 현재 구현은 닫기 버튼을 항상 렌더링                 | 높음: 기본값 true로 호환성을 유지하며 옵션 반영 검토                     |
| 소비 컴포넌트 | docs 모바일 메뉴와 공용 Sidebar가 `[&>button]:hidden`으로 직접 자식 버튼을 숨김              | 높음: 명시적 옵션으로 대체하고 다른 버튼이 숨겨지지 않는지 검사          |
| Button        | 공식에 xs와 icon-xs가 있으며 현재 구현에는 없음                                              | 필요할 때 추가. 작은 시각 크기와 터치 영역은 별도로 검토                 |
| Input         | cn import와 클래스 나열 순서 외에 확인 범위의 주요 스타일은 거의 같음                        | 낮음: 최신이라는 이유만으로 재작성하지 않음                              |
| import 기반   | 공식 new-york-v4는 cn 패키지와 radix-ui 통합 import, 현재는 로컬 cn과 개별 Radix 패키지 사용 | 컴포넌트 기능 변경과 별도의 의존성 마이그레이션으로 검토                 |
| CLI 설정      | 현재 components.json의 로컬 alias는 tsconfig에 있으며 CSS 대상 파일도 존재함                 | 잘못된 설정으로 단정하지 않음. CLI 적용 전 공개 exports와 생성 경로 확인 |

공식 출처:

- [Radix Sheet 문서](https://ui.shadcn.com/docs/components/radix/sheet)
- [Sheet 소스](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/sheet.tsx)
- [Button 소스](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/button.tsx)
- [Input 소스](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/input.tsx)
- [shadcn 변경 이력](https://ui.shadcn.com/docs/changelog)
- [모노레포 가이드](https://ui.shadcn.com/docs/monorepo)

## Notes

shadcn 소스 갱신, Radix 런타임 갱신, 프로젝트 디자인 토큰 변경은 서로 다른 작업이다. npm 의존성 업데이트만으로 저장소에 복사된 컴포넌트 구현이 바뀌지는 않는다. Base UI나 React Aria 구현으로의 전환도 단순 버전 업데이트가 아니라 별도 마이그레이션이다.

공식 Sheet 소스도 Content 내부에서 Portal을 구성한다. 이번 확인 범위에서는 Activity 전용 처리가 없어, 소스를 갱신하면 [Activity 실험](../../verification/content/2026-09-21-activity-focus.md)의 포털 문제가 해결된다고 결론 내릴 수 없다. Radix 의존성을 변경한다면 같은 실험을 다시 실행해야 한다.

기존 글·실험의 포맷 검사, 문서 검사, commitlint가 통과했다. 글의 실행 예제와 콘텐츠 테스트도 재검사했다. 공식 소스를 설치하거나 기존 파일에 overwrite하지 않았으며 이번 조사는 전체 컴포넌트의 시각 회귀 검증이 아니다.

## Open Questions

cn 및 radix-ui 통합 패키지 전환의 이점과 lockfile·소비 앱 영향은 추가 검증이 필요하다. 최신 upstream 스타일을 그대로 적용할지, 현재 디자인 토큰과 밀도를 유지할지도 기능 갱신과 분리해야 한다.

## Next

1. Sheet에 showCloseButton을 호환 가능한 형태로 반영하고 모바일 메뉴·Sidebar의 우회 CSS를 제거한다.
2. 기본 닫기, 사용자 정의 닫기, Escape, 포커스 복귀, disabled·다크모드·모바일을 확인한다. 실제 애니메이션 조건과 Activity 특성 검사는 구분한다.
3. Button의 크기 옵션은 실제 사용처가 필요한 경우 추가한다. cn·Radix import 전환은 별도 변경으로 검증한다.

아직 적용하지 않은 후속 제안이며 새로운 ADR 결정은 아니다.
