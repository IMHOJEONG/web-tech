# 코드용 폰트의 전역 preload 해제

## Summary

본문/브랜드 폰트의 디자인과 선다운로드는 유지하고 JetBrains Mono의 전역 preload만 해제했다.

## Changed

- `apps/docs/shared/config/fonts.ts`: mono에 `preload: false` 지정.
- 16개 weight/style 파일 및 CSS variable, `display: swap`은 유지.
- `apps/docs/scripts/font-preload.test.mjs`: 설치된 Next local font loader로 출력 정책 검증.

## Notes

폰트 파일을 삭제하거나 시스템 폰트로 디자인을 바꾸는 작업이 아니다.
mono는 브라우저가 CSS와 실제 텍스트에 맞는 font-face를 필요로 할 때 요청한다.
코드가 페이지에 있으면 초기 로드 중에도 요청할 수 있으며 viewport 진입 시에만 받는
이미지 lazy loading 같은 정책은 아니다.

예상 font preload는 기존 18개에서 Pretendard/Space Grotesk 2개로 줄어든다.
모든 폰트 CSS 선언은 여전히 18개다. Pretendard 분할과 굵기 삭제는 이번 범위 밖이다.
mono가 늦게 도착하면 fallback에서 전환될 수 있어 코드 줄바꿈/가로폭은 배포 후 확인한다.

## Validation

```sh
mise exec -- node --test apps/docs/scripts/font-preload.test.mjs
```

실제 파일을 Next font loader에 넣어 세 family의 선언 개수, preload flag,
swap 및 CSS variable 보존을 확인한다. 이 검증은 전체 next build나 브라우저 측정을
대체하지 않는다. Next 내부 loader 경로가 바뀌면 테스트도 갱신해야 한다.

## Open Questions

아래 배포 검증은 소수 실험실 표본이며 실제 사용자 p75 개선 폭을 보장하지 않는다.

## Next

배포 후 Network에서 16종의 무조건적인 preload가 사라지는지 확인하고,
기존 trace 스크립트로 두 상세 페이지의 LCP 및 코드 글꼴 전환을 재검증한다.
헤더/본문 loading shell 안정화는 별도 작업으로 남아 있다.

## Deployment Verification

`7f8252b`를 feature/docs에 푸시했고 GitHub의 `Vercel – web-tech` 배포 상태가 success임을 확인했다.
2026-09-18 07:29:49 UTC(16:29:49 KST)에 성능 측정을 완료했다.

- 로컬 Next font loader 테스트: 3/3 통과.
- 두 public 상세 페이지의 HTTP Link 헤더: font preload 2개, JetBrains Mono 없음.
  HTML link 태그만 검사하면 0으로 보일 수 있으므로 응답 Link 헤더도 확인해야 한다.
- 이벤트 루프 글의 실제 폰트 요청: Pretendard/Space Grotesk만 2개.
- browser 글의 실제 폰트 요청: 위 2개 + mono Regular 1개.
- FontFaceSet에는 mono 16종이 모두 남아 있고 browser 글의 400 normal만 loaded.
  이는 파일 삭제 없이 필요에 따른 로드로 바뀌었음을 확인한다.

| 조건 / 문서              | 이전 LCP 중앙값 | 배포 후 LCP 중앙값 | 배포 후 TTFB 중앙값 |
| ------------------------ | --------------- | ------------------ | ------------------- |
| desktop / 이벤트 루프    | 1.908s          | 1.424s             | 0.759s              |
| desktop / browser        | 1.232s          | 1.268s             | 0.678s              |
| mobile-lab / 이벤트 루프 | 4.076s          | 2.372s             | 0.675s              |
| mobile-lab / browser     | 3.340s          | 2.396s             | 0.686s              |

각 조건 3회, 총 12회. 모두 HTTP 200, pageerror/HTTP 오류/완료된 깨진 이미지 없음.
desktop 이벤트 루프 1회에서 CLS 1.00018이 재현됐으며 다른 11회는 0이었다.
폰트 변경으로 헤더/본문의 스트리밍 교체 문제까지 해결된 것은 아니다.
배포 전후는 동일 실험 조건이지만 측정 시각·TTFB·서버 캐시 등은 통제되지 않았다.

원본:

- `docs/worklog/artifacts/2026-09-18-after-font-preload.json`
- `docs/worklog/artifacts/2026-09-18-font-browser-smoke.json`

재현:

```sh
mise exec -- node --test apps/docs/scripts/font-preload.test.mjs
mise exec -- node apps/docs/scripts/verify-deployed-fonts.cjs
PERF_OUTPUT=/tmp/heap-forge-after-font-preload.json mise exec -- node apps/docs/scripts/measure-deployed-performance.mjs
```

폰트 smoke 테스트는 실제 public 페이지 2개를 로드한다. 코드 블록 전반의 시각적 회귀나
모든 굵기의 수동 렌더링을 검증한 것은 아니다. 전체 로컬 빌드는 별도로 실행하지 않았고
이 커밋의 Vercel 배포 성공과 실제 배포 응답으로 확인했다.
