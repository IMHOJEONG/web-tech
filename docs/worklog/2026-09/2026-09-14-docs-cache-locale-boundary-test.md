# Cache Components locale 경계 호환성 시험

## Summary

전체 앱의 Cache Components 전환을 막던 루트 locale 처리에 대해,
임시 `instant = false`를 적용한 호환성 시험을 수행했다.
빌드, 언어별 서버 응답 10개 사례, 캐시 갱신, 실제 상세 페이지 검증이 통과했다.
운영 설정 변경이나 성능 최적화 완료를 의미하지 않는다.

## Changed

- `test-content-cache-prod.mjs`: `--locale-boundary` 옵션 추가.
- `cache-locale-layout.mjs`: 임시 앱에서 원래 Layout/metadata를 재수출하고 `instant = false`만 지정.
- `cache-locale-page.tsx`: 원래 next-intl 요청 설정을 사용하는 임시 검증 페이지.
- `test-utils/assert-locale-boundary.mjs`: 언어 응답 검증을 독립 모듈로 분리.
- production 테스트 runbook 및 모델 비교 문서에 결과 연결.

## Notes

### 구성과 범위

원래 `app/layout.tsx`는 임시 복사본에서만 `layout.cache-base.tsx`로 보관한다.
새 임시 Layout은 원래 구현과 generateMetadata를 그대로 사용한다.
쿠키/헤더 우선순위, 메시지 JSON, 실제 운영 파일은 바꾸지 않았다.
`/cache-locale-probe`는 임시 앱에서만 존재한다.

이 모드는 Cache Components를 켜며, 이전에 통과한 함수 캐시 단독 구성을 사용한다.
테스트용 fetch TTL은 0, use cache 함수의 revalidate는 3600초다.
따라서 결과는 `instant = false`와 함수 캐시 단독 구성의 조합에 대한 검증이다.
중첩 캐시 실패가 instant 설정 하나로 해결됐다는 뜻은 아니다.

루트의 `instant = false`는 전체 앱의 정적 셸 검증을 완화한다.
요청 언어를 올바르게 읽도록 허용하는 임시 전환 방법이지,
정적인 화면을 즉시 제공하도록 최적화한 방법은 아니다.
설치된 Next.js 16.3.4의 번들 instant 문서와 동작을 대조했다.
[공식 instant 문서](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/instant)

### 실행 명령

저장소 루트에서:

```bash
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs --locale-boundary --debug-prerender
```

OS 임시 앱에서 `next build --webpack --debug-prerender`, `next start`를 실행했다.
실제 `.env`와 인증값 대신 loopback 원본 및 임시 토큰을 사용한다.
종료 코드 0과 `All checks passed`를 확인했다.

### 언어 검증 결과

| 요청 사례              | 예상 언어 | 결과 |
| ---------------------- | --------- | ---- |
| Accept-Language: ko-KR | ko        | 통과 |
| Accept-Language: en-US | en        | 통과 |
| 이후 ko-KR 재요청      | ko        | 통과 |
| ko 쿠키 + en 헤더      | ko        | 통과 |
| en 쿠키 + ko 헤더      | en        | 통과 |
| 미지원 쿠키 + ko 헤더  | ko        | 통과 |
| 미지원 헤더            | en        | 통과 |
| 언어 설정 없음         | en        | 통과 |
| ko 쿠키 동시 요청      | ko        | 통과 |
| en 쿠키 동시 요청      | en        | 통과 |

각 응답에서 html lang, h1, 본문 설명, title, description, OG description을
현재 ko/en 메시지 값과 비교한다. ko/en 설명이 서로 다르다는 전제도 assertion으로 검사한다.
이는 서버 HTML 응답 검증이며, 브라우저 hydration 또는 Router Cache의 언어 전환 검증은 아니다.
또한 locale별 UI에 use cache를 붙인 실험은 아니다. 그 경우에는 locale 캐시 키 검증이 추가로 필요하다.

### 함께 실행한 캐시/상세 회귀 검사

```text
[PASS] Cold read and Data Cache reuse { index: 2, body: 1 }
[PASS] expire: 0 waited for origin and returned V2 { elapsedMs: 123 }
[PASS] Authentication, lazy invalidation, refreshed index/body { index: 4, body: 2 }
[PASS] max returned stale V2 while origin was held { elapsedMs: 11 }
[PASS] max background refresh and warm V3 reuse { index: 6, body: 3 }
[PASS] Article renders V3 { minimal: false }
[cache-test] All checks passed
```

시간에는 인위적인 원본 응답 보류가 포함된다. 성능 개선 수치로 해석하지 않는다.
공통 로그의 Data Cache reuse 라벨과 달리 이 모드의 재사용 대상은 함수 캐시다.
이번 작업에서 NAS/Vercel 배포 테스트나 운영 설정 변경, 커밋은 하지 않았다.

## Open Questions

- 정적 셸 검증을 다시 켠 상태에서 html lang과 요청 기반 locale을 어떻게 유지할 것인가?
- 실제 브라우저에서 언어 변경 후 탐색/뒤로가기에도 응답이 일관되는가?
- locale을 함수 인자로 받는 캐시와 요청별 metadata를 어떻게 분리할 것인가?

## Next

다음 한 단계는 locale을 명시적인 캐시 키로 전달하는 작은 함수 fixture를 추가하고,
ko/en 캐시가 각각 재사용되면서 서로 섞이지 않는지 검증하는 것이다.
URL에 locale을 추가하거나 운영 루트 레이아웃을 바꾸는 결정은 별도로 한다.
