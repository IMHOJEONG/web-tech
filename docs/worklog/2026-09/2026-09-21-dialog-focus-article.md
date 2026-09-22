# Dialog 포커스 복귀 심화 글 초안

## Summary

UI/UX 자료 조사에서 고른 첫 주제를 공개 글 형식으로 작성했다. 제목은 「닫았는데, 어디로 돌아가야 하지?」이며, 검수 전이므로 status: draft로 유지한다.

## Changed

- [심화 글](../../../apps/docs/data/shadcn/dialog-focus-restoration.mdx)에 모달 범위, 닫힘 생명주기, 네이티브 실행 예제, aria-hidden 진단, Radix 적용 조건, 검증 한계를 정리했다.
- [예제 검사](../../../apps/docs/scripts/check-dialog-focus-example.ts)는 글의 HTML 블록을 읽어 취소·Escape·삭제와 대체 복귀 코드 제거를 비교한다. 복제한 fixture 대신 독자가 보는 코드 자체를 실행한다.
- 기존 체크리스트와 ARIA 글은 수정하지 않았다. 이번 초안은 문제 분석과 실험 중심의 별도 심화 글이다.
- 구조나 공개 계약을 변경하지 않아 새 ADR은 만들지 않았다.

## Notes

공식 APG, MDN, Radix, Playwright 문서의 링크를 본문의 관련 설명 옆에 배치했다. 설치된 Radix Dialog 1.1.15의 모달 복귀 코드도 확인했으나 Radix 화면을 실행 검증한 것은 아니다.

저장소 루트에서 Node 24와 설치된 Playwright Chromium을 사용한다. 최초 브라우저 바이너리가 없으면 별도 설치가 필요하다.

```sh
mise exec -- pnpm --filter docs test:content
mise exec -- pnpm --filter docs exec node scripts/check-dialog-focus-example.ts
```

콘텐츠 테스트 17개와 frontmatter·스타일 검사 16개 파일이 통과했다. 네이티브 예제는 headless Chromium 151.0.7922.34에서 세 닫힘 경로의 복귀와 다음 Tab을 확인했다. 복귀 코드 제거 시 제목에 도달하지 않았다. 임시 검사에서는 BODY, 저장소 검사에서는 닫힌 창의 삭제 버튼이 관측되어 본문에 두 결과와 스냅샷의 한계를 명시했다. 특정 최종 포커스가 반드시 유지된다고 가정하지 않는다.

초기 임시 검사에서 setContent만 반복해 전역 const 재선언으로 두 번째 시나리오가 실패했다. 시나리오마다 about:blank로 이동해 문서 실행 환경을 초기화한 뒤 재검사했다. 글 자체의 오류와 테스트 격리 문제를 구분했다.

커밋 전 MDX 포맷 후에도 비교 실험이 실행되도록 복귀 리스너 추출이 들여쓰기와 세미콜론 유무에 의존하지 않게 수정했다.

## Open Questions

Safari·Firefox, 모바일, VoiceOver/NVDA, 실제 Radix·Drawer의 애니메이션과 빠른 재열기는 미검증이다. 이 결과 없이 검증 완료 또는 운영 환경 적용 가이드로 표현하지 않는다.

## Next

사용자 검수 후 대상 라이브러리의 실제 UI와 보조 기술 검증을 진행하고 게시 여부를 결정한다. 기존 체크리스트의 포괄적인 포커스 규칙도 이후 별도 검토한다.

[선행 자료 조사](../../knowledge/docs-app/uiux-resource-research.md)
