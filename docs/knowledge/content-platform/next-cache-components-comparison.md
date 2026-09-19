# Next.js 캐시 모델 비교와 Cache Components 도입 검토

## 목적과 조사 기준

2026-09-12 기준 공식 문서와 `apps/docs` 구현을 비교한다. 새 모델이 나온 배경을 이해하고, 나중에 재현 가능한 전환 실험을 하기 위한 조사 문서다. 이번 작업은 Cache Components 활성화나 운영 정책 변경이 아니다.

- 로컬에 설치된 Next.js: `16.3.4` (`node -p "require('./apps/docs/node_modules/next/package.json').version"`로 확인).
- 공식 웹 문서는 조사 당시 최신 문서를 기준으로 하므로, 실험할 때 설치 버전과 다시 대조한다.
- 아래에서 공식 설명, 현재 코드에서 확인한 사실, 프로젝트에 대한 판단을 구분한다.

## 왜 새로운 모델이 나왔는가

### 1. 캐시 여부를 코드에서 더 명시적으로 표현하기 위해

Next.js 16 발표는 Cache Components의 목표를 명시성과 유연성으로 설명한다. `'use cache'`를 통해 함수, 컴포넌트, 페이지 중 재사용할 결과를 지정하고, 컴파일러가 캐시 키 생성을 지원한다. 기존 App Router의 암묵적인 동작을 추론하기보다 캐시 경계를 코드에 드러내려는 방향이다. [Next.js 16 발표](https://nextjs.org/blog/next-16#cache-components)

이는 현재 기존 모델의 모든 요청이 기본적으로 캐시된다는 뜻은 아니다. 현재 기존 모델 문서도 `fetch`의 기본 동작은 비캐시라고 설명한다. 과거 버전의 기본값과 현재 설정을 혼동하면 안 된다. [기존 모델 가이드](https://nextjs.org/docs/app/guides/caching-without-cache-components)

### 2. 정적 페이지와 동적 페이지의 이분법을 줄이기 위해

공식 발표는 PPR(Partial Prerendering)을 통해 빠르게 제공할 정적 부분과 요청 시 처리할 부분을 한 화면에 조합하는 방향을 제시한다. Cache Components는 이 흐름을 캐시 선언과 연결한다. [Next.js 16 발표](https://nextjs.org/blog/next-16#cache-components)

예를 들어 블로그의 공통 화면은 먼저 제공하고, 요청에 따라 달라지는 영역은 Suspense 경계에서 나중에 채우는 구성을 검토할 수 있다. 이것은 우리 프로젝트에 대한 적용 예시이지, 활성화만 하면 현재 화면이 자동으로 빨라진다는 보장은 아니다.

### 3. 네트워크 응답뿐 아니라 계산 결과와 UI도 캐시하기 위해

새 모델은 데이터 조회 함수뿐 아니라 컴포넌트 결과에도 캐시 경계를 둘 수 있다. 수명은 `cacheLife`, 태그는 `cacheTag`로 표현한다. 요청 시 필요한 비캐시 데이터는 Suspense를 통해 정적 부분과 분리한다. [Cache Components 가이드](https://nextjs.org/docs/app/getting-started/caching)

기존 모델에도 `unstable_cache`가 있으므로, 함수 결과 캐싱 자체가 처음 생긴 것은 아니다. 새 모델의 차이는 명시적인 선언과 렌더링 모델을 함께 구성하는 데 있다.

## 현재 블로그의 구조

| 확인 대상                                       | 현재 구현                                     | 의미                                       |
| ----------------------------------------------- | --------------------------------------------- | ------------------------------------------ |
| `apps/docs/next.config.mjs`                     | `cacheComponents` 미활성화                    | Previous Model 기준                        |
| `apps/docs/lib/content-api.ts`                  | ky 요청에 `next.revalidate`, `next.tags` 전달 | 원격 목록과 본문 응답의 Data Cache 사용    |
| `apps/docs/lib/content-api-config.ts`           | 재검증 기본 300초, 요청 제한 기본 2500ms      | 시간 기반 갱신과 네트워크 제한은 별도 정책 |
| `apps/docs/lib/content-cache.ts`                | `docs-content:remote` 공통 태그               | 원격 목록과 본문을 함께 무효화             |
| `apps/docs/app/api/revalidate/content/route.ts` | 인증 후 `{ expire: 0 }`                       | 다음 조회가 새 데이터를 기다리도록 만료    |
| `apps/docs/shared/message/request.ts`           | 쿠키와 헤더로 locale 선택                     | 요청별 정보와 공용 캐시의 경계 필요        |

```text
NAS 문서 변경
  -> docs-backend 원본 응답 변경
  -> 인증된 재검증 웹훅 호출
  -> docs-content:remote 태그 만료
  -> 다음 서버 조회에서 원본 재조회 및 캐시 갱신
```

웹훅 성공은 원본 재조회 완료가 아니다. 300초 역시 정해진 시각마다 NAS를 조회하는 스케줄러가 아니다. 브라우저 Router Cache, 이미지/CDN 캐시는 별도로 확인해야 한다.

기존 통합 테스트에서는 실제 ky 경로를 통해 원본 호출 횟수가 초기 `{ index: 1, body: 1 }`, 인증된 만료 후 `{ index: 2, body: 2 }`로 바뀌는 것을 확인했다. 이는 로컬 production 테스트 결과이며 Cache Components 또는 Vercel 다중 인스턴스 검증 결과가 아니다. [실험 노트](./next-data-cache-integration-lab.md)

## 모델 비교

| 항목               | 현재 모델                             | Cache Components 도입 시                      |
| ------------------ | ------------------------------------- | --------------------------------------------- |
| 주요 선언          | 요청의 `next.revalidate`, `next.tags` | `'use cache'`, `cacheLife`, `cacheTag`        |
| 캐시 경계          | 현재는 원격 HTTP 응답 중심            | 조회 함수 또는 UI 결과까지 설계 가능          |
| 화면 구성          | 현재 라우트의 정적/동적 조건을 추적   | 정적 셸과 Suspense 내부 요청 시 렌더링을 설계 |
| 갱신 API           | `revalidateTag`                       | 태그 기반 갱신 개념 유지                      |
| 언어별 정보        | 요청 쿠키/헤더에서 결정               | 캐시 밖에서 결정한 locale 전달과 키 분리 검증 |
| 도입 비용          | 기존 검증과 운영 지식 재사용          | 레이아웃, 메타데이터, 동적 경로까지 회귀 검사 |
| 해결하지 않는 문제 | NAS 장애, 잘못된 콘텐츠, 이미지 캐시  | 동일하게 별도 대책 필요                       |

최신 마이그레이션 문서는 기존 `fetch`/`unstable_cache` 캐시가 별도 계층으로 계속 동작할 수 있다고 설명한다. 따라서 전환이 모든 fetch 옵션을 기계적으로 삭제하는 작업은 아니다. 중첩된 캐시의 수명과 태그를 함께 검증해야 한다. 라우트의 `dynamic`, `revalidate`, `fetchCache` 설정은 별도 전환 대상이다. [마이그레이션 가이드](https://nextjs.org/docs/app/guides/migrating-to-cache-components)

## 모델 전환과 갱신 정책은 다른 결정

| 재검증 정책                         | 캐시가 있을 때 다음 요청         | 적합한 목표                |
| ----------------------------------- | -------------------------------- | -------------------------- |
| `revalidateTag(tag, 'max')`         | 기존 내용 응답과 백그라운드 갱신 | 독자의 대기 최소화         |
| `revalidateTag(tag, { expire: 0 })` | 새 데이터 조회까지 대기          | 발행 후 다음 조회의 최신성 |

`max`의 1년은 갱신 주기가 아니라 오래된 캐시 제공을 허용하는 창이다. 갱신 완료 뒤에는 새 내용이 사용되며, 캐시가 전혀 없다면 기존 내용으로 즉시 응답할 수 없다. 새 모델을 도입한다고 `max`를 반드시 선택해야 하는 것은 아니다. [revalidateTag 공식 문서](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)

## 우리 프로젝트에서 기대되는 장점과 부담

다음은 코드와 공식 모델을 바탕으로 한 판단이며 성능 측정 결과가 아니다.

- 장점: 원격 조회 이후 정규화 같은 계산까지 캐시할 경계를 명확하게 표현할 수 있다.
- 장점: 정적인 화면과 느린 원격 콘텐츠 영역을 분리해 첫 화면 응답을 개선할 여지가 있다.
- 부담: locale을 잘못 공유하면 언어가 섞일 수 있다. 요청 쿠키/헤더를 공용 캐시 함수 안에서 직접 읽지 않도록 검토해야 한다.
- 부담: 원격 장애를 빈 배열이나 빈 본문으로 바꾸고 그 결과를 캐시하면 정상 콘텐츠 대신 실패 결과를 재사용할 수 있다. 오류와 정상 빈 값의 구분이 먼저 필요하다.
- 부담: 목록과 본문을 서로 다른 시점에 갱신하면 버전 불일치가 생길 수 있다. 공통 태그만으로 원자적 발행이 보장되지는 않는다.
- 부담: 서버 캐시가 바뀌어도 이미 열린 브라우저 화면이나 이미지 URL의 캐시가 동시에 교체되는 것은 아니다.

## 권고와 단계별 실험

현 단계 권고는 기존 운영 구조를 유지하면서 격리된 환경에서 비교하는 것이다. Previous Model이라는 이름만으로 즉시 전환하지 않는다. 아래는 초기 실험 계획이며, 2026-09-13에 갱신 정책 비교 및 Cache Components 격리 실험을 수행했다. 단계별 결과와 미해결 항목은 아래 관련 프로젝트 문서에서 확인한다.

1. 현재 통합 테스트를 다시 실행하고 커밋, Node/Next 버전, cold/warm 응답 시간, 원본 호출 횟수를 기록한다.
2. 기존 모델에서 `max`와 `expire: 0`부터 비교한다. 캐시 모델과 갱신 정책을 동시에 바꾸지 않는다.
3. 격리된 앱 또는 실험 브랜치에서 Cache Components를 켜고 원격 조회 함수 하나를 대상으로 캐시 경계를 설계한다. 설정은 앱 단위이므로 다른 라우트 영향도 확인한다.
4. locale, `searchParams`, metadata, 동적 상세 경로와 Suspense 경계를 검증한다. 최신 문서의 점진 전환 API는 설치 버전 지원 여부를 먼저 확인한다.
5. 같은 V1/V2 fixture로 캐시 재사용, 인증 실패, 만료, 재조회 결과를 비교한다.
6. NAS 지연/실패, 동시 요청, 목록/본문 버전 일치, 브라우저 이동과 새로고침을 검사한다.
7. Vercel Preview에서 실제 배포 캐시 동작을 확인한 후 채택 여부를 별도 결정한다.

통과 기준: 기존 콘텐츠·인증·다국어 동작이 유지되고, 원격 호출이 불필요하게 증가하지 않으며, 첫 응답 또는 유지보수상의 이점이 측정되어야 한다. 실패하면 실험 브랜치를 운영에 병합하지 않는다.

## 공식 자료 읽는 순서

1. [Next.js 16 발표](https://nextjs.org/blog/next-16#cache-components): 왜 명시적인 캐시와 PPR이 필요한가.
2. [기존 모델](https://nextjs.org/docs/app/guides/caching-without-cache-components): 현재 코드가 어떤 규칙으로 동작하는가.
3. [Cache Components](https://nextjs.org/docs/app/getting-started/caching): 함수/UI 캐시와 정적 셸을 어떻게 조합하는가.
4. [마이그레이션](https://nextjs.org/docs/app/guides/migrating-to-cache-components): 어떤 설정과 요청 시 API 경계를 재검토하는가.
5. [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag): 기존 내용 제공과 즉시 만료를 어떻게 선택하는가.

## 관련 프로젝트 문서

- [Locale 캐시 키 재현 가이드](../../runbooks/docs-locale-cache-key-test.md): locale 인자별 재사용과 언어별 선택적 만료 검증.
- [2026-09-14 locale 경계 시험](../../worklog/2026-09/2026-09-14-docs-cache-locale-boundary-test.md): 임시 instant=false와 함수 캐시 단독 구성에서 전체 앱 빌드 및 언어별 서버 응답 검증 통과. 정적 셸 최적화는 미완료.
- [2026-09-13 Cache Components 실험](../../worklog/2026-09/2026-09-13-docs-cache-components-experiment.md): 전체 앱은 locale 경계에서 실패, 최소 앱의 함수 캐시 단독 구성은 통과. 운영 전환은 보류.
- [2026-09-13 갱신 정책 비교 결과](../../worklog/2026-09/2026-09-13-docs-cache-policy-comparison-test.md): 기존 모델에서 `max`와 `expire: 0` 비교 완료. Cache Components 결과는 별도 실험 기록에서 다룬다.
- [로컬 production 캐시 테스트](../../runbooks/docs-content-cache-production-test.md)
- [개선 우선순위](../../architecture/docs-content-cache-improvement-backlog.md)
- [통합 테스트 실험 노트](./next-data-cache-integration-lab.md)
