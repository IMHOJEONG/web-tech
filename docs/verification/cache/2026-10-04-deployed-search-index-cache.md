# 배포 환경 검색 인덱스 캐시 검증

## 대상과 조건

- 확인일: 2026-10-04, KST. `feature/docs`, 커밋 `52b3017` (캐시 구현 `e6211e6`).
- Vercel API에서 해당 SHA의 Production READY와 `heap-forge.app` alias를 확인했다. 배포 ID와 요청 UUID는 공개 보고서에서 제외한다.
- 공개 검색 API 연속 5회, 페이지 HTML 4개, 미인증 웹훅 2회. NAS 문서와 환경 변수는 수정하지 않았다.
- 응답의 `x-docs-request-id`로 Runtime Logs를 조회했고 모든 검색 로그가 새 배포에 속했다.

## 재현 방법

저장소 루트에서 완료한 커밋 3개를 `git push origin feature/docs`로 게시했다. 기존 미커밋 복구 정책 문서는 포함하지 않았다.

```sh
gh run list --repo IMHOJEONG/web-tech --branch feature/docs --limit 5
gh run watch 37182830470 --repo IMHOJEONG/web-tech --exit-status --interval 30
vercel list web-tech --scope hojeong-ims-projects
```

측정은 Node fetch로 응답 본문까지 읽는 시간을 기록했다. 검색어 순서는 React, accessibility, React, rendering, React이며 간격은 약 1.5초였다. 같은 응답과 로그를 수동 확인하려면 다음 명령을 사용한다. UUID는 로컬에서만 대입하며 원본 로그를 그대로 Git에 저장하지 않는다.

```sh
curl -sS -D - 'https://heap-forge.app/api/search?q=React'
vercel logs --project web-tech --scope hojeong-ims-projects \
  --environment production --since 15m --query '<x-docs-request-id>' \
  --json --limit 10 --no-follow
curl -i -X POST 'https://heap-forge.app/api/revalidate/content'
```

첫 반복 조회에서는 정상 POST를 실행하지 않았다. 아래 후속 검증에서는 사용자 요청에 따라 정상 POST 1회를 실행해 두 캐시 태그를 만료했다.

## 결과와 증거

