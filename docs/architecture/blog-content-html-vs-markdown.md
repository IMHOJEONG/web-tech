# Blog Content Delivery: HTML vs Markdown

## Context

`apps/docs`는 블로그 목록 메타데이터를 백엔드에서 받고, 개별 본문은 별도 엔드포인트로 다시 가져오는 구조를 준비 중이다.

현재 확인된 백엔드 본문 엔드포인트 예시:

- `<BLOG_CONTENT_MARKDOWN_BASE_URL>/posts/test`

이 엔드포인트는 현재 `200 OK`와 함께 `text/html`을 반환한다. 따라서 앞으로의 선택지는 크게 두 가지다.

1. 백엔드는 markdown 원문을 반환하고, 프론트가 markdown/MDX를 렌더링한다.
2. 백엔드는 HTML을 반환하고, 프론트는 렌더링된 HTML을 표시한다.

## Option 1: Markdown Response

### 장점

- 프론트가 표현을 더 많이 통제할 수 있다.
- TOC, 코드 하이라이트, 커스텀 MDX 컴포넌트 연결이 쉽다.
- 동일한 markdown 소스에서 여러 표현 방식으로 재가공하기 좋다.
- Git 기반 문서 관리와 잘 맞는다.

### 단점

- 렌더링 책임이 프론트에 있다.
- 웹 외 다른 클라이언트가 생기면 각 클라이언트가 markdown 렌더링 규칙을 맞춰야 한다.
- 프론트와 백엔드가 markdown 파이프라인 차이로 서로 다른 결과를 낼 수 있다.
- 현재 백엔드가 HTML을 반환하는 구조와는 어긋난다.

### 잘 맞는 경우

- 문서 사이트가 MDX 컴포넌트 중심일 때
- 프론트에서 문서 표현을 적극적으로 커스터마이즈해야 할 때
- 작성 포맷 자체를 제품 역량으로 다뤄야 할 때

## Option 2: HTML Response

### 장점

- 현재 백엔드 엔드포인트 상태와 바로 맞는다.
- 렌더링 책임을 서버 한 곳으로 모을 수 있다.
- 여러 클라이언트가 같은 결과를 소비하기 쉽다.
- NAS나 CMS에서 변환된 산출물을 바로 제공하기 편하다.

### 단점

- 프론트가 본문 구조를 재가공하기 어렵다.
- TOC, heading anchor, 코드 블록 enhancement 같은 문서 기능을 프론트에서 추가하기 까다롭다.
- 신뢰되지 않은 HTML이면 sanitize 정책이 필요하다.
- MDX 컴포넌트 생태계를 그대로 쓰기 어렵다.

### 잘 맞는 경우

- 백엔드가 문서 렌더링 규칙을 소유해야 할 때
- 여러 소비처가 동일한 HTML 결과물을 써야 할 때
- 문서 본문을 "완성된 산출물"로 전달하는 운영 모델일 때

## Practical Comparison

### 저장 포맷과 전송 포맷은 분리해서 생각하는 편이 좋다

실무에서는 `저장 포맷`과 `클라이언트 전달 포맷`을 같은 문제로 보지 않는 경우가 많다.

- 저장은 markdown
- 전달은 HTML

이 조합이 꽤 흔하다. 작성과 버전 관리에는 markdown이 유리하고, 배포와 렌더링 일관성에는 HTML이 유리하기 때문이다.

즉 질문을 이렇게 다시 나누는 것이 더 정확하다.

1. 원본 문서를 무엇으로 저장할 것인가
2. 프론트에는 무엇을 내려줄 것인가

## Recommendation

현재 프로젝트 상황에서는 단기와 장기를 나눠 보는 것이 좋다.

### 단기 추천

백엔드 응답은 **HTML 허용**으로 가는 편이 현실적이다.

이유:

- 현재 `/posts/{markdownPath}` 엔드포인트가 이미 HTML을 반환한다.
- 프론트에서 이를 수용하는 쪽이 백엔드 렌더링 구조를 뒤집는 것보다 비용이 낮다.
- 문서 운영이 NAS/백엔드 중심으로 갈 가능성이 높다.

### 중장기 추천

원본 저장은 가능하면 **markdown 유지**, 전송은 **HTML**로 가져가는 하이브리드가 가장 안정적이다.

이유:

- 작성/수정/리뷰/버전관리에는 markdown이 훨씬 다루기 쉽다.
- 클라이언트 전달은 HTML이 렌더링 일관성과 운영 단순성에서 유리하다.
- 나중에 RSS, 검색 인덱싱, 요약 파이프라인, LLM 파싱 등에 원문 markdown이 있으면 활용 폭이 넓다.

## What This Means for `apps/docs`

HTML 응답을 채택하면 프론트는 다음 방향으로 바뀌어야 한다.

