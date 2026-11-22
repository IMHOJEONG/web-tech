# MDX 본문 이미지의 요청과 공간 예약 검증

## 대상과 조건

2026-11-22 KST, `feature/modern-web-guidance`의 `872d65f8`와 기존 작업 트리에서 이미지 항목을 적용했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

일반 본문 이미지의 기본 priority·0×0과 공통 blur 이미지를 제거했다. 기존 public 경로 정규화 뒤 실제 파일의 메타데이터를 읽어 크기를 보완하고 EXIF 회전·한쪽 크기만 지정한 경우를 처리한다. 양쪽 크기를 지정한 값과 static import는 유지한다. public 밖·심볼릭 링크 밖·원격 URL은 읽지 않는다.

크기가 있는 이미지는 Next Image로 최적화하며 기본 lazy와 sizes=auto를 사용한다. auto 미지원·eager 환경에는 본문 최대 폭 1024px과 화면별 여백을 반영한 sizes fallback이 있다. fetchPriority=high는 loading 미지정 시 eager로 처리하고 명시적 loading은 우선한다. 기존 원격 MDX 중 크기를 모르는 이미지는 native img로 표시한다. 알려진 도식의 picture 분기는 유지하면서 기본 eager를 정리했다. 서버 메타데이터 읽기에 필요한 public 이미지 파일은 Next 출력 추적에 포함했다.

Next가 사용하던 sharp 0.35.5를 docs 직접 의존성과 루트 catalog에 선언했다. 기존 라이브러리 버전을 재사용했다.

## 재현 방법

```sh
pnpm --filter docs typecheck
pnpm --filter docs typecheck:node-test
pnpm --filter docs lint
pnpm --filter docs exec node --experimental-strip-types --test lib/rehype-image-dimensions.test.ts lib/rehype-public-images.test.ts lib/render-article-content.test.ts lib/article-diagram-sources.test.ts
pnpm validate:catalog
```

브라우저 비교는 저장소 밖 임시 harness에서 HEAD와 수정본의 실제 MDX img 렌더러를 esbuild로 번들했다. 공식 Next Image의 SSR 결과와 합성 1200×800 PNG를 사용했다. 390·1280px, DPR 1, Chromium·Firefox·WebKit의 6조건에서 변경 전후 12실행을 비교했다. 본문 폭은 실제 ArticleContentGrid의 최대 폭과 여백에 맞췄으며 목차가 없는 조건이다. 6000px 아래 이미지의 응답을 900ms 지연시켰다. Next 이미지 최적화 HTTP 서버는 합성 응답으로 대체했으므로 실제 변환 byte나 운영 네트워크 측정은 아니다.

## 결과와 증거

| 항목                          | 결과                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------- |
| MDX·도식·메타데이터 검사      | 34개 통과. 실제 renderArticleContent에서 경로 정규화 후 폭·높이 주입 확인    |
| 앱 타입·테스트 타입·린트      | 통과                                                                         |
| 화면 밖 일반 이미지 초기 요청 | 여섯 조건 모두 1건 → 0건                                                     |
| 합성 글의 image preload       | 3개 → 1개. 명시적 hero용 preload는 유지                                      |
| 로딩 전후 일반 이미지 높이    | 수정 후 여섯 조건 모두 차이 0px                                              |
| 선택한 srcset 폭              | 모바일 640 → 384px, 데스크톱 1920 → 1080px                                   |
| 기존 크기 없는 이미지         | 스크롤 후 정상 디코딩                                                        |
| 누락 이미지                   | 404에도 대체 텍스트 유지                                                     |
| 경로와 크기 계약              | EXIF·한쪽/양쪽 명시 크기, 누락 파일·외부 URL·탈출 경로·심볼릭 링크 검사 통과 |

[정제 관측값과 소스 해시](../artifacts/2026-11-22-docs-article-images.json)

초기 harness는 hero에 React가 자동 생성하는 preload까지 0개로 기대했고 Firefox의 기존 placeholder를 0px로 가정해 실패했다. hero 1개와 브라우저별 기존 높이를 구분한 뒤 동일한 비교를 완료했다. 의존성 도구는 제한 환경에서 저장소·DNS 접근에 실패해 승인된 환경에서 복구했다.

## 한계와 후속 작업

실제 Next 전체 페이지·배포 산출물의 파일 추적·이미지 최적화 HTTP 변환과 운영 LCP·INP·CLS는 미검증이다. 위 높이 비교를 전체 페이지 CLS 개선량으로 해석하지 않는다. WebKit은 실제 Safari 앱 검증과 구분한다. 원격 HTML 본문은 별도 렌더 경로이므로 이번 MDX 변경의 대상 밖이다.

크기를 모르는 원격 이미지에는 공간 예약 한계와 native img 전송량이 남는다. 작성·수집 단계에서 실제 폭·높이를 제공하면 최적화 경로를 사용한다. 전역 임의 종횡비는 넣지 않았다. 현재 글의 실제 LCP 후보를 확인한 뒤 해당 이미지에 eager·high를 지정할 수 있다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-22-docs-article-images.md)
- [현대화 후보 조사](../accessibility/2026-11-21-frontend-modernization-audit.md#접근성-외-항목-재조사)
- [Next Image](https://nextjs.org/docs/app/api-reference/components/image)
- [HTML 이미지의 auto sizes](https://html.spec.whatwg.org/multipage/images.html)
- [sharp 메타데이터](https://sharp.pixelplumbing.com/api-input/)
