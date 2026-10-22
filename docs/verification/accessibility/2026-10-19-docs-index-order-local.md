# 문서 목록 우선 배치의 로컬 검증

## 대상과 조건

- 날짜: 2026-10-19 Asia/Seoul. `feature/docs` HEAD `29acd24` 위 미커밋 목록 UI 변경을 검사했다. 전체 기준 SHA와 도구 버전은 artifact에 보관한다.
- 환경: 로컬 Next.js 16.3.8 development 서버 `http://127.0.0.1:3011`. 원격 인덱스를 비활성화하고 로컬 문서를 사용했다. 기본 목록은 12개, `stream` 검색은 3개였다.
- 기본 반응형 측정은 Chromium 320/390/768/1280px × 밝은/어두운 테마 × 인덱스/검색의 16조건이다. 높이는 320/390px에서 844px, 768/1280px에서 900px이다.
- 큰 root 글자 32px 4조건, 긴 검색어의 빈 결과 2조건, 펼친 필터 4조건을 더해 총 26조건을 측정했다. reduced motion을 사용했으며 실제 기기·브라우저 자체 확대 검사가 아니다.

## 재현 방법

저장소 루트에서 실행한다. 3011번에 기존 서버가 있으면 같은 로컬 전용 설정인지 먼저 확인한다. Playwright가 새로 실행한 서버는 종료 시 정리하지만 재사용한 서버는 유지한다.

```bash
DOCS_E2E_PORT=3011 mise exec -- pnpm --filter docs test:e2e docs-index-order docs-index-navigation docs-index-pagination content-discovery search-navigation docs-touch-target horizontal-overflow --project=chromium-mobile --project=chromium-desktop --workers=2
DOCS_E2E_PORT=3011 mise exec -- pnpm --filter docs test:e2e docs-index-order --project=chromium-mobile --project=chromium-desktop --workers=2
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter docs lint
```

26조건 측정은 실행 당시의 일회성 `/tmp/measure-docs-index-order.cjs`로 수행했다. 이 스크립트는 저장소의 상시 검사 도구가 아니다. 영구 `docs-index-order.spec.ts`는 한/영 목록·검색의 초기 위치, 보조 탐색 순서와 선택 해제를 두 프로젝트에서 검사한다. 추가 조건은 같은 두 URL에서 viewport·테마·root font-size와 필터 펼침 상태를 바꿔 재현한다.

## 결과와 증거

| 화면        | viewport | 10-14 공개 기준선의 첫 제목 | 10-19 로컬 첫 제목 | 제안 목표  |
| ----------- | -------- | --------------------------- | ------------------ | ---------- |
| 인덱스      | 390×844  | 2,730px                     | 512px              | 650px 이내 |
| stream 검색 | 390×844  | 1,306px                     | 452px              | 500px 이내 |
| 인덱스      | 1280×900 | 1,268px                     | 426px              | 550px 이내 |
| stream 검색 | 1280×900 | 736px                       | 398px              | 550px 이내 |

좌표는 문서 최상단 기준 CSS pixel이다. 이전 공개 화면은 문서 13개, 현재 로컬은 12개이며 deployment·실행 모드도 다르다. 동일 환경의 통제 실험이나 배포 개선율로 해석하지 않는다. 현재 로컬 네 조건이 제안 목표 안에 있는 사실을 확인했다.

| 검사                              | 결과                                           |
| --------------------------------- | ---------------------------------------------- |
| 관련 E2E 74개                     | 69개 통과·5개 조건부 제외·실패 0               |
| 캡처 옵션 보완 후 목록 E2E 재검사 | 12개 통과·제외/실패 0                          |
| 추가 화면 측정                    | 26조건 통과, HTTP 200·가로 넘침·pageerror 없음 |
| 타입 검사와 docs lint             | 통과                                           |

제외 5개는 데스크톱 프로젝트에서 모바일 전용 내비게이션 3개와 터치 영역 2개를 실행하지 않는 기존 조건이다. 통과 수에 포함하지 않았다.

첫 E2E 실행에서 `caret-color: transparent` 속성 차이의 hydration 경고를 한 번 관측했다. 새 스크린샷의 `caret: 'initial'`을 지정해 캡처 중 입력 스타일 변경을 피하고 목록 12개를 재검사했다. 이 결과를 모든 hydration 경고의 원인을 해결한 것으로 일반화하지 않는다.

검사에서 검색 제출의 동일 문서 이동·뒤로/앞으로·중복 제출 제어, 필터 query 보존과 페이지 초기화, 페이지네이션 경계, 태그·모음 재로드와 읽기 순서가 유지됐다. 선택한 섹션·정렬·태그·모음은 접힌 필터 밖에 표시되고 개별 해제할 수 있었다.

- [측정값과 검사 요약](../artifacts/2026-10-19-docs-index-order-local.json)
- [모바일 인덱스](../artifacts/2026-10-19-docs-index-order-index-390.png), [모바일 검색](../artifacts/2026-10-19-docs-index-order-search-390.png)
- [데스크톱 인덱스](../artifacts/2026-10-19-docs-index-order-index-1280.png), [데스크톱 검색](../artifacts/2026-10-19-docs-index-order-search-1280.png)

artifact의 `firstArticleTop`은 카드 내부 article 상단이며 링크 카드의 padding을 제외한다. 이전 기준선과의 비교에는 동일한 `firstTitleTop`을 사용했다.

## 한계와 후속 작업

운영용 빌드·공개 배포·실기기 Safari/Firefox·스크린 리더·사용자 이탈률은 이번에 검증하지 않았다. 캡처의 Next 개발 표시기는 개발 환경에만 해당한다. 측정의 pageerror 0은 모든 console 경고가 없다는 뜻이 아니다.

이번 구현은 목록 순서와 필요한 검색 패널·필터 진입부를 정리한 1단계다. 통계·섹션·태그·모음은 기능과 기존 표현을 보존한 채 목록 뒤로 이동했다. 통계 중복 축소·보조 탐색의 추가 접힘·카드의 메타/OPEN 정리는 후속 단계다. 검색 순위·데이터 조회와 카드 자체 스타일은 변경하지 않았다.

## 관련 문서

- [개선 전 검토](2026-10-14-docs-index-density-review.md)
- [목록 순서·밀도 기준](../../architecture/docs-search-experience-policy.md#문서-목록-순서와-밀도-보완-검토)
- [진행 목록](../../todo/todo.md)
- [작업 기록](../../worklog/2026-10/2026-10-19-docs-index-order.md)
