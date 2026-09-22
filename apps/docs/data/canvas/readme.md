---
title: 'HTML-in-Canvas에 대해 알아봅시다'
slug: html-in-canvas-paint-record
date: 2026-08-21
updatedAt: 2026-09-20
summary: Chromium 실험 API인 drawElementImage 사용 중 발생한 paint record 오류를 정리합니다.
authorName: 'HoJeong Im'
authorRole: 'Web Engineer'
readMinutes: 6
topicLabel: 'BROWSER'
tags:
    - browser
    - canvas
    - rendering
    - chromium
status: published
---

## HTML-in-Canvas란?

- Canvas 내부에서 HTML 요소를 함께 다루기 위한 Chromium 실험 기능

- `<canvas layoutsubtree>` 안에 있는 DOM 요소를 Canvas 2D context에서 그릴 수 있음

- 핵심 API는 `drawElementImage()`이며, DOM 요소의 paint 결과를 Canvas에 그리는 방식으로 이해할 수 있음

- 현재는 실험 기능이므로 실제 서비스 코드에 바로 적용하기보다는 브라우저 렌더링 동작을 이해하기 위한 실험에 가까움

> [!NOTE]
> 이 글은 production 적용 가이드가 아니라 Chromium 실험 API를 통해 브라우저의 layout / paint 타이밍을 이해하기 위한 기록입니다.

### 왜 작성하였는가?

- Canvas 위에 HTML 버튼을 그리는 실험을 진행하던 중 오류가 발생

- 일반적인 Canvas API와 달리 DOM의 layout / paint 타이밍을 함께 고려해야 했음

- 단순히 “버튼을 그린다”가 아니라, 브라우저가 만든 paint record를 언제 사용할 수 있는지가 핵심 문제였음

### 실험 코드

아래 JavaScript는 오류를 설명하기 위한 예제다. 정상 동작을 확인할 때는 이 코드를 실행하지 말고, 아래의 **해결 방법** 코드로 교체한다. 두 코드를 함께 실행하지 않는다.

```html
<canvas width="640" height="360" layoutsubtree>
    <button type="button" style="transform-origin: left top">click me</button>
</canvas>
```

`width`와 `height`는 내부 그리기 영역의 크기다. 생략하면 기본 300×150 영역의 끝에 가까운 (280, 140)에 그려 버튼이 잘릴 수 있다. 이 예제는 CSS로 캔버스를 확대·축소하지 않는다. 반응형 크기 변경과 고해상도 화면의 픽셀 비율 보정은 별도 과제다.

```js
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const button = canvas.querySelector('button')

ctx.drawElementImage(button, 280, 140)
```

- 위 코드는 DOM 요소를 Canvas에 그리려는 가장 단순한 형태

- 하지만 페이지가 로드되자마자 바로 실행하면 아래 오류가 발생할 수 있음

```text
Uncaught InvalidStateError: Failed to execute 'drawElementImage' on 'CanvasRenderingContext2D':
No cached paint record for element.
```

### 문제

- `drawElementImage()` 호출 시점에 버튼의 paint record가 아직 준비되지 않음

- 즉, 브라우저가 `<button>`을 Canvas에서 사용할 수 있는 snapshot 형태로 캐시하기 전에 그리려고 한 것

- 이 상태에서는 Canvas context가 그릴 대상을 찾지 못해 `InvalidStateError`를 발생시킴

### 원인

- `drawElementImage()`는 DOM 요소를 그 자리에서 즉시 렌더링해 Canvas에 복사하는 함수가 아님

- 브라우저가 이전 렌더링 단계에서 만들어 둔 paint 결과를 Canvas에 그리는 함수에 가까움

- 따라서 아래 순서가 맞아야 함

1. DOM 요소가 layout 됨
2. DOM 요소의 paint record가 생성됨
3. Canvas에서 `drawElementImage()`를 호출함

- 기존 실험 코드는 3번을 너무 빨리 실행하고 있었음

### 해결 방법

위 HTML 아래의 script 또는 DOM이 준비된 시점에 다음 코드를 실행한다. 지원되는 실험 브라우저에서 `paint` 이벤트를 받은 뒤 그리고, 반환된 변환 행렬을 버튼에 적용해 화면과 클릭 위치를 맞춘다.

실험 기능이 없으면 명시적으로 중단한다. `requestPaint()` 호출만으로 paint record가 즉시 준비되는 것은 아니며, 이 예제에서는 이벤트를 기다린다.

