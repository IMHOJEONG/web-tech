# Feed 화면 밖 렌더링 지연 비교

## 대상과 조건

2026-11-22 KST, 요청 취소 커밋 `35c6b59e` 기준 실제 Vuln Radar 프로덕션 빌드와 합성 25개 카드를 사용했다. 기본 페이지 크기 25개를 유지하고 제목 길이·KEV·워치리스트 수가 다른 표본을 구성했다. 실제 서비스 API·사용자 데이터는 사용하지 않았다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

이번 후보는 첫 6개를 유지하고 7번째 이후 카드에만 `content-visibility: auto`와 `contain-intrinsic-block-size: auto <추정 rem>`을 적용했다. CSS는 비교 브라우저에만 주입했으며 제품 소스를 편집하지 않았다. 결론은 **현재 후보 적용 보류**다.

Modern Web Guidance의 defer-rendering-heavy-content·performance에서 초기 fold 제외, intrinsic size, 연속 키보드 검사와 작은 목록의 과도한 적용 주의를 확인했다. `hidden`·`aria-hidden`·JS 가상화는 추가하지 않았다. 미지원 브라우저는 `@supports` 블록을 적용하지 않고 기존 렌더링을 유지하는 실험 구조다.

## 재현 방법

1. 현재 실제 앱을 저장소 밖 신규 출력 경로로 빌드한다.

   ```sh
   pnpm --filter vuln-radar exec vp build --outDir /tmp/web-tech-feed-rendering/dist
   ```

2. SPA를 루프백 정적 서버로 제공하고 Feed 검색 응답만 합성 25개·전체 50개·2페이지로 반환한다. 세 종류의 제목 길이와 KEV·워치리스트 수를 반복해 폭에 따른 카드 크기를 다르게 만든다.
3. 별도 기준 페이지에서 카드 좌표와 padding/border를 읽는다. 이 보정 실행은 성능 표본에서 제외한다. 7번째 카드가 초기 850px fold 밖인지 확인하고, 7~25번째 카드의 평균 content-box 높이를 rem으로 변환한다.
4. 후보에만 아래 CSS를 모듈 실행 전 주입한다. 같은 observer 코드는 기준안에도 사용한다. 미리 정한 높이를 매 실행 중 다시 측정하지 않는다.

   ```css
   @supports (content-visibility: auto) {
     main .grid.gap-3 > article.group:nth-child(n + 7) {
       content-visibility: auto;
       contain-intrinsic-block-size: auto 28.766rem;
     }
   }
   ```

   위 값은 390px 표본이며 1280px에서는 12.332rem을 사용했다. 제품 CSS·브라우저 지원 정책을 변경한 결과가 아니다.

5. Chromium의 새 context·빈 cache·CPU 4배, 390/1280×850px에서 기준/후보를 반복마다 교대해 각각 5회, 총 20회 실행한다. 카드 25개가 DOM에 나타난 뒤 두 frame과 100ms를 기다려 초기 지표를 수집한다. 이후 600px씩 끝까지 이동하고 두 frame씩 기다린 뒤 맨 위로 돌아온다.
6. CDP의 LayoutDuration·RecalcStyleDuration과 별도의 초기/스크롤 trace에서 Layout·UpdateLayoutTree·Paint·PrePaint를 집계한다. LCP·최대 session-window CLS, 자동 생략 상태 이벤트와 스크롤 높이도 기록한다. 초기 측정 중 생략된 카드의 자손 기하를 읽어 렌더링을 강제하지 않는다.
7. 세 엔진·두 폭·기준/후보 12조건에서 첫 결과를 포커스한 뒤 키보드만으로 25개 링크에 차례로 도달하고 역방향 경계·페이지 이동 버튼 포커스를 검사한다. macOS WebKit의 링크 이동에는 Option-Tab을 사용한다. `window.find`로 마지막 표본의 검색·선택도 확인한다.

실행 harness·합성 서버·원시 trace는 저장소 밖에 보관했다. [정제 결과와 소스·trace 해시](../artifacts/2026-11-22-feed-offscreen-rendering.json)

## 결과와 증거

### 화면 밖 조건과 크기

| 폭     | 첫 카드 top | 7번째 top | 기준 카드 높이 범위 | 후보 content-box 추정 |
| ------ | ----------- | --------- | ------------------- | --------------------- |
| 390px  | 1,352.6px   | 4,386.4px | 467.5~530.8px       | 28.766rem             |
| 1280px | 599.9px     | 2,059.8px | 231.3px             | 12.332rem             |

