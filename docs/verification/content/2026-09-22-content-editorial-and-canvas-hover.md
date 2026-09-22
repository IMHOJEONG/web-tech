# 콘텐츠 편집과 Canvas hover 대조 검증

## 대상과 조건

2026-09-22 KST, feature/docs `6ce44c9` 기반 작업 트리. 요청 순서대로 운영체제 글 → ARIA·V8·Next.js 글 → Canvas 진단을 수행했다. 공개 URL과 slug는 변경하지 않았다.

Canvas는 macOS Chrome 153.0.8010.53, viewport 1000×700, DPR 1, `--enable-blink-features=CanvasDrawElement` 조건이다. 본문에서 추출한 예제·기존 public 데모·일반 HTML 버튼 대조군을 사용했다. 브라우저는 기존 사용자 프로필과 분리했고 종료 후 로컬 서버도 닫았다.

## 재현 방법

저장소 의존성, mise와 로컬 Chrome이 필요하다. 저장소 루트에서 실행한다.

```sh
mise exec -- pnpm --filter docs test:content
mise exec -- node docs/verification/artifacts/2026-09-22-canvas-hover-diagnostic.mjs
mise exec -- node docs/verification/artifacts/2026-09-22-canvas-hover-diagnostic.mjs --headless-only
```

두 브라우저 명령 모두 `/tmp/canvas-hover-diagnostic.json`에 결과를 쓰므로 이전 결과를 보관한 뒤 다음 명령을 실행한다. 기본 명령은 headless/headed 각각 페이지별 3회, 전용 명령은 headless만 페이지별 3회다. 각 실행에서 중심으로 포인터를 옮긴 뒤 20프레임의 hover·문서 포커스·hit target을 기록하고 중심/외부 클릭을 비교한다. 포인터 이벤트 좌표도 함께 기록한다. 조건 실패가 있으면 종료 코드 1을 반환하며 재시도로 결과를 숨기지 않는다.

## 결과와 증거

### 1·3번: 글의 범위와 정확성

- 운영체제: 독립된 주소 공간과 명시적 공유 메모리를 구분하고 용어·카운터 사례를 보완했다. 사례는 설명용이며 실제 OS 측정 결과가 아니다. [Microsoft 공유 메모리](https://learn.microsoft.com/en-us/windows/win32/memory/creating-named-shared-memory), [프로세스·스레드](https://learn.microsoft.com/en-us/windows/win32/procthread/about-processes-and-threads)와 대조했다.
- ARIA: Drawer 종료 경고 조사로 제목을 좁히고 역사적 관찰·가설·미확인 결과를 분리했다. 애니메이션 완료 처리만으로 해결된다는 단정을 제거했다. [aria-hidden](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden), [모달 포커스 복귀](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)를 근거로 확인 절차를 추가했다.
- V8: Ignition 입문 노트로 바꾸고 가상 레지스터·누산기를 설명했다. 실제 바이트코드 출력과 성능 결과는 아직 없다고 명시했다. [Ignition](https://v8.dev/docs/ignition), [초기 설계 소개](https://v8.dev/blog/ignition-interpreter)를 참고했다.
- Next.js: 패키지 탐색 체크리스트로 제목·요약을 맞추고 버전 및 실행 명령 확인 절차를 추가했다. 앱 디렉터리에서 `mise exec -- node -p "require('next/package.json').version"` 실행 결과는 16.3.4였다. 설치 패키지의 `dist/docs/01-app/01-getting-started/02-project-structure.md`를 대조했다. 내부 구조 분석을 완료했다는 의미는 아니다.
- 콘텐츠 단위 테스트 19개와 frontmatter·style 검사 16개 파일이 통과했다.

### 2번: Canvas와 일반 버튼 비교

| 모드                 | 본문     | 데모     | 일반 버튼 |
| -------------------- | -------- | -------- | --------- |
| headless, 첫 비교    | 3/3 통과 | 3/3 통과 | 3/3 통과  |
| headed               | 3/3 통과 | 2/3 통과 | 2/3 통과  |
| headless-only 재실행 | 3/3 통과 | 3/3 통과 | 3/3 통과  |

통과 조건은 hover 20/20프레임, 중심 클릭 1회, 외부 클릭 후 추가 증가 없음, pageerror 없음이다. 혼합 실행은 종료 코드 1, headless-only 재실행은 0이었다. 모든 27개 실행에서 클릭 결과는 정상이었고 pageerror가 없었다.

headed 실패에서 문서 포커스는 20프레임 내내 true였고 지정한 중심의 `elementFromPoint`도 BUTTON이었다. 하지만 포인터는 그 중심에 머물지 않았다.

- 데모 3회차: 지정 좌표 (541, 336.5) 이후 (416.21875, 81.734375) 등으로 pointerout/move가 발생했고 hover 0/20이었다.
- 일반 버튼 1회차: 지정 좌표 (320.0703125, 158.75) 이후 (217.48046875, 319.421875) 등으로 이동했고 hover 3/20이었다.

테스트 코드가 요청하지 않은 좌표 이동이 일반 버튼에서도 관측돼, **이번 headed 실패에는 외부 포인터 입력이 개입했다는 근거**가 있다. 특정 사용자나 프로그램이 입력했다고 식별하지는 않았다. Canvas 자체를 수정하거나 09-20 실패도 같은 원인이었다고 소급 확정하지 않는다. 독립 headless 환경에서는 해당 hover 불안정을 재현하지 못했다.

증거:

- [진단 스크립트](../artifacts/2026-09-22-canvas-hover-diagnostic.mjs)
- [혼합 실행 원본](../artifacts/2026-09-22-canvas-hover-mixed-result.json)
- [headless 재실행 원본](../artifacts/2026-09-22-canvas-hover-headless-result.json)

## 한계와 후속 작업

글의 기술 주장 전체를 실행 검증한 것은 아니다. ARIA 당시 환경·스크린리더, OS 공유 메모리 구현, V8 바이트코드 생성, Next.js 배포 화면은 미검증이다. 제목·설명의 범위와 공식 근거를 정리한 편집 작업이다.

Canvas는 단일 Chrome 버전·DPR 1 조건이다. 다른 기기나 키보드·스크린리더 접근성을 보장하지 않는다. headed 반복 안정성은 외부 입력을 통제한 전용 환경에서 추가 확인해야 한다. 기존 데모의 중복 paint 등록과 재시도 로직은 변경하지 않았다.

## 관련 문서

- [최초 독해 검토](2026-09-20-content-readability-review.md)
- [작업 기록](../../worklog/2026-09/2026-09-22-content-editorial-and-canvas-hover.md)
- [후속 목록](../../todo/todo.md)
