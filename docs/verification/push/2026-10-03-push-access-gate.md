# 웹 푸시 초대 접근 제어 검증

## 대상과 조건

- 검증일: 2026-10-03, KST.
- 대상: `feature/docs` 작업 트리의 초대 세션 정책, Next BFF, 웹 푸시 UI.
- 환경: macOS, Node.js 24.12.0, Chrome 154.0.8037.95.
- Playwright 개발 서버 3017과 실제 로컬 Nest 8007을 사용했다. 운영 NAS·Vercel 설정은 변경하지 않았다.
- 단위/UI 테스트는 명시된 합성 credential을 사용한다. 실제 연동은 일회성 무작위 값과 임시 Chrome 프로필을 만들고 종료 시 정리했다. 비밀값·쿠키·구독 주소는 증거 파일에 넣지 않는다.

## 재현 방법

저장소 루트에서 실행한다. Node.js 24와 설치된 Chrome이 필요하다. 로컬 실제 연동과 브라우저 회귀 검사는 같은 Next checkout/포트를 사용하므로 순서대로 실행한다.

```bash
pnpm --filter docs test:lib
pnpm --filter docs typecheck
pnpm --filter docs test:push:browser
pnpm --filter docs-backend build
pnpm --filter docs test:push:local
pnpm --filter docs exec eslint lib/push-access-policy.ts lib/push-access-policy.test.ts lib/push-access.ts lib/push-api.ts app/api/push/access/route.ts feature/web-push/model/use-web-push.ts feature/web-push/ui/push-access-form.tsx feature/web-push/ui/push-subscription-panel.tsx e2e-push/subscription.spec.ts scripts/verify-web-push-local.ts --max-warnings 0
```

이번 검증에서는 기존 빌드된 Nest를 사용했다. 위 재현 명령에는 이 전제 조건을 명확히 하도록 build를 포함했다.

## 결과와 증거

| 검사                                 | 결과                                                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| docs 공용 로직·Node 테스트 타입 검사 | 198개 통과                                                                                                                                                   |
| 브라우저 회귀                        | 11개 통과, 한국어·영어·390px 폭                                                                                                                              |
| docs 타입 검사·변경 파일 lint        | 통과                                                                                                                                                         |
| Production 플래그·독립 키 설정       | 비활성·WAF 미확인·키 누락/공용 사용은 fail-closed                                                                                                            |
| 세션 정책                            | 1시간 만료·위조·서명 키 변경·초대 코드 교체·중복 쿠키 거부                                                                                                   |
| 실제 BFF                             | 미인증 config/등록은 401, 다른 Origin은 403, 잘못된 코드는 401                                                                                               |
| 정상 초대                            | HttpOnly·SameSite=Strict·Path=/api/push·Max-Age=3600 쿠키, 코드 값 포함 안 함                                                                                |
| UI                                   | 초대 확인 전 등록 없음, 코드 확인만으로 권한 요청 없음, 잘못된 코드 입력 후 입력값 삭제; 세션 만료 시 해지 중단·브라우저 구독 보존, 비활성 시 권한 요청 차단 |
| 실제 로컬 Chrome                     | 초대 인증→네이티브 구독→Nest 저장→FCM 수락 200→push 이벤트 1건→알림 생성 1건→해지                                                                            |
| Vercel CLI 인증                      | `vercel whoami`가 유효하지 않은 토큰으로 실패. WAF 실제 게시는 미실행                                                                                        |

최초 브라우저 실행은 8개 통과·1개 실패였다. Next 기본 route announcer와 폼의 `role=alert`가 테스트 선택자에 함께 잡혔다. 폼 전용 ID로 좁혀 재실행한 결과 9개가 통과했다. 이후 세션 만료와 비활성 회귀를 추가해 최종 11개가 통과했다. 기능 실패와 구분한다.

비밀값을 제외한 관측 결과는 [증거 파일](../artifacts/2026-10-03-push-access-gate.json)에 기록했다. 기존 [초대제 도입 전 실제 연동 결과](2026-10-03-local-web-push.md)는 과거의 검증으로 유지한다.

## 한계와 후속 작업

- 실제 Production Secure 쿠키 전달, Vercel WAF 429, 운영 NAS·Firefox/Safari/iOS는 미검증이다. 정책 단위 테스트는 운영 환경 검증의 대체가 아니다.
- 실제 Chrome 알림 권한은 Playwright가 테스트 프로필에 허용했다. OS 배너·사용자의 권한 승인·알림 클릭은 직접 확인하지 않았다.
- 공유 초대 코드는 개인 인증·개별 회수·사용자별 quota가 아니다. 초대 세션 만료도 기존 구독을 삭제하지 않는다.
- Production WAF 게시·차단 확인 전에는 활성화하지 않는다. CLI 로그인 갱신, docs 대상 프로젝트 확인, 기존 rate limit과 draft 확인이 필요하다.

## 관련 문서

- [ADR-0010](../../architecture/adr-0010-web-push-invitation-and-waf-gate.md)
- [운영 실행 절차](../../runbooks/docs-web-push-experiment.md)
- [작업 기록](../../worklog/2026-10/2026-10-03-web-push-access-gate.md)
