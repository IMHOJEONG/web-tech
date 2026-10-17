# Docs 로컬 웹 푸시 실제 연동 검증

## 대상과 조건

- 검증일: 2026-10-03, KST.
- 기준: `feature/docs`, HEAD `d77a041`와 커밋 전 웹 푸시 변경. 병행 작업의 현재 docs 코드도 개발 서버에 포함된다.
- 환경: macOS, Node.js 24.12.0, Google Chrome 154.0.8037.95, Next 개발 서버 `127.0.0.1:3017`, Nest 서버 `127.0.0.1:8007`.
- 실제 Chrome 구독과 FCM 발송을 사용했다. 최종 수신 성공 표본은 한 브라우저, 한 건이다. 브라우저 권한은 Playwright로 허용했으며 사람이 권한 팝업을 클릭한 검사는 아니다.
- API/관리자 토큰과 VAPID 키는 실행 중 생성하여 임시 파일에만 저장했다. 기존 `.env`, 사용자 Chrome 프로필, NAS, Vercel 설정은 변경하지 않았다.

## 재현 방법

Chrome과 workspace 의존성이 설치되어 있어야 한다. 같은 checkout의 Next 개발 서버를 중지하고 3017·8007 포트가 비어 있는지 확인한다. 저장소 루트에서 실행한다.

```bash
pnpm --filter docs-backend build
pnpm --filter docs test:push:local
pnpm --filter docs test:push:browser
pnpm --filter docs typecheck
pnpm --filter docs exec eslint scripts/verify-web-push-local.ts lib/push-request-policy.ts lib/push-request-policy.test.ts --max-warnings 0
pnpm --filter docs exec node --test lib/push-request-policy.test.ts
```

`test:push:local`은 임시 Chrome 프로필을 사용하는 실제 연동 검사다. `test:push:browser`는 모의 구독을 사용하는 UI 회귀 검사이며 실제 수신 증거로 대체하지 않는다. 실제 연동 스크립트는 서버 두 개를 띄우고 테스트 알림을 발송한다. 마지막에는 구독 해지, 서버 종료, 임시 파일·프로필 삭제를 수행한다.

이번 실제 연동은 `apps/docs`에서 `node scripts/verify-web-push-local.ts`로 실행했다. 이후 같은 명령을 `test:push:local`에 연결했다.

## 결과와 증거

| 검사                          | 관측                                      | 판정                      |
| ----------------------------- | ----------------------------------------- | ------------------------- |
| 공개 config                   | 응답이 공개 키 한 개로 구성됨             | 통과                      |
| 무인증 backend config         | 401                                       | 통과                      |
| 다른 출처 BFF 변경 요청       | 403                                       | 통과                      |
| 잘못된 구독 데이터            | 400                                       | 통과                      |
| 구독 API 토큰으로 관리자 발송 | 401                                       | 통과                      |
| 파일 저장·중복·재시작·삭제    | 합성 구독이 한 건 유지된 뒤 삭제됨        | 통과, 실제 HTTP/파일 저장 |
| Chrome 네이티브 구독          | 실제 구독 생성과 Nest 저장                | 통과                      |
| 로컬 알림 대조군              | `showNotification` 후 알림 한 건 조회     | 통과                      |
| 제공자 발송                   | Nest 응답 200, `sent: true`               | 통과, 수락 단계           |
| 제공자 메시지 수신            | 서비스 워커 `push` 이벤트 1건             | 통과                      |
| 수신 알림 생성                | `heap-forge-push-test` 태그 알림 1건 조회 | 통과                      |
| UI 구독 해지                  | 파일 0건, 브라우저 구독 `null`            | 통과                      |
| 실제 OS 배너와 사용자 클릭    | 직접 관측하지 않음                        | 미검증                    |

비밀값을 제외한 최종 출력: [실행 결과](../artifacts/2026-10-03-local-web-push.json).

기존 모의 구독 UI 회귀 검사도 6개 모두 통과했다.

### 검사 중 발견한 차이

처음에는 정상적인 `127.0.0.1` 요청도 403이었다. 설치된 Next의 `next/dist/server/web/next-url.js`는 loopback hostname을 `localhost`로 정규화한다. 기존 검사는 정규화된 `request.url`과 브라우저의 실제 Origin을 그대로 비교했다.

개발 환경에서만 URL의 `localhost`와 동일 포트의 Host `127.0.0.1`을 보정했다. 다른 Host·포트는 허용하지 않고, 운영 환경은 기존의 정확한 Origin 비교를 유지한다. 관련 정책 회귀 검사 3개와 docs 타입 검사·변경 파일 린트가 통과했다.

최초 Chrome 검사는 자동화의 격리 컨텍스트에서 구독을 확인하지 못했다. 임시 persistent 프로필로 바꾼 후 네이티브 구독은 성공했다. 이후 첫 30초 수신 관측은 실패했으나, 최종 60초 관측에서는 실제 이벤트와 알림을 확인했다. 이 사실만으로 수신 지연의 네트워크 원인을 확정하지 않는다.

## 한계와 후속 작업

- 로컬 개발 환경의 최종 1회 통과이며 전체 Next Production 빌드, NAS volume, Vercel BFF/WAF, Firefox/Safari/iOS 홈 화면은 미검증이다.
- 백엔드 재시작 유지 검사는 합성 구독으로 수행했다. 실제 구독의 NAS 재시작 복원은 별도 확인한다.
- 권한 수동 승인, 집중 모드·OS 배너, 알림 클릭, 탭을 닫은 상태와 브라우저 종료 후 수신을 직접 확인한다.
- 제공자 수락만으로 전달 완료를 판단하지 않는다. 스크립트는 서비스 워커 수신과 알림 생성까지 요구하며, 실패하더라도 독립적인 해지 검사와 정리를 시도한다.

## 관련 문서

- [실험 실행 절차](../../runbooks/docs-web-push-experiment.md)
- [ADR-0009](../../architecture/adr-0009-docs-web-push-experiment.md)
- [구현과 검사 기록](../../worklog/2026-10/2026-10-03-docs-web-push-mvp.md)
