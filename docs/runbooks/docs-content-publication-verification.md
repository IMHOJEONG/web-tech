# 콘텐츠 게시 결과 확인

## 목적과 준비 조건

캐시 만료 성공과 실제 게시 성공을 구분한다. `revalidated: true`는 캐시 만료를 요청했다는 뜻이며 목록·검색·상세에 기대한 글이 보인다는 증거는 아니다.

- 저장소 checkout과 Node.js 24, 설치된 docs 의존성이 필요하다. NAS의 API 컨테이너 안에서 이 명령을 실행하는 것은 아니다.
- 원격 글은 NAS 저장 후 API의 작성 규칙 검사를 먼저 통과해야 한다. 로컬 글은 파일이 포함된 새 프론트 배포가 필요하며 웹훅만으로 파일이 교체되지 않는다.
- 공개 조회가 가능한 동일 origin과 대상 글의 기대값 JSON을 준비한다. Deployment Protection을 우회하는 토큰·cookie는 지원하지 않는다.
- 기본 모드의 POST는 운영 캐시를 만료하므로 운영자가 대상 deployment와 게시 내용을 확인한 뒤 실행한다. 이 문서의 검증 기록은 로컬 테스트이며 운영 실행 완료를 의미하지 않는다.

## 실행 순서

### 1. 기대값 준비

게시할 **새 버전**을 기준으로 저장소 밖에 JSON 파일을 작성한다. 아래 경로·제목·표식은 예시이며 실제 공개 글에 맞춰 바꾼다. 표식은 공개 글의 자연스러운 문장 일부를 선택해도 된다. 비밀값이나 원문 전체를 넣지 않는다.

```json
{
  "documentPath": "/ko/docs/web/publication-probe",
  "listPath": "/ko/docs",
  "title": "게시 확인 문서 V2",
  "summaryMarker": "두 번째 버전의 요약",
  "searchQuery": "게시 확인 문서",
  "bodyMarkers": ["두 번째 버전의 첫 문장", "두 번째 버전의 마지막 문장"],
  "timeoutMs": 60000,
  "requestTimeoutMs": 5000,
  "pollIntervalMs": 1000,
  "maxAttempts": 10
}
```

- `documentPath`: 주소창의 언어 포함 상세 경로. query·fragment 없이 지정한다.
- `listPath`: 글의 카드가 실제로 있는 언어 포함 목록 경로. 페이지네이션이 있으면 `/ko/docs?page=2`처럼 해당 페이지를 지정한다. 전체 페이지를 자동 탐색하지 않는다.
- `title`: 카드와 검색 결과의 새 제목 전체. `summaryMarker`는 해당 카드와 검색 결과의 요약에 포함된 새 문구다.
- `searchQuery`: 공유 검색 규칙에 맞는 40자 이하의 정규화된 검색어. 해당 글이 API 결과에 포함될 만큼 구체적으로 선택한다.
- `bodyMarkers`: 상세 `.mdx-wrapper`에 보이는 새 본문 문구 1~10개. 처음과 끝의 두 문구를 권장하며 화면 표시 기준 공백을 사용한다. 코드 복사 데이터나 HTML 주석 등 숨겨진 텍스트는 쓰지 않는다.
- 이전 버전에도 있는 문구만 선택하면 버전 변경을 증명하지 못한다. V2만의 요약·본문 문구를 사용한다. 제목이 바뀌지 않는 수정이면 제목은 유지하고 문구로 변경을 구별한다.

검색 API의 결과 `href`는 언어 없는 `/docs/...`다. 검증기는 검색에만 언어 접두사를 제거해 대조하며, 목록 링크는 지정한 언어의 경로와 정확히 대조한다.

### 2. 캐시 만료와 공개 반영 확인

저장소 루트에서 실행한다. 토큰 파일에는 Vercel의 `BLOG_CONTENT_REVALIDATE_TOKEN`과 일치하는 별도 관리 토큰이 있어야 한다. API 읽기 토큰과 혼용하지 않는다.

```bash
DOCS_CONTENT_REVALIDATE_URL=https://heap-forge.app/api/revalidate/content \
DOCS_CONTENT_REVALIDATE_TOKEN_FILE=/volume1/docker/heap-forge/secrets/docs_revalidation_token \
DOCS_CONTENT_VERIFY_FILE=/volume1/docker/heap-forge/publication/expectation.json \
pnpm --filter docs revalidate:content-cache
```

기본 동작은 기대값 검증 → 인증 POST **1회** → 공개 목록·검색 API·상세 GET 검사다. 인증 헤더는 POST에만 전송한다. 공개 GET에는 인증·cookie·캐시 우회 query를 넣지 않고 redirect도 따라가지 않는다.

