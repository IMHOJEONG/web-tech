# 로컬 콘텐츠 재점검

## 대상과 조건

2026-09-20 KST, feature/docs HEAD `93d5173`에서 로컬 data/category 문서 15개를 점검했다. 공개 11개, 초안 4개다. 앱 코드와 콘텐츠 원문은 변경하지 않았다. 원격 NAS 및 배포 화면은 이번 범위에 포함하지 않았다.

## 재현 방법

저장소 루트:

```sh
mise exec -- pnpm --filter docs test:content
diff -u apps/docs/data/shadcn/blocked-aria-hidden.mdx apps/docs/category/fe/react/test.mdx
```

추가로 `apps/docs`에서 Node의 `--experimental-strip-types --input-type=module`로 다음 조합을 실행했다.

- `collectMarkdownFiles()`로 data/category를 순회한다.
- 파일 전체를 `renderArticleContent({ content, contentFormat: 'mdx' }, { codeHighlight: false })`에 전달하고 `renderToStaticMarkup()`으로 변환한다.
- `parseLocalDocument()`가 반환한 공개 문서 본문을 trim 후 SHA-256으로 비교한다.
- 공개 문서의 정규화된 thumbnail 및 Markdown 이미지의 루트 상대 URL을 `public` 아래 파일 존재 여부로 검사한다.

렌더링 점검은 커스텀 MDX components를 전달하지 않은 파서 smoke 검사다. 실제 스타일, callout UI, 이미지 디코딩, 복사 버튼까지 검증한 것은 아니다.

## 결과와 증거

| 항목               | 결과                                               |
| ------------------ | -------------------------------------------------- |
| 콘텐츠 검사 테스트 | 17 통과, 실패 0                                    |
| frontmatter/style  | 15개 통과, 경고 출력 없음                          |
| MDX 변환           | 15개 모두 예외 없이 static markup 생성             |
| 문제 글 표         | critical-rendering-path-diagnosis의 table 4개 생성 |
| 초안 표            | DNS/TCP/TLS 글 1개, health/readiness 글 1개 생성   |
| 로컬 이미지        | 공개 글 참조 13개 모두 파일 존재, 중복 참조 포함   |
| 본문 중복          | ARIA 글 1쌍                                        |

### P2: 같은 ARIA 글의 중복 공개

`data/shadcn/blocked-aria-hidden.mdx`와 `category/fe/react/test.mdx`의 본문은 trim 후 동일하다. 제목도 같지만 slug와 날짜가 다르다. 날짜는 각각 2025-07-02와 2025-12-30이다. 파일 경로가 달라 서로 다른 문서로 처리될 수 있으며, 독자가 같은 내용을 다른 글로 탐색하게 된다.

둘 중 대표 문서와 유지할 URL을 결정한 뒤 나머지는 redirect/alias와 함께 정리하는 것이 좋다. 이 점검에서 임의 삭제하거나 발행 상태를 변경하지 않았다. 기존 schema/style 검사는 본문 중복을 판정하지 않으므로 기본 검사 통과와 콘텐츠 품질을 구분해야 한다.

## 한계와 후속 작업

- 원격 문서와 로컬 문서 사이의 중복, 운영 이미지 HTTP 응답, 외부 참고 링크의 생존 여부는 미검증이다.
- GFM 표 생성은 확인했지만 브라우저에서 모바일 overflow와 다크 모드 표 가독성은 미검증이다.
- 커스텀 components 없는 출력에 callout marker가 남는 것은 이 smoke 검사의 한계이며 실제 callout 오류로 판정하지 않았다.
- 기술 주장 전체의 사실 검증이나 교정은 수행하지 않았다. V8 글처럼 짧은 개요와 깊이를 약속하는 summary의 균형은 후속 편집 검토 대상이다.
- 대표 ARIA 글 선택 후 중복 방지 검사를 콘텐츠 검사에 추가할지 결정한다.

## 관련 문서

- [GFM 표 수정 기록](../../worklog/2026-09/2026-09-19-local-mdx-gfm-table-fix.md)
- [점검 작업 기록](../../worklog/2026-09/2026-09-20-content-review.md)
