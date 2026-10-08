# 잔여 의존성 보안 패치와 호환성 검증

## 대상과 조건

- 검증일: 2026-10-09, Asia/Seoul.
- 기준: main `3134150`, `codex/security-remaining-advisories-20261009`의 변경. 최초 검증 당시 미커밋이었으며 보안 구현은 후속 커밋 `5fa50ab`에 보관했다.
- 환경: macOS arm64, Node.js 24.12.0, pnpm 11.10.0. 전체 workspace를 frozen lockfile로 설치했다.
- 기존 `feature/docs`의 문서 변경과 커밋은 그대로 보존했다. NAS·운영 API·DB에는 연결하지 않았다.
- 적용 범위는 의존성 override·lockfile·회귀 테스트다. 구현 커밋 이후 저장소 테스트 27개·커밋 포맷·문서 검사도 다시 통과했다. 원격 CI, PR, 병합, 배포는 미검증이다.

## 재현 방법

저장소 루트에서 다음 명령을 실행했다. `mise`의 프로젝트 설정을 먼저 신뢰하고 의존성을 설치한다. 수식·Typography 테스트는 각 앱의 실제 전이 의존성을 해석한다.

```bash
mise exec -- pnpm install --lockfile-only --ignore-scripts
mise exec -- pnpm install --frozen-lockfile --ignore-scripts
mise exec -- pnpm test:repo
mise exec -- pnpm validate:catalog
mise exec -- pnpm --filter @web-tech/ui build
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm test
mise exec -- pnpm --filter docs-backend test:e2e --runInBand
mise exec -- pnpm lint
mise exec -- pnpm typecheck
mise exec -- pnpm --filter vuln-radar build
mise exec -- pnpm --filter docs-backend build
mise exec -- pnpm --filter vuln-radar-backend build
mise exec -- pnpm --filter docs test:article:prod --project=article-desktop article-detail.spec.ts category-boundary.spec.ts
mise exec -- pnpm audit --prod --json
mise exec -- pnpm audit --json
mise exec -- pnpm view braces version --json
mise exec -- pnpm view katex@0.18.11 deprecated --json
mise exec -- pnpm view katex@0.18.2 deprecated --json
```

Playwright는 자체 로컬 콘텐츠 fixture와 production Next.js 서버를 실행한다. NAS 주소·토큰 후보는 테스트 전용 설정으로 대체된다. `test:lib`의 공용 UI build 누락 실패는 선행 build 후 재실행하여 해결했다. 최초 전체 타입 검사는 Prisma 사용자 캐시의 `EPERM`으로 중단됐고, 캐시 접근 승인 후 재실행하여 통과했다.

## 결과와 증거

### 패치한 패키지

