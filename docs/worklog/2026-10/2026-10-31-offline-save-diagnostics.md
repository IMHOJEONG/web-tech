# 오프라인 저장 실패 대조와 오류 진단 보완

## Summary

운영 공개 글 저장 실패 신고를 [KAN-57](https://web-tech-service.atlassian.net/browse/KAN-57)로 분리했다. 최신 main 기반의 별도 worktree에서 작업하며 기존 초안·stash·NAS 작업을 유지한다. 직접 진입은 성공했지만 Feed에서 카드로 진입한 운영 Chrome에서는 `source` 거절을 재현했다. Worker가 최초 Feed URL을 현재 글 주소로 오인한 결함과 진단 누락을 로컬에서 보완했다.

## Changed

- 공용 Worker 등록은 사용 가능한 active Worker를 waiting 업데이트보다 먼저 선택한다. 초기 활성화의 실패와 8초 제한은 유지한다.
- SPA 진입은 browser 발신 client에 현재 글을 확인한다. 탭의 실제 pathname과 렌더된 공개 글의 metadata가 일치해야 저장하며 URL 비교를 삭제하거나 요청 payload만 믿지 않는다.
- offline 모델은 등록·활성화·메시지·검증·저장소 단계 및 안전한 오류 코드를 구분한다. 채널 전송 실패 때 timer/port를 정리하고 응답 형식을 확인한다.
- Worker는 저장소 용량/접근 거부와 open/read/write/confirmation 단계를 반환한다. 쓰기가 끝난 뒤 확인이 실패하면 저장 자체의 실패로 단정하지 않는다.
- 한·영 사용자 안내와 접이식 오류 상세 UI를 분리했다. 원시 예외나 본문을 화면/로그/새 API로 전송하지 않는다.
- Worker·클라이언트 단위 및 production 오프라인 회귀를 추가했다. 실제 결과와 실패 이력은 [검증 보고서](../../verification/resilience/2026-10-31-offline-save-diagnostics.md)에 연결한다.

## Notes

- URL·scope·알림 권한·데이터 캐시 이름과 기존 공개 경로 allowlist는 유지했다. SPA 현재 문서를 확인하는 새 왕복과 신뢰 경계는 [ADR-0026](../../architecture/adr-0026-offline-spa-article-context.md)으로 분리했다.
- 원시 브라우저 자료는 공개 저장소 밖에 보관한다. 공개 검수 manifest를 임의 갱신하거나 다른 초안·NAS 변경을 커밋하지 않았다.

## Open Questions

운영 Chrome의 Feed→글 경로 오류는 확인했다. 수정 배포 후 사용자 기존 탭에서도 정상 동작하는지 재검증해야 한다. 사용자 프로필을 자동으로 읽거나 저장본/Worker를 강제로 삭제하지 않는다.

## Next

사용자 공개 검수 후 커밋·PR·배포를 별도로 진행하고 같은 프로필에서 재시도한다. 신규 오류 코드·단계가 확인되면 실제 원인과 후속 수정을 같은 이슈에 기록한다.
