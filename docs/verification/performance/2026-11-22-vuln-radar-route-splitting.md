# Vuln Radar 화면별 JavaScript 분리 실험

## 대상과 조건

2026-11-22 KST, Noto 적용 커밋 `f05f7f5f`와 기존 작업 트리를 기준으로 했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)의 접근성 외 현대화 계획 중 세 번째 후보를 검증했다. 공용 API 클라이언트의 기존 미커밋 변경은 두 빌드에 동일하게 포함하고 수정하지 않았다.

실제 Vuln Radar 프로덕션 번들의 기준안과 화면 3개를 `lazyRouteComponent(() => import(...), namedExport)`로 분리한 후보를 비교했다. React·TanStack Router·Query의 기존 설치 버전을 사용하고 번들러 설정·의존성·라우트와 검색 계약은 유지했다. 후보에서도 `defaultPreload: "intent"`를 유지했다.

결론은 **현재 분리 후보의 제품 적용 보류**다. 후보 빌드와 검증 자료를 저장소 밖에 보존하고 제품 router를 원래 bytes로 복구했다. 아래 결과는 운영 배포와 구분한다.

## 재현 방법

1. 저장소 루트에서 기준 소스로 다음 프로덕션 빌드를 실행한다. 출력 폴더는 신규 폴더를 사용한다.

   ```sh
   pnpm --filter vuln-radar exec vp build --outDir /tmp/web-tech-route-split-before
   ```

2. `src/app/router/create-app-router.tsx`에서 Feed·Overview·VulnerabilityDetail의 정적 UI import를 제거하고 각 route의 component를 TanStack Router의 `lazyRouteComponent`로 연결한다. 검색 정규화 함수는 정적 import로 유지한다. 같은 명령의 출력 폴더를 `route-split-after`로 바꿔 후보를 빌드한다.
3. 두 산출물을 동일한 루프백 정적 서버에서 gzip으로 제공한다. SPA 직접 URL은 index.html을 반환하고 API는 동일한 합성 26건·2페이지 표본으로 처리한다. 실제 운영 API·DB·응답 원문은 사용하지 않는다.
4. Chromium의 새 context·빈 cache·390×850px에서 Feed와 Overview를 각각 3회 측정한다. 반복마다 기준/후보의 순서를 교대한다. 일반 연결·CPU 1배와 RTT 150ms·download 200,000bytes/s·upload 93,750bytes/s·CPU 4배로 총 24실행한다.
5. Resource Timing의 실제 JS encodedBodySize·decodedBodySize, 마지막 LCP, 최대 session-window CLS, CDP ScriptDuration, Long Task를 수집한다. 화면 준비 시간은 해당 화면 제목이 DOM에 나타난 뒤 두 animation frame으로 정의한다. 이는 API 본문의 모든 panel 준비와 다르다.
6. 실제 빌드 화면의 Chromium·Firefox·WebKit과 390·1280px에서 직접 URL·검색 파라미터·검색/0건·상세 Enter 이동·뒤로 가기·focus/hover 선로딩을 확인한다. 단발성 청크 실패의 재로드 복구도 별도 확인한다.

제품 타입·린트와 기존 회귀 명령은 다음과 같다.

```sh
pnpm --filter vuln-radar typecheck
pnpm --filter vuln-radar exec eslint src/app/router/create-app-router.tsx --max-warnings 0
pnpm --filter vuln-radar test:lib
```

## 결과와 증거

### 초기 요청과 표시 시간

크기는 브라우저가 실제 받은 모든 JS 응답의 합이다. 시간은 3회 중앙값이며 Chromium 버전은 artifact에 기록했다. 표의 LCP는 느린 연결 조건이다.

| 직접 진입 | 기준 JS bytes | 후보 JS bytes | 기준 gzip bytes | 후보 gzip bytes | 기준 LCP ms | 후보 LCP ms |
| --------- | ------------- | ------------- | --------------- | --------------- | ----------- | ----------- |
| Feed      | 483,101       | 451,171       | 141,662         | 139,721         | 1,596       | 1,688       |
| Overview  | 483,101       | 456,671       | 141,662         | 140,728         | 1,388       | 1,520       |

