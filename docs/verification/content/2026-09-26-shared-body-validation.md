# 로컬·원격 공용 본문 검증

## 대상과 조건

- 날짜: 2026-09-26 KST, `feature/docs`의 `af6f171` 및 이번 미커밋 본문 검증 변경.
- macOS, mise Node 24.12.0. 공용 계약의 Node 테스트, 로컬 CLI, NestJS Jest·Supertest를 사용했다.
- HTTP 검사는 임시 content 디렉터리와 fixture 토큰을 사용한다. NAS·운영 API·웹훅을 호출하지 않았다.

## 재현 방법

저장소 루트에서 순차 실행한다.

```bash
mise exec -- pnpm --filter @web-tech/docs-content-contract test
mise exec -- pnpm --filter @web-tech/docs-content-contract lint
mise exec -- pnpm --filter docs test:content
mise exec -- pnpm --filter docs-backend check
mise exec -- pnpm --filter docs exec eslint scripts/validate-content-style.mjs scripts/validate-content-style.test.mjs --max-warnings 0
```

공용 패키지 ESM/CJS build는 로컬 콘텐츠와 백엔드 명령의 pre-script에서 수행한다. 백엔드 check는 lint·타입·단위·HTTP E2E·build를 포함한다.

## 결과와 증거

- 공용 계약 20개 통과. 기존 계약 6개와 본문 규칙 14개다.
- 로컬 콘텐츠 테스트 20개 통과. 실제 로컬 문서 16개의 frontmatter·본문 검사도 통과했다.
- 백엔드 단위 13개·HTTP E2E 18개 통과. lint·타입·Nest build도 통과했다.
- 공용 패키지 lint 및 로컬 검사 어댑터 lint 통과.

추가 검증 범위:

- 정상·깨진·다중 행 HTML 주석, 단독 닫힘 표식, h1, 제목 단계 생략, 언어 없는/닫히지 않은 펜스, 지원하지 않는 callout을 공개 목록과 상세에서 차단한다.
- 정상 글은 같은 목록에 유지하며 오류 응답에 본문이나 검증 원인을 출력하지 않는다.
- 3개·4개 백틱과 틸드 안의 HTML 주석은 허용하고 raw HTML은 여전히 escape한다.
- 로컬 frontmatter 어댑터와 공용 함수가 같은 본문에 같은 판정을 반환한다.
- warning-only 본문은 허용하며 문서 수정 후 서버 재시작 없이 상세 응답이 404에서 200으로 바뀐다.

초기 이관 과정에서 TypeScript의 배열 접근 null 검사와 새 테스트의 행 번호 기대값이 실패했다. 타입 처리와 실제 행 번호를 수정한 뒤 위 명령을 재실행해 통과했다. 기존 테스트 기대값을 광범위하게 완화하지 않았으며 정상 published fixture의 본문 h1만 작성 규칙에 맞게 h2로 변경했다.

## 한계와 후속 작업

- NAS 문서 전체·컨테이너 이미지·Vercel 캐시 갱신은 미검증이다. 기존 위반 글이 새 이미지에서 제외될 수 있다.
- 본문 검사는 줄 단위 작성 규칙이며 전체 Markdown/MDX AST 검증이나 보안 sanitizer가 아니다.
- 일반 렌더러·문서 UI·캐시 정책은 변경하지 않았다. 전체 Next production E2E는 이번 작업에서 재실행하지 않았다.
- 백엔드 목록 요청은 기존처럼 문서를 다시 파싱한다. 문서 수가 많은 운영 환경의 성능과 반복 경고량은 별도 측정 대상이다.

## 관련 문서

- [본문 작성 정책과 배포 영향](../../architecture/docs-content-authoring-markup-policy.md)
- [작업 기록](../../worklog/2026-09/2026-09-26-shared-body-validation.md)
