# Locale 캐시 키 분리 재현 가이드

## 목적과 준비 조건

`readCopy(locale)`의 ko/en 인자가 별도 캐시 키로 작동하는지 확인한다.
같은 문구가 나오는 것만으로 캐시 적중이라 판단하지 않고, 함수 실행 때 생성한
`executionId`를 함께 비교한다. 읽을 때마다 새 UUID가 나오면 재사용 검증은 실패한다.

이번 fixture는 실제 메시지 JSON에서 설명을 선택한다. 원격 문서 본문이
다국어로 저장/조회된다는 것을 검증하는 시험은 아니다.

### 준비

저장소 루트에서 수행한다. Node.js 24, 설치된 의존성, 공용 패키지 빌드가 필요하다.
현재 개발 중인 `.env`나 NAS 연결은 필요하지 않다.

```bash
cd /Users/coder/Desktop/project/web-tech
mise exec -- node -p "JSON.stringify({node:process.version,next:require('./apps/docs/node_modules/next/package.json').version})"
mise exec -- pnpm --filter @web-tech/docs-content-contract build
mise exec -- pnpm --filter @web-tech/ui build
```

공용 패키지는 기존 설치를 공유하므로 시험 도중 다른 터미널에서 의존성이나
공용 패키지를 변경하지 않는다. 개발 서버의 `.next`는 사용하지 않는다.

## 실행 순서

```bash
set -o pipefail
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs --locale-cache-key 2>&1 | tee /tmp/docs-locale-cache-key.log
echo $?
```

`pipefail`을 켜야 tee의 성공이 테스트 실패를 가리지 않는다.
마지막 종료 코드가 0이고 `All checks passed`가 있어야 전체 통과다.
빌드 실패 시 같은 명령에 `--debug-prerender`를 추가한다.

다시 실행하면 새 임시 앱과 토큰을 만들기 때문에 UUID 자체는 매번 달라진다.
아래처럼 해당 실행 안에서 유지/변경 관계가 맞는지 검증한다.

## 내부 실행 과정

1. OS 임시 디렉터리에 앱을 복사하고 `.env`, `.next`는 제외한다.
2. Cache Components와 임시 루트 `instant = false`를 적용한다. 운영 파일은 그대로 둔다.
3. 함수 캐시 단독 구성으로 fetch TTL을 0으로 설정한다. 함수 캐시의 revalidate는 3600초다.
4. `next build --webpack`과 loopback `next start`, 가짜 콘텐츠 서버를 실행한다.
5. 기존 언어 경계 10개 사례를 검사한 뒤 `/api/locale-cache-probe`를 호출한다.
6. 언어별 UUID, 메시지, 만료 전후 관계를 검사하고 기존 콘텐츠 캐시/상세 회귀 시험도 실행한다.
7. 테스트 서버와 임시 앱을 종료/삭제한다. 개발 서버와 NAS는 건드리지 않는다.

임시 API는 운영 앱에 존재하지 않는다. GET은 캐시 밖에서 `getLocale()`를 호출한 뒤
정규화된 locale만 `readCopy(locale)`에 넘긴다. 해당 함수는 cookies/headers를 읽지 않는다.
응답에는 `Cache-Control: no-store`를 지정해 HTTP 응답 캐싱과 함수 캐싱을 구분한다.

POST는 매번 생성한 임시 토큰으로 인증하고 ko/en만 허용한다.
`test:locale-copy:ko` 또는 `test:locale-copy:en`을 `expire: 0`으로 만료한다.
프로덕션의 원격 콘텐츠 공통 태그를 locale 태그로 변경하는 작업은 아니다.

## 기대 결과

| 단계                      | 기대 관계                                         |
| ------------------------- | ------------------------------------------------- |
| 최초 ko/en                | 번역은 각 locale JSON과 일치하고 UUID는 서로 다름 |
| ko/en 재요청              | 각각 최초 UUID와 동일                             |
| warm 동시 요청 4개        | ko/en/ko/en 각각 해당 최초 결과와 동일            |
| 토큰 누락/오류            | 401, 기존 두 UUID 유지                            |
| 인증은 정상이나 locale=fr | 400, 기존 두 UUID 유지                            |
| ko만 만료 후 조회         | ko UUID 변경, en UUID 유지                        |
| en만 만료 후 조회         | en UUID 변경, 갱신된 ko UUID 유지                 |
| 갱신 후 반복 요청         | 새 UUID 재사용                                    |

캐시 키 분리와 태그 분리는 서로 다르다. 인자 locale은 캐시 항목을 나누고,
언어별 태그는 어떤 항목을 만료시킬지 정한다. 같은 태그를 쓰면 키가 달라도 함께 만료될 수 있다.

## 관련 검증

- [시험 fixture](../../apps/docs/scripts/fixtures/locale-cache-probe.ts): locale 인자, cacheTag, UUID 생성, 인증.
- [검증 모듈](../../apps/docs/scripts/test-utils/assert-locale-cache-key.mjs): deepEqual/notEqual assertion.
- [실행기](../../apps/docs/scripts/test-content-cache-prod.mjs): 격리 복사, 빌드, 시작과 정리.
- [실제 결과](../worklog/2026-09/2026-09-14-docs-locale-cache-key-test.md): 관측 UUID와 환경.

## 실패 대응과 복구

- 이 시험은 단일 로컬 next start 인스턴스의 warm 캐시 동작을 검증한다.
- cold 동시 요청의 중복 실행 억제, 서버 재시작, Vercel 다중 인스턴스 캐시 공유는 별도 시험이다.
- 브라우저 hydration, Router Cache, 언어 전환 UI와 정적 셸 성능은 검증하지 않는다.
- 초기 UUID 관계가 틀리면 cache 인자/본문의 요청 상태 접근 여부를 확인한다.
- 선택적 만료가 틀리면 locale별 태그 생성과 revalidateTag 인자를 확인한다.
- HTTP 200 또는 문구 일치만으로 통과로 판단하지 않는다. UUID 관계 assertion이 필요하다.

공식 원리: [use cache의 cache key와 요청 데이터 경계](https://nextjs.org/docs/app/api-reference/directives/use-cache).
