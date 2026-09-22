# 로컬 문서 타입 보호와 파서 통합

## Summary

기존 요청 내 중복 읽기 개선을 `7af5971`로 먼저 커밋한 뒤, docs 앱 하부에서
읽기 전용 문서 계약과 상세·검색·카테고리의 공통 파서를 적용했다.

## Changed

- `document.types.ts`로 Metadata를 모으고 필드와 태그를 readonly로 선언했다.
- 기존 모듈의 타입 재수출을 유지하고 Next.js 메타데이터 경계에서는 태그를 복사한다.
- `parseLocalDocument()`가 frontmatter 파싱·검증, 게시 상태, 경로·썸네일 정규화를 담당한다.
- 검색에서 frontmatter를 두 번 제거하던 정규식을 없앴다. 본문 구분선 사이의 내용 손실을 방지한다.
- [서버 렌더링 정책](../../architecture/docs-server-rendering-assessment.md)과
  [검증 절차](../../runbooks/docs-article-streaming-performance.md)를 갱신했다.

## Notes

Node 24의 단위·타입 검사와 별도 fixture 기반 프로덕션 E2E로 검증한다.
첫 E2E는 기존 36개가 통과하고 새 4개가 실패했다. 검색 카드가 summary 대신
본문 발췌를 보여주는 기존 정책을 테스트가 놓친 것이므로 화면 구현 대신 기대값을 수정했다.
최종 재검증은 저장소 루트에서 다음 명령으로 완료했다.

- `pnpm --filter docs test:lib`: 타입 검사와 단위 테스트 127개 통과.
- `pnpm --filter docs test:article:prod`: 프로덕션 빌드와 E2E 40개 통과(58.2초).
- 변경한 TypeScript 파일의 ESLint: 경고 없이 통과.

한/영, 모바일/데스크톱의 검색·카테고리 및 기존 상세/스트리밍/웹훅 회귀를 확인했다.
게시 갱신 테스트에서는 기존 prefetch 취소 관련 `destination stream closed early`
로그가 여전히 발생했다. 이번 파서 변경으로 해결되었다고 보지 않는다.

파일 탐색/I/O, 원격 선택과 fetch 캐시, 웹훅은 변경하지 않았다.
readonly는 컴파일 시 보호이며 런타임 deep freeze는 아니다.
카테고리 결과에는 공통 파서가 local/mdx 소스·형식 필드를 추가한다.
실제 NAS/Vercel 배포 검증과 푸시는 수행하지 않는다.

## Open Questions

여러 로더를 함께 쓰는 요청의 파일 I/O 통합은 별도 측정 후 판단한다.

## Next

후속 변경은 커밋하지 않은 상태로 검토한다.
