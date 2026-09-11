# Docs Vercel Platform Operations Policy

## Status

- Proposed operational baseline
- Applied scope: `apps/docs` Vercel project
- Last reviewed: 2026-09-11

## Purpose

`apps/docs`는 Vercel에서 실행되고 NAS의 `docs-backend`를 원격 콘텐츠
원본으로 사용한다. 이 구조에서는 애플리케이션 코드만으로 인증, 트래픽
남용, Preview 노출, 성능 저하와 비용 급증을 모두 방어하기 어렵다.

이 문서는 Vercel 기능을 무조건 활성화하는 목록이 아니라 현재 서비스
규모에 맞춰 적용 순서와 보류 기준을 정한다.

## Principles

- 인터넷 경계의 반복 트래픽은 애플리케이션보다 Vercel Firewall에서 먼저 제한한다.
- secret은 코드와 일반 환경변수 화면에서 최대한 읽을 수 없게 관리한다.
- Production과 Preview의 접근 정책을 분리한다.
- 플랫폼 기능을 활성화하기 전후로 실패율, 지연 시간과 비용을 측정한다.
- 유료 기능은 동일한 문제를 기존 로그와 CI로 해결하기 어려울 때 도입한다.
- 플랫폼 설정은 저장소 커밋만으로 재현되지 않으므로 dashboard 변경 일자와 검증 결과를 worklog에 남긴다.

## Current Baseline

현재 저장소에서 확인되는 기준은 다음과 같다.

- `@vercel/analytics`와 `<Analytics />`가 `apps/docs` root layout에 연결되어 있다.
- 원격 콘텐츠 요청은 짧은 timeout과 local fallback 정책을 사용한다.
- 원격 콘텐츠 캐시는 TTL과 tag 기반 on-demand revalidation을 함께 사용한다.
- `POST /api/revalidate/content`는 별도 Bearer token으로 보호한다.
- 콘텐츠 source 선택과 cache invalidation 결과는 Runtime Logs에 남긴다.
- 의심스러운 요청에 대한 앱 레벨 request blocklist가 존재한다.
- Vercel의 자동 DDoS mitigation은 별도 설정 없이 모든 배포에 적용된다.

Dashboard에서만 확인 가능한 활성화 상태는 코드만 보고 완료로 판단하지 않는다.

## Apply Now

### 1. Revalidation Endpoint Rate Limit

Vercel Dashboard에서 `Project > Firewall > Configure > New Rule`로 이동해
다음 규칙을 설정한다.

```text
Name: Docs content revalidation rate limit

If:
  Request Path = /api/revalidate/content
  Method = POST
  Environment = Production

Then:
  Rate Limit
  Strategy = Fixed Window
  Window = 60 seconds
  Request Limit = 5
  Key = IP
  Action = Default (429)
```

기계 호출 endpoint이므로 browser challenge를 사용하지 않는다. NAS 호출은
Challenge를 통과할 수 없다. IP 제한은 Bearer 인증을 대체하지 않으며 두
방어선을 함께 유지한다.

Vercel rate-limit counter는 region별로 계산되므로 전역에서 정확히 5회로
고정되는 강한 분산 lock은 아니다. 이 endpoint의 목적에는 충분하지만
결제나 데이터 변경 API의 유일한 제한 장치로 재사용하지 않는다.

### 2. Sensitive Environment Variables

다음 값은 `Project > Settings > Environment Variables`에서 Production과
Preview 환경의 `Sensitive` 옵션을 활성화한다.

- `BLOG_CONTENT_API_TOKEN`
- `BLOG_CONTENT_REVALIDATE_TOKEN`
- 향후 추가되는 server-to-server credential

기존 변수를 Sensitive로 직접 전환할 수 없다면 삭제 후 같은 key로 다시
추가한다. 환경변수 변경은 이전 deployment에 적용되지 않으므로 새
deployment를 만든다.

공개 URL, timeout, feature flag처럼 secret이 아닌 값까지 Sensitive로 만들
필요는 없다. `NEXT_PUBLIC_*`에는 secret을 넣지 않는다.

### 3. Preview Deployment Protection

`Project > Deployment Protection > Vercel Authentication`에서 `Preview only`를
활성화한다.

이 설정은 feature branch Preview에 공개 전 UI, 환경 구성과 API 경로가
노출되는 범위를 줄인다. Production custom domain은 공개 블로그이므로 보호
대상에 포함하지 않는다.

Playwright나 외부 QA가 Preview에 접근해야 하면 Vercel의 automation bypass
방식을 사용하고 bypass secret도 CI secret으로만 보관한다.

### 4. Runtime And Firewall Alerts

`Project > Logs`에서 다음 이벤트를 정기적으로 확인한다.

- `docs.content_source`
- `Remote content request failed`
- `Remote content cache invalidated`
- `/api/revalidate/content`의 `401`, `429`, `5xx`
- Function timeout과 비정상적으로 긴 duration

`Observability > Alerts > Subscribe to Alerts`에서 failed function invocation과
비정상 사용량 알림을 Email 또는 Webhook으로 구독한다. Firewall의 live
traffic에서는 revalidation path를 기준으로 IP, User-Agent와 응답 상태를
확인한다.

## Measure Then Apply

### 5. Speed Insights

Web Analytics는 방문 경로를 보여주지만 실제 사용자의 Core Web Vitals는
Speed Insights가 담당한다. 이미지가 많은 목록과 문서 상세의 LCP, CLS와
INP 회귀를 확인하는 데 유용하다.

적용 순서:

1. Dashboard의 `Speed Insights`에서 기능을 활성화한다.
2. `@vercel/speed-insights`를 `apps/docs`에만 설치한다.
3. root layout에 `SpeedInsights`를 추가한다.
4. Production과 Preview를 분리해 최소 일주일간 측정한다.
5. 데이터 사용량이 크면 `sampleRate`를 낮춘다.

현재는 정책 후보이며 패키지와 컴포넌트는 아직 추가하지 않는다.

### 6. Function Region Near The NAS

Vercel Function의 기본 region은 일반적으로 `iad1`이다. NAS와 원격 API가
한국에 있으므로 서버 렌더링 function을 데이터 원본에 가까운 `icn1`로
옮기면 왕복 지연과 timeout 위험을 낮출 수 있다.

바로 변경하지 않고 다음 순서로 검증한다.

1. Runtime Logs에서 현재 execution region과 원격 fetch duration을 기록한다.
2. Preview 환경에서 `icn1`을 설정한다.
3. `/feed`, `/docs`, 검색, 원격 상세의 cold/warm latency를 비교한다.
4. 한국 외 사용자의 응답 시간과 region별 비용 차이도 확인한다.
5. 개선이 확인된 경우 Production default region으로 승격한다.

정적 자산은 CDN에서 사용자 가까운 위치에 제공되므로 Function region을
서울로 바꾼다고 모든 응답이 서울에서만 전달되는 것은 아니다.

### 7. Web Analytics Verification

코드 연결은 완료되어 있으므로 Dashboard의 `Analytics`가 활성화돼 있는지,
Production 방문 데이터가 실제로 수집되는지만 확인한다. 검색어 원문이나
Bearer token을 custom event로 보내지 않는다.

## Incident And Release Controls

### Instant Rollback

Production 배포 후 5xx, hydration 오류 또는 주요 route 회귀가 발생하면
Production Deployment의 `Instant Rollback`을 우선 복구 수단으로 사용한다.
Hobby는 바로 이전 Production deployment, 상위 plan은 더 많은 eligible
deployment를 선택할 수 있다.

rollback은 외부 NAS 콘텐츠와 현재 환경변수 상태를 되돌리지 않는다는 점을
확인한다. 코드와 외부 데이터 contract가 동시에 변경된 경우 단순 rollback만
수행하면 호환성 문제가 남을 수 있다.

### Attack Challenge Mode

평상시에는 사용하지 않는다. 대규모 비정상 트래픽이 진행 중일 때만
Firewall에서 일시적으로 활성화하고 상황이 끝나면 해제한다. 모든 방문자에게
challenge를 요구하므로 정상 사용자 경험에도 영향을 준다.

## Deferred Features

### Log Drains

Pro 또는 Enterprise에서 장기 로그 보관, SIEM 연동이나 별도 alert query가
필요해질 때 도입한다. 현재 규모에서는 Vercel Runtime Logs와 구조화된
애플리케이션 로그를 먼저 사용한다.

### Spend Management

Pro plan으로 운영하고 metered usage가 의미 있게 증가하면 팀의
`Settings > Billing > Spend Management`에서 50%, 75%, 100% 알림을 설정한다.
자동 project pause는 공개 사이트 전체를 중단할 수 있으므로 알림부터
적용한다.

### Rolling Releases And Deployment Checks

트래픽 규모와 배포 빈도가 높아져 canary 검증이 필요할 때 도입한다. 현재는
GitHub CI, Preview 검증과 Instant Rollback의 운영 비용이 더 낮다. 도입 시
Rolling Release와 Skew Protection을 함께 검토한다.

### Additional WAF Deny Rules

`.env`, `.git`, WordPress 같은 반복 probe는 현재 앱 레벨 blocklist와 Firewall
로그로 관찰한다. 반복량이 유의미할 때만 하나의 WAF 규칙으로 승격한다.
Hobby에서는 custom/rate-limit rule 수가 제한되므로 추측성 규칙으로 slot을
소비하지 않는다.

## Verification Checklist

- [ ] 토큰 없는 revalidation 요청은 `401`이다.
- [ ] 동일 IP의 반복 POST는 설정한 window 안에서 `429`가 된다.
- [ ] 정상 NAS publish 호출은 제한 이하에서 `200`을 받는다.
- [ ] 두 콘텐츠 token은 Sensitive로 등록되어 있다.
- [ ] Preview URL은 Vercel 로그인을 요구한다.
- [ ] Production custom domain은 일반 사용자가 접근할 수 있다.
- [ ] Runtime Logs에서 content source와 invalidation 성공 시각을 찾을 수 있다.
- [ ] Function 실패/사용량 alert 수신 경로가 최소 하나 존재한다.
- [ ] rollback 담당자가 Dashboard 위치와 외부 콘텐츠 호환성 주의사항을 알고 있다.

## References

- https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting
- https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules
- https://vercel.com/docs/environment-variables/sensitive-environment-variables
- https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication
- https://vercel.com/docs/logs/runtime
- https://vercel.com/docs/alerts
- https://vercel.com/docs/speed-insights
- https://vercel.com/docs/functions/configuring-functions/region
- https://vercel.com/docs/instant-rollback
- https://vercel.com/docs/vercel-firewall/ddos-mitigation
- https://vercel.com/docs/drains
- https://vercel.com/docs/spend-management

## Related Documents

- `docs/architecture/docs-content-cache-revalidation-policy.md`
- `docs/architecture/docs-content-api-fail-fast-policy.md`
- `docs/runbooks/docs-env-checklist.md`
- `docs/runbooks/docs-request-blocklist.md`
- `docs/runbooks/docs-remote-payload-observability.md`
