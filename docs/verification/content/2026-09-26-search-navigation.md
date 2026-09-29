# 헤더·본문 검색 이동 통일 검증

## 대상과 조건

- 날짜: 2026-09-26 KST, `feature/docs`의 `875ab3a` 이후 검색 이동 미커밋 변경.
- macOS, mise Node 24.12.0, Next.js 16.3.4, Playwright 1.62.1 Chromium.
- 개발 서버 3116, 모바일 390×844·태블릿 768×1024·데스크톱 1280×800. 한국어·영어와 로컬 콘텐츠를 사용했다.
- 원격 목록·외부 로그 전송·React inspection을 비활성화했다. 운영 API·NAS·Vercel 배포는 검사하지 않았다.

## 재현 방법

[검색 제출 회귀 검사](../../runbooks/docs-responsive-browser-device-checklist.md#검색-제출-회귀-검사)의 세 spec을 실행한다. production build는 저장소 루트에서 별도로 확인한다.

```bash
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false \
BLOG_CONTENT_API_BASE_URL= BLOG_CONTENT_API_BASE_URL_INTERNAL= BLOG_CONTENT_API_BASE_URL_PUBLIC= \
DOCS_BETTER_STACK_SOURCE_TOKEN= DOCS_BETTER_STACK_INGESTING_URL= \
DOCS_ENABLE_REACT_INSPECTION=false \
mise exec -- pnpm --filter docs build
```

## 결과와 증거

- 최종 E2E 51개 통과, 약 1.1분. 새 이동 테스트 30개, 기존 입력 정책 9개, 키보드·본문 구조 12개다.
- DOM 식별 표식 유지와 main-frame navigation request 부재로 전체 문서 reload가 없음을 확인했다. 같은 URL 재제출 시 history 길이도 유지됐다.
- 새 검색의 필터 초기화, 빈 검색, locale 유지, 뒤로/앞으로 가기와 본문 입력 복원을 확인했다.
- 응답을 gate로 보류한 동안 버튼 비활성·상태 문구·폭 유지·reduced motion을 검사했다. Enter와 submit을 추가해도 대상 요청은 하나였다.
- 실제 폼 markup을 독립 페이지에 옮겨 JavaScript 없이 GET·locale 경로·`q` 전송이 유지됨을 확인했다. 이때 공백 원문은 서버 정규화 대상으로 남는다.
- Next production build 통과. TypeScript 검사, 정적 페이지 28개 생성, 실제 로컬 문서 16개 frontmatter·본문 검사도 통과했다.

초기 실패와 보정:

- 검색 결과가 없는 `React Suspense`에서도 본문 폼이 있을 것으로 가정한 테스트를 실제 결과가 있는 `React`로 수정했다. 숨겨진 검색 아이콘까지 선택하던 스피너 검사는 실제 회전 아이콘으로 범위를 좁혔다.
- 전체 앱에서 JavaScript를 비활성화한 두 locale 검사는 `/docs`가 `ContentPending`에 머물러 실패했다. 기존 페이지의 Suspense 경계가 있는 상태에서 관측했으며 원인 전체를 확정하지 않았다. 이 실패를 해결했다고 처리하지 않고 폼 계약 검사와 분리했다.
- 로컬 Playwright report와 trace는 재실행 시 덮어쓰는 산출물이며 영구 artifact로 커밋하지 않았다. 검사 조건과 assertion은 `apps/docs/e2e/search-navigation.spec.ts`에 남아 있다.

## 한계와 후속 작업

- 브라우저 동작 검증은 개발 서버 Chromium에 한정한다. production build 통과는 배포된 화면이나 Safari·Firefox 통과를 의미하지 않는다.
- 무-JavaScript 전체 페이지 지원은 미완료다. production에서도 loading 상태가 남는지 별도 확인 후 지원 범위를 결정한다.
- 실제 OS IME·스크린리더 낭독, 원격 장애 시 검색 지연은 미검증이다. `aria-busy`·status DOM assertion은 실제 낭독 타이밍을 보증하지 않는다.
- 이번 변경에 검색 원문 로깅, 순위·캐시·서버 입력 계약 변경은 없다.

## 관련 문서

- [검색 경험 정책](../../architecture/docs-search-experience-policy.md)
- [입력 계약 ADR-0007](../../architecture/adr-0007-search-input-contract.md)
- [작업 기록](../../worklog/2026-09/2026-09-26-search-navigation.md)
