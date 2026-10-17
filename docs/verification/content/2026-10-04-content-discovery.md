# 태그 필터와 읽기 모음 검증

## 대상과 조건

- 날짜: 2026-10-04, Asia/Seoul
- 기준: feature/docs `52b3017` 위 작업 트리. 기존 미커밋 변경 포함이며 배포 SHA가 아니다.
- Node 24.12.0, pnpm 11.10.0, TypeScript 6.0.3, React/React DOM 19.2.6, Next.js 16.3.4.
- 원격 목록을 끄고 로컬 공개 글 10개를 사용한다. 운영 API·토큰·NAS는 사용하지 않는다.

## 재현 방법

루트에서 Node 24·설치된 의존성·Playwright Chromium이 필요하다.

```sh
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs exec playwright test e2e/content-discovery.spec.ts --workers=1
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter docs lint
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false BLOG_CONTENT_API_BASE_URL= BLOG_CONTENT_API_BASE_URL_INTERNAL= BLOG_CONTENT_API_BASE_URL_PUBLIC= DOCS_BETTER_STACK_SOURCE_TOKEN= DOCS_BETTER_STACK_INGESTING_URL= mise exec -- pnpm --filter docs build
```

## 결과와 증거

- 통과: docs 단위 테스트 208개. 태그 정규화·중복 집계, 교집합·query 유지, 모음 순서·없는 글 제외·공개 canonical 참조 포함.
- 통과: 탐색 E2E 9개. ko/en과 mobile/tablet/desktop에서 새로고침·뒤로가기·순서 링크·해제, 320px에서 가로 넘침과 44px 필터를 확인했다.
- 첫 탐색 E2E는 3개 통과·6개 실패했다. 태그 해제 직후 전환 대기 없이 다음 모음을 눌러 이전 query가 남았다. URL·선택 상태 대기를 추가한 재실행에서 9개 통과했다.
- 통과: docs 타입 검사와 lint.
- 통과: docs production 빌드. frontmatter·본문 16개 검사, 타입·33개 static page 생성 완료. 운영 API를 비활성화한 범위다.
- 통과: 문서 변경 검사와 diff 공백 검사. 문서 검사는 기존 문제의 증가 여부를 확인하며 전체 과거 문제 해결을 의미하지 않는다.

## 한계와 후속 작업

실제 NAS·Vercel 배포·혼합 목록은 미검증이다. Chromium 자동 검사를 실제 Safari/Firefox·스크린 리더 검사로 일반화하지 않는다. 모음 편집 레지스트리가 현재 공개 목록에서 두 글 이상을 확보할 때만 노출되는지 배포 환경에서도 확인한다.

## 관련 문서

- [탐색 결정](../../architecture/adr-0012-content-discovery-collections.md)
- [탐색 작업 기록](../../worklog/2026-10/2026-10-04-content-discovery.md)
