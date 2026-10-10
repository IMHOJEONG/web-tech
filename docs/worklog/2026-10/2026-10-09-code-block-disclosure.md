# 긴 코드 블록 접기

## Summary

블로그 본문에서 긴 코드가 화면을 과도하게 차지하지 않도록, 20줄을 넘는 코드만
처음 10줄을 보여주고 나머지는 펼쳐 볼 수 있게 했다. 짧은 코드는 그대로 표시하며
접힌 상태에서도 전체 코드를 복사한다. 로컬 MDX와 원격 HTML에 함께 적용했다.

## Changed

- `feature/code-block/lib/code-disclosure.ts`: 공통 줄 수·미리보기·펼치기 문구 규칙.
- `CodeBlockFrame`: 로컬 일반 코드와 Shiki 출력의 프레임·복사·접기 구조 재사용.
- 원격 코드 정규화: 같은 native `details / summary` 구조와 하이라이팅 미리보기 생성.
- 원격 복사 enhancer: 닫힌 영역의 전체 코드를 읽도록 `innerText` 대신 `textContent` 사용.
- `mdx.css`: 접기 하단 조작 영역, 키보드 포커스, 한국어/영어 표시, Shiki 여백 우선순위.
- 캡처 점검에서 발견한 일반 `details / figcaption` 스타일 침범을 코드 프레임 안에서만 차단했다.
- 사용자 화면 확인 후 UI를 보완했다. 코드 글자 14px, 여백·그림자 축소,
  중립적인 복사 버튼, 44px 접기 바, `10 / 전체 줄 수` 안내, 미리보기 끝 페이드,
  주석·언어 라벨 대비를 적용했다. Shiki 전체 코드 글자도 같은 크기로 맞췄다.
- 로컬 복사 실패를 catch하고 로컬·원격 모두 상태와 접근성 안내를 제공한다.
- 공통 규칙은 [본문 출력 계약](../../architecture/docs-article-rendering-convergence.md#code-block)에 반영했다.

## Notes

저장소 루트 실행 명령:

```sh
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs test:code-block
mise exec -- pnpm --filter docs typecheck
```

- 단위 검사 223개 통과. 접기 임계값, 미리보기 줄 수, CRLF·끝 개행, 원격 코드 escaping을 포함한다.
- Chromium 브라우저 검사 10개 통과. 데스크톱·모바일, 한국어/영어, 라이트/다크,
  Enter·Space·포인터 조작, 접힌 전체 코드 복사, 페이지 가로 넘침, JavaScript 비활성을 확인했다.
- UI 보완 후 같은 브라우저 검사에 복사 실패 안내, 44px 조작 영역,
  reduced-motion 전환 비활성, 전체 코드 14px 조건을 추가했으며 10개 모두 통과했다.
- UI 보완 후 단위 검사 223개, 타입 검사, 수정 파일 ESLint와 diff 공백 검사도 통과했다.
- 실제 개발 서버의 공개된 backpressure 글에서 데스크톱 1280px·모바일 390px
  접힘·펼침을 캡처 점검했다. HTTP 초안은 게시 필터로 숨겨져 있으므로 상태를 바꾸지 않았다.
  Chrome 직접 조작 도구는 환경 오류로 사용할 수 없어 Playwright의 별도 브라우저로 확인했다.
- 타입 검사 통과. 브라우저 fixture는 실제 프레임·정규화·enhancer·CSS를 사용하고,
  clipboard를 mock하여 전체 복사 문자열을 검사한다. Shiki는 기존 출력 모양을 사용하며
  Shiki 엔진을 이 테스트에서 실행하지 않는다.
- 첫 브라우저 검사에서는 원격 코드의 끝 개행 차이로 8개가 실패했다. 기존 sanitizer가
  외부 공백을 제거한다는 점을 확인하고 원격 기대값을 정규화된 전체 코드로 구분했다.
  마지막 줄과 전체 문자열 일치를 유지하여 미리보기만 복사되는 회귀를 막는다.
- 접기는 화면 밀도 개선이다. 전체 코드 DOM과 렌더링 비용은 남으며, 추가 fetch·Shiki 초기화를 만들지 않는다.
- 모바일 fixture에 viewport meta를 넣고 실제 `innerWidth`가 390px인지 검사한다.
  모바일 에뮬레이션의 기본 980px 레이아웃을 작은 화면 검사로 오인하지 않도록 했다.
- 전체 Next.js 빌드, 실제 NAS 콘텐츠, 배포 환경, Safari·Firefox·실제 스크린리더는 미검증이다.
- 2026-10-10 사용자 승인에 따라 코드 접기·UI 보완 범위만 커밋한다.
  HTTP 초안·도식·미리보기와 다른 미커밋 작업은 포함하지 않으며, 푸시는 요청받지 않았다.

## Open Questions

실제 글을 읽어 본 뒤 20줄 임계값과 10줄 미리보기가 적절한지 확인한다.

## Next

커밋 후 작은 화면·다크모드·키보드·복사 UX를 항목별로 다시 점검한다.
기존 렌더러 분리·출력 계약을 유지하므로 별도 ADR은 만들지 않았다.
