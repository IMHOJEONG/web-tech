# 문서 구조화 데이터와 제목 기반 OG 이미지

## Summary

docs 공개 상세에 BlogPosting JSON-LD와 제목 기반 1200×630 공유 이미지를 추가했다. 로컬·원격 문서가 선택된 이후 같은 컴포넌트를 사용한다.

## Changed

- JSON-LD 생성·안전한 직렬화와 OG query 정규화를 공통 함수로 분리했다.
- 제목·분야·작성자를 PNG로 렌더링한다. 글꼴은 공식 Pretendard v1.3.9 Bold OTF이며 기존 OFL 라이선스를 사용한다. 이미지 요청은 NAS나 외부 글꼴 서버를 호출하지 않는다.
- 한국어·영어 canonical 주소를 JSON-LD에 반영하고, 관련 데이터가 없으면 작성자와 날짜를 추정하지 않는다.
- [문서 metadata 정책](../../architecture/docs-article-metadata-policy.md)과 [SEO 확인 절차](../../runbooks/docs-seo-metadata-routes.md)를 갱신했다.

## Notes

Node 24에서 메타데이터·공유 함수 단위 테스트 7개와 변경 코드 lint, 문서 변경 검사가 통과했다. 로컬 개발 서버에서 로컬 MDX·fixture 원격 HTML의 한국어/영어 상세 4개를 확인했다. 각각 BlogPosting 하나와 canonical·OG 연결이 일치했고, 두 언어의 없는 문서에는 BlogPosting이 없었다. 실제 한글 PNG의 HTTP 200·image/png·1200×630과 긴 제목·분야·작성자 배치도 확인했다. 글꼴을 이미지 라우트의 `outputFileTracingIncludes`에 명시했다.

프로덕션 코드 컴파일은 성공했지만 전체 build/typecheck는 다른 작업에서 추가 중인 `lib/push-api.ts`의 `ky.prefixUrl` 타입 오류로 중단되었다. 이후 앱 디렉터리에서 `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false mise exec -- pnpm exec next build --experimental-build-mode compile`을 실행하여 OG 라우트 컴파일 및 `route.js.nft.json`의 Pretendard OTF 포함을 확인했다. compile 모드는 전체 빌드·타입 검사를 대체하지 않는다. 프로덕션 E2E 전체 실행과 실제 배포 함수·검색·공유 서비스 결과는 미검증이다. 회귀 검사에는 로컬/원격 상세의 JSON-LD·canonical 일치와 없는 문서의 데이터 부재 검사를 추가했다.

## Open Questions

후속 검증에서 전체 프로덕션 빌드·82개 Playwright 회귀·앱과 Node 테스트 타입 검사·변경 코드 lint가 통과했다. 실제 PNG 응답 검사를 `article-sharing.spec.ts`에 추가했다. 이전 빌드 실패 기록은 당시 결과로 유지하며 현재 결과와 한계는 [SEO 검증 보고서](../../verification/seo/2026-10-03-article-sharing.md)를 따른다.

배포 후 공유 서비스 자체의 캐시가 기존 thumbnail을 유지하는지 확인한다. 구조화 데이터는 검색 노출 형식을 보장하지 않는다.

## Next

프로덕션 빌드와 상세 회귀의 후속 확인은 완료했다. 배포 후 Rich Results Test와 실제 공유 미리보기를 검증한다.
