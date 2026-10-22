# 콘텐츠 네트워크 실패와 오프라인 열람 검증

## 대상과 조건

- 검증: 2026-10-17~18, KST. 10-18 중단 작업을 재개하고 최종 production 검사를 실행했다.
- 브랜치: `feature/docs`, 기준 `6dfba954100ced20b09b3b7624083f6ae16ef74e` 위 미커밋 작업 트리.
- macOS, 프로젝트 Node.js 24.12.0·pnpm 11.10.0·Next.js 16.3.8.
- 원격 실패 검사는 실제 콘텐츠 조합 함수를 esbuild로 묶고 Ky의 transport만 모의한다. 실제 NAS·Cloudflare 장애를 유발하지 않았다.
- 브라우저 검사는 실제 Next 서버·Chromium·Service Worker·CacheStorage를 사용한다. 폭 1280px와 390px의 두 프로젝트이며 실제 휴대전화는 아니다. 원격 목록·푸시는 이 suite에서 비활성화한다.

## 재현 방법

저장소 루트에서 실행한다. dev/build/production 검사는 같은 앱의 Next 산출물을 공유하므로 순차 실행한다.

```bash
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs test:offline
mise exec -- pnpm --filter docs test:push:browser
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter docs lint
mise exec -- pnpm test:repo

BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false BLOG_CONTENT_API_BASE_URL= BLOG_CONTENT_API_BASE_URL_INTERNAL= BLOG_CONTENT_API_BASE_URL_PUBLIC= BLOG_PUSH_ENABLED=false mise exec -- pnpm --filter docs build
NODE_ENV=production mise exec -- pnpm --filter docs test:offline
```

네트워크·Worker 단위 검사의 보관 원본은 아래 범위를 별도로 실행한 출력이다. 실제 인증값을 사용하지 않는다.

```bash
mise exec -- node --experimental-strip-types --test apps/docs/lib/content-api-request.test.ts apps/docs/lib/content-api-resilience.test.ts apps/docs/lib/offline-worker.test.ts apps/docs/lib/push-service-worker.test.ts apps/docs/lib/sitemap.test.ts
```

## 결과와 증거

| 검사                         | 결과       | 확인 범위                                                                                          |
| ---------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| 전체 lib                     | 통과 253개 | 기존 렌더링·검색·라우팅과 새 네트워크·Worker 검사                                                  |
| 네트워크·Worker 발췌         | 통과 29개  | [원본 출력](../artifacts/2026-10-17-content-network-tests.txt)                                     |
| 오프라인 dev 브라우저        | 통과 18개  | 아래 9개 시나리오 × 두 화면                                                                        |
| 오프라인 production 브라우저 | 통과 18개  | [원본 출력](../artifacts/2026-10-18-offline-production-browser.txt), production 재실행             |
| 기존 푸시 브라우저           | 통과 11개  | 초대·권한·구독·해지·실패 복구 UI. 네이티브 구독은 기존 모의 환경이며 FCM 실제 발송을 의미하지 않음 |
| docs typecheck·lint          | 통과       | Node 테스트의 erasable 문법과 앱 TypeScript, lint 경고 0                                           |
| 저장소 도구 검사             | 통과 37개  | 기존 포맷·문서·catalog·의존성 회귀                                                                 |
| docs production build        | 통과       | 콘텐츠 작성 규칙 19개·컴파일·타입 검사·정적 페이지 33개 생성                                       |

원격 reader는 연결 실패·401/403/404/429/502/503/530에서 호출 1회를 확인했다. 헤더 정지, 헤더 이후 본문 정지, 조금씩 도착하는 본문, 상세 단계의 공유 deadline과 이미 만료된 deadline을 검사했다. 타이밍 테스트의 수치는 작은 모의 deadline의 제어된 조건이지 실제 NAS 지연 측정값이 아니다.

실제 콘텐츠 조합에서는 목록·검색의 로컬 유지, 본문 HTTP 오류·빈 본문·빈 HTML·본문 정지·잘못된 JSON의 동일 route 로컬 대체를 확인했다. 정상 원격은 계속 우선하며 원격 전용 실패는 throw, 정상 목록에 없는 route는 null이다. Ky 예외를 안전한 오류로 바꾼 뒤 출력에 인증 헤더·Request·원본 cause가 없는지도 검사했다.

Worker 단위 검사에서는 같은 출처·현재 상세 경로 일치, API/preview/query/fragment/외부 경로 거부, 동시 11개 저장 중 10개만 허용, 한도 상태에서도 기존 글 업데이트, 개별·전체 삭제, 2MiB 초과 거부, 업그레이드 시 글·타 앱 캐시 유지, 정상 404 유지, API·RSC·POST 미개입을 검사했다.

실제 브라우저의 9개 시나리오는 다음과 같다.

