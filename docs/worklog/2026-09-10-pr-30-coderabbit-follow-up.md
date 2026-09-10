# 2026-09-10 PR #30 CodeRabbit 후속 점검

## 목적

PR #30에 남은 CodeRabbit 의견을 실제 결함, 이미 해결된 항목, 저장소 정책과 다른 제안, 추후 고려사항으로 구분했다. 자동 리뷰를 일괄 적용하지 않고 현재 콘텐츠 계약과 배포 방식에 맞는지 검증한 뒤 반영했다.

## 반영한 항목

| 항목                                                 | 판정               | 조치                                                                                    |
| ---------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| `PORT`의 부분 숫자 파싱 및 범위 누락                 | 실제 결함          | 숫자로만 구성된 `1..65535` 정수만 허용하고 나머지는 `8000`으로 fallback한다.            |
| numeric/double-encoded HTML entity 미복원            | 실제 결함          | `entities` parser로 named, decimal, hexadecimal entity를 최대 2회 복원한다.             |
| `items`와 `results`가 동시에 있을 때 묵시적 우선순위 | 계약 모호성        | 둘 중 정확히 하나만 허용하도록 schema와 회귀 테스트를 추가했다.                         |
| 운영 NAS에서 source rebuild 수행                     | 운영 절차 결함     | GHCR immutable image를 `pull`하고 `up -d --no-build`하도록 변경했다.                    |
| runbook의 개인 로컬 절대경로 링크                    | 문서 이식성 결함   | 저장소 상대경로로 변경했다.                                                             |
| mise 활성화가 현재 shell에만 적용됨                  | 온보딩 문서 결함   | `~/.zshrc`에 중복 없이 기록한 뒤 shell을 다시 시작하도록 변경했다.                      |
| backend token이 Turbo `globalEnv`에 포함됨           | 비밀정보 범위 과다 | 전역 목록에서 제거하고 `apps/docs-backend/turbo.json`의 `dev`, `start` task로 제한했다. |

## 이미 해결된 항목

- 중복 `rel` 속성 문제는 `sanitize-html` parser 전환과 `_blank` 링크 transform으로 이미 해결됐다.
- 이번 점검에서는 `rel`이 하나만 출력되고 값이 `noopener noreferrer`인지 확인하는 회귀 테스트를 추가했다.
- CodeQL의 다중 문자 sanitization 경고 3개도 같은 parser 전환 커밋에서 해결됐다.

## 정책상 변경하지 않은 항목

CodeRabbit은 `./cover.png`를 Markdown 파일의 부모 디렉터리 기준으로 해석하라고 제안했다. 그러나 이 저장소의 공개 asset 계약은 다음과 같다.

```text
posts:  content/posts/{channel}/{slug}.md
assets: content/assets/{channel}/{slug}/...
```

따라서 `web/event-loop.md` 안의 `./diagram.webp`는 `web/diagram.webp`가 아니라 `web/event-loop/diagram.webp`로 해석해야 한다. 현재 구현은 의도한 동작이며, 이를 회귀 테스트와 코드 주석으로 고정했다.

## 고려사항

CodeRabbit의 docstring coverage 80% 제안은 현재 저장소의 CI 품질 게이트가 아니다. 모든 함수에 형식적인 주석을 추가하면 유지보수 비용과 코드 잡음이 커질 수 있어 이번 PR에서는 적용하지 않는다. 공개 API, 보안 경계, 복잡한 계약처럼 이름과 타입만으로 의도가 드러나지 않는 곳에만 설명을 추가하는 정책이 더 적합하다.

## 검증

```bash
CI=true pnpm --filter @web-tech/docs-content-contract test
CI=true pnpm --filter @web-tech/docs-content-contract build
CI=true pnpm --filter docs-backend test --runInBand
CI=true pnpm --filter docs-backend test:e2e --runInBand
CI=true pnpm --filter docs-backend typecheck
CI=true pnpm --filter docs-backend lint
CI=true pnpm --filter docs test:lib
CI=true pnpm --filter docs typecheck
CI=true pnpm --filter docs lint
CI=true pnpm validate:catalog
CI=true pnpm test:repo
```

검증 결과:

- content contract test: 6개 통과
- docs-backend unit test: 13개 통과
- docs-backend e2e test: 5개 통과
- docs library test: 94개 통과
- docs/docs-backend typecheck 및 lint 통과
- catalog validation 및 repository test 통과
- Turbo dry-run에서 token 변수는 `docs-backend#dev`에만 지정되고 root global env에는 포함되지 않음을 확인
