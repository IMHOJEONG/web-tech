# OG 이미지의 브라우저·Vercel 캐시 헤더 분리

## Summary

브라우저 1시간·Vercel CDN 1일이라는 기존 TTL 의도를 각각의 헤더로 분리했다. Cloudflare를 거친 공개 응답의 4시간 TTL은 별도 운영 설정 문제로 남기고 조치 절차를 문서화했다.

## Changed

- `article-og-cache.ts`의 `Cache-Control: public, max-age=3600`과 `Vercel-CDN-Cache-Control: public, s-maxage=86400`을 OG route에서 사용한다.
- 단위 검사와 로컬 프로덕션 OG E2E에서 두 헤더를 각각 검사한다. 공개 응답에 Vercel 전용 헤더가 보여야 한다는 조건은 추가하지 않았다.
- [공유 이미지 정책](../../architecture/docs-article-metadata-policy.md)과 [Cloudflare 조치·복구 절차](../../runbooks/docs-seo-metadata-routes.md#og-브라우저-캐시와-cdn-캐시-분리)를 갱신했다. OG 경로에만 `Browser TTL: Respect origin`을 적용하는 방법과 공개 GET 재검증을 구분했다.

## Notes

Node 24.12.0에서 관련 단위 검사 23개, docs 전체 타입 검사, 수정 코드 ESLint가 통과했다. 콘텐츠 검증을 포함한 프로덕션 빌드도 성공했다. 다음 OG 프로덕션 E2E는 두 project에서 **2개 통과**(18.5초)했다. 각 테스트는 한국어·긴 제목·빈 제목의 세 PNG에 대해 HTTP 200·1200×630·signature·nosniff와 두 캐시 헤더를 검사한다.

```sh
cd apps/docs
mise exec -- pnpm exec playwright test --config=playwright.article.config.ts article-sharing.spec.ts
```

검사 서버는 로컬 fixture를 사용하고 NAS로 요청하지 않는다. 로컬 `next start`에서 헤더가 반환되는 것은 앱 설정 증거이며 실제 Vercel의 1일 캐시 보존이나 Cloudflare 정책 변경 증거가 아니다. [운영 관측](../../verification/security/2026-10-05-deployed-blog-smoke.md)은 이전 배포의 값으로 보존한다.

## Open Questions

Cloudflare zone의 Browser Cache TTL·적용 Cache Rules 확인과 새 배포의 공개 응답 검증은 남아 있다. 이번에는 zone 설정·purge·배포 보호 토큰·NAS 문서를 변경하지 않았다.

## Next

코드 배포 후 OG 전용 규칙을 확인하고 공개 응답의 `max-age=3600`과 PNG 본체를 함께 검증한다. 이미 브라우저나 공유 서비스에 저장된 이미지는 CDN purge만으로 삭제되지 않는다. 필요 시 metadata 이미지 URL의 버전을 변경한다.
