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

수정 후 프로덕션 LCP 개선 폭은 아직 측정하지 않았다. 운영 서버는 아직 이전 코드다.

## Next

배포 후 Network에서 16종의 무조건적인 preload가 사라지는지 확인하고,
기존 trace 스크립트로 두 상세 페이지의 LCP 및 코드 글꼴 전환을 재검증한다.
헤더/본문 loading shell 안정화는 별도 작업으로 남아 있다.
