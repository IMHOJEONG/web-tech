# 모바일 drawer와 주제 필터 E2E 안정화

## Summary

CI에서 모바일 drawer가 열리지 않거나 주제 필터 이동 및 뒤로 가기 검사가 간헐적으로 실패했다. 병렬 반복 실행에서 hydration 전 drawer 클릭과 느린 개발 서버 탐색을 재현해 두 검사를 분리했다.

## Changed

- [모바일 drawer](../../../apps/docs/widgets/app-shell/ui/mobile-nav-drawer.tsx): 서버 렌더링 및 hydration 중에는 열기 버튼을 비활성화하고, 클라이언트 구독이 준비되면 활성화한다.
- [셸 탐색 E2E](../../../apps/docs/e2e/shell-active-navigation.spec.ts): drawer 열기 전에 활성 상태를 확인한다.
- [주제 필터 E2E](../../../apps/docs/e2e/hub-topic-filters.spec.ts): hydration 준비를 기다리고, URL 이동 대기 한도를 병렬 개발 서버에 맞춘다. 뒤로/앞으로 탐색 후 새로고침을 검증해 두 행동의 실패 지점을 분리한다.

## Notes

- 수정 전 CI `36245303265`에서 hydration 경고와 이력 탐색 불일치를 확인했다. 로컬 병렬 반복 실행은 모바일 8건 실패, 40건 통과였다. 실패 시 `nprogress-busy` 상태에서 URL 대기 5초가 끝나거나 버튼 클릭 뒤 dialog가 나타나지 않았다.
- 수정 후 모바일 병렬 반복 16개 통과. 두 이슈를 함께 포함한 전체 대상 E2E는 27개 통과, 6개 건너뜀. docs lint 및 typecheck 통과.
- `useSyncExternalStore`의 서버 snapshot은 `false`, 클라이언트 snapshot은 `true`로 두어 hydration 중 HTML 속성이 일치하도록 했다. 일반 `useEffect`의 즉시 `setState`는 lint 경고가 있어 사용하지 않았다.
- 원격 CI 및 운영 브라우저의 재현 여부는 아직 확인하지 않았다. 로컬 통과만으로 기존 CI의 모든 hydration 경고가 사라졌다고 단정하지 않는다.

## Open Questions

- 원격 CI에서 경고가 재발하면 모달의 inert 속성이 아직 hydration되지 않은 스트리밍 영역을 변경하는지 별도로 계측한다.

## Next

전체 대상 E2E와 원격 CI를 재실행하고, 실패 시 최초 선행 오류와 route 전환 시간을 함께 기록한다.
