# 주간 글의 로컬 게시와 수요일 자동 실행

## Summary

사용자의 배포 준비 요청에 따라 분리 worktree의 backpressure 글을 현재 저장소의 로컬 콘텐츠로 옮기고 `published` 상태로 전환했다. 수요일 오전 9시 한국 시간의 채팅 자동 실행을 등록했다.

## Changed

- [Node.js backpressure 글](../../../apps/docs/category/be/node-js/stream-backpressure-diagnosis.mdx): 기초 용어, 실행 결과, Next.js 스트리밍 연결과 관찰 절차를 포함한다.
- Codex 자동 실행 `heapforge-2`: 승인된 글 한 편을 검사하고 기존 배포 경로로 커밋·푸시한 뒤 운영 글과 사이트맵을 확인한다. 승인된 글이 없으면 초안을 작성해 검토를 요청한다.
- 후속 사용자 지시로 커밋을 보류했다. 자동 실행에도 커밋·푸시·배포 재승인 전까지 로컬 준비만 수행하도록 반영했다.
- 실행 예제를 `.mts`와 TypeScript 코드 블록으로 바꾸고 `Writable`, `Iterable<Buffer>`, `Promise<void>`, 쓰기 콜백 타입을 명시했다.
- 글의 스트림 ASCII 도식을 의미 있는 HTML figure·순서 목록으로 바꾸고 [MDX 스타일](../../../apps/docs/app/css/mdx.css)에 카드와 방향 화살표를 추가했다. 640px 이하에서는 세로로 배치하며 기존 테마 토큰을 사용한다. 로컬 MDX용 표현이며 원격 Markdown 렌더러 지원은 이번 범위에 포함하지 않는다.

## Notes

- 현재 글은 이번 사용자의 요청으로 게시 대상으로 승인되었다. 후속 글은 기존 사용자 초안 검토 절차를 유지한다.
- 시각 답변 전 기본값은 수요일 오전 9시 Asia/Seoul이다.
- 콘텐츠 테스트 20건과 frontmatter·스타일 검사 17개 파일이 통과했다.
- TypeScript 예제 세 개를 본문에서 추출해 `tsc --noEmit --strict`로 검사했다. `.mts` 느린 Writable 예제는 Node.js v24.12.0 실행 결과가 본문과 일치하며, 브라우저에서도 타입 표기와 변경된 실행 명령이 표시된다.
- 흐름도는 브라우저에서 가로 3열과 390px 세로 1열, 단계 3개, 영역 내 가로 넘침 없음, 복사 버튼 없음으로 확인했다. MDX의 중첩 문단으로 발생한 hydration 오류를 수정하고 `p p`가 없는 것을 확인했다. 콘텐츠·문서 검사도 통과했다.
- 로컬 Next.js 서버의 글 URL과 `/sitemap.xml` 모두 HTTP 200이며 사이트맵에 새 글이 포함된다. 브라우저에서 제목, 본문, 코드 실행 결과, Next.js 절과 표의 실제 표시를 확인했다.
- 로컬 미리보기: `http://127.0.0.1:3125/ko/docs/category/be/node-js/stream-backpressure-diagnosis`.
- 원격 게시와 Vercel Production 배포는 아직 실행하지 않았다. 로컬 게시 상태와 실제 원격 배포 완료를 구분한다.
- 로컬 자동 실행은 Codex 앱의 실행 환경·권한과 Git/Vercel 접근이 필요하며 실패 시 원인을 알린다.

## Open Questions

게시 시각 또는 후속 글의 사용자 승인 방식 변경 여부는 사용자 답변을 반영한다.

## Next

후속 사용자 요청으로 현재 블로그 변경 전체의 커밋을 승인받았다. 새 글·흐름도 스타일과 [배포 후속 점검](2026-10-06-deployed-followup.md)을 함께 커밋한다. 이번 승인은 현재 변경의 커밋에 한정하며 푸시·배포·자동 실행의 보류 정책 재개는 포함하지 않는다. 원격 게시와 운영 글·사이트맵 확인은 푸시 승인 이후 별도 진행한다.
