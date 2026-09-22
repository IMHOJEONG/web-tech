# UI/UX 이미지 카드를 작은 문서 카드로 통일

## Summary

화살표 제거 작업을 `41a136c`로 먼저 커밋한 뒤, UI/UX 페이지의 이미지 비중을 줄였다.
대표 글의 최소 512px, 튜토리얼의 최소 416px 이미지 배경을 제거하고 피드 공용 카드를 적용했다.

## Changed

- 대표 글·보조 글 2개·튜토리얼을 `UiUxArticleCard`를 통해 `DocumentPreviewCard`로 표시한다.
- `UiUxArticleCard`는 UI/UX 데이터와 읽기 시간 번역·대체 이미지만 연결한다.
  레이아웃, 썸네일, 단일 링크와 포커스 표시는 기존 공용 카드를 재사용한다.
- 별도 `UiUxSmallArticleCard`를 제거하고 카드들을 같은 너비의 목록으로 배치했다.
- 이미지 높이는 모바일 144px부터 최대 192px, 데스크톱 너비는 최대 288px이다.
  텍스트와 이미지를 분리해 밝은·어두운 테마에서 이미지 위 글자 대비 문제를 줄였다.
- 작성자와 읽기 시간이 없는 카드에는 메타데이터 행을 만들지 않도록 공용 컴포넌트를 보완했다.
- 대표 글의 고정 `10분 읽기` 문구를 제거하고 실제 readMinutes가 있을 때만 시간을 표시한다.
- 튜토리얼과 뉴스레터는 별도 행으로 분리하고 뉴스레터의 고정 최소 높이를 제거했다.
  뉴스레터 기능이나 전송 로직을 추가하지는 않았다.
- 기존 콘텐츠 선택·대체 콘텐츠·상세 링크와 이미지 없는 추가 글 목록은 유지했다.

## Notes

Node 24, 로컬 개발 서버 및 원격 목록 비활성화 조건에서 검사했다.

```sh
pnpm --filter docs exec playwright test e2e/uiux-compact-cards.spec.ts e2e/feed-lead-story.spec.ts e2e/feed-recent-articles.spec.ts --workers=1
pnpm --filter docs exec tsc --noEmit
pnpm --filter docs exec eslint entities/document/ui/document-card-meta.tsx entities/document/ui/document-preview-card.tsx widgets/content-hub/ui/uiux-article-card.tsx widgets/content-hub/ui/uiux-hub-featured-section.tsx widgets/content-hub/ui/uiux-hub-tutorial-section.tsx widgets/content-hub/ui/uiux-hub-page.tsx e2e/uiux-compact-cards.spec.ts --max-warnings 0
```

- 브라우저 42개 통과, viewport 한정 검사 6개 제외. 타입 검사와 변경 파일 lint 통과.
- 한국어·영어, 밝은·어두운 테마, Chromium 390/768/1280px에서 카드 경계·이미지 높이·상세 이동을 확인했다.
- 320/640/1024px 추가 검사에서도 카드 내부 넘침이 없었다.
- 대표 카드 이미지 로드, 여백 클릭과 Enter 이동, 튜토리얼 이미지 클릭을 검사했다.
- 실제 캡처에서 발견한 고정 읽기 시간 중복을 후속 제거했다.
  이후 UI/UX 테스트를 `--project=chromium-desktop --workers=1`로 재실행해 5개 통과했고 타입 검사도 다시 통과했다.
- 실기기, Safari/Firefox, 프로덕션 빌드와 원격 이미지 장애는 검증하지 않았다.

## Open Questions

기존 대체 콘텐츠 운영 여부는 이번 범위에서 변경하지 않았다. 뉴스레터는 후속 요청으로 제거했다.

## 뉴스레터 제거

- 사용하지 않는 UI/UX 뉴스레터 제목·설명·이메일 입력·구독 버튼을 제거했다.
- `UiUxHubNewsletterSection`을 삭제하고 튜토리얼 카드만 `UiUxHubTutorialSection`으로 유지했다.
- 뉴스레터 전용 한국어·영어 메시지와 props, 불필요해진 locale 조회를 정리했다.
- 페이지 본문에 뉴스레터 문구와 input/button이 없다는 회귀 조건을 추가했다.
- `pnpm --filter docs exec playwright test e2e/uiux-compact-cards.spec.ts --workers=1`: 13개 통과, viewport 전용 중복 검사 2개 제외.
- `tsc --noEmit`과 변경 파일 lint 통과. 튜토리얼 및 기존 카드 링크 이동도 유지됨을 확인했다.

## Next

`http://127.0.0.1:3001/ko/ui-ux`에서 확인한다. UI/UX 카드 개선과 뉴스레터 제거를 하나의 작업 커밋으로 관리한다.