### 3. 목적을 구분한 선택 모드

이미 웹훅을 호출했거나 로컬 글의 새 배포를 확인할 때는 POST 없이 검사한다. 이 모드에는 토큰 파일이 필요 없다.

```bash
DOCS_CONTENT_REVALIDATE_URL=https://heap-forge.app/api/revalidate/content \
DOCS_CONTENT_VERIFY_FILE=/volume1/docker/heap-forge/publication/expectation.json \
pnpm --filter docs revalidate:content-cache --verify-only
```

기존처럼 캐시 만료만 실행해야 할 때는 명시적으로 선택한다. 아래 명령의 종료 코드 0을 게시 성공으로 기록하면 안 된다.

```bash
DOCS_CONTENT_REVALIDATE_URL=https://heap-forge.app/api/revalidate/content \
DOCS_CONTENT_REVALIDATE_TOKEN_FILE=/volume1/docker/heap-forge/secrets/docs_revalidation_token \
pnpm --filter docs revalidate:content-cache --invalidate-only
```

**이전 명령과의 차이:** 기본 모드에서 `DOCS_CONTENT_VERIFY_FILE`이 없거나 잘못된 JSON이면 POST 전에 실패한다. 기존 호출자는 기대값 파일을 추가하거나 `--invalidate-only`로 의도를 명시해야 한다.

## 기대 결과

```text
[docs] Content cache invalidated; this alone does not confirm publication.
[docs] Publication check attempt=1 list=fresh search=fresh article=fresh
[docs] Publication verified attempts=1 elapsedMs=...
```

일반·`--verify-only` 모드는 한 순회의 세 검사 모두 일치하고 제한 시간이 지나지 않아야 종료 코드 0이다. 서로 다른 순회의 성공을 합치지 않는다. 이는 순차 HTTP 관측이며 여러 응답의 원자적 스냅샷이나 모든 독자의 브라우저 갱신을 보장하지 않는다.

목록은 대상 링크가 유일한 카드 안의 제목·요약, 검색은 대상 경로가 유일한 결과의 제목·요약, 상세는 `.mdx-wrapper` 안의 모든 본문 문구를 검사한다. HTTP 200이나 hydration script 안의 문구만으로 성공하지 않는다.

기본값은 10회, 검사 루프 전체 60초, 개별 응답 5초, 순회 사이 1초다. 성공하면 즉시 종료한다. 최대 설정은 30회·300초·개별 30초·간격 30초이며 순회당 GET은 최대 3회다. POST에는 별도 5초 제한이 있다. 전체 응답 스트림을 제한 시간 안에 읽고 응답당 5 MiB를 넘으면 중단한다.

로그는 검사 종류·상태·시도 횟수·시간·실패 상태 코드만 기록한다. 제목·검색어·본문·토큰·token 파일 경로·upstream 응답 전체는 출력하지 않는다.

## 실패 대응과 복구

- `stale`: 응답은 왔지만 기대값과 다르다. 대상 목록 페이지, 검색 결과 포함 여부, V2 표식과 문서 유효성, 올바른 배포를 확인한다.
- `unavailable`: GET의 네트워크·응답 시간 초과, 비정상 HTTP 상태 또는 content-type을 확인한다. 남은 횟수·시간 안에서 공개 GET만 반복한다.
- `pending`: 전체 제한 시간이 먼저 끝나 해당 순회에서 아직 검사하지 못했다.
- 401/403·429·redirect는 즉시 종료 코드 1이다. 인증·WAF·언어 경로·배포 보호 설정을 먼저 확인하며 자동으로 반복하지 않는다.
- POST 실패·응답 유실에서도 자동 재전송하지 않는다. 실제 캐시는 이미 만료됐을 수 있으므로 로그 확인 후 `--verify-only` 또는 운영자가 승인한 새 호출을 선택한다.
- 불일치·시간 초과는 종료 코드 1이다. NAS 원문이나 프론트 배포를 자동 수정·삭제·롤백하지 않는다. 필요하면 기존 복구 절차로 별도 원복 후 다시 검사한다.

## 관련 검증

- [로컬 모의 서버·production 캐시 검증](../verification/cache/2026-10-08-content-publication-verifier.md)
- [캐시 갱신 정책](../architecture/docs-content-cache-revalidation-policy.md)
- [NAS 배포 절차](docs-backend-nas-deployment.md)
- [토큰 수명 관리](../architecture/docs-secret-token-lifecycle-policy.md)
- [작업 기록](../worklog/2026-10/2026-10-08-content-publication-verifier.md)