| 패키지                  | main lockfile | 수정 lockfile | 근거                                                                            |
| ----------------------- | ------------- | ------------- | ------------------------------------------------------------------------------- |
| proxy-addr              | 2.0.7         | 2.0.8         | [IPv4-mapped IPv6 신뢰 판정](https://github.com/advisories/GHSA-jqcg-44mw-7w3h) |
| sharp                   | 0.35.4        | 0.35.5        | [네이티브 SVG 처리](https://github.com/advisories/GHSA-wq5f-xc86-pv6w)          |
| source-map-js           | 1.2.1         | 1.2.2         | [indexed source map 처리](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)    |
| seroval                 | 1.6.2         | 1.6.8         | [TypedArray 역직렬화](https://github.com/advisories/GHSA-jp82-f5mq-hwhp)        |
| katex                   | 0.16.45       | 0.18.2        | [상속된 설정의 trust 우회](https://github.com/advisories/GHSA-238p-pmpm-9mq7)   |
| postcss-selector-parser | 6.0.10        | 7.1.6         | [selector 파싱 비용](https://github.com/advisories/GHSA-rj75-hqrm-r3gf)         |

KaTeX와 selector parser는 상위 패키지가 요구하는 범위를 벗어나므로 `rehype-katex>katex`, `@tailwindcss/typography>postcss-selector-parser`에만 제한한 override를 적용했다. 상위 패키지 전체나 다른 소비처를 일괄 변경하지 않았다. sharp의 플랫폼별 네이티브 패키지와 libvips도 함께 갱신됐다.

처음 KaTeX를 `^0.18.2`로 지정하자 0.18.11이 선택됐고, registry가 호환성을 깨뜨린 실수 배포라고 경고했다. 최종 설치에서는 이를 제외하고 실제 검증한 0.18.2로 고정했다. 0.19 전환은 이번 조치에 포함하지 않았다.

### 실행 결과

| 검사                              | 관측 결과                                                                                                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 보안 전이 의존성 회귀             | 7개 통과. 두 백엔드 proxy 신뢰 판정, source map 정상 mapping, SVG→WebP, TypedArray 정상 왕복·비정상 source 거부, 상속 trust 차단·수식 렌더링, Typography pseudo-element 유지 |
| 저장소 테스트                     | 27개 통과. 위 7개는 기존 CI의 `pnpm test:repo` 호출에 자동 포함                                                                                                              |
| docs 라이브러리                   | 189개 통과                                                                                                                                                                   |
| workspace 단위 테스트             | 콘텐츠 계약 20개, docs-backend 13개, vuln-radar-backend 19개 통과. 계약 테스트는 Turbo 캐시 결과                                                                             |
| docs-backend HTTP E2E             | 18개 통과                                                                                                                                                                    |
| catalog·lint·타입 검사            | 통과                                                                                                                                                                         |
| production build                  | docs, vuln-radar, 두 백엔드 통과                                                                                                                                             |
| production 상세·카테고리 Chromium | desktop 18개 통과, 한·영 로컬/원격 fixture·reload·not-found·허용 목록 경계                                                                                                   |
| production audit                  | critical 0, high 1, moderate 0, low 0. 종료 코드 1                                                                                                                           |
| 전체 audit                        | critical 0, high 1, moderate 0, low 0. 종료 코드 1                                                                                                                           |

최종 [audit 응답 artifact](../artifacts/2026-10-09-security-patch-audit.json)에 명령·환경·종료 코드·잔여 의존성 경로를 보관했다. 패치 대상 6개의 advisory는 반환되지 않았다. audit이 완전히 통과한 상태로 표현하지 않는다.

미커밋 작업 트리의 문서 delta 검사, 새 코드·보고서·artifact·YAML 포맷 검사, `git diff --check`도 통과했다. 인덱스를 변경하거나 커밋하지 않고 작업 트리와 HEAD의 차이를 검증했다.

### 남은 braces 경고

잔여 항목은 `braces 3.0.3`, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)이다. registry 최신은 여전히 3.0.3이다. audit의 패치 범위 `>=3.0.4`를 출시 사실로 해석하거나 존재하지 않는 버전을 강제하지 않았다.

이 **main 기준** 브랜치에는 `docs → fast-glob → micromatch → braces` 운영 경로가 남아 있다. 카테고리 URL에는 이전 main의 allowlist가 적용되어 있지만 모든 경고가 해소된 것은 아니다. `feature/docs`의 별도 커밋 `c574bbd`는 로컬 콘텐츠 탐색에서 glob 경로를 제거했으므로 그 브랜치의 production 범위와 혼동하지 않는다. 제거 작업을 main에 전달한 뒤 다시 검사해야 한다. ESLint·ts-loader의 개발 경로는 별도로 남는다.

## 한계와 후속 작업

- Mac의 sharp 실제 네이티브 버전은 librsvg 2.63.2다. Linux amd64 컨테이너·Vercel의 설치 바이너리와 글로벌 라이브러리 사용 여부는 미검증이다.
- 테스트는 작은 정상/비정상 fixture만 사용했다. 메모리 고갈·RCE 공격을 재현하지 않았고 패키지 존재와 운영 exploit 도달 가능성을 동일시하지 않는다.
- 수식·Typography는 대표 입력과 production 빌드 범위다. 모든 LaTeX 명령·확장 API의 호환성을 보장하지 않는다. 상위 패키지가 보안 버전을 지원하면 scoped override를 재검토한다.
- Vite build의 향후 native config loader 경고와 Playwright의 색상 환경 경고는 남았다. 검사 실패는 아니며 보안 변경과 무관한 설정을 함께 수정하지 않았다.
- 원격 CI·main 병합·배포 브랜치 동기화·실제 배포는 미검증이다. NAS SSH 차단과 외부 백업 미구축에 대한 보류 정책을 변경하지 않았다.
- 기존 패키지 버전으로 되돌리면 취약점이 재유입된다. 회귀가 발견되면 문제 상위 경로를 격리하거나 후속 패치를 검증하며 무조건 rollback하지 않는다.

## 관련 문서

- [이전 main 입력 경계 검증](2026-10-05-next-category-hardening.md)
- [보안 작업 기록](../../worklog/2026-10/2026-10-09-security-patches.md)
- [보안 후속 TODO](../../todo/todo.md#dependency-security)