후보의 진입 JS 한 파일은 257,274bytes지만, 초기 요청에는 161,316bytes의 공통 청크와 공용 API·현재 화면 청크가 추가된다. 진입 파일의 감소율을 초기 전체 JS 감소율로 보고하지 않는다. Feed의 전체 JS는 약 6.6%, gzip은 약 1.4% 감소했다. 빌드 도구의 gzip 추정과 서버의 gzip 옵션이 달라 표에는 실제 응답 크기만 사용했다.

느린 연결에서 화면 제목 준비 시간은 Feed 1,587→1,683ms, Overview 1,395→1,527ms였다. 같은 조건의 ScriptDuration은 Feed 284→252ms, Overview 285→270ms였다. Feed의 Long Task 합은 283→203ms였지만 실제 사용자의 INP를 측정한 것은 아니다. 일반 연결의 LCP는 Feed 128→128ms, Overview 136→132ms였다.

CLS 최댓값은 두 연결 조건 모두 Feed 0→0, Overview 약 0.1418→0.1418이었다. Overview에는 기존 비동기 panel 표시로 이동이 관측되며 이번 분리가 이를 해소하지 않았다. 이 표본에서 원인별 CLS 기여를 분해하지 않았으므로 별도 분석이 필요하다.

첫 화면의 작은 압축 전송량 절약에 추가 청크 요청의 왕복이 더해졌다. 이번 표본에서는 직접 진입의 표시 지연을 상쇄할 이득이 확인되지 않아 후보를 채택하지 않았다.

### 기능 회귀와 검사

실행 결과는 [정제 artifact](../artifacts/2026-11-22-vuln-radar-route-splitting.json)에 기록한다. 세 엔진·두 폭·두 빌드의 12조건에서 네 직접 URL과 검색/0건·상세 키보드 이동·뒤로 가기·focus/hover 선로딩을 확인했다. 단발성 상세 청크 실패에서 문서 요청 2회, 재로드 1회 뒤 복구했다. 두 빌드와 타입·린트, 기존 단위 테스트 36개도 통과했다. 제품 router의 최종 해시는 기준안과 일치한다.

별도 느린 연결·390px의 6실행에서 선로딩 완료 후 상세 Enter·개요 click 이동을 각각 비교했다. 제목 표시까지의 3회 중앙값은 상세 232→224ms, 개요 143→162ms였다. 자동화 입력 전달·행동 대기와 두 frame을 포함한 로컬 경계값이며 전체 데이터 준비 시간·INP가 아니다. 전환 시간의 작은 차이는 개선으로 단정하지 않는다.

초기 검증 스크립트가 미사용 번역 문장을 Overview의 H1로 지정하고 입력을 searchbox로 가정해 실패했다. 실제 DOM의 `Global Vuln Radar` H1과 이름이 붙은 textbox로 판정 대상을 정정했다. 제품 코드를 수정해 검사를 통과시키지 않았으며 이 실패를 제품 회귀로 집계하지 않았다.

## 한계와 후속 작업

합성 API와 로컬 gzip·네트워크 조건의 표본이다. 실제 백엔드 지연·CDN 압축·실기기·실제 Safari 앱·운영 LCP/INP는 미검증이다. 3회 표본의 작은 차이를 운영 개선·악화량으로 일반화하지 않는다. 데이터 요청을 route loader로 옮기거나 서버에서 경로별 modulepreload를 제공하는 대안은 이번에 구현하지 않았다.

장차 화면·차트 의존성이 커지면 전체 초기 JS·압축 전송량·요청 waterfall을 다시 측정한다. 다음 기존 후보는 Feed의 취소 신호 전달이며, 자체 timeout과 호출자 취소·캐시 의미를 구분해 검토한다. 제품 적용을 보류했으므로 공개 계약·라우팅·공용 책임의 새로운 결정을 만들지 않았고 ADR을 추가하지 않았다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-22-vuln-radar-route-splitting.md)
- [기존 현대화 후보](../accessibility/2026-11-21-frontend-modernization-audit.md#우선-적용-후보와-완료-기준)
- [TanStack 코드 분리](https://tanstack.com/router/latest/docs/framework/react/guide/code-splitting)
- [TanStack lazyRouteComponent](https://tanstack.com/router/latest/docs/framework/react/api/router/lazyRouteComponentFunction)
