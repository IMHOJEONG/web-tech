# HTTP 스트리밍 글 게시 준비와 공개 전환

## Summary

사용자가 HTTP 스트리밍 글 한 편의 게시를 승인했습니다. 해당 글을 published로 전환하고 그림 경로·반응형 도식 표시를 포함한 최소 변경을 최신 배포 브랜치 위에서 검증합니다.

## Changed

- [게시 원문](../../../apps/docs/category/be/node-js/http-response-streaming-lab.mdx): 게시 상태와 게시일을 2026-10-14로 전환했습니다.
- 네 도식의 SVG·PNG 원본과 모바일/데스크톱 그림, 상대 public 이미지 경로 변환과 대응하는 렌더러·검사를 포함합니다.
- TCP 초안, 개발 preview 라우트·제목 스타일, 다른 학습 문서와 작업 변경은 포함하지 않습니다.

## Notes

기존 로컬 테스트 저장소의 article-source.json과 .test.mts로 실제 원문과 fixture를 검증합니다. 테스트 저장소 경로·전용 명령은 공개 본문에 넣지 않습니다. 기술·독해·존댓말 검토를 반영했습니다. 기존 MDX 렌더링 경로의 이미지 표현을 보완하며 원격 HTML·공개 API·캐시 경계를 바꾸지 않습니다.

검사 결과는 [게시 준비 검증](../../verification/content/2026-10-14-http-streaming-publication.md)에 기록합니다. Production 성공·공개 본문·사이트맵의 후속 확인 전에는 배포 성공을 추정하지 않습니다.

## Open Questions

게시 승인 범위는 HTTP 글 한 편입니다. 소켓 초안과 이후 글은 별도 승인 대상입니다.

## Next

검사 통과 후 feature/docs 배포 경로로 커밋·푸시하고 Vercel Production과 공개 글·그림·sitemap을 확인합니다.
