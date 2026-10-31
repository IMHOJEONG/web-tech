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
- 원시 브라우저 자료는 공개 저장소 밖에 보관한다. 공개 검수 manifest는 사용자 승인 후 일치하는 파일 해시만 반영하며 다른 초안·NAS 변경은 커밋하지 않는다.

## Open Questions

운영 Chrome의 Feed→글 경로 오류는 확인했다. 수정 배포 후 사용자 기존 탭에서도 정상 동작하는지 재검증해야 한다. 사용자 프로필을 자동으로 읽거나 저장본/Worker를 강제로 삭제하지 않는다.

## Next

최초 공개 승인 후 `af6cc95`·`e940e143`를 푸시하고 [PR #81](https://github.com/IMHOJEONG/web-tech/pull/81)을 생성했다. main 병합·운영 배포는 하지 않았다. 신규 오류 코드·단계가 확인되면 실제 원인과 후속 수정을 같은 이슈에 기록한다.

## PR 리뷰와 목차 후속 수정

- CodeRabbit Minor 5건을 실제 코드와 대조했다. 단계 없는 구형 Worker 응답의 `message` 추정은 `unknown`으로, 등록 단계의 `SecurityError` 분류는 `registration`으로 고쳤다. 유효한 단계·실제 저장소 오류 구분은 유지한다.
- 기존 CI의 오프라인 61/62 실패는 모바일 Feed 링크를 Next 개발 오버레이가 막은 클릭 단계였다. 로컬 `next dev`로 같은 실패를 재현한 뒤 실제 Drawer/배너 링크를 사용하도록 고쳤다. URL 변경만 기다리지 않고 실제 listener 제거를 관측해 cleanup 이후의 위조 요청 거부를 검사한다. 두 원인을 동일시하지 않는다.
- [d2949a8](https://github.com/IMHOJEONG/web-tech/commit/d2949a853f0c358319fccf984c295edc36bf5e8c)은 위 오프라인 진단·CI·회귀 수정이다. [3a65604](https://github.com/IMHOJEONG/web-tech/commit/3a6560411853f6447280041d280203fab73cecc1)는 추가 목차 신고의 앵커 불일치 수정이며 제목 컴포넌트가 parser의 ID를 덮어쓰지 않게 한다. 글 본문과 원격 HTML 경로는 수정하지 않았다.
- runbook은 `source-check`의 `source`를 주소 불일치만으로 단정하지 않게 보완했다. 검증 보고서는 최초/후속 코드 커밋·승인 manifest·실행 조건을 연결한다.
- 후속 검증은 라이브러리 347개, 개발/production 오프라인 각각 62개, 개발/production 목차 각각 3개와 type/lint/build 통과다. helper 타입 선언 때문에 최초 타입/빌드 검사는 실패했으며 수정 후 재검사했다. 상세 명령·실패 이력·한계는 [검증 보고서](../../verification/resilience/2026-10-31-offline-save-diagnostics.md)의 후속 검증에 둔다.
- 후속 문서의 공개 검수, PR에 대한 푸시·해결된 스레드 정리·원격 CI 재확인은 다음 단계다. 로컬 통과만으로 운영 검증 완료나 이슈 완료로 표시하지 않는다. 기존 초안·stash·NAS는 보존했다.