```js
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const button = canvas.querySelector('button')

if (
    !ctx ||
    typeof ctx.drawElementImage !== 'function' ||
    typeof canvas.requestPaint !== 'function'
) {
    throw new Error('HTML-in-Canvas 실험 기능과 브라우저 버전을 확인해 주세요.')
}

const handleCanvasPaint = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const transform = ctx.drawElementImage(button, 280, 140)
    button.style.transform = transform.toString()
}

canvas.addEventListener('paint', handleCanvasPaint)
canvas.requestPaint()
```

이벤트 등록은 한 방식만 사용한다. 같은 함수를 `addEventListener`와 `onpaint` 양쪽에 등록하면 같은 이벤트에서 중복 호출될 수 있다.

버튼에 적용하는 `transform`은 단순한 장식이 아니다. Canvas에 그린 위치와 실제 DOM의 클릭·hover 영역을 맞추기 위한 값이다. `transform-origin: left top`도 함께 유지한다.

### 재현 시 확인할 조건

- [Chrome 공식 준비 안내](https://developer.chrome.com/blog/html-in-canvas-origin-trial)의 지원 버전과 `chrome://flags/#canvas-draw-element` 설정을 확인하고 브라우저를 다시 시작한다. 실험 API이므로 플래그만 켜면 모든 버전에서 동작한다고 가정하지 않는다.
- `chrome://version`의 버전, 운영체제, 플래그 상태를 기록한다. 당시 오류를 관찰한 정확한 브라우저 버전은 이 글에 남아 있지 않아 재현 환경을 확정할 수 없다.
- 첫 paint 이후 버튼이 캔버스 안에 나타나는지, 그려진 버튼 위치에서 클릭과 hover가 맞는지 확인한다. 클릭 확인은 DevTools 이벤트 중단점이나 디버깅용 click 리스너를 이용한다.
- 2026-09-20 macOS의 Chrome 153.0.8010.48에서 `--enable-blink-features=CanvasDrawElement`를 켜고 본문 예제와 연결된 데모를 확인했다. 1000×700 viewport, 픽셀 비율 1에서 버튼 표시와 클릭을 확인했으며 pageerror는 없었다. hover는 한 실행에서 정상 유지됐지만 재실행에서 false 또는 대기 시간 초과가 발생해 안정성을 확인하지 못했다. 창 포커스·실험 API 중 어느 쪽의 영향인지 추가 조사가 필요하다. 다른 버전·모바일·고해상도 화면은 미검증이다. paint 이후에도 오류가 나면 무한 재시도하지 말고 버전과 이벤트 발생 여부를 먼저 확인한다.

### 실험 페이지

2026-09-22에는 Chrome 153.0.8010.53에서 본문 예제·데모·일반 버튼을 비교했다. headless에서는 각 3회 모두 hover가 유지됐다. 화면이 있는 브라우저에서는 데모와 일반 버튼에서 각각 1회 hover를 잃었고, 테스트가 지정하지 않은 좌표로 포인터가 이동한 기록을 확인했다. 해당 실행의 실패는 외부 포인터 입력 영향으로 보이지만, 이전 실패까지 같은 원인으로 확정하거나 다른 환경의 안정성을 보장하지는 않는다.

[HTML-in-Canvas 실험 페이지](/experiments/html-in-canvas/index.html)

연결된 데모에는 반사 효과·클릭 파동·재시도 로직도 있다. 본문은 그 효과를 재현하는 전체 코드가 아니라, 크기 설정 → paint 대기 → 그리기 → DOM 위치 보정의 최소 흐름이다.

### 알게 된 점

- Canvas에 DOM을 그린다고 해서 Canvas가 DOM을 직접 소유하는 것은 아님

- DOM은 여전히 브라우저의 layout / paint pipeline 안에서 처리됨

- Canvas는 준비된 paint 결과를 특정 시점에 가져와서 그릴 뿐임

- 따라서 HTML-in-Canvas를 사용할 때는 무엇을 그릴지보다 언제 그릴 수 있는지를 먼저 확인해야 함

### 한계

- 아직 Chromium 실험 기능이므로 브라우저 지원 범위가 제한적임

- API 이름과 동작이 바뀔 수 있음

- 실제 DOM과 Canvas에 그려진 시각 결과를 동기화하는 처리가 필요함

- 접근성 관점에서 사용자가 조작하는 DOM 요소와 Canvas에 표시되는 결과가 어긋나지 않도록 주의해야 함

---

## 참고

- [WICG HTML-in-Canvas proposal](https://github.com/WICG/html-in-canvas)

- [Chrome HTML-in-Canvas 준비와 좌표 동기화](https://developer.chrome.com/blog/html-in-canvas-origin-trial)

- [WHATWG Canvas 크기 규칙](https://html.spec.whatwg.org/multipage/canvas.html#the-canvas-element)
