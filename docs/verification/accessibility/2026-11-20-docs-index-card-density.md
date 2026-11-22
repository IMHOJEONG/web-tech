# 문서 인덱스 카드 밀도 검증

## 대상과 조건

- 검증일: 2026-11-20 KST. 기준 로컬 커밋 `6f1851cd`, KAN-87의 보조 탐색 두 커밋 위에서 진행한 별도 미커밋 변경이다. 추적은 [KAN-88](https://web-tech-service.atlassian.net/browse/KAN-88)이다.
- 환경: Node 24.22.1·pnpm 12.14.0·Next 16.4.6 development·Playwright Chromium. 기본 390×844·768×1024·1280×800, 추가 320px·root 24px·한영·라이트/다크·reduced-motion 조건이다.
- 입력은 기존 합성 문서 17개와 필요한 합성 이미지다. 비공개 Git·NAS·운영 키를 사용하지 않는다. 원시 캡처·로그는 저장소 밖에 보관하고 이번 커밋에는 포함하지 않는다.

## 재현 방법

별도 작업 트리에서 [보조 탐색 검증의 준비 방법](2026-11-20-docs-index-discovery.md#재현-방법)대로 누락 합성 입력만 생성한다. 기존 문서·앱 자산은 덮어쓰지 않는다. 아래 명령은 저장소 루트에서 실행한다.

```sh
pnpm --filter docs test:lib
pnpm --filter docs typecheck
pnpm --filter docs exec eslint widgets/docs-index/model/docs-index-card-labels.ts widgets/docs-index/model/docs-index-card-labels.test.ts widgets/docs-index/ui/docs-index-card-layout.ts widgets/docs-index/ui/docs-index-card.tsx widgets/docs-index/ui/docs-index-pending.tsx e2e/docs-index-card-density.spec.ts e2e/page-skeletons.spec.ts --max-warnings 0
DOCS_E2E_PORT=3077 DOCS_CONTENT_SOURCE=legacy pnpm --filter docs test:e2e docs-index-card-density.spec.ts docs-index-order.spec.ts content-discovery.spec.ts docs-index-navigation.spec.ts docs-index-pagination.spec.ts docs-touch-target.spec.ts horizontal-overflow.spec.ts --workers=2 --retries=0 --output=/private/tmp/docs-index-card-density-results-v1-20261120
DOCS_E2E_PORT=3077 DOCS_CONTENT_SOURCE=legacy pnpm --filter docs test:e2e page-skeletons.spec.ts --grep ' /docs.*domain skeleton' --workers=2 --retries=0 --output=/private/tmp/docs-index-card-skeleton-results-20261120
DOCS_E2E_PORT=3077 DOCS_CONTENT_SOURCE=legacy pnpm --filter docs test:e2e page-skeletons.spec.ts docs-index-card-density.spec.ts --grep ' /docs.*domain skeleton|compact cards|narrow large text' --workers=2 --retries=0 --output=/private/tmp/docs-index-card-final-results-20261120
```

완료한 출력 디렉터리는 공개 업로드하지 않는다. 생성한 문서는 기존 생성기의 bytes와, 신규 이미지는 `syntheticPng` bytes와 대조한 뒤 이번에 생성한 경로만 정리한다.

## 결과와 증거

| 검사                             | 결과                          | 구분                                                                                 |
| -------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| 라이브러리 전체·Node 테스트 타입 | 381/381 통과                  | 메타 정규화·중복 이후 두 태그·빈 값·서로 다른 기술·입력 불변성 6개 추가              |
| 앱 타입·변경 코드 lint           | 통과                          | docs 전체 타입, 변경 코드 경고 0개                                                   |
| 브라우저 첫 실행                 | 95개 통과·기존 조건 제외 10개 | 105개, workers 2·retries 0, 약 1.5분                                                 |
| 최초 스켈레톤 기하·카드 간격     | 18개 통과·6개 실패            | 빈 검색 결과에서도 첫 카드를 찾던 새 조건의 30초 timeout. 운영 장애가 아닌 검사 오류 |
| 기본 간격 명시·스켈레톤 최종     | 48/48 통과                    | 카드 24개·스켈레톤/상세 기하 24개, workers 2·retries 0, 48.3초. 앱 구현 변경 없음    |

제외 10개는 기존 모바일 전용 navigation 3개·touch target 2개의 태블릿/데스크톱 조건이다. 신규 카드 검사는 세 프로젝트 모두에서 한영·라이트/다크를 실행한다. 빈 padding 클릭과 Enter로 실제 상세 이동, 본문·제목의 검색어 강조, 포커스 표시와 중복 메타를 확인한다. 320px·root 24px에서는 제목 24px·요약 21px를 유지하고 제목 전체 줄바꿈·요약 두 줄·44px 이상 카드와 가로 넘침을 검사한다.

최초 실패는 합성 `stream` 검색과 `nodejs` 교집합이 0개인 여섯 조건에서만 발생했다. 빈 결과는 해당 제목이 보이고 article이 0개임을 검사하며, 카드가 있는 조건에서는 실제 카드와 별도 스켈레톤 snapshot의 padding을 비교한다. 기존 상태·기하 허용오차·모션·오류 검사는 그대로 유지한다. 숨긴 요소를 찾거나 빈 결과용 가짜 카드를 만들지 않는다.

같은 합성 React 카드의 별도 화면 확인에서 390px 폭의 높이169px·상하 padding16px·제목16px·요약14px, 768/1280px 폭의 높이157px·padding20px·제목18px·요약14px를 측정했다. 세 폭 모두 페이지 가로 넘침0px이며 모바일·데스크톱 캡처를 직접 열어 확인했다. 단일 카드·현재 수정본의 관측값이며 이전 배포 대비 개선율이나 모든 글의 최대 높이가 아니다.

검사 뒤 생성 문서17개·신규 이미지5개는 bytes 대조 후 정리했고 테스트 서버 포트3077도 종료를 확인했다. 기존 문서·앱 자산은 보존했다.

## 한계와 후속 작업

- 카드와 스켈레톤의 간격만 공유하며 글 길이가 다른 모든 카드의 전체 높이가 같다고 주장하지 않는다. 정규화 비교는 동의어 추론이나 원문 메타 수정이 아니다.
- 실제 비공개 글·운영·Safari/Firefox·실기기·브라우저 자체 확대·스크린 리더는 미검증이다. root 글자 확대 검사를 브라우저 200%/400% 확대의 대체로 보고하지 않는다.
- 검증 당시에는 별도 미커밋 작업이었다. 이후 사용자가 코드·회귀7개와 정제 문서6개만 공개 검수·해시 등록·작업별 로컬 커밋하도록 승인했고 코드 기준은 `35f73bbd`다. 커밋 전 라이브러리381개·타입·lint·포맷 재검사가 통과했다. 브라우저 결과를 재실행 또는 운영 검증으로 바꾸지 않으며 푸시·PR·배포·원시 자료·다른 작업은 제외한다.

### 2026-11-22 최신 main 통합과 PR 준비

기준 main은567398255f3c00a35fc52432beb30a68e86ed2bb, 작업 브랜치는codex/docs-ui-pr-20261122다. 목차 정렬2개와 인덱스4개의 원본 커밋을 최신 main에서 재구성했다. 목차 브랜치의 실제 공통 조상은2728665e여서 비교 기준을 바로잡았고, 현재 콘텐츠 lock을 과거 게시 revision으로 되돌리는 차이는 제외했다. 원본14개 로컬 커밋·기존 미커밋·stash·비공개 자료는 원래 위치에 보존하며 새 브랜치에서만 정리한다. 겹친 목차는 새 main의 링크를 유지해 합치고 이전 승인 기록은 동일 bytes에만 사용한다.

docs test:lib 381개와 node-test 타입 검사를 통과했다. 전체 앱 타입·lint 결과는 같은 검증 기준으로 확인하며 브라우저 전체 검사는 원격 CI에서 별도 확인한다. 실행 환경은Node24.22.1·pnpm12.14.0이며 의존성은 frozen lockfile·ignore-scripts·offline으로 재사용했다. 설치 훅·dotenv skill은 승인하지 않았다.

사용자가 기존 목차4개와 관련 보고서/worklog6개의 정제 보완·재검수·해시 갱신을 승인했다. 최종 staged bytes의 공개·포맷·문서·메시지 검사 후 작업별 커밋과 푸시·main 대상 PR을 준비한다. 실제 원격 SHA·CI 결과는 같은 Jira/Confluence 추적 기록에 연결하며 로컬 통과를 원격 성공으로 바꾸지 않는다. main 병합·Production 배포·기존 PR 종료·브랜치/원본 삭제는 범위 밖이다.

## 관련 문서

- [목록 밀도 정책](../../architecture/docs-search-experience-policy.md#3-카드-밀도-검토)
- [작업 기록](../../worklog/2026-11/2026-11-20-docs-index-card-density.md)
