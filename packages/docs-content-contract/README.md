# Docs Content Contract

`apps/docs`와 `apps/docs-backend`가 공유하는 콘텐츠 API 계약이다.

- canonical channel과 `markdownPath`
- editorial status
- `published` frontmatter 필수 metadata와 `YYYY-MM-DD` 날짜
- legacy-compatible remote payload parsing
- 신규 NestJS API의 canonical response schema
- published 본문 검색 전용 선택 필드 `searchText` (렌더링 content와 분리, 구형 생산자 호환)
- 전체 목록 JSON의 UTF-8 byte budget 상수 (경고512KiB·상한1MiB, [ADR-0020](../../docs/architecture/adr-0020-content-posts-byte-budget.md)). 스키마 자체가 아닌 생산자 직렬화·소비자 스트림 경계에서 검사한다.
- 상세 HTML의 독립된 UTF-8 byte budget 상수 (경고512KiB·상한1MiB, [ADR-0021](../../docs/architecture/adr-0021-content-html-byte-budget.md)). 전체 렌더 응답·소비자 스트림을 제한하며 HTML을 절단하지 않는다.
- 로컬·원격이 공유하는 본문 작성 규칙 (`@web-tech/docs-content-contract/body-style`)

소비 앱은 경로 정규식이나 상태 enum을 다시 선언하지 않고 이 패키지를 사용한다.

Next.js ESM과 NestJS/Jest CommonJS가 같은 계약을 읽도록 `dist/esm`과 `dist/cjs`를 함께 생성한다.

## Boundary

- `remotePayloadSchema`: 기존 원격 서버 payload를 읽기 위한 호환 입력 계약
- `publishedDocumentFrontmatterSchema`: 새로 게시하는 Markdown의 엄격한 작성 계약
- `canonicalPostsPayloadSchema`: `apps/docs-backend`가 반환하는 엄격한 목록 응답 계약
- `getMarkdownBodyStyleIssues(body, { status, slug })`: frontmatter를 제외한 본문을 검사해 `failures`·`warnings`를 반환하는 순수 함수. 파일 탐색·공개 차단·로깅은 소비 앱의 책임이다.

본문 검사기는 renderer나 HTML sanitizer가 아니다. raw HTML 비활성화 정책을 대체하지 않는다. 작성 규칙과 배포 영향은 [본문 작성 정책](../../docs/architecture/docs-content-authoring-markup-policy.md)을 따른다.

## Publication Integrity

`@web-tech/docs-content-contract/publication`은 불변 게시 스냅샷의 별도 계약이다.
기존 root export·목록 API·본문 렌더링을 바꾸거나 자동 활성화하지 않는다.
[ADR-0028](../../docs/architecture/adr-0028-nas-content-revision-snapshots.md)의 첫 단계만 로컬 구현했다.

| 계약       | 의미                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| revision   | canonical manifest 저장 bytes의 SHA-256, 정확히 64자리 소문자 hex                                                |
| generation | 새 게시·rollback의 소문자 UUIDv4. 순서·시간 비교에 사용하지 않음                                                 |
| pointer    | `schemaVersion: 1`, `generation`, `revision`, 필수 `previousGeneration`(UUIDv4 또는 null). 자기 세대 재사용 금지 |
| manifest   | `schemaVersion: 1`, `formatVersion: 1`, index의 `bytes`·`sha256`, 각 문서의 `markdownPath`·`bytes`·`sha256`      |
| index      | published canonical metadata의 `results`. id·slug·경로와 manifest의 문서 집합이 일치해야 함                      |

새 스키마는 알 수 없는 필드·미지원 버전·중복/비정렬 문서·경로 우회·비정규 식별자를 거절한다.
문서 경로는 기존 channel/leaf-slug allowlist이며 최대 256자다. 빈 게시본은 허용한다.
포인터 4KiB, manifest 1MiB, index·각 HTML 1MiB, 문서 4,096개,
선언된 index+HTML 합계 64MiB가 상한이다. 포인터와 manifest는 합계와 별도로 제한한다.
이는 초기 애플리케이션 계약이지 실제 NAS 처리량·peak 메모리 보장이 아니다.

`createPublicationManifest`는 strict 스키마를 통과한 입력을 고정 필드 순서·compact JSON·UTF-8·BOM 없음으로
직렬화해 `{ bytes, revision }`을 반환한다. 문서를 자동 정렬하거나 누락을 보정하지 않는다.
`verifyPublicationManifest`는 실제 bytes의 SHA-256과 canonical 직렬화 일치를 모두 검사한다.
같은 의미의 JSON이라도 들여쓰기·필드 순서·중복 key·마지막 개행이 다르면 canonical manifest가 아니다.
포인터와 index에는 canonical 직렬화를 강제하지 않지만 strict 필드·형식·byte 상한은 적용한다.

검증 함수의 입력 데이터는 `Uint8Array`(Buffer 포함)다. HTML 정규화·문자열 변환 전에 전송 계층에서
디코딩한 bytes를 전달한다. 상한 검사 뒤 소유한 복사본으로 Web Crypto SHA-256을 계산하므로
비동기 digest 대기 중 호출자가 원본 배열을 바꾸더라도 검증 중인 bytes가 바뀌지 않는다.
파일·네트워크·환경 변수·시간·로그에 접근하지 않는다. 호출자의 bounded stream reader는 별도로 필요하다.

```ts
import { verifyPublicationSnapshot } from "@web-tech/docs-content-contract/publication";

const result = await verifyPublicationSnapshot({
  pointer: pointerBytes,
  manifest: manifestBytes,
  index: indexBytes,
  documents: [{ markdownPath: "web/note", body: htmlBytes }],
});
if (!result.ok) {
  // code와 artifact만 반환하며 본문·경로·인증 정보는 오류에 넣지 않는다.
  throw new Error(`${result.artifact}:${result.code}`);
}
```

전체 검증은 pointer → manifest → index·HTML 순서로 해시·정확한 길이·UTF-8·문서 집합을 대조한다.
필수 필드 누락은 `invalid-schema`, 파일 bytes의 null/undefined 또는 누락 문서는 `missing-artifact`,
길이 불일치는 `size-mismatch`, 변조는 `hash-mismatch`, 상한 초과는 `too-large`로 구분한다.
해시 제공자 실패도 `crypto-unavailable`로 거절한다. 성공 HTML을 sanitize하거나 렌더링하지 않는다.

개별 `verifyPublicationIndex`·`verifyPublicationDocument`는 공급한 manifest 기준의 무결성 검사다.
먼저 신뢰 경로에서 받은 pointer로 manifest를 검증하거나 전체 검증 함수를 사용해야 한다.
전체 검증 성공도 pointer가 최신인지, 공개 승인됐는지, 원본과 pointer가 함께 장악되지 않았는지 보장하지 않는다.
실제 NAS 파일 안전 접근·승격 잠금·원자적 교체·세대 CAS·API·웹훅·캐시는 아직 연결하지 않았다.
[검증 결과와 한계](../../docs/verification/content/2026-11-06-publication-integrity-contract.md)를 참고한다.

변경 후에는 아래를 실행한다.

```bash
pnpm --filter @web-tech/docs-content-contract lint
pnpm --filter @web-tech/docs-content-contract typecheck
pnpm --filter @web-tech/docs-content-contract test
pnpm --filter @web-tech/docs-content-contract build
```
