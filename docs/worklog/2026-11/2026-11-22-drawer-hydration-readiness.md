# 모바일 Drawer 키보드 검사 준비 조건 보완

## Summary

PR #107의 모바일 메뉴 재시도 통과를 조사했다. disabled 서버 버튼에 press를 보내면 키가 유실되는 경로를 실제 합성 Next 화면에서 확인했다. 최초 CI의 정확한 이벤트 순서는 미확정으로 남긴다.

## Changed

키보드 Drawer 도우미와 한영 메뉴·검색 hydration 지연 회귀를 추가하고 기존 셸 대비 검사를 연결했다. enabled·focus·expanded 조건을 추가하되 기존 메뉴 개수·포커스·대비·outline·Tab 검사는 보존했다. 앱 런타임·공용 UI·CI 설정은 바꾸지 않았다.

## Notes

검사 조건·명령·실패와 한계는 [검증 보고서](../../verification/resilience/2026-11-22-drawer-hydration-readiness.md)를 따른다. [KAN-51](https://web-tech-service.atlassian.net/browse/KAN-51)의 PR 통합 후속으로 추적한다. 기존 지연/준비 상태 원칙의 테스트 보완이므로 새 ADR은 만들지 않는다. 원문·원시 자료·키·다른 작업 트리·stash는 변경하지 않는다.

## Open Questions

최초 CI의 지연 호출자는 미확정이다. 통제된 결함 재현과 과거 CI의 근본 원인을 구분한다.

## Next

공개 검수 후 #107에만 작업별 커밋·푸시하고 원격 CI를 확인한다. 최종 메시지 사전검사 후 사용자 승인 순서대로 병합하며 나머지 PR의 목차·해시 충돌은 양쪽 내용을 보존해 처리한다.
