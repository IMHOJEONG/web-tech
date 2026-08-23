---
title: 'HTML-in-Canvas에 대해 알아봅시다'
slug: html-in-canvas-paint-record
date: 2026-08-21
updatedAt: 2026-08-22
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

### 왜 작성하였는가?

- Canvas 위에 HTML 버튼을 그리는 실험을 진행하던 중 오류가 발생

- 일반적인 Canvas API와 달리 DOM의 layout / paint 타이밍을 함께 고려해야 했음

- 단순히 “버튼을 그린다”가 아니라, 브라우저가 만든 paint record를 언제 사용할 수 있는지가 핵심 문제였음

### 실험 코드

```html
<canvas layoutsubtree>
    <button>click me</button>
</canvas>
```

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

- Canvas의 paint 이벤트 이후에 `drawElementImage()`를 호출하도록 변경

- paint record가 아직 없으면 `requestPaint()`로 다시 paint를 요청

```js
let hasPaintRecord = false

const render = () => {
    if (!hasPaintRecord) {
        canvas.requestPaint?.()
        return
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawElementImage(button, 280, 140)
}

const handleCanvasPaint = () => {
    hasPaintRecord = true
    render()
}

canvas.addEventListener('paint', handleCanvasPaint)
canvas.onpaint = handleCanvasPaint
canvas.requestPaint?.()
```

- 핵심은 `render()`를 페이지 로드 직후 바로 실행하지 않는 것

- DOM 요소가 먼저 paint record를 만든 뒤, 그 결과를 Canvas에서 사용해야 함

### 실험 페이지

- 로컬 개발 서버에서 아래 경로로 실험 페이지를 확인할 수 있음

[HTML-in-Canvas 실험 페이지](/experiments/html-in-canvas/index.html)

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

- https://developer.chrome.com/blog/html-in-canvas-origin-trial?hl=ko