- 원격 문서는 MDX 평가 대신 HTML 렌더링 경로를 둔다.
- 로컬 문서는 기존 MDX 흐름을 유지할 수 있다.
- 원격 문서가 HTML인지 markdown인지 구분할 메타데이터가 있으면 더 안전하다.
- HTML sanitize 정책을 정한다.
- TOC가 필요하면:
  - 백엔드가 heading id와 TOC 데이터를 같이 내려주거나
  - 프론트가 HTML 파싱 후 heading을 추출해야 한다.

## Suggested Decision

현재 기준 권장안:

- 저장 포맷: markdown 유지
- 백엔드 본문 응답: HTML 허용
- 프론트 렌더링: 원격 문서는 HTML, 로컬 문서는 MDX 유지

이 방식은 현재 백엔드 상태와 가장 잘 맞고, 이후에도 markdown 원본 자산을 잃지 않으면서 운영 유연성을 유지한다.

## Follow-up Questions

- 원격 문서는 sanitize를 어디까지 적용할지
- heading id / TOC를 백엔드가 같이 내려줄지
- 코드 하이라이트를 백엔드가 완료할지, 프론트가 후처리할지
- 로컬 문서와 원격 문서를 장기적으로 하나의 렌더링 파이프라인으로 통일할지

## Security Considerations In Current Code

현재 코드 방식에서는 아래 리스크를 실제로 고려해야 한다.

### 1. Raw HTML Rendering Risk

현재 원격 문서가 `html`로 판별되면 프론트는 해당 본문을 그대로 렌더링한다.

- 관련 위치: `apps/docs/app/docs/[slug]/page.tsx`
- 현재 방식: `dangerouslySetInnerHTML`

이 경우 백엔드나 NAS에 저장된 HTML이 신뢰되지 않거나 변조될 수 있으면 XSS 계열 문제가 생길 수 있다.

특히 아래 요소는 주의 대상이다.

- 인라인 이벤트 핸들러
- 악성 링크(`javascript:` 등)
- 외부 iframe/embed
- 의도하지 않은 form/script 스타일 주입

즉 HTML 응답을 허용한다면, 실무적으로는 **백엔드 sanitize** 또는 **프론트 sanitize** 중 적어도 하나는 필요하다.

### 2. Remote MDX Evaluation Risk

현재 코드는 원격 본문이 `html`이 아니면 `mdx`로 간주해 평가한다.

- 관련 위치: `apps/docs/app/docs/[slug]/page.tsx`
- 관련 판단: `apps/docs/lib/content-api.ts`

이건 단순 markdown 렌더링보다 위험하다. MDX는 표현력이 강해서, 신뢰되지 않은 원격 입력을 그대로 평가하는 구조는 보수적으로 봐야 한다.

따라서 원격 입력에 대해서는 다음 중 하나가 더 안전하다.

- 원격 문서는 항상 HTML만 허용
- 원격 문서는 markdown-only 파서로 처리
- MDX 평가는 로컬/신뢰 문서에만 제한

현재 구조에서 보안 관점의 안전한 방향은 **원격은 HTML 또는 plain markdown만 허용하고, MDX 평가는 로컬 콘텐츠 전용으로 두는 것**이다.

### 3. Server-side Fetch Target Control Risk

현재 본문 URL은 메타데이터 응답의 `markdownPath` 또는 `markdown_url` 계열 값에 의해 결정된다.

- 관련 위치: `apps/docs/lib/content-api.ts`

특히 절대 URL(`http://...`)을 허용하면, 메타데이터 공급자가 의도하지 않은 외부/내부 주소를 지정하도록 만들 수 있다.

이 경우 SSRF 성격의 문제가 생길 수 있다.

안전하게 가려면:

- 절대 URL 금지
- 허용 호스트 allowlist 적용
- `markdownPath`는 상대 경로만 허용
- `..` 같은 상위 경로 이동 패턴 거부

### Practical Recommendation

현재 구조를 유지하면서 위험을 낮추려면 우선순위는 이렇다.

1. 원격 문서는 HTML만 허용하고 sanitize 정책을 정한다.
2. 원격 문서는 MDX 평가 대상에서 제외한다.
3. `markdown_url` 절대 URL 허용을 막거나 allowlist를 둔다.
4. `markdownPath` 입력값 검증을 추가한다.

즉 “HTML이냐 markdown이냐”보다 더 중요한 것은, **신뢰되지 않은 원격 본문을 어떤 실행/렌더링 규칙으로 통과시키느냐**다.

### Current Mitigations Applied

현재 코드에는 아래 방어가 이미 반영되어 있다.

- 원격 본문은 HTML이 아니면 렌더링 대상에서 제외
- 원격 본문 URL은 상대 경로만 허용
- 절대 URL, `..`, 백슬래시, 제어 문자가 포함된 경로는 거부
- 원격 HTML은 기본적인 위험 태그/속성 제거 후 렌더링

다만 이건 **기본 방어선**에 가깝고, 장기적으로는 백엔드 sanitize까지 함께 두는 것이 더 안전하다.