1. 이미지 요청 실패 후 로컬 대체 이미지 표시, 카드로 실제 상세 이동.
2. 대체 이미지까지 실패해도 카드 영역·탐색과 페이지 폭 유지.
3. 명시적 저장 전에는 글을 보관하지 않음. 저장 후 `context.setOffline(true)`로 전환하고 상세 새로고침·저장 목록·삭제 성공.
4. 직접 업데이트 전에는 저장본을 바꾸지 않음. script·iframe·form·입력값·이벤트 속성과 실행 URL 제외.
5. 이미지 하나를 차단하면 누락 안내를 표시하고 작은 동일 출처 래스터는 오프라인에서도 실제 decode 성공.
6. Cache.put에 QuotaExceededError를 주입하면 실패 안내를 표시하며 이전 저장본 바이트 유지.
7. 저장 경로 조작 거부·API 검색 응답 미보관·저장하지 않은 상세의 오프라인 목록 대체.
8. 영문 저장·reader·가로 overflow 없는 본문과 전체 삭제 확인창 취소/승인 구분.
9. 본문 로딩 표시를 DOM에 주입하면 저장하지 않고 안내한다. 표시를 제거한 뒤 직접 저장하면 실제 본문이 보관된다. 서버 응답을 실제로 지연시킨 스트리밍 시험과는 구분한다.

### 초기 실패와 수정

첫 dev 실행은 8개 실패·2개 통과였다. 기존 Worker CSP의 `default-src 'none'`에 `connect-src`가 없어서 reader shell 다운로드가 차단되었다. 같은 출처 연결만 허용하도록 보완했다. 해당 실행 도중 서버 재시작이 있었으므로 부분 통과 2개를 완료 근거로 쓰지 않는다. 이후 설정 변경 없이 dev 16개와 production 16개를 각각 새로 실행해 통과했다.

최초 lint에서 새 브라우저 JS의 document/confirm 전역과 테스트의 `module` 변수 경고 13개를 발견했다. 해당 파일의 브라우저 전역을 선언하고 변수명을 변경한 후 경고 0을 확인했다. 초기 Node 테스트 타입 오류도 env 복원·nullable 문서·인증 헤더 타입을 수정한 후 전체 lib 검사에 포함해 재확인했다.

### 기존 상세·캐시 production 회귀

`test:article:prod`는 108개 모두 통과했다. 실제 모의 Content API와 Next production 서버로 로컬·원격 상세, not-found, 인증된 웹훅 이후 목록·검색·본문 갱신, 요청 생명주기를 확인했다. [테스트 결과·오류 발췌](../artifacts/2026-10-18-article-production-results.txt)는 인증·환경 정보 없이 결과 줄과 스트림 오류만 선별한 출력이다.

동시에 `The destination stream closed early.` 오류가 12회 남았다. 테스트 통과로 이 오류가 해결되었다고 판단하지 않는다. 이번 범위에서는 각 발생 요청의 원인을 확정하지 않았으며, 정상 취소로 단정하지 않고 [요청 생명주기 정책](../../architecture/docs-request-lifecycle-logging-policy.md)의 별도 후속 대상으로 유지한다. 색상 환경 변수 경고도 남았지만 test failure는 아니었다.

## 한계와 후속 작업

- Vercel 배포·NAS 실환경·실제 DNS 단절·TLS 오류·사용자 라우터와 장기 저장 공간 회수는 미검증이다. `setOffline(true)`는 Chromium 네트워크 차단을 제어한 조건이다.
- Safari·Firefox·iOS·Android 실기기의 Worker 설치·저장 권한·공간 정책은 별도 확인한다. 현재 CI 추가 job도 아직 원격에서 실행하지 않았다.
- 첫 방문 오프라인, 저장하지 않은 글, 전체 검색, Next 클라이언트 이동 자동 복구는 지원하지 않는다. reader 북마크나 저장한 상세의 직접 navigation을 사용한다.
- 외부 이미지·SVG·큰 이미지·인터랙티브 예제는 저장하지 않는다. 본문은 정규화된 읽기 화면이며 온라인과 완전히 같은 스타일·코드 복사 동작을 보장하지 않는다.
- 일반 카드의 이미지 오류 처리를 확인한 것이며 본문에 포함된 모든 이미지·외부 동영상의 온라인 대체 UX를 구현했다는 의미는 아니다.
- 기존 TCP 초안·도식·증거와 복구 stash는 이번 작업에 포함해 커밋하거나 게시하지 않았다.

## 관련 문서

- [원격 실패 정책](../../architecture/docs-content-api-fail-fast-policy.md)
- [ADR-0015](../../architecture/adr-0015-explicit-offline-article-snapshots.md)
- [실행·복구 절차](../../runbooks/docs-offline-reading.md)
- [작업 기록](../../worklog/2026-10/2026-10-17-content-network-offline-reading.md)