- 통과: [CI](https://github.com/IMHOJEONG/web-tech/actions/runs/37182830470)의 Test·공용 UI 2개·Commit Messages·Typecheck·Lint 모두 success. [Documentation](https://github.com/IMHOJEONG/web-tech/actions/runs/37182830498)도 success. 배포 검증과 별개로 해당 SHA의 자동 검사를 확인했다.

| 요청 | 검색어        | HTTP | 결과 수 | HTTP 전체 ms | search-local ms | search-remote ms | search-rank ms | 인덱스 생성 로그 수 |
| ---- | ------------- | ---- | ------- | ------------ | --------------- | ---------------- | -------------- | ------------------- |
| 1    | React         | 200  | 3       | 2393.75      | 259.88          | 82.61            | 14.84          | 1                   |
| 2    | accessibility | 200  | 1       | 946.77       | 7.14            | 6.31             | 4.86           | 0                   |
| 3    | React         | 200  | 3       | 289.45       | 5.94            | 14.24            | 0.80           | 0                   |
| 4    | rendering     | 200  | 2       | 307.71       | 9.64            | 5.58             | 0.77           | 0                   |
| 5    | React         | 200  | 3       | 472.98       | 5.79            | 7.69             | 0.83           | 0                   |

- 통과: 모든 검색 단계 success. 병합 전 로컬 10개·원격 1개·합계 11개 유지, 검색 결과 href 중복 없음.
- 관측: 첫 요청의 `[docs.search_index_build] { documentCount: 10 }` 이후 다른 검색어를 포함한 4회에는 추가 생성 로그가 없었다. 요청 간 인덱스 재사용과 일치한다.
- 통과: `/ko/docs?q=React`, `/en/docs?q=React`, `/ko/feed`, `/ko/docs/web/javascript-event-loop-runtime` 모두 HTTP 200, title 포함, 일반 문서 로딩 오류 문구 없음. 브라우저 interaction 검사는 아니다.
- 통과: 웹훅 토큰 누락·잘못된 토큰 각각 HTTP 401, `private, no-store`, 동일한 Unauthorized 응답.
- 증거: [식별자를 제거한 측정 JSON](../artifacts/2026-10-04-deployed-search-index-cache.json). 요청 ID는 비공개 임시 파일에서만 대조했다.

모든 검색 응답의 `x-vercel-cache`는 MISS였다. 공개 응답 캐시 표시이며 내부 Data Cache 미적중을 의미하지 않는다. `search-local`은 캐시 조회 또는 실제 생성 전체를 측정한다. HTTP 시간에는 네트워크·시작 비용 등도 포함된다.

## 한계와 후속 작업

### 정상 웹훅과 재조회 후속 검증

- 통과: 로컬 `.env`의 API 읽기 토큰을 출력하지 않고 backend 목록을 조회해 HTTP 200, 공개 원격 문서 1개를 확인했다.
- 통과: 정상 웹훅 POST 1회가 HTTP 200, `revalidated: true`, `private, no-store`를 반환했다. 완료 시각은 `2026-10-04T06:46:56.911Z` (KST 15:46:56.911)이다. 인증값·요청 ID는 저장하지 않았다.
- 통과: 이후 `/api/search?q=browser`, `/ko/docs`, `/ko/docs/web/browser`, `/api/search?q=React` 모두 HTTP 200, 일반 로딩 오류 문구 없음.
- 관측: 첫 검색과 목록 각각 로컬 인덱스 생성 로그 1개. 마지막 React 검색은 추가 생성 로그 없이 local 7.05ms. 서로 다른 라우트에서 별도로 생성됐으므로 전역 단일 생성 보장으로 해석하지 않는다.
- 통과: 원격 상세의 source 로그는 remote, `remote-detail` success 892.87ms, 본문 렌더링 success 4.19ms. 조회·선택·렌더링 정상 여부를 확인한 것이며 새 버전의 반영 증거는 아니다.
- 증거: [웹훅 이후 측정 발췌](../artifacts/2026-10-04-after-revalidation.json). 시간 만료를 통제하지 않았으므로 재생성 로그만으로 웹훅의 단독 인과관계를 주장하지 않는다.
- 미검증: NAS SSH 연결은 설정된 호스트의 DNS 해석 실패로 종료됐다. NAS 파일을 수정·생성·삭제하지 않았으며 V1/V2 게시·원복도 수행하지 않았다. 접근 가능한 SSH 주소와 승인된 테스트 파일 경로가 필요하다.

### 남은 범위

첫 표본이 모든 계층의 cold 상태였다는 보장은 없다. 명시적인 Data Cache HIT 헤더는 없으며 로그 누락 가능성도 있다. 5개 표본으로 p75·일반 개선율·다른 지역/인스턴스의 재사용을 주장하지 않는다. TTL 자연 만료, 동시 cold 요청, 로컬 문서가 달라진 재배포 키 검증은 남아 있다.

NAS 테스트 문서 V1/V2 변경, 정상 webhook, 목록·검색·상세 갱신, 원복은 승인된 문서와 복구 계획을 정한 뒤 수행한다. 로컬 파일은 배포 산출물이므로 NAS 수정만으로 교체되지 않는다. RUM과 모바일 UI 검증도 이번 범위 밖이다.

## 관련 문서

- [로컬 통합 검증](2026-10-03-local-search-index-cache.md)
- [캐시 결정](../../architecture/adr-0011-local-search-index-cache.md)
- [배포 측정 절차](../../runbooks/docs-deployed-performance-measurement.md)
- [작업 기록](../../worklog/2026-10/2026-10-04-deployed-search-index-cache.md)
