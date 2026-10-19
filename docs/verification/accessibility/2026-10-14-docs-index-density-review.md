# 문서 인덱스와 검색 결과의 목록 도달 거리 검토

## 대상과 조건

- 날짜: 2026-10-14 Asia/Seoul. 공개 사이트 `https://heap-forge.app`의 한국어 화면을 관측했다.
- 범위: `/ko/docs`, `/ko/docs?q=stream`과 Chromium 1280×900·390×844의 네 조건.
- 조건: 기본 글자 크기, 밝은 테마, `prefers-reduced-motion: reduce`, 로그인 없는 새 브라우저 context. 화면 전환 후 load·폰트 준비를 기다렸다.
- 코드 대조 기준: `feature/docs` HEAD `d8c09527f8cb9195aa16258fee9b2bec916ee818`와 당시 미커밋 작업 트리. 공개 deployment ID·SHA는 이 점검에서 확정하지 않았다. 로컬 코드가 공개 배포와 동일하다고 간주하지 않는다.
- 이 보고서는 앞선 UI/UX 분석의 측정값을 영구 문서로 정리한 것이다. 개선 후 재측정이나 사용자 행동 실험은 아직 하지 않았다.

## 재현 방법

앞선 점검에서 저장소의 Playwright를 사용해 실행한 명령은 다음과 같다. 스크립트와 전체 캡처는 임시 경로이므로 장기 보존 증거는 아래 artifact에 필요한 관측값만 발췌했다.

```bash
mise exec -- node /tmp/blog-ui-audit.cjs
```

재측정 시 같은 두 URL을 각 viewport로 열고 글 목록이 표시된 뒤 브라우저 Console에서 다음 값을 확인한다. 섹션 모음의 링크를 실제 문서 카드로 잘못 세지 않도록 `article h3`가 있는 링크를 선택한다. 세로 위치는 페이지 맨 위 기준 CSS pixel이며 현재 스크롤을 더한다.

```javascript
const firstCard = [...document.querySelectorAll("main a")].find(
  (link) =>
    link.querySelector("article h3") && link.getBoundingClientRect().height > 0,
);
const firstTitle = firstCard?.querySelector("article h3");
console.log({
  viewport: { width: innerWidth, height: innerHeight },
  firstCardTop: firstCard
    ? Math.round(firstCard.getBoundingClientRect().top + scrollY)
    : null,
  firstTitleTop: firstTitle
    ? Math.round(firstTitle.getBoundingClientRect().top + scrollY)
    : null,
  pageWidth: document.documentElement.scrollWidth,
  pageHeight: document.documentElement.scrollHeight,
});
```

Network에서 문서 응답 상태를, Console에서 pageerror를 별도로 확인한다. 카드 구조가 변경되면 선택자를 수정하고 변경 전후 측정 대상이 같은 실제 문서 카드인지 확인한다.

## 결과와 증거

| 화면        | viewport | 첫 카드 상단 | 첫 글 제목 상단 | 페이지 높이 |
| ----------- | -------- | ------------ | --------------- | ----------- |
| 인덱스      | 1280×900 | 1,223px      | 1,268px         | 2,831px     |
| 인덱스      | 390×844  | 2,685px      | 2,730px         | 5,378px     |
| stream 검색 | 1280×900 | 691px        | 736px           | 1,417px     |
| stream 검색 | 390×844  | 1,261px      | 1,306px         | 2,369px     |

- 네 조건 모두 HTTP 200, pageerror 0건, 페이지 가로 넘침 없음이었다. 이는 해당 화면의 관측이며 전체 접근성·브라우저 호환성 통과를 의미하지 않는다.
- 기본 인덱스에는 당시 문서 13개·섹션 5개가 있었고 1페이지에 문서 8개를 표시했다. 검색은 결과 3개였다.
- 모바일 인덱스에서 검색 패널은 420px, 통계는 286px, 분류·정렬은 306px, 섹션 요약은 746px을 차지했다. 태그·모음까지 목록 앞에 배치돼 실제 제목이 세 viewport 높이보다 아래에 나타났다.
- 모바일 검색에서도 검색 패널 426px, 분류 250px, 태그 등이 결과 앞에 나타났다. 검색 제출 직후 첫 화면에서 문서 제목을 읽을 수 없었다.
- 첫 인덱스 카드의 모바일 높이는 282px이며 제목 폭은 276px였다. `/docs` 검색 패널 H1의 폭은 268px였다. 페이지 여백·패널 여백·메타 pill·OPEN 표시의 누적을 함께 검토해야 한다.
- [관측값 발췌](../artifacts/2026-10-14-docs-index-density-baseline.json)는 개선 전 기준선이다. 목표 수치와 분리한다.

위 결과는 목록 도달 거리가 길다는 근거다. 독자의 이탈률·검색 성공률이 실제로 악화됐다는 주장은 하지 않는다. 해당 지표는 수집하지 않았다.

## 한계와 후속 작업

각 조건 한 번의 표본이며 Safari·Firefox·실기기·영어·확대·키보드 전체 흐름은 이번 밀도 측정에서 미검증이다. 단발 load 시간을 성능 지표로 평가하지 않았다. 콘텐츠 추가·원격 인덱스 상태·폰트 설정에 따라 위치가 달라질 수 있다.

10-14 당시 순서 검토는 완료했고 UI 구현·개선 후 회귀 검사는 미착수였다. 이후 10-19에 [1단계 로컬 구현·검증](2026-10-19-docs-index-order-local.md)을 진행했다. 이 보고서의 기준선 측정값은 변경하지 않는다. 현재 진행은 [단계별 설계 기준](../../architecture/docs-search-experience-policy.md#문서-목록-순서와-밀도-보완-검토)을 따른다.

## 관련 문서

- [피드·색인 역할](../../architecture/adr-0003-feed-and-docs-roles.md)
- [태그·읽기 모음 계약](../../architecture/adr-0012-content-discovery-collections.md)
- [작업 기록](../../worklog/2026-10/2026-10-14-docs-index-density-review.md)
- [TODO](../../todo/todo.md)
