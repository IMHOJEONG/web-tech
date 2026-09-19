# Cache Components 단계별 격리 실험

## Summary

기존 모델의 갱신 정책 비교 다음 단계로 Cache Components를 시험했다.
운영 `next.config.mjs`, 콘텐츠 API, locale 결정 방식, 재검증 정책은 변경하지 않았다.
전체 앱 활성화와 최소 앱의 캐시 동작을 구분했고, 성공뿐 아니라 실패 결과도 기록한다.

## Changed

- `test-content-cache-prod.mjs`에 전체 앱/최소 앱/함수 캐시 단독 실험 옵션 추가.
- 임시 앱 전용 config와 `'use cache'` probe 추가.
- 최소 HTML 셸과 상세 화면 fixture 추가. 실제 `content-api.ts`와 운영 웹훅 코드를 재사용한다.
- 캐시 API 검증을 먼저 완료하고 화면 검증을 마지막에 실행하도록 분리.
- runbook과 비교 문서에 재실행 명령과 결과 연결.

## Notes

### 실행 환경과 격리

Next.js 16.3.4, webpack production 빌드와 `next start`, loopback 가짜 원본 서버를 사용했다.
`.env`, 기존 `.next`, 운영 인증값은 복사하지 않는다. 토큰은 매번 생성한다.
종료 시 테스트 서버와 임시 앱을 정리하며 NAS, Vercel에 요청하지 않는다.
원본 대기 시간을 인위적으로 제어하므로 관측 ms 값은 성능 벤치마크가 아니다.

### 1. 전체 앱에서 활성화: 실패 원인 확인

```bash
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs --cache-components
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs --cache-components --debug-prerender
```

컴파일과 TypeScript 검사는 통과했다. 사전 렌더링에서 실패하여 종료 코드 1을 반환했다.
상세 로그에서는 16개 경로의 실패가 보고되었다. 핵심 증거:

```text
Route "/_not-found": Next.js encountered uncached or runtime data during prerendering.
at <anonymous> (webpack://docs/shared/message/request.ts:25:38)
at Layout (webpack://docs/app/layout.tsx:51:35)
const cookieStore = await cookies()
```

루트 Layout의 `getLocale()`가 쿠키 기반 locale 설정을 호출한다.
Layout이 반환하는 JSX 내부의 Header Suspense는 이 선행 호출을 감싸지 못한다.
따라서 단순히 플래그만 켜는 방식은 현재 구조에서 통과하지 않는다.
이 오류는 기존 모델의 운영 장애가 아니라 격리된 새 모델 실험의 실패다.

### 2. 최소 앱 + 중첩 캐시: 일부 통과, 전체 실패

```bash
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs --cache-components-minimal
```

원래 app 디렉터리 대신 최소 셸을 복사하며 proxy와 라이브러리 등은 유지한다.
probe는 실제 조회 함수에 `'use cache'`, `cacheLife`, 동일 태그를 추가한다.
기존 fetch TTL 3600초도 남아 있으므로 함수 캐시와 fetch 캐시가 겹친다.

- 빌드, 최초 조회, warm 재사용, 인증, `expire: 0` 갱신은 통과했다.
- 첫 실행은 상세 페이지 요청에서 30초 타임아웃이 발생했다.
- 화면 검증을 뒤로 옮긴 재실행에서는 max가 기존 V2를 즉시 반환하는 단계까지 통과했다.
- 이후 최대 100회 polling(조회 사이 50ms 대기)에서 목록/본문 모두 V3가 되는 조건을 만족하지 못했다.

```text
[PASS] max returned stale V2 while origin was held { elapsedMs: 4 }
AssertionError: Background revalidation must eventually publish V3
```

중첩 SWR에서 바깥 함수가 안쪽 캐시의 이전 값을 다시 저장할 가능성이 있다.
이는 현재 관측을 설명하는 가설이며 Next.js 내부 결함을 확정한 것은 아니다.
30초 타임아웃의 내부 원인도 아직 특정하지 않았다. 두 증상을 같은 원인으로 단정하지 않는다.

### 3. 최소 앱 + 함수 캐시 단독: 통과

```bash
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs --function-cache-only
```

최소 앱/Cache Components를 자동 활성화하고 테스트 환경의
`BLOG_CONTENT_REVALIDATE_SECONDS`만 0으로 설정해 fetch 캐시를 사용하지 않는다.
함수 캐시 수명은 `stale: 0, revalidate: 3600, expire: 7200`이다.
운영 환경변수나 구현에는 영향을 주지 않는다.

실제 출력, 종료 코드 0:

```text
[PASS] Cold read and Data Cache reuse { index: 2, body: 1 }
[PASS] expire: 0 waited for origin and returned V2 { elapsedMs: 119 }
[PASS] Authentication, lazy invalidation, refreshed index/body { index: 4, body: 2 }
[PASS] max returned stale V2 while origin was held { elapsedMs: 4 }
[PASS] max background refresh and warm V3 reuse { index: 8, body: 4 }
[PASS] Article renders V3 { minimal: true }
[cache-test] All checks passed
```

로그의 `Data Cache reuse`는 공통 테스트 라벨이며, 이 모드에서 검증하는 재사용 계층은 함수 캐시다.
목록 조회와 상세 조회가 각각 목록 API를 사용하므로 최초 index 카운터는 2였다.
polling과 중복 조회가 포함되어 있어 원본 호출 횟수가 최소라는 증거는 아니다.
실제 블로그 레이아웃, 다국어 metadata, 브라우저 탐색의 통과를 뜻하지도 않는다.

## Open Questions

### 기존 모델 회귀 검사와 정적 검사

`mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs`를 마지막에 재실행했다.
전체 앱에서 `All checks passed`, 종료 코드 0을 확인했고 실제 상세 화면 V3도 검증했다.
최종 카운터는 `{ index: 4, body: 4 }`였다.
추가한 스크립트/fixture의 ESLint와 `git diff --check`도 통과했다.

### 남은 질문

- 공용 `<html lang>`를 유지하면서 요청별 locale을 새 렌더링 경계에 어떻게 배치할 것인가?
- 중첩 캐시의 재갱신 지연과 상세 요청 타임아웃은 각각 어디서 발생하는가?
- 함수 캐시만 쓸 때 목록 API 중복 요청을 안전하게 줄일 수 있는가?
- NAS 장애 및 Vercel 다중 인스턴스에서도 같은 결과가 나오는가?

## Next

다음 실험은 locale/루트 레이아웃 경계를 별도 fixture로 검증하는 것이다.
한국어와 영어 요청을 번갈아 보내 언어 혼합 및 metadata 회귀를 검사한다.
운영 전환은 보류한다. 특히 기존 fetch 캐시 위에 use cache만 덧씌우지 않는다.

공식 근거: [마이그레이션 가이드](https://nextjs.org/docs/app/guides/migrating-to-cache-components).
실험은 설치된 Next.js의 번들 문서와 대조했으며 최신 문서만 보고 운영 옵션을 변경하지 않았다.
