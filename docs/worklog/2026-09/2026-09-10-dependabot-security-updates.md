# 2026-09-10 Dependabot 보안 업데이트

## 배경

GitHub Dependabot에 열린 npm 경고 12개를 확인했다. 동일 패키지의 여러 advisory를 묶으면 실제 업데이트 대상은 6개다.

| 패키지                     | 경고 수 | 최고 심각도 | 안전 버전 기준 |
| -------------------------- | ------: | ----------- | -------------- |
| `next`                     |       2 | critical    | `>=16.3.3`     |
| `multer`                   |       4 | high        | `>=2.3.0`      |
| `sharp`                    |       1 | high        | `>=0.35.4`     |
| `js-yaml`                  |       1 | high        | `>=4.3.2`      |
| `hono`                     |       3 | medium      | `>=4.13.5`     |
| `baseline-browser-mapping` |       1 | medium      | `>=2.11.0`     |

## 변경 원칙

- Dependabot이 제시한 최초 패치 버전 이상으로만 올린다.
- 직접 사용하는 Next catalog와 전이 의존성 override를 함께 조정한다.
- docs 앱의 `next`와 `@next/mdx`는 같은 최소 버전으로 정렬한다.
- lockfile 재생성 후 production audit과 workspace 검증을 모두 실행한다.

## 검증 명령

```bash
pnpm install --lockfile-only
pnpm audit --prod
pnpm validate:catalog
pnpm test:repo
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 검증 결과

- `pnpm audit --audit-level low`: 알려진 취약점 없음
- `pnpm validate:catalog`: 통과
- `pnpm test:repo`: 3개 테스트 통과
- `pnpm lint`: 7개 작업 통과
- `pnpm typecheck`: 9개 작업 통과
- `pnpm test`: contract 6개, vuln-radar-backend 19개, docs-backend 13개 테스트를 포함한 전체 작업 통과
- `pnpm build`: docs, docs-backend, vuln-radar, vuln-radar-backend를 포함한 6개 작업 통과

lockfile에는 `next@16.3.4`, `multer@2.3.0`, `sharp@0.35.4`, `js-yaml@4.3.2`, `hono@4.13.7`, `baseline-browser-mapping@2.11.20`이 반영됐다.

Dependabot 경고는 기본 브랜치를 기준으로 판정하므로 이 변경이 `main`에 병합된 뒤 최종 종료 여부를 다시 확인한다.
