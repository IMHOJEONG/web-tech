# Docs 프로덕션 페이지 이미지·한글 폰트 성능 검증

## 대상과 조건

2026-11-25 KST. PR #112의 `212369f8`과 병합 커밋 `5dc0e252`는 같은 파일 트리다. 이 트리에서 합성 문서 네 개로 기준선을 만들고, 기존에 공개된 문서 두 개를 별도로 관측했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)과 [현대화 계획](../../todo/modern-web-guidance.md#3-p2--실제-next-페이지의-이미지폰트-cwv-마감)을 연결한다.

로컬 기준선은 Node 24.22.1, pnpm 12.14.0, Next.js 16.4.6 Webpack 프로덕션 빌드다. 한글·영문 문단과 1440×810 JPEG 유무를 조합한 문서 네 개를 실제 `/[locale]/docs/[...slugParts]`에서 렌더했다. Chromium의 390×844px(DPR 2)과 1280×850px(DPR 1)에서 새 브라우저 컨텍스트로 각 세 번 측정했다. CDP 다운로드 200,000B/s·지연 80ms·CPU 2배, 브라우저 캐시와 서비스 워커 비활성화, 같은 출처만 허용했다. 반복 중 Next 이미지 캐시는 사용했다.

## 재현 방법

격리된 소스 사본에 합성 MDX와 JPEG를 두고 저장소의 패키지 관리자와 잠금 파일을 사용한다. 합성 문서는 동일 제목·첫 문단·후속 문단을 사용하고, 이미지 조건에만 첫 문단 뒤 이미지 한 장과 본문 아래 이미지 한 장을 넣는다. 실제 발행 원문은 빌드 입력으로 가져오지 않는다.

```sh
DOCS_CI_SYNTHETIC=1 DOCS_CONTENT_SOURCE=legacy \
  BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false pnpm --filter docs build --webpack
DOCS_CI_SYNTHETIC=1 DOCS_CONTENT_SOURCE=legacy \
  BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false pnpm --filter docs start --hostname 127.0.0.1 --port 3197
```

실행 호스트의 내부 포트 권한 때문에 Turbopack이 실패했다. Webpack은 CSP 모듈의 `.mts`를 변환하지 못해, 격리 사본에서 동일 구현의 `.ts` 복제본을 라우트가 직접 참조하게 했다. 이 우회는 측정 사본에만 적용했다.

```sh
# 격리 사본에서 Webpack 빌드 전에 실행한다.
cp packages/api/csp-reporting.mts packages/api/csp-reporting.ts
node --input-type=module -e '
  import { readFileSync, writeFileSync } from "node:fs";
  const route = "apps/docs/app/api/csp-report/route.ts";
  const source = readFileSync(route, "utf8");
  writeFileSync(route, source.replace("@web-tech/api/csp-reporting", "../../../../../packages/api/csp-reporting.ts"));
'
```

