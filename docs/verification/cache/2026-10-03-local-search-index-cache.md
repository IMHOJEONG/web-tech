# 로컬 검색 인덱스 캐시 검증

## 대상과 조건

- 확인일: 2026-10-03, KST. `feature/docs`의 미커밋 변경.
- Node 24.12.0, Next 16.3.4. 설치한 공용 패키지 사용.
- 실제 `.env`를 제외한 임시 복사본과 loopback 원본 서버. 운영 Vercel/NAS는 호출하지 않았다.
- 최소 셸 검색 통합 2회(최초 테스트 검색어 충돌로 실패, 수정 후 통과), 전체 docs 기존 캐시 통합 1회 통과.

## 재현 방법

저장소 루트에서 공용 패키지 빌드 후 다음 명령을 실행한다.

```sh
mise exec -- pnpm --filter docs test:lib
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs --search-index
mise exec -- pnpm --filter docs test:cache:prod
```

명령은 임시 앱에서 `next build --webpack`과 `next start`를 실행하고 정리한다. 비밀값과 실제 배포 ID는 저장하지 않는다. 절차·준비 조건은 [runbook](../../runbooks/docs-content-cache-production-test.md#로컬-검색-인덱스-재사용과-만료)을 따른다.

## 결과와 증거

- 통과: 라이브러리 테스트 204개. 새 검사 3개는 canonical 경로·draft 제외·본문 보존, 문서/경로 변경에 따른 digest, 개발 환경 캐시 우회를 검사했다.
- 통과: 검색 인덱스를 읽은 뒤 원본 fixture를 V2로 바꿔도 반복 요청과 다른 검색어는 V1을 유지한다. 동적 Route Handler의 결과 캐시가 아니라 실제 검색 로더의 Data Cache를 검사한다.
- 통과: 누락·잘못된 토큰은 401이며 V1 유지. 정상 webhook 뒤 다음 조회에서 V2를 반환하고 V1 요약 검색 결과는 사라진다. webhook은 원본 서버 조회 수를 증가시키지 않는다.
- 통과: draft 전환·파일 삭제 뒤 인증된 만료와 재조회에서 해당 문서가 사라진다. 원격 503에서도 로컬 문서 조회는 성공한다. 원격 복구 뒤 추가 webhook 없이 원격 결과를 조회한다.
- 통과: 로컬 파싱 실패는 500이며 빈 인덱스로 저장되지 않는다. 파일 복구 후 같은 인덱스 조회가 성공한다.
- 통과: 전체 앱의 격리 production 빌드와 locale URL·canonical·sitemap·API·404, 원격 목록/본문 재사용·인증·expire:0·max 비교·실제 V3 상세 응답 회귀.

검색 fixture 실행 출력:

```text
[PASS] Local index reused across queries; drafts excluded; authorized webhook refreshes V2 { coldRequestMs: 45, warmRequestMs: 4 }
[PASS] Unpublishing and deletion remove cached local results after invalidation
[PASS] Remote failure keeps local search; recovery fetches remote without another webhook
[PASS] Failed local parsing is not stored as an empty index
[cache-test] All checks passed
```

45ms/4ms는 최소 셸 HTTP 요청 한 쌍의 관측값이며 일반적인 개선율·실사용 p75로 해석하지 않는다. 최초 실패는 광범위한 `CACHE_LOCAL` 검색어가 기존 글 본문에도 일치한 테스트 조건 문제였다. 특정 fixture 요약으로 검사해 해결했으며 앱의 검색 알고리즘은 바꾸지 않았다.

## 한계와 후속 작업

Vercel 실제 Data Cache·재배포 키 변경·NAS 게시·브라우저 Router Cache는 미검증이다. TTL 자연 만료와 동시 cold 요청 중복도 이번 시험 범위 밖이다. 개발 bypass는 선택 조건 단위 검사이며 실제 dev 편집 브라우저 시험은 수행하지 않았다. production 전체 앱에서 목록·검색 DOM의 게시 갱신은 기존 브라우저 회귀를 배포 전후 추가 실행한다.

## 관련 문서

- [선택 이유](../../architecture/adr-0011-local-search-index-cache.md)
- [변경 전 비용](../performance/2026-10-03-search-index-cost.md)
- [작업 기록](../../worklog/2026-10/2026-10-03-local-search-index-cache.md)
