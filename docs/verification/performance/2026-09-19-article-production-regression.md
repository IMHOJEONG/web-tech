# 상세 렌더링 및 스트리밍 회귀 검증

## 대상과 조건

2026-09-19 KST, Node.js 24.12.0에서 미커밋 변경을 포함한 작업 트리를 검사했다. 실행 도중 같은 체크아웃의 테스트/컴포넌트 변경이 관측되어 특정 커밋으로 고정한 검증은 아니다. 운영 배포의 통과 여부를 뜻하지 않는다.

`playwright.article.config.ts`의 Chromium 모바일 390x844, 데스크톱 1280x800에서 `next build` 후 `next start`를 실행했다. Next 서버는 loopback 3111, 콘텐츠 fixture는 3112이며 테스트용 인증 값만 사용한다. 원격 본문 fixture 응답에 350ms 지연이 있고 캐시 TTL은 300초다.

## 재현 방법

저장소 루트에서 실행한다. 의존성 및 Playwright Chromium이 설치되어 있어야 하며 같은 체크아웃에서 다른 빌드/개발 서버를 동시에 실행하지 않는다.

```sh
mise exec -- pnpm --filter docs test:article:prod > /tmp/docs-article-regression.log 2>&1
```

`.next`에는 fixture 환경으로 생성한 빌드가 남는다. 이후 실제 환경의 서버를 실행하려면 해당 환경으로 다시 빌드한다.

## 결과와 증거

전체 명령은 종료 코드 1로 실패했다. 총 18개 중 16개 통과, 2개 실패이며 테스트 실행 요약 시간은 29.4초다. 빌드 시간 및 실제 LCP 측정값과는 다르다.

| 대상                            | 조합                     | 결과     |
| ------------------------------- | ------------------------ | -------- |
| 로컬 data 문서                  | ko/en, 모바일/데스크톱   | 4개 통과 |
| 로컬 category canonical 상세    | ko/en, 모바일/데스크톱   | 4개 통과 |
| 원격 HTML fixture               | ko/en, 모바일/데스크톱   | 4개 통과 |
| 존재하지 않는 문서              | ko/en, 모바일/데스크톱   | 4개 통과 |
| 부가 영역 준비 전 본문 스트리밍 | 모바일/데스크톱 프로젝트 | 2개 실패 |

정상 문서는 직접 접근과 새로고침 모두 본문 첫 heading, 고유 문장, 마지막 섹션, loading 제거를 검사했다. 없는 문서는 HTTP 상태만 믿지 않고 not-found UI 및 본문 부재를 확인했다.

스트리밍 검사의 오류:

```text
Objects are not valid as a React child
(found: object with keys {__pw_type, type, props, key}).
```

오류는 `article-streaming.spec.ts`의 React 서버 스트림 검사에서 발생했다. 이 검사는 브라우저 viewport의 시각적 스트리밍 측정이 아니라 두 프로젝트에서 반복 실행되는 서버 컴포넌트 경계 검사다. JSX 변환 경로와 React renderer의 입력 불일치를 우선 조사해야 하며, 이 오류만으로 실제 Next 페이지의 스트리밍이 실패했다고 단정하지 않는다.

로컬 원본 로그는 `/tmp/docs-article-regression.log`, 실패 trace는 `apps/docs/test-results/`에 있다. 임시 로그/trace는 재실행 또는 정리 시 사라질 수 있으며 저장소에는 이 요약만 보관한다. 명령의 실패를 무시하거나 테스트를 제외하여 통과로 표시하지 않았다.

## 한계와 후속 작업

이 보고서는 최초 실행 당시 결과를 보존한다. 기록 이후 `cc954d4`, `d1adf4c` 스트리밍 관련 커밋이 추가됐으므로 여기의 실패 결과를 최신 HEAD의 상태로 해석하지 않는다. 해당 커밋 기준 재검증 결과는 별도 실행으로 확인해야 한다.

- 스트리밍 테스트 수정 담당을 확인한 후 작업 트리를 고정하여 전체 검사를 재실행한다.
- 실제 캐시 적중/미적중별 본문 표시 시간과 원격 장애 fallback 측정은 아직 수행하지 않았다.
- 이번 페이지 기능 검사는 스트리밍 전후 성능 개선 폭, 실기기 Safari, Vercel timeout을 증명하지 않는다.
- 다른 작업의 미커밋 내용을 수정하거나 커밋하지 않았다.

## 관련 문서

- [상세 렌더링 회귀 절차](../../runbooks/docs-article-rendering-regression.md)
- 스트리밍 변경 이력: `cc954d4`, `d1adf4c`.