- `PerformanceObserver`에서 첫 본문 문단의 `Element Timing`, 마지막 `largest-contentful-paint`, 최근 입력을 제외한 `layout-shift`를 읽는다. CLS는 인접 이동 간격 1초 미만·전체 길이 5초 미만인 세션의 최대 합이다. Noto의 빌드 자원은 파일 해시로 식별한다.
- 본문 이미지의 선택 URL과 응답, HTML의 치수·`sizes`·`loading`, 문서 라우트 `.nft.json`의 자산 경로를 확인한다. 공개 표본은 같은 브라우저 조건에서 [HTTP 응답 스트리밍 글](https://heap-forge.app/ko/docs/category/be/node-js/http-response-streaming-lab)과 [폼 오류 복구 글](https://heap-forge.app/ko/docs/ui-ux/form-error-recovery)을 언어 경로별·폭별 한 번 읽었다. 영문 경로는 UI locale을 가리킨다.
- 도식 비교는 이미지 요청을 보류하고 요청 전후 높이를 잰다. 공개 문서는 가로 `<source>`에 1600×540을 넣은 브라우저 대조군을 사용한다. 수정본의 합성 문서에서는 서버가 생성한 `<source>` 치수와 응답 전후의 높이를 직접 확인한다.

## 결과와 증거

로컬 표의 시간은 세 번의 중앙값, CLS는 최댓값이다. 이미지 열의 픽셀 값은 Next 최적화 URL이 선택한 `w`다.

| 폭   | 본문        | 첫 문단 ms | LCP ms / 요소  |    CLS | 이미지 요청 |
| ---- | ----------- | ---------: | -------------- | -----: | ----------- |
| 390  | 한글·이미지 |        896 | 3,524 / 이미지 | 0.0186 | 750w        |
| 390  | 한글·텍스트 |        872 | 872 / 문단     | 0.0144 | 해당 없음   |
| 390  | 영문·이미지 |        964 | 2,964 / 이미지 | 0.0140 | 750w        |
| 390  | 영문·텍스트 |        940 | 940 / 문단     | 0.0120 | 해당 없음   |
| 1280 | 한글·이미지 |        892 | 3,720 / 이미지 | 0.0000 | 828w        |
| 1280 | 한글·텍스트 |        884 | 884 / 문단     | 0.0000 | 해당 없음   |
| 1280 | 영문·이미지 |        964 | 3,172 / 이미지 | 0.0000 | 828w        |
| 1280 | 영문·텍스트 |        948 | 948 / 문단     | 0.0000 | 해당 없음   |

저속 조건의 한글 첫 문단은 872~896ms에 표시됐고 Noto 응답 완료는 9.06~9.59초였다. 같은 영문 표본에서 Noto 요청은 0회였다. 이미지 조건에서 750w·828w 응답은 모두 HTTP 200 WebP였고 첫 이미지 응답은 각각 35,052B와 45,432B였다. 두 JPEG가 문서 라우트의 빌드 추적에 포함됐다.

공개 표본에서도 도식 글의 마지막 LCP는 네 조건 모두 이미지였으며 5.29~8.41초였다. 이미지 없는 글의 LCP는 문단이며 1.88~3.50초였다. 도식 글의 CLS는 0.0103~0.0855였다. 한국어 도식 글의 데스크톱에서 도식 주변 이동이 관측됐고, 한국어 모바일에서는 Noto 응답 완료 무렵 별도 이동도 관측됐다.

공개 데스크톱 도식은 이미지 응답을 막았을 때 1,193.42px을 예약했다가 가로 파일이 표시되자 264.59px로 바뀌었다. 가로 `<source>`에 실제 치수를 지정한 대조군은 응답 전후 모두 264.59px였다. 모바일은 세로 원본의 508.42px을 유지했다. 네 가로 PNG의 크기를 코드의 높이 표에 반영하고 각 `<source>`에 `width`와 `height`를 지정했다. 합성 CI 이미지도 실제 비율을 사용한다.

수정본의 새 프로덕션 빌드는 이미지 응답 보류 상태에서 Chromium·Firefox·WebKit 각각 두 폭의 예약 높이를 확인했다. 응답이 끝난 뒤 여섯 조건의 이미지 높이 변화가 모두 0px이었다. WebKit은 글꼴 응답을 차단해 이미지 기하만 확인했다. WebKit 모바일에서 도식의 화면 내 위치는 14px 이동했으므로 전체 레이아웃 이동은 따로 본다. 변경 경로 린트·Docs 타입·MDX/이미지 테스트 34개·CI 합성 콘텐츠 테스트 27개가 통과했다.

`font-size-adjust: from-font`을 주입한 한글 대조군 12회에서 모바일 첫 문단은 기존과 동일하게 4줄에서 5줄로 바뀌고 CLS도 같은 0.0186(이미지)·0.0144(텍스트)였다. 데스크톱은 두 안 모두 첫 문단 2줄과 CLS 0이었다. Noto Sans KR과 현재 폰트 전략을 유지한다. Chromium 버전과 각 표본, 도식 높이는 [정제 증거](../artifacts/2026-11-25-docs-production-cwv.json)에 있다.

## 한계와 후속 작업

브라우저에서 제한한 단일 호스트 표본이다. 공개 URL은 조건별 한 번씩 관측했으며 운영 사용자 CWV 분포와 CDN의 다른 리전을 포함하지 않는다. 이미지 예약 높이는 독립 대조군에서 확인한 변화량이다. 공개 페이지의 배포 후 CLS 개선량은 미측정이다.

이미지 글의 LCP 후보는 확인했으며, 우선순위 설정의 효과는 별도의 전후 비교 대상이다. 초기 JavaScript와 외부 스크립트 비용은 P2의 다음 항목에서 확인한다.

## 관련 문서

- [본문 이미지 이전 검증](2026-11-22-docs-article-images.md)
- [Noto Sans KR 이전 검증](2026-11-22-docs-noto-sans-kr.md)
- [HTML Standard `source` 치수](https://html.spec.whatwg.org/multipage/embedded-content.html#the-source-element)
- [LCP 측정 기준](https://web.dev/articles/lcp) · [CLS 측정 기준](https://web.dev/articles/cls)
- [작업 기록](../../worklog/2026-11/2026-11-25-docs-production-cwv.md)
