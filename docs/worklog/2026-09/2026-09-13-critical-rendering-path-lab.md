# Critical Rendering Path Lab

## Goal

브라우저 렌더링 문서를 개념 요약에서 직접 기록하고 해석할 수 있는 실험형 리소스로 확장한다.

## Review Outcome

- 세 개의 1차 리소스를 Browser, Network, Containers 관점에서 독립 검토했다.
- Browser 문서는 핵심 설명과 공식 자료 연결이 가장 안정적이어서 `published`를 유지했다.
- Network와 Containers 문서는 진단 명령과 runtime 동작을 더 검증하기 위해 `draft`로 전환했다.
- Browser 문서에서 이전 CLS 누적 설명을 session window 기준으로 교정했다.
- LCP를 TTFB, resource load delay, resource load duration, element render delay로 분리했다.
- INP를 input delay, processing duration, presentation delay로 구분했다.
- field data에서 문제 조건을 찾고 local lab에서 반복 재현하는 흐름을 추가했다.

## Experiment

`docs/examples/critical-rendering-path-lab`에 Node.js 표준 라이브러리만 사용하는 TypeScript 실험 서버를 추가했다. 브라우저 실행 코드도 TypeScript로 관리하며 서버가 응답 전에 타입을 제거한다.

- `baseline`: 의도적인 지연이 없는 비교 기준
- `slow-css`: render-blocking stylesheet 응답 지연
- `blocking-script`: parser-blocking classic script 응답 지연
- `late-lcp`: JavaScript에 의한 LCP image 발견 지연

실험 서버는 `127.0.0.1`에만 bind하고, route와 asset을 allowlist로 제한하며, 지연 query를 최대 3000ms로 제한한다.

## Validation

```bash
pnpm test:crp-lab
pnpm test:crp-lab:browser
pnpm --filter docs test:content
pnpm exec prettier --check docs/examples/critical-rendering-path-lab
git diff --check
```

- 실험 서버 테스트 6개 통과
- Chromium 관계 기반 테스트 3개 통과
- 콘텐츠 단위 테스트 17개 통과
- local 콘텐츠 15개 frontmatter·style 검증 통과
- Prettier와 whitespace 검사 통과
