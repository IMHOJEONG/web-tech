# ADR-0009: 웹 푸시는 문서 제공과 분리한 선택형 실험으로 시작한다

## 상태와 범위

- 상태: 적용 중
- 대상: docs / docs-backend의 웹 푸시 MVP
- 결정일: 2026-10-03
- 최종 검토: 2026-10-03
- 운영 활성화와 실제 기기 수신은 미검증이다.

## 배경

RSS 외의 새 글 전달 방식과 서비스 워커·브라우저 권한·비동기 발송을 직접 경험하고 싶다. 기존 About의 문의 폼과 뉴스레터는 운영하지 않으므로 동작하지 않는 새 글 알림을 약속하지 않는다. Vercel 메모리에 구독을 저장하면 재시작과 인스턴스 교체로 정보가 사라진다.

## 결정

기본 비활성화된 푸시 실험을 About에 선택적으로 노출한다. 이는 문의나 이메일 접수가 아니며 [ADR-0004](adr-0004-about-content-and-shared-shell.md)의 공용 셸 책임을 바꾸지 않는다.

- docs는 한·영 구독/해지 UI, 푸시 전용 서비스 워커, same-origin BFF를 담당한다. 권한은 버튼 클릭으로만 요청한다.
- docs-backend는 구독 영구 저장과 발송을 담당한다. MVP 저장소는 NAS 단일 프로세스의 전용 JSON 파일이며 변경을 직렬화하고 atomic rename한다. 복제 배포나 다중 프로세스를 지원하지 않는다.
- 구독 API 토큰과 관리자 발송 토큰을 분리한다. 콘텐츠 API 토큰은 사용하지 않는다. VAPID 공개 키만 브라우저로 전달한다.
- 서비스 워커에는 fetch listener와 오프라인 캐시가 없다. 기존 콘텐츠 캐시와 revalidation은 그대로 둔다.
- 테스트 발송은 관리자 인증으로 저장된 한 endpoint에만 고정 문구를 보낸다. 브라우저용 발송 API, 대량 발송, 새 글 자동 발송은 제공하지 않는다.
- 실험은 구독 최대 20개, 인증된 변경/발송 요청 전체에 프로세스당 분당 30회 한도를 둔다. 지원 endpoint는 FCM·Mozilla·Apple의 제한된 HTTPS 도메인이다. 미지원 provider는 추정해서 허용하지 않는다.
- provider가 404/410을 반환하면 해당 구독을 삭제한다. 다른 실패는 재시도 없이 generic error로 끝낸다. endpoint·암호화 키·인증 헤더·provider 응답 본문은 로그에 남기지 않는다.

## 대안과 영향

- RSS는 운영 부담이 작지만 브라우저 권한과 발송을 배울 기회가 적다. 웹 푸시가 RSS를 반드시 대체해야 한다는 결정은 아니다.
- 외부 알림 서비스는 구현을 줄이는 대신 외부 구독 저장소·비용·의존성이 추가된다.
- 처음부터 DB·발송 큐를 도입하면 확장성이 좋지만 소규모 실험 범위를 넘어선다. 구독 수 증가, 다중 인스턴스, 자동 발송을 검토할 때 DB·outbox·중복 방지·보관 기간을 새 ADR로 결정한다.
- NAS가 꺼져 있어도 블로그 읽기는 유지된다. 구독 변경과 테스트 발송만 실패한다.
- iOS/iPadOS는 홈 화면 웹앱과 사용자 상호작용 조건을 별도로 안내한다. 수신은 OS 권한·집중 모드·provider 상태의 영향을 받으므로 즉시 전달을 보장하지 않는다.
- 기능 플래그를 끄는 것은 저장된 구독 삭제나 서비스 워커 해지와 다르다. 실험 종료 시 저장 파일과 브라우저 구독을 별도로 정리한다.

## 관련 문서

- [ADR-0010: 후속 초대 접근 제한과 WAF 활성화 게이트](adr-0010-web-push-invitation-and-waf-gate.md)

- [웹 푸시 실험 실행 절차](../runbooks/docs-web-push-experiment.md)
- [토큰과 VAPID 키 관리](docs-secret-token-lifecycle-policy.md)
- [구현 기록](../worklog/2026-10/2026-10-03-docs-web-push-mvp.md)
- [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [WebKit iOS/iPadOS Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [web-push 공식 저장소](https://github.com/web-push-libs/web-push)