7번째 이후가 초기 fold 밖임을 확인했다. 후보의 초기 자동 생략 카드는 모바일 19개·데스크톱 18개였다. 브라우저의 viewport 근처 선행 렌더링 때문에 적용 대상 모두가 생략되는 것은 아니다.

### 초기 비용과 전체 스크롤

시간은 폭·안별 5회 중앙값이며 CPU 4배의 로컬 관측이다. 스크롤 Layout은 초기 측정 이후의 추가분이다.

| 폭·안     | 초기 Layout ms | 초기 Style ms | 초기 LCP ms | 전체 스크롤 추가 Layout ms |
| --------- | -------------- | ------------- | ----------- | -------------------------- |
| 390 기준  | 94.0           | 18.2          | 516         | 0                          |
| 390 후보  | 86.4           | 14.7          | 504         | 40.6                       |
| 1280 기준 | 97.1           | 18.2          | 552         | 0                          |
| 1280 후보 | 84.2           | 15.9          | 556         | 26.4                       |

초기 Layout 절약은 약 7.5/12.9ms였고 스크롤 시 추가 Layout·Style 작업이 발생했다. trace의 스크롤 Paint 중앙값도 모바일 약 35.4→43.3ms, 데스크톱 약 12.9→25.0ms로 늘었다. 초기 Paint의 작은 차이나 LCP를 운영 개선량으로 일반화하지 않는다. 사용자가 전체 목록을 읽을 때는 뒤로 미뤄진 작업을 수행하므로 모든 비용이 제거된 것은 아니다.

20실행의 초기·스크롤 CLS 최댓값은 0이었다. 마지막까지 이동 후 높이는 기준 0px 변화, 후보 모바일 0px·데스크톱 1px 변화였고 맨 위 복귀는 scrollTop 0이었다. 이 조건에서 큰 높이 변화를 관측하지 않았지만 임의 데이터와 모든 스크롤 앵커의 무이동을 입증한 결과는 아니다.

### 키보드와 검색·페이지 회귀

12조건에서 결과 25개 링크의 연속 도달·viewport 안 포커스, 역방향 이동과 다음 페이지의 버튼 포커스 유지가 통과했다. 세 엔진 모두 `window.find`로 마지막 제목을 찾아 선택했다. 이는 브라우저의 물리적인 Command-F 도구막대를 직접 검증한 결과와 구분한다.

기능 비교의 후보 높이 변화는 엔진·폭에 따라 0~1px였고 pageerror는 0개였다. VoiceOver 발화·로터는 사용자 요청으로 생략했다. 숨기기 속성을 추가하지 않았다는 사실만으로 스크린리더 검증을 통과했다고 보고하지 않는다.

## 한계와 후속 작업

보수적으로 첫 6개를 유지한 특정 CSS 후보와 합성 25개 표본의 결과다. 모든 content-visibility 적용이 불리하다는 결론이 아니다. 매우 긴 목록·더 무거운 카드·다른 보호 경계·실제 사용자 스크롤 패턴은 별도 측정이 필요하다. 추정값은 이번 표본에서 유도했으며 임의 콘텐츠에 그대로 재사용하지 않는다.

현재 25개 목록에서는 초기 절약이 작고 전체 스크롤 비용이 늘었으며 LCP의 일관된 개선도 확인하지 못해 채택하지 않았다. 제품 소스·CSS·의존성을 변경하지 않았다. 새 구조 결정을 적용하지 않아 ADR을 추가하지 않았다. 다음 기존 후보는 실제 응답 헤더와 외부 자원 목록을 확인한 뒤 CSP Report-Only 도입 가능성을 판단하는 조사다.

운영 LCP/INP·실기기·실제 Safari 앱·실서비스 API·미지원 구형 브라우저·VoiceOver는 미검증이다. 최초 마감 시 보고서·artifact·작업 기록은 로컬 미커밋이었으며 후속 커밋과 개발 서버 종료는 작업 기록에서 연결한다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-22-feed-offscreen-rendering.md)
- [기존 현대화 후보](../accessibility/2026-11-21-frontend-modernization-audit.md#우선-적용-후보와-완료-기준)
- [요청 취소 검증](../integration/2026-11-22-feed-request-cancellation.md)
- [web.dev content-visibility와 강제 렌더링 주의](https://web.dev/articles/content-visibility)
- [MDN intrinsic block size](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/contain-intrinsic-block-size)
