# 이벤트 루프 글 예제 검증

## 대상과 조건

2026-09-22 14:32 KST, feature/docs 작업 트리의 이벤트 루프 글을 검증했다. macOS, Chrome 153.0.8010.53, headless 환경에서 새 페이지 10개를 사용했다. 브라우저 실험 플래그와 원격 API는 사용하지 않았다.

## 재현 방법

저장소 의존성과 로컬 Google Chrome이 필요하다. 저장소 루트에서 실행한다.

```sh
mise exec -- node --test docs/verification/artifacts/2026-09-22-event-loop-browser.test.mjs
mise exec -- pnpm --filter docs test:content
```

[검증 코드](../artifacts/2026-09-22-event-loop-browser.test.mjs)는 본문의 JavaScript와 예상 출력 블록을 직접 추출한다. 독립적인 기대 순서와 문서 출력을 비교하고, 실제 브라우저의 classic script로 실행해 console 로그와 pageerror를 수집한다. 결과는 `/tmp/event-loop-browser-result.json`에 생성된다. 실패하면 테스트가 비정상 종료된다.

## 결과와 증거

- 브라우저 반복 검사: 10/10 통과, pageerror 0건.
- 순서: sync:start → sync:end → microtask:promise → microtask:queued → microtask:nested → task:timer.
- 콘텐츠 단위 테스트: 19/19 통과.
- 콘텐츠 frontmatter·style 검사: 16개 파일 통과, 경고 없음.
- [원본 브라우저 결과](../artifacts/2026-09-22-event-loop-browser-result.json).

처리 중 추가한 microtask도 타이머보다 먼저 실행되는 결과를 확인했다. 설명은 [WHATWG 처리 모델](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)과 [MDN microtask 안내](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)에 대조했다.

## 한계와 후속 작업

Chrome classic script의 콜백 순서 검사다. DevTools Snippets UI 자체, 다른 브라우저, Node.js CommonJS/ES module의 순서는 테스트하지 않았다. 실제 paint 시점·렌더링 지연·성능을 측정하지 않았으며 이번 결과로 렌더링 순서를 보장하지 않는다. 배포된 상세 페이지 통합 검증도 별도다.

## 관련 문서

- [검증 대상 글](../../../apps/docs/data/v8/javascript-event-loop-runtime.mdx)
- [최초 독해 검토](2026-09-20-content-readability-review.md)
- [작업 기록](../../worklog/2026-09/2026-09-22-event-loop-content-clarification.md)
