# 언어별 URL 전환 후 정적 셸 검증

## Summary

`feature/docs`를 `origin`에 push했고 Everything up-to-date를 확인했다.
확인 당시 HEAD와 origin/feature/docs는 모두 `648932153358cff1046deb1007a65f87c3219d50`이었다.
기존 운영 캐시 모델은 통과했지만, Cache Components를 켠 전체 앱은 정적 셸 검증에 실패했다.
운영 next.config.mjs는 변경하지 않았다.

## Changed

이번 작업은 push와 검증 및 기록만 수행했다. 실패를 숨기기 위해 instant=false를 추가하지 않았다.
작업 중 별도로 변경된 `normalize-remote-article-html.ts`는 수정하거나 커밋하지 않았다.
시험은 작업 트리의 임시 복사본을 사용하므로 배포 커밋만으로 만든 아티팩트 검증이나 Vercel 실배포 확인과는 구분한다.

## Notes

### 재현 명령

저장소 루트에서 Node 24(mise)로 실행했다. 실제 NAS/인증정보 대신 모의 서버와 임시 토큰을 사용한다.

```sh
mise exec -- git push origin feature/docs
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs --cache-components
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs --cache-components --debug-prerender
```

### 기존 운영 모델: PASS

- next build --webpack 및 next start.
- 언어 URL 우선순위, 기존 URL query 유지, canonical/hreflang, sitemap, API 인증, 404.
- 최초 조회와 캐시 재사용, expire: 0의 원본 대기 후 V2 반환.
- 비인증 요청 거부, 목록/본문 무효화.
- max의 stale V2 반환 후 백그라운드 V3 갱신 및 재사용.
- 상세 페이지 V3 렌더링.

이번 로컬 모의 서버 측정값은 expire: 0 118ms, max stale 응답 6ms였다. 운영 성능 보장값은 아니다.

### Cache Components 전체 앱: FAIL

Next 16.3.4에서 컴파일과 TypeScript 검사는 통과했지만 prerender 단계에서 종료 코드 1로 실패했다.
테스트 서버 실행 및 캐시 동작 검증 단계에는 도달하지 않았다.

일반 빌드에서 확인한 핵심 오류:

```text
Route "/[locale]/feed": Next.js encountered uncached or runtime data during prerendering.
Route "/[locale]/category/[main]/[sub]": Next.js encountered URL data `usePathname()` in a Client Component outside of `<Suspense>`.
```

디버그 빌드에서 확인한 소스 위치:

- `widgets/app-shell/ui/footer.tsx:37`: locale-aware Link 렌더링 내부에서 pathname에 접근. Footer 자체에서 훅을 직접 호출한다고 단정하지 않는다.
- `widgets/app-shell/ui/mobile-bottom-nav.tsx:43`: usePathname.
- `widgets/category-sidebar/ui/category-sidebar.tsx:26`: usePathname.
- `app/[locale]/category/page.tsx:24`: 페이지 데이터 조회 중 런타임/미캐시 데이터 접근.
- `/[locale]/docs`: searchParams의 then 접근이 Suspense 밖에서 발생.

소스 확인상 `/feed`도 Page 시작에서 searchParams를 await한다. 검색 조건은 요청마다 달라 언어별 URL 도입만으로 정적으로 결정되지 않는다.
이번 로그로 모든 실패 지점을 다 찾았다고 보장하지 않는다. 빌드 실패 순서는 실행마다 달랐다.

## Open Questions

- URL locale 전환은 요청 쿠키 기반 번역 의존성을 줄이지만, 다른 runtime 데이터 경계까지 해결하지 않는다.
- 각 UI의 fallback 높이/내용과 스트리밍 후 레이아웃 이동을 함께 검토해야 한다.
- 빌드 통과 이후에도 함수 캐시와 기존 fetch 캐시의 중복 계층 및 재검증을 별도로 시험해야 한다.

## Next

1. 공용 UI의 pathname 의존 부분을 최소 Suspense 경계로 분리한다. 루트 전체를 감싸 빈 셸로 통과시키지 않는다.
2. feed/docs의 검색 조건 처리를 하위 비동기 컴포넌트로 이동하고 의미 있는 fallback을 둔다.
3. category/detail의 params와 데이터 조회 경계에 대해 정적 생성, 캐시, Suspense 중 적절한 책임을 정한다.
4. 같은 명령을 다시 실행해 정적 셸 검증과 캐시 갱신을 모두 확인한 뒤 운영 활성화 여부를 결정한다.
