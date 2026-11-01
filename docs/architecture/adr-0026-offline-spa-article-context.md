# ADR-0026: SPA 오프라인 저장은 요청한 탭의 현재 글을 확인

## 상태와 범위

- 상태: 적용 중
- 대상: docs 오프라인 메시지·발신 문서 검증
- 결정일: 2026-10-31
- 최종 검토: 2026-10-31
- 기존 ADR-0015의 명시적 저장·캐시·공개 경로 정책을 보완한다. 대체하지 않는다. 로컬 구현·회귀 범위이며 수정의 운영 배포는 별도다.

## 배경

운영 Chrome에서 Feed 카드로 Brotli 글에 이동하면 주소창은 상세인데 `WindowClient.url`은 최초 `/ko/feed`로 남았다. 기존 Worker는 이를 현재 상세 주소로 취급해 `source` 오류로 저장을 거절했다. 같은 탭에서 새로고침하면 성공했다. 본문·권한·저장소를 바꾸지 않고 진입 방식만 바꾼 대조다.

`Client.url`은 문서 생성 URL이며 SPA 내 이동으로 갱신되지 않을 수 있다. [MDN Client.url](https://developer.mozilla.org/en-US/docs/Web/API/Client/url)과 [Service Workers 명세](https://w3c.github.io/ServiceWorker/v1/#client-url)의 설명을 운영 관측과 대조했다. 직접 URL 검사만으로 실제 링크 이동을 검증할 수 없었다.

## 결정

- browser가 제공하는 `event.source.id`로 실제 발신 client를 조회하고 같은 origin인지 확인한다. save 요청에 담긴 임의 현재 URL을 그대로 믿지 않는다.
- 저장 요청은 직접 진입 여부와 무관하게 같은 client에 별도 MessageChannel로 현재 문서를 확인한다. 최초 URL과 저장 대상이 같아도 이미 Feed로 떠난 탭일 수 있으므로 같은 URL이라는 이유만으로 확인을 생략하지 않는다. 최초 발신 URL은 같은 origin의 공개 앱 진입점 또는 공개 상세여야 한다.
- 공개 글의 `OfflineSaveButton`이 살아 있는 동안만 응답 listener를 둔다. listener는 메시지 origin과 `/push-sw.js`의 정확한 script URL을 확인한다. 현재 `location.pathname`이 렌더된 글의 path prop과 같을 때만 그 pathname을 답한다. query·본문·제목·쿠키는 답하지 않는다.
- Worker는 응답 path를 기존 공개 상세 allowlist로 다시 검사하고 저장 대상과 정확히 일치해야 쓰기를 진행한다. Feed에 머무르는 탭, listener 없는 탭, 다른 글·외부 origin·API/preview 대상은 허용하지 않는다. 같은 초기 Feed URL의 list/delete/clear도 현재 글 확인 없이 허용하지 않는다. 정적 offline reader의 기존 목록·삭제 동작은 유지한다.
- 확인은 요청별 전용 port로 연결하고 1.5초 안에 끝낸다. port·timer를 정리하고 timeout이면 `context-timeout` / `source-check`로 거절한다. 일반 작업 결과의 8초 제한·저장 실패 시 자동 재시도 금지는 유지한다.
- 기존 Worker URL/scope·cache 이름·저장 개수·크기 제한과 푸시 구독은 유지한다. 배포 전 열린 구형 페이지에는 listener가 없을 수 있으므로 최초 한 번 새로고침이 필요할 수 있다. 저장본·Worker를 일괄 삭제하도록 안내하지 않는다.

이 절차는 현재 글과 저장 요청의 일관성을 확인한다. 같은 origin에서 이미 실행되는 악성 스크립트에 대한 인증 장치나 서버 게시 상태 재검증이 아니다. `published` UI에서만 저장을 제공한다는 ADR-0015의 기존 위협 모델을 유지한다.

## 대안과 영향

- client URL 비교를 제거하거나 Feed origin만 허용: 실제 현재 글 확인이 없어 제외했다.
- 요청 payload의 현재 URL만 추가: 호출자가 임의 값을 담을 수 있으므로 제외했다.
- 모든 저장 때 문서를 강제 reload: 링크 이동의 장점을 없애고 사용자 상태를 바꾸므로 기본 해결로 삼지 않았다.
- 발신 탭 확인: SPA 동작과 출처 검증을 유지하지만 새 메시지 왕복·listener 수명·업데이트 호환 검사가 필요하다. 확인 실패는 진단 코드로 보이게 한다.

## 관련 문서

- [ADR-0015: 명시적 공개 글 저장](adr-0015-explicit-offline-article-snapshots.md)
- [운영 대조·음성 회귀·한계](../verification/resilience/2026-10-31-offline-save-diagnostics.md)
- [사용·복구 절차](../runbooks/docs-offline-reading.md)
- [작업 기록](../worklog/2026-10/2026-10-31-offline-save-diagnostics.md)
- [KAN-57](https://web-tech-service.atlassian.net/browse/KAN-57)
