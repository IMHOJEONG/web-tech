# Next.js 활용 점검 체크리스트

## 목적과 준비 조건

대상은 HEAP-FORGE `apps/docs`의 App Router 구성이다. 작성일은 2026-09-19이며 로컬 설치 버전은 Next.js 16.3.4, Node.js 24.12.0이다. 온라인 공식 문서는 이후 변경될 수 있으므로 설치 버전의 동작과 구분한다.

목표는 Next.js 기능을 많이 사용하는 것이 아니라 콘텐츠가 정확하고 빠르고 안전하게 전달되는지 판단하는 것이다. 전면 SSR, 모든 컴포넌트의 서버화, 모든 fetch의 캐시, Cache Components 도입 자체를 합격 기준으로 삼지 않는다.

각 항목은 확인 전에는 체크하지 않는다. 검토 시 `통과 / 실패 / 미검증 / 해당 없음`과 근거 파일·테스트·배포를 기록한다. 해당 없음에는 이유를 적는다. 아래 항목은 전체 코드 감사를 완료했다는 선언이 아니다.

## 실행 순서

### 1. P0: 서버와 클라이언트 경계

- [ ] S1. 인증 토큰과 서버 전용 코드가 Client Component import, props, RSC 응답, 브라우저 번들에 포함되지 않는다. 소스 검색과 Network 응답을 함께 확인한다.
- [ ] S2. `NEXT_PUBLIC_`에는 공개 가능한 값만 둔다. 공개 이미지 URL이 브라우저에 보이는 것과 인증정보 노출을 구분한다.
- [ ] S3. `'use client'`는 상태·이벤트·브라우저 API가 필요한 경계에 둔다. 클라이언트 모듈의 import 의존성이 불필요하게 커지지 않는지 확인한다.
- [ ] S4. 서버에서 읽은 문서 전체 대신 클라이언트에 필요한 최소 props를 전달하며, 전달 가능한 값인지 확인한다. Client Component라는 이유만으로 최초 HTML이 없는 것은 아님을 설명할 수 있다.

