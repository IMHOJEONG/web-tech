# 로컬 파일 탐색의 braces 운영 경로 제거 검증

## 대상과 조건

- 검증일: 2026-10-08~09, Asia/Seoul. 최종 재검증 10-09.
- 기준: `feature/docs`, 게시 검증 도구 커밋 `c000e41` 이후의 작업 트리.
- 환경: Node.js 24.12.0, pnpm 11.10.0, Next.js 16.3.8, 로컬 production 서버와 Playwright Chromium desktop 프로젝트.
- 범위: docs 직접 `fast-glob` 제거, 카테고리·검색·revision 공용 탐색, 배포 파일 추적. 운영 NAS·Vercel에는 쓰기 요청을 보내지 않았다.

## 재현 방법

저장소 루트에서 실행한다. 빌드와 공용 UI `dist`를 재생성하는 검사는 순차 실행한다.

```bash
mise exec -- pnpm view braces version versions --json
mise exec -- pnpm why -r braces
mise exec -- pnpm install --lockfile-only --ignore-scripts
mise exec -- pnpm install --frozen-lockfile --ignore-scripts
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm audit --prod --json
mise exec -- pnpm audit --json
```

`apps/docs`에서 실행한 focused lint와 production 검사:

```bash
mise exec -- pnpm exec eslint lib/get-category.ts lib/get-category.test.ts lib/local-search-index.ts lib/local-search-revision.ts lib/local-markdown-files.ts lib/local-markdown-files.test.ts article-e2e/local-content-tracing.spec.ts next.config.mjs
mise exec -- pnpm exec playwright test --config=playwright.article.config.ts --project=article-desktop local-content-tracing.spec.ts content-publication-cli.spec.ts content-publication.spec.ts
```

Playwright 설정이 fixture와 프론트 production 빌드·시작·종료를 관리한다. 실제 인증값 대신 fixture 인증값을 사용한다. trace 검사는 빌드 산출물에 대해서만 실행해야 한다.

## 결과와 증거

### 패치와 의존 경로

registry 최신 `braces`는 **3.0.3**이다. [GitHub advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)에도 출시된 패치는 없다고 표시되어 있다. audit의 `>=3.0.4` 안내를 실제 출시 확인으로 간주하지 않는다.

기존 docs 운영 경로 `fast-glob@3.3.3 → micromatch@4.0.8 → braces@3.0.3`를 제거했다. 변경 후 production audit에는 `braces`가 없다. 전체 dependency graph에는 `@next/eslint-plugin-next → fast-glob@3.3.1` 및 두 백엔드의 `ts-loader` 개발 경로가 남는다. **전체 저장소 패치 완료 또는 개발 도구의 위험 해소를 의미하지 않는다.**

### 회귀와 배포 파일

| 검사                                      | 관측 결과                                    |
| ----------------------------------------- | -------------------------------------------- |
| docs 라이브러리·Node 테스트 타입          | 216개 통과, 실패 0                           |
| 변경 파일 lint                            | 통과                                         |
| production 빌드·게시 CLI·ko/en 갱신·trace | 4개 통과, 빌드 포함 26.8초                   |
| 현재 corpus와 기존 개발용 fast-glob 대조  | 파일 18개, 파일 집합·revision digest 동일    |
| search·docs 상세·category 목록 trace      | 세 경로 모두 로컬 Markdown 18개 포함         |
| 세 trace의 외부 패키지 경로               | `braces`, `fast-glob`, `micromatch` 경로 0개 |

회귀 fixture에는 중첩 디렉터리, `.md/.mdx`, 지원하지 않는 확장자, 숨김 파일, 루트와 하위 심볼릭 링크, brace 문자 파일명이 포함된다. 잘못된 카테고리 입력은 디렉터리 읽기에 도달하지 않는다. `EACCES`는 빈 결과로 바뀌지 않고 호출자에게 전파된다.

파일 trace 검사는 `.next/server/app/api/search/route.js.nft.json`, `docs/[...slugParts]/page.js.nft.json`, `category/[main]/[sub]/page.js.nft.json`을 읽는다. 세 결과는 위 E2E에서 매번 검사한다. 이 관측으로 Next 내부 번들 전체의 취약 코드 부재나 모든 입력의 비도달을 증명하지 않는다.

게시 브라우저 회귀는 통과했지만 `The destination stream closed early`가 4회 기록됐다. 별도의 요청 종료 문제이며 테스트 성공만으로 정상 취소라고 판정하지 않는다.

### 별도로 남은 audit

두 audit 모두 종료 코드 **1**이다. production은 **5건**(critical 1, high 3, low 1), 전체는 **7건**(critical 1, high 4, moderate 1, low 1)이다. [민감정보를 제외한 실행 요약](../artifacts/2026-10-09-braces-runtime-removal.json).

| 패키지                         | 심각도   | audit의 패치 범위   | 범위                       |
| ------------------------------ | -------- | ------------------- | -------------------------- |
| proxy-addr 2.0.7               | critical | >=2.0.8             | 두 NestJS 백엔드의 Express |
| source-map-js 1.2.1            | high     | >=1.2.2             | docs·vuln-radar 등         |
| sharp 0.35.4                   | high     | >=0.35.5            | docs Next 이미지 의존성    |
| seroval 1.6.2                  | high     | >=1.6.3             | vuln-radar TanStack        |
| katex 0.16.45                  | low      | >=0.18.2            | docs rehype-katex          |
| braces 3.0.3                   | high     | 실제 출시 패치 없음 | 개발 도구                  |
| postcss-selector-parser 6.0.10 | moderate | >=7.1.6             | docs Typography 개발 경로  |

`proxy-addr@2.0.8`의 registry 존재를 별도로 확인했다. [공식 advisory](https://github.com/advisories/GHSA-jqcg-44mw-7w3h)는 IPv4-mapped IPv6 신뢰 판정에 따른 우회 위험을 설명한다. 현재 서비스에서 실제 악용을 관측했다는 의미는 아니다. 해당 패키지의 패치와 trust proxy·IP 기반 보호의 회귀 검사는 공통 main 기반 보안 작업으로 분리한다. 나머지 패키지도 상위 API·major 호환성을 검토해야 하며 이 작업에서는 갱신하지 않았다.

## 한계와 후속 작업

- 변경 파일과 production 의존 경로만 검사했다. 전체 앱 lint, 다른 브라우저·실기기, NAS 배포, 원격 CI는 이번 완료 조건에 포함하지 않는다.
- 동기 순회는 현재 18개 corpus에 맞춘 선택이다. 성능 개선 수치를 주장하지 않으며 corpus 증가 시 이벤트 루프·산출물 크기를 재측정한다.
- 개발 도구의 `braces` 패치 추적은 계속한다. 이번 제거로 audit 전체가 통과했다고 표시하지 않는다.
- 10-09 사용자 요청으로 운영 발행 V1→V2·원복과 NAS 외부 백업·격리 복원을 추후 점검으로 보류했다. 보안 조치로 SSH가 차단되어 있고 외부 백업 저장소도 아직 없다. 두 항목은 미실행 상태이며 SSH 개방이나 백업 설정을 임의 변경하지 않는다. [재개 조건과 완료 기준](../../todo/todo.md#추후-점검으로-보류한-nas-과제).

## 관련 문서

- [ADR-0014](../../architecture/adr-0014-local-content-file-discovery.md)
- [게시 결과 검증 절차](../../runbooks/docs-content-publication-verification.md)
- [작업 기록](../../worklog/2026-10/2026-10-09-braces-runtime-removal.md)
- [후속 TODO](../../todo/todo.md#dependency-security)
