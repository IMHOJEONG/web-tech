# 2026-08-26 Docs Responsive Checklist And Static Audit

## 배경

`/docs` 인덱스 개선과 문서 카드 공통 UI 분리 이후, `640px ~ 1023px` 구간의 shell/UI 동작을 실제 디바이스 기준으로 확인해야 한다.

이 구간은 mobile shell과 desktop shell 사이의 경계가 섞이기 쉬워서, 별도 체크리스트가 필요하다.

## 추가한 문서

- `docs/runbooks/docs-responsive-browser-device-checklist.md`

이 문서는 아래 기준을 포함한다.

- 브라우저별 점검 기준
- viewport별 점검 기준
- route별 확인 순서
- header, drawer, bottom nav 체크리스트
- `/docs`, `/feed`, article detail, channel hub, about 체크리스트
- 정적 코드 점검 패턴
- 향후 Playwright 자동화 후보

## 정적 점검 결과

아래 명령으로 breakpoint 관련 패턴을 훑었다.

```bash
rg -n "sm:|md:|lg:|xl:" apps/docs/widgets/docs-index apps/docs/widgets/m apps/docs/widgets/article-detail apps/docs/widgets/about-us apps/docs/widgets/content-hub apps/docs/widgets/app-shell
```

정책과 비교했을 때 우선 확인할 후보:

- `DocsIndexCard`
  - `sm:flex-row`
  - 카드 우측 `Open` pill이 640px 직후부터 옆으로 붙으므로, 좁은 tablet에서 제목/요약 폭을 압박할 수 있다.
- `DocsIndex`
  - `sm:grid-cols-3`, `sm:grid-cols-2`
  - stats와 section summary가 640px 직후부터 다열화되어 카드 밀도가 빠르게 올라갈 수 있다.
- `HubPage`
  - `md:grid-cols-3`
  - channel hub panel이 768px부터 3열로 전환되어 텍스트 폭이 좁아질 수 있다.
- `AboutUs`
  - `md:grid-cols-3`, `sm:grid-cols-3`
  - 소개 카드가 tablet portrait에서 과하게 압축될 수 있다.
- `Header`
  - `sm`부터 desktop navigation이 보이고 `md`부터 theme toggle이 보인다.
  - 정책상 허용 가능한 구조지만, 640~767px에서 navigation 폭이 부족한지 실제 확인이 필요하다.

## 현재 판단

자동화 도구는 아직 `apps/docs`에 없다.

따라서 지금 단계에서는 아래 순서가 적절하다.

1. runbook 기준으로 수동 브라우저 QA를 진행한다.
2. 문제가 재현된 viewport와 route를 worklog에 남긴다.
3. 반복되는 shell visibility 또는 anchor scroll 문제만 Playwright smoke test로 승격한다.
4. screenshot diff는 시각 회귀가 반복될 때 도입한다.

## 다음 조치 후보

- `DocsIndexCard`의 `sm:flex-row`를 `md` 또는 `lg` 기준으로 늦출지 검토
- `DocsIndex` section summary grid를 640px 구간에서는 1열 또는 2열로 유지할지 검토
- `HubPage` panel grid의 `md:grid-cols-3`를 `lg:grid-cols-3`로 늦출지 검토
- `AboutUs` 내부 `sm:grid-cols-3` 사용 지점을 실제 viewport에서 확인