참고: [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components), [Data Security](https://nextjs.org/docs/app/guides/data-security).

### 2. P0: 콘텐츠와 캐시 정확성

- [ ] C1. 데이터별 출처, 로컬/원격 우선순위, TTL, 캐시 태그, 갱신 주체를 설명할 수 있다. 일반적인 Next 기본값을 ky 요청에도 추정 적용하지 않고 통합 테스트로 확인한다.
- [ ] C2. 요청 내 중복 제거용 React `cache()`와 요청 간 유지되는 데이터 캐시, HTML/RSC 결과 캐시, 클라이언트 Router Cache를 혼동하지 않는다.
- [ ] C3. 글 수정 후 목록·검색·상세를 각각 확인한다. 새 요청뿐 아니라 열린 탭의 이동·뒤로가기·새로고침도 검사한다. webhook 성공 응답만으로 화면 갱신을 완료 처리하지 않는다.
- [ ] C4. `revalidateTag(..., 'max')`의 stale 응답과 `{ expire: 0 }`의 다음 요청 대기를 이해하고 발행 정책에 맞게 선택한다. 즉시 만료가 원문을 즉시 미리 가져오는 것은 아니다.
- [ ] C5. locale, route, 검색 조건 등 결과에 영향을 주는 값이 캐시 구분에 반영된다. 추후 사용자별 데이터가 생기면 공유 캐시에 섞이지 않는지 별도 검사한다.
- [ ] C6. 원격 장애·삭제·빈 본문·잘못된 payload를 정상 빈 목록과 구분한다. 실패 결과가 정상 콘텐츠처럼 장기간 캐시되지 않는지 확인한다.

참고: [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag). 이 프로젝트의 설정에는 현재 `cacheComponents: true`가 명시되어 있지 않다. [캐시 모델 비교](../knowledge/content-platform/next-cache-components-comparison.md)를 바탕으로 운영 모델과 실험 모델을 구분한다.

### 3. P0: 장애 격리와 보안

- [ ] E1. 원격 서버 지연·timeout·401/403·5xx를 로컬 fixture로 재현한다. 인증 실패에 무의미한 endpoint 재시도를 하지 않고, 로컬 문서는 정책에 따라 이용 가능하다.
- [ ] E2. 요청별 timeout만 아니라 metadata, 본문, 부가 조회와 재시도를 합친 전체 응답 예산을 확인한다. Vercel 제한은 실제 배포 설정에서 확인하며 10초를 모든 환경의 고정값으로 가정하지 않는다.
- [ ] E3. `error.tsx`, `global-error.tsx`, `not-found.tsx`의 책임을 구분한다. 재시도와 홈 이동이 같은 장애를 무한 반복하지 않는다.
- [ ] E4. 재검증 Route Handler의 인증 누락·오류를 거부한다. rate limit, token 회전, 환경별 권한은 코드뿐 아니라 배포 설정까지 확인한다.
- [ ] E5. 원격 HTML을 sanitize하고 신뢰할 수 없는 MDX를 서버 코드처럼 실행하지 않는다. 이미지 허용 host/path도 필요한 범위인지 검토한다.
- [ ] E6. Proxy에서 경로 처리와 빠른 차단을 수행하되 무거운 콘텐츠 조회를 하지 않는다. Proxy나 숨겨진 URL만으로 API 인증을 대신하지 않는다.

### 4. P1: 렌더링과 스트리밍

- [ ] R1. 주요 경로마다 정적 생성 또는 요청 시 렌더링이 필요한 이유를 설명한다. 공개 소개 페이지와 검색 조건에 따른 결과를 같은 방식으로 강제하지 않는다.
- [ ] R2. Server Component가 자사 Route Handler를 불필요하게 HTTP로 우회 호출하지 않는다. 같은 서버의 데이터 함수 재사용 가능성을 검토한다.
- [ ] R3. 서로 독립적인 조회는 순차 waterfall을 만들지 않는다. 다만 본문에 필요 없는 관련 문서를 `Promise.all`로 함께 기다리지는 않는다.
- [ ] R4. 본문과 부가 영역의 Suspense 경계가 실제 응답에서도 독립적이다. 관련 문서가 늦거나 실패해도 본문이 먼저 보이는지 지연 fixture로 확인한다.
- [ ] R5. loading fallback이 헤더·본문의 필요한 공간을 예약한다. 로딩 교체, 폰트 교체, 이미지 로드에서 CLS와 가로 넘침을 확인한다.
- [ ] R6. 파일 스캔·MDX 변환·Shiki 같은 CPU/동기 작업을 계측한다. Suspense를 추가했다고 CPU 작업이 병렬화되거나 렌더링 비용이 사라졌다고 보지 않는다.

### 5. P1: 라우팅·검색·SEO

- [ ] U1. locale URL, 기존 URL redirect, query 보존, 직접 접근과 새로고침이 일관된다. canonical·hreflang·sitemap이 동일한 정책을 따른다.
- [ ] U2. metadataBase와 OG URL이 운영 도메인을 사용한다. 검색/필터 URL의 index/noindex 및 canonical 정책을 확인한다.
- [ ] U3. 존재하지 않는 문서를 HTTP 200만으로 정상 판정하지 않는다. streaming 상태에서는 UI와 robots meta까지 확인한다.
- [ ] U4. 검색어 길이·필터·페이지 번호를 URL 입력으로 검증한다. 연속 입력, 뒤로가기, 페이지 전환에서 오래된 결과가 남지 않는다.
- [ ] U5. 링크 prefetch가 원격 호출량을 늘리거나 사용하지 않은 응답을 취소할 수 있음을 고려한다. 무조건 끄지 않고 사용자 탐색 이점과 로그·비용을 측정한다.

### 6. P1: 이미지·폰트·클라이언트 비용

- [ ] P1. 첫 화면에서 실제 LCP가 제목인지 이미지인지 측정한 후 preload 대상을 정한다. 모든 이미지를 우선 로딩하지 않는다.
- [ ] P2. 이미지 크기 또는 비율과 반응형 sizes가 레이아웃에 맞는다. 원본과 `/_next/image` 응답을 따로 점검해 400/530 원인을 구분한다.
- [ ] P3. 필요한 폰트만 먼저 요청한다. 코드가 없는 글에서 코드 폰트가 내려오는지, fallback 글꼴과 다크 모드에서 읽을 수 있는지 검사한다.
- [ ] P4. 브라우저 번들에 서버 전용 파서·하이라이터가 불필요하게 포함되지 않는다. 분석 도구와 외부 script가 Production에서 의도대로 제한된다.

### 7. P1: 사용자 경험과 접근성

- [ ] A1. 키보드로 검색·목차·drawer를 조작하고 닫힌 뒤 focus가 적절한 위치로 돌아온다. 보이는 focus와 input label을 확인한다.
- [ ] A2. 모바일·태블릿·데스크톱, 확대, 긴 제목·코드·표에서 잘림과 가로 스크롤을 확인한다. sticky 헤더 아래 anchor 제목이 가려지지 않는다.
- [ ] A3. reduced-motion, 다크 모드, 느린 네트워크에서도 내용과 loading/error 상태가 이해 가능하다. 모션으로 콘텐츠 표시를 과도하게 지연하지 않는다.

### 8. P1: 배포·관측·재현성

- [ ] O1. `next dev`만이 아니라 production build/start로 직접 접근과 reload를 검사한다. 같은 체크아웃의 동시 빌드를 피하고 검증할 커밋·환경을 고정한다.
- [ ] O2. TTFB, 본문 표시, LCP, CLS와 서버 단계 시간을 구분한다. cold/warm은 원본 요청 횟수 등으로 확인하며 첫 요청을 무조건 cold라고 부르지 않는다.
- [ ] O3. 실험실 측정과 실사용 LCP·CLS·INP를 구분한다. 모바일·데스크톱의 실제 사용자 분포를 확인하고 소수 샘플 중앙값으로 전체 사용자를 대표하지 않는다.
- [ ] O4. locale·출처·지연·실패 결과를 추적할 로그가 있고 비밀정보와 문서 본문은 제외한다. 테스트 통과 여부와 운영 alert 작동 여부는 따로 확인한다.
- [ ] O5. 앱별 Node/pnpm/Next 버전, lockfile, 환경변수와 롤백 절차가 재현 가능하다. 프로덕션 테스트 fixture로 만든 `.next`를 실제 배포용으로 재사용하지 않는다.

### 시작 명령

저장소 루트에서 실행한다. 아래는 검사 명령 목록이며 이번 문서 작성 중 재실행한 결과가 아니다. 빌드가 포함된 명령은 순차로 실행한다. fixture 및 브라우저 설치 조건은 연결된 runbook을 먼저 확인한다.

```sh
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs test:content
mise exec -- pnpm --filter docs test:article:prod
mise exec -- pnpm --filter docs test:cache:prod
```

## 기대 결과

P0에 실패가 남으면 항목 개수로 상쇄하지 않는다. P1은 사용자 영향과 측정 근거로 우선순위를 정한다. 검사 결과에는 항목 ID, 판정, 커밋/배포, 재현 명령, 증거 링크를 기록한다.

현재 출발점은 아래와 같다. 코드 확인을 운영 통과로 표시하지 않는다.

| 코드에서 확인한 구성                             | 의미                             | 추가 확인                              |
| ------------------------------------------------ | -------------------------------- | -------------------------------------- |
| `lib/content-api.ts`의 server-only 및 ky 조회    | 서버 조회 경계 존재              | 번들/응답 비밀정보 및 실제 장애 격리   |
| `lib/content-cache.ts`와 revalidation handler    | 토큰 검사와 tag 만료 경로 존재   | 발행 후 각 화면 갱신, WAF 및 운영 환경 |
| `[locale]/layout.tsx`, `proxy.ts`                | locale URL 및 metadata 구성 존재 | redirect·canonical·언어별 전체 경로    |
| `shared/config/fonts.ts`의 mono preload 비활성화 | 불필요한 우선 요청을 줄이는 구성 | 페이지별 Network·LCP·글꼴 교체         |
| 상세 페이지 프로덕션 fixture 테스트              | 본문 완성을 검사할 기반 존재     | 현재 커밋 전체 통과 및 배포 검증       |

따라서 현재는 기반 기능을 잘 나누는 방향으로 진행 중이지만, 전체 항목의 운영 검증까지 완료했다고 평가할 수는 없다. 우선 C3, E1/E2, R4, O1/O2를 묶어 게시·장애·느린 부가 영역을 검증한다.

## 실패 대응과 복구

검증할 커밋과 fixture를 고정하고 실패 항목을 좁힌다. 단순 timeout 연장, 전역 no-store, 전체 Client Component 전환으로 우회하지 않는다. 로컬 모의 서버에서 재현한 뒤 수정 전후를 비교한다. 배포 회귀면 마지막 검증 배포로 롤백하고, 인증정보 노출이면 먼저 자격증명을 교체한다. 실제 사이트에 임의 장애나 캐시 만료 실험을 수행하지 않는다.

## 관련 검증

- [2026-09-19 1차 실행 결과](../verification/cache/2026-09-19-nextjs-checklist-phase-one.md): C4/O1 로컬 검증 통과, C3/R4/O2 부분 검증, E1/E2 미검증. 체크박스는 운영까지 완료한 것으로 오인하지 않도록 유지한다.
- [상세 렌더링 회귀 절차](docs-article-rendering-regression.md)
- [캐시 프로덕션 검사](docs-content-cache-production-test.md)
- [브라우저·기기 점검](docs-responsive-browser-device-checklist.md)
- [검증 결과 목록](../verification/README.md): 각 보고서의 커밋과 날짜를 확인한다.
- [Next.js Production 가이드](https://nextjs.org/docs/app/guides/production-checklist): 일반 기준이며 프로젝트별 체크 항목은 위와 같이 구체화했다.
- [Next.js Caching](https://nextjs.org/docs/app/getting-started/caching): 최신 문서 모델과 현재 프로젝트 설정을 구분해서 읽는다.
