# 오프라인 저장 운영 대조와 실패 단계 검증

## 대상과 조건

- 검증일: 2026-10-31 KST. 기준 main `92e424dcff16bc159421b2bcf0fae4b2c295175b`. 최초 검증 코드의 확정 리비전은 [af6cc95](https://github.com/IMHOJEONG/web-tech/commit/af6cc95bd6680b881c0cd8637520f00bdd1c08b5)이며 공개본의 bytes는 [e940e143의 승인 manifest](https://github.com/IMHOJEONG/web-tech/blob/e940e143c05c3365b88e6e6a01c58fb33a6b9290/.publication-review.json)에 연결한다. 당시 미커밋 상태로 실행한 결과와 이후 확정 리비전을 구분한다.
- [KAN-57](https://web-tech-service.atlassian.net/browse/KAN-57): 운영 Brotli 글 저장 실패 신고. 사용 환경은 Chrome 일반 창이다.
- 운영 대상: `https://heap-forge.app/ko/docs/category/be/node-js/node-brotli-runtime-security`. Event Loop 공개 글도 대조했다.
- 운영 검사는 사용자의 기존 프로필을 열지 않는 Chrome/Chromium 격리 환경, 390px·1440px에서 수행했다. 최종 원인 대조는 임시 디렉터리의 새 Chrome persistent profile을 일반 모드로 실행했다. 기존 저장본·사이트 권한·Worker를 일괄 삭제하거나 운영 서버에 장애를 주입하지 않았다.
- 로컬: Node 24.22.1·pnpm 12.14.0·Next 16.4.3, loopback production 서버, 원격 콘텐츠 조회 비활성. 변경한 Worker와 브라우저 소스는 아직 운영 미배포다.

## 재현 방법

저장소 루트에서 의존성을 설치하고 공용 UI를 먼저 빌드한다. 새 worktree에서 UI dist가 없는 첫 라이브러리 검사는 모듈 누락으로 실패했다. 공용 UI build 후 재검사했으며 검사 제외나 타입 완화로 해결하지 않았다.

```sh
pnpm install --frozen-lockfile
pnpm --filter @web-tech/ui build
pnpm --filter docs test:lib
pnpm --filter docs lint
pnpm --filter docs typecheck

BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false BLOG_CONTENT_API_BASE_URL= \
  BLOG_CONTENT_API_BASE_URL_PUBLIC= BLOG_CONTENT_API_BASE_URL_INTERNAL= \
  pnpm --filter docs build
NODE_ENV=production pnpm --filter docs test:offline --reporter=list
```

- 집중 단위 검사: `node --experimental-strip-types --test apps/docs/lib/offline-client.test.ts apps/docs/lib/offline-worker.test.ts apps/docs/lib/push-service-worker.test.ts`.
- 운영의 직접 진입과 Feed 카드 진입을 구분했다. `/ko/feed`에서 실제 카드 Link로 Brotli 글에 이동하고 본문 로딩 완료를 기다린 뒤 저장했다. `performance.timeOrigin` 불변으로 같은 document 이동임을 확인하고 Worker의 client pathname·안전한 오류 코드만 읽었다. 실패 후 **같은 탭을 새로고침하고 다시 저장**하는 대조를 수행했다. 저장소·권한·Worker 삭제나 서버 소스 교체는 하지 않았다.
- `offline-reading.spec.ts`는 신고 글의 직접/카드 진입 저장·완전 오프라인 읽기, 현재 글 listener 없는 Feed의 위조 요청 거부, 합성 대기 Worker, 등록 거부, 용량/접근 거부, 응답 없음, 쓰기 후 확인 실패를 검사한다. 장애 주입은 격리된 로컬 브라우저/Worker에만 한다.

## 결과와 증거

| 구분                      | 실제 결과                                                                                                                                       | 판단                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 운영 Brotli 직접 진입     | Chrome/Chromium 두 폭에서 저장 성공                                                                                                             | 이것만으로 실제 사용자 동선을 검증하지 못했던 초기 대조.                |
| 운영 Feed→Brotli 진입     | Chrome 일반 모드 새 persistent profile의 두 폭 모두 `source` 거절. 주소창은 상세, Worker client pathname은 `/ko/feed`, 글 cache는 생성되지 않음 | 실제 신고 문구와 같은 운영 실패를 재현. 출처 주소 검증에서 거절됨.      |
| 같은 탭 새로고침 대조     | 두 폭 모두 새로고침 뒤 저장 성공·글 cache 생성                                                                                                  | 권한·저장소를 지우거나 바꾸지 않고 최초 문서 주소만 달라졌을 때 성공.   |
| 운영 Event Loop 직접 진입 | 새 Chromium 두 폭에서 저장 성공                                                                                                                 | 특정 글 자체만의 장애라고 단정하지 않는 대조.                           |
| 기존 Worker 선택 순서     | active가 있어도 waiting을 먼저 선택. 대기 업데이트가 redundant가 되면 정상 active까지 거부                                                      | 별도 잠재 결함을 active 우선으로 수정. 신고의 SPA 주소 결함과 구분.     |
| 최종 라이브러리           | 346개 통과                                                                                                                                      | 집중 오프라인·푸시 단위 19개는 포함 관계이므로 합산하지 않음.           |
| 최종 production 오프라인  | 62개 통과, skip·실패 0                                                                                                                          | desktop/mobile 각 31개. 실제 카드 이동·위조 Feed 요청 거부와 진단 포함. |
| 빌드·타입·lint            | 성공, static page 33개 생성                                                                                                                     | 기존 published 글 2개의 스타일 경고 유지. 글 본문은 수정하지 않음.      |

원인은 Worker의 `Client.url`을 현재 주소로 간주한 점이다. 이 속성은 SPA 내 이동에서 갱신되지 않을 수 있다. [MDN 설명](https://developer.mozilla.org/en-US/docs/Web/API/Client/url) 및 [명세의 creation URL](https://w3c.github.io/ServiceWorker/v1/#client-url)과 실제 대조가 일치한다. 초기의 ‘새 프로필이면 성공’ 관측은 직접 URL 진입 조건에만 해당했다. 이후 카드 진입 대조로 원인을 좁혔으며 기존 관측을 실패 재현으로 바꾸어 적지 않는다.

수정은 출처 검증을 삭제하지 않고 browser 발신 client에 전용 port로 현재 공개 글을 확인한다. listener 없는 실제 Feed의 위조 저장 요청도 거절한다. 결정과 신뢰 경계는 [ADR-0026](../../architecture/adr-0026-offline-spa-article-context.md)에 둔다. 최초 진단 묶음 344개/58개 통과 후 SPA·listener 회귀를 추가해 최종 346개/62개로 재검사했으며 합산하지 않는다.

기준 main과 수정 함수에 같은 active+waiting 조건을 넣은 별도 로컬 대조는 각각 `rejected-usable-active-registration`과 `active-registration-returned`를 관측했다. 과거 소스 실행용 임시 harness·운영 캡처·원시 응답은 공개하지 않는다. 현재 코드의 재현 가능한 회귀는 `offline-client.test.ts`의 active Worker 테스트다.

첫 저장소 오류 회귀는 ‘실패 응답이면 저장본은 항상 그대로’라는 잘못된 가정 때문에 실패했다. 실제로 쓰기는 끝났어도 뒤따르는 목록 조회가 실패할 수 있었다. 이를 `storage-confirmation`으로 분리하고 저장 결과 불확실 안내 및 실제 저장본 갱신 여부를 검사했다. 공간 부족/쓰기 거부로 쓰기 전 실패하는 경우에는 이전 저장본 불변 검사를 유지했다.

## 한계와 후속 작업

- 운영 Chrome에서 실제 카드 이동의 `source` 거절은 재현했지만, 사용자 기존 프로필 내부의 다른 권한·확장 상태까지 조사한 것은 아니다. 수정 후 같은 사용자 탭의 운영 검증은 배포 이후에 수행한다.
- 최초 수정과 문서는 공개 승인 후 커밋·푸시하고 [PR #81](https://github.com/IMHOJEONG/web-tech/pull/81)을 생성했다. main 병합·운영 배포는 하지 않았다. 배포 후 같은 기존 프로필에서 **오류 자세히**의 코드·단계를 확인하는 절차가 필요하다.
- 원시 예외·본문·URL query·토큰·프로필을 수집하지 않고 UI에 allowlist 코드·단계만 노출한다. 브라우저 내부 실패를 Vercel Runtime Logs에서 직접 볼 수 있는 서버 수집 API는 추가하지 않았다.
- 알림 권한 요청·Worker URL/scope 변경·자동 저장 재시도·캐시 일괄 삭제는 하지 않았다. 기존 공개 경로/발신 client 검증과 저장본 보존을 유지했다.
- 실기기·Safari·실제 확장 프로그램 조합과 사용자 기존 데이터 상태는 미검증이다. 별도 원본 artifact 링크는 없으며 원시 자료는 비공개 로컬에만 보관한다.

## PR #81 후속 검증

- 검증 코드: 오프라인 진단·CI 안정화 [d2949a8](https://github.com/IMHOJEONG/web-tech/commit/d2949a853f0c358319fccf984c295edc36bf5e8c), 목차 수정 [3a65604](https://github.com/IMHOJEONG/web-tech/commit/3a6560411853f6447280041d280203fab73cecc1). 최종 검증 소스는 두 번째 커밋과 일치한다. 후속 문서 공개본의 검수 해시는 [현재 승인 manifest](../../../.publication-review.json)에서 확인한다.
- 기존 원격 실행 [41201077212](https://github.com/IMHOJEONG/web-tech/actions/runs/41201077212)의 head는 `e940e143`다. 오프라인 62개 중 61개가 통과했고 모바일 Feed 클릭을 개발 오버레이가 차단해 60초 후 실패했다. 집계 `Test`도 이 결과에 따라 실패했다. 동일 `next dev` 조건의 로컬 단일 검사에서 같은 클릭 차단을 재현했다. 기존 production 62/62 성공과 실행 조건을 구분한다.
- 강제 클릭·오버레이 숨김·skip·timeout 확대 대신 모바일에서는 실제 Drawer 메뉴, 데스크톱에서는 배너의 Feed 링크를 선택한다. 같은 document임을 확인하고 실제 `removeEventListener` 관측으로 현재 글 listener 해제를 기다린 뒤 위조 저장 거부를 검사한다. URL 변경과 effect cleanup 사이의 잠재 race는 CI에서 관측한 클릭 차단과 다른 문제다.
- 구형 Worker의 단계 없는 응답은 `unknown`으로 남기고 유효한 단계는 보존한다. Worker 등록의 `SecurityError`는 저장소 작업 이전의 실패이므로 `registration`으로 분류한다. 실제 저장소 접근 거부 분류는 유지한다.
- 추가 목차 신고는 `1/2 — 압축할 바이트 만들기`, `2/2 — 복원 결과와 실행 버전 출력`을 대상으로 확인했다. TOC의 GitHub slug와 제목 컴포넌트의 자체 ID가 달랐다. runtime MDX에 `rehype-slug`를 적용하고 컴포넌트에서 전달받은 ID를 보존한다. 문장부호·inline markup·중복 제목·h5/h6의 단위 회귀를 추가했다. 이 단위 회귀는 수정 전 실패하고 수정 후 성공했다.

| 후속 검사           | 실제 결과                    | 범위                                                                                                                                                |
| ------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 전체 라이브러리     | 347개 통과                   | 최초 346개에 목차 ID 회귀 1개 추가.                                                                                                                 |
| 개발 서버 오프라인  | 62개 통과                    | CI와 같은 `next dev`, desktop/mobile 각 31개.                                                                                                       |
| production 오프라인 | 62개 통과                    | 같은 소스의 성공한 production build로 실행. 개발 결과와 합산하지 않음.                                                                              |
| 목차 클릭           | 개발 3개·production 3개 통과 | 390/768/1280px, 신고된 두 링크의 ID·해시·헤더 아래 스크롤 위치 및 모바일 포커스/목차 닫힘.                                                          |
| 타입·lint·build     | 통과                         | 새 관측 helper의 전역 타입 선언 오류로 최초 typecheck/build가 실패했다. 선언을 바로잡아 재검사했으며 검사 완화는 없었다. 기존 글 2개의 경고는 유지. |

후속 재현 명령은 저장소 루트 기준이다. production 실행 전에는 위의 원격 조회 비활성 build를 먼저 수행한다. 브라우저 원시 trace는 저장소 밖의 비공개 출력 디렉터리를 사용한다.

```sh
pnpm --filter docs test:lib
pnpm --filter docs test:offline --reporter=list --output=/tmp/docs-offline-dev-review
NODE_ENV=production pnpm --filter docs test:offline --reporter=list --output=/tmp/docs-offline-prod-review
DOCS_E2E_PORT=3018 pnpm --filter docs test:e2e e2e/article-anchor-scroll.spec.ts --grep 'Brotli numbered' --workers=1 --reporter=list --output=/tmp/docs-toc-dev-review
NODE_ENV=production DOCS_E2E_PORT=3018 pnpm --filter docs test:e2e e2e/article-anchor-scroll.spec.ts --grep 'Brotli numbered' --workers=1 --reporter=list --output=/tmp/docs-toc-prod-review
```

새 head의 원격 CI·CodeRabbit 결과는 PR과 Jira의 해당 SHA 기록으로 확인한다. 여기의 로컬 성공을 원격 CI 성공이나 운영 배포 성공으로 바꾸어 적지 않는다. 후속 소스/문서의 푸시·리뷰 스레드 정리와 재검증은 별도 단계다.

## 추가 재리뷰 4건의 호환성 검증

사용자가 같은 PR에서의 보완을 승인한 범위다. 구현은 [521d004](https://github.com/IMHOJEONG/web-tech/commit/521d004cec5eb4ac89ab669c5ec375f5072058e7), 실제 production 렌더러 회귀는 [b4811d6](https://github.com/IMHOJEONG/web-tech/commit/b4811d663ae8a19ab1d1c23522d1161513290587)으로 나눴다. 아래 결과는 두 번째 커밋과 같은 소스의 로컬 결과이며 이전 head의 원격 CI 성공을 새 코드의 성공으로 대체하지 않는다.

- h5·h6와 호환 앵커에도 기존 header 기반 스크롤 여백을 적용했다.
- 기존 h1~h4 fragment를 숨은 앵커로 보존한다. 명시 ID, 기존 fragment의 첫 대상, 새 canonical ID 순으로 우선한다. 새 제목의 canonical ID가 기존 링크의 대상을 빼앗는 경우도 검사했다.
- 문서 뒤쪽의 정적 JSX ID까지 먼저 예약한다. 자동 ID만 충돌을 회피하며 작성자 ID를 바꾸거나 JavaScript를 평가하지 않는다. 이미 중복된 명시 ID·동적 DOM ID·제목 자체의 변경까지 자동 보존하지는 않는다.
- Node 기본 렌더링뿐 아니라 실제 상세 라우트의 커스텀 h1~h4 렌더러로 중복 제목을 검사했다. 테스트 전용 preload의 요청별 메모리 fixture만 사용하며 공개 글 파일·운영 라우트·환경변수는 수정하지 않았다. 다음 일반 요청과 preload 없는 일반 서버에서 fixture가 나타나지 않는 대조도 수행했다.

할당 규칙과 한계는 [ADR-0027](../../architecture/adr-0027-article-heading-anchor-compatibility.md)에 둔다. 원격 HTML 경로와 정적 `@next/mdx` loader는 이번 변경 대상이 아니다.

| 검사                         | 실제 결과                    | 조건과 범위                                                                                                                                |
| ---------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 전체 라이브러리              | 351개 통과                   | 이전 347개에 회귀 4개 추가. 명시 ID 충돌·기존 fragment 회귀는 수정 전 실패, 수정 후 성공.                                                  |
| 전체 production 상세         | 176개 통과                   | 모바일·데스크톱. 아래 새 목차 14개를 포함하며 합산하지 않는다.                                                                             |
| 새 production 목차 집중 검사 | 14개 통과                    | 실제 h1~h4 중복·명시 ID·h5/h6·이전 hash 직접 진입 및 reload·모바일 포커스/닫힘. 최종 전체 실행에는 다음 일반 요청의 원문 복원 검사도 포함. |
| 개발·production 오프라인     | 각각 62개 통과               | 실행 조건별 결과이며 합산하지 않는다.                                                                                                      |
| 일반 서버 원문 대조          | 개발 3개·production 3개 통과 | 신고된 Brotli 두 링크 정상. 테스트 헤더만 보내도 원문이 바뀌지 않음.                                                                       |
| 타입·lint·build·포맷         | 통과                         | 최초 VFileData 타입 호환 오류를 런타임 검증과 Record 타입으로 수정. 타입 억제·검사 완화 없음.                                              |

추가 재현 명령은 저장소 루트 기준이다. Node 24와 설치된 의존성을 사용한다. 상세 production 설정은 자체 build와 합성 loopback content 서버를 기동하며 NAS를 호출하지 않는다. 일반 production 오프라인·목차 대조는 앞 절의 원격 조회 비활성 build 절차를 따른다. 출력 디렉터리는 공개 artifact로 업로드하지 않는다.

```sh
pnpm --filter docs test:lib
pnpm --filter docs test:article:prod --reporter=list --output=/tmp/docs-article-compat-review
pnpm --filter docs test:article:prod article-e2e/article-heading-anchors.spec.ts --reporter=list --output=/tmp/docs-heading-compat-review
pnpm --filter docs test:offline --reporter=list --output=/tmp/docs-offline-compat-dev
NODE_ENV=production pnpm --filter docs test:offline --reporter=list --output=/tmp/docs-offline-compat-prod
pnpm --filter docs typecheck
pnpm --filter docs lint
```

전체 상세 검사의 의도적인 upstream 503 출력은 장애 음성 대조이며 실제 NAS 장애를 주입한 것이 아니다. 기존 published 글 2개의 스타일 경고는 유지됐다. 개발 오프라인 검사에서는 이전 리뷰 수정 CI에서도 보였던 thumbnail의 `loading=eager/lazy` hydration 경고가 남았다. 테스트 통과와 경고 해소를 동일시하지 않으며 이 경고의 production 발생 여부·별도 원인은 이번에 조사하지 않았다. 실제 사용자 Chrome 프로필·실기기·Safari와 운영 배포 후 검증은 여전히 미수행이다.

## 관련 문서

- [저장·보안 경계 ADR-0015](../../architecture/adr-0015-explicit-offline-article-snapshots.md)
- [SPA 현재 문서 확인 ADR-0026](../../architecture/adr-0026-offline-spa-article-context.md)
- [오프라인 운영 절차와 코드별 조치](../../runbooks/docs-offline-reading.md)
- [작업 기록](../../worklog/2026-10/2026-10-31-offline-save-diagnostics.md)
