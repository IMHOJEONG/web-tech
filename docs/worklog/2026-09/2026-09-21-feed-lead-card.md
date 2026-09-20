# 피드 상단 글을 작은 링크 카드로 변경

## Summary

상단의 큰 정사각형 이미지와 `READ ARTICLE` 버튼을 제거하고,
카드 전체에서 상세로 이동하는 제목 중심 레이아웃으로 변경했다.

## Changed

- `MainFeed`에서 상단 표현을 `FeedLeadStory`로 분리했다.
- [별도 도입한 공용 카드](2026-09-21-document-preview-card.md)를 피드에 적용했다.
  기존 공용 `DocumentThumbnail`을 사용하며 새로운 이미지 처리 로직은 만들지 않았다.
- 작은 이미지 한 장, 제목, 요약, 작성자와 읽기 시간만 표시한다.
  모바일 이미지 높이는 144px, 넓은 화면은 최대 192px이며 데스크톱 이미지 너비는 최대 288px이다.
- `TRENDING NOW` 대신 한국어 `먼저 읽어볼 글`과 영어 `Featured article`을 제공한다.
- 기존 hero와 동일하게 이미지 최적화 우회 설정을 피드에서 명시한다.
  범용 카드의 기본값은 최적화 사용이며 다른 사용처로 우회 정책을 강제하지 않는다.
- 링크에 공용 focus ring을 적용하고 제목을 접근 가능한 이름으로 사용한다.
- 책임 경계를 [피드·문서 라우팅 정책](../../architecture/docs-feed-and-docs-routing-policy.md)에 추가했다.

## Notes

Node 24와 기존 로컬 개발 서버에서 실행했다. 원격 인덱스는 비활성화한 상태이며 `.env`는 변경하지 않았다.

```sh
pnpm --filter docs exec playwright test e2e/feed-lead-story.spec.ts e2e/header-clarity.spec.ts e2e/shell-navigation.spec.ts --workers=1
pnpm --filter docs exec tsc --noEmit
pnpm --filter docs exec eslint entities/document/ui/document-card-meta.tsx entities/document/ui/document-preview-card.tsx widgets/m/ui/feed-lead-story.tsx widgets/m/ui/main-feed.tsx e2e/feed-lead-story.spec.ts --max-warnings 0
```

- 최종 브라우저 검사 30개 통과, 해당 viewport 대상이 아닌 12개는 의도적으로 제외했다.
- 한국어·영어, 밝은·어두운 테마, Chromium 390/768/1280px을 확인했다.
- 320/640/767/1024px 추가 검사에서 카드 가로 넘침과 이미지 높이 제한을 확인했다.
- 이미지 로드, 카드 여백·이미지 클릭, Enter 이동과 Web 필터 전환을 확인했다.
- 실제 캡처를 확인했고 타입 검사와 변경 파일 lint가 통과했다.
- 초기 테스트는 로컬 Mobile 글이 없는 상태에서 카드를 기대해 실패했다.
  필터 후 카드 검사는 실제 로컬 글이 있는 Web 조건으로 수정해 재검증했다.
- 실제 기기, Safari/Firefox, 원격 썸네일 실패 대응, 프로덕션 빌드는 검증하지 않았다.

## Open Questions

없음. 후속 요청으로 최근 글 목록에도 같은 카드를 적용했다.

## 최근 글 목록 후속 적용

- 기존 Featured/Compact/Image 카드 3종을 공용 `DocumentPreviewCard`로 통일했다.
  상단 글과 중복되지 않는 최대 4개 글, 기존 정렬과 필터는 유지한다.
- 실재하지 않는 Mobile/UI 예시 카드와 이미 비활성화된 newsletter placeholder는 제거했다.
  글이 없을 때는 안내와 필터·전체 목록 링크를 제공한다.
- 메타데이터 가공은 `model/feed-document.ts`, 필터는 `FeedFilters`, 최근 목록은
  `FeedRecentArticles`로 분리했다. `MainFeed`는 조합과 첫 글/나머지 글 배분만 담당한다.
- 최근 목록 제목·설명·빈 상태·하단 링크에 한국어와 영어 문구를 제공했다.
- `e2e/feed-recent-articles.spec.ts`에서 제목 단계, 중복 URL 없음, 이미지 높이,
  카드 전체 클릭·이미지 클릭·Enter 이동과 빈 Mobile 필터 복귀를 검사한다.
  빈 상태 검사는 Mobile 게시글이 없는 현재 로컬 콘텐츠를 기준으로 한다.
- 상단과 최근 목록 테스트를 함께 실행해 28개 통과, 중복 viewport 검사 2개는 제외했다.
  한국어·영어, 밝은·어두운 테마, Chromium 390/768/1280px에서 확인했다.
- 변경 파일 lint는 통과했다. 타입 검사에서 URL 헬퍼에 불필요한 title 인자를 전달한 것을 발견해 제거했고,
  `pnpm --filter docs exec tsc --noEmit` 재검사도 통과했다.

```sh
pnpm --filter docs exec playwright test e2e/feed-lead-story.spec.ts e2e/feed-recent-articles.spec.ts --workers=1
```

## Next

`http://127.0.0.1:3001/ko/feed`에서 확인한다. 공용 카드 도입과 피드 적용을 별도 커밋으로 관리한다.
