# 기본 브랜치 경고 4건과 Handlebars 패치 검증

## 대상과 조건

- 검증일: 2026-10-18 KST. 최신 `origin/main`의 `93fbf6da6126ddfa8b150a1ed4cd4d94a1f4002c`를 기준으로 `codex/security-dependabot-20261018`에서 수행했다.
- 환경: macOS arm64, Node 24.12.0, pnpm 11.10.0. 새 작업 트리에 frozen lockfile로 설치했고 설치 lifecycle script는 실행하지 않았다. 필요한 build/generate는 아래 명령으로 명시 실행했다.
- 기존 `feature/docs`의 TCP 초안·도식·기록은 옮기거나 스테이징하지 않았다. 운영 NAS·DB·콘텐츠 API에는 연결하지 않았다.
- GitHub의 open Dependabot #336~#339는 패키지 4개가 아니라 **Handlebars 3건, braces 1건**이었다. 로컬 audit의 의존 경로와 공식 advisory·npm registry를 대조했다.

## 재현 방법

저장소 루트에서 실행한다. `audit`은 남은 경고 때문에 정상적으로 종료 코드 1을 반환할 수 있으므로 원문 JSON도 함께 확인한다.

```bash
gh api repos/IMHOJEONG/web-tech/dependabot/alerts --paginate
mise exec -- pnpm view handlebars version engines --json
mise exec -- pnpm view braces version engines --json
mise exec -- pnpm why -r handlebars braces
mise exec -- pnpm audit --json
mise exec -- pnpm audit --prod --json

# 패치 전/후 같은 테스트를 실행해 실제 취약 동작 차이를 확인
mise exec -- node --test --test-name-pattern=Handlebars scripts/security-dependencies.test.mjs

# override 수정 후 lockfile 생성과 재현 가능한 설치
mise exec -- pnpm install --lockfile-only --ignore-scripts
mise exec -- pnpm install --frozen-lockfile --ignore-scripts
mise exec -- pnpm test:repo
mise exec -- pnpm --filter docs-backend check
mise exec -- pnpm --filter vuln-radar-backend build
mise exec -- pnpm test
mise exec -- pnpm lint
mise exec -- pnpm typecheck
mise exec -- pnpm validate:catalog
mise exec -- pnpm --filter docs test:article:prod local-content-tracing.spec.ts category-boundary.spec.ts
```

Playwright는 loopback의 합성 콘텐츠 서버와 production Next 서버만 사용한다. 테스트 build가 남으므로 실제 환경의 production 실행 전에는 정상 환경으로 다시 build한다. 샌드박스의 pnpm SQLite store 접근 실패는 권한을 승인받아 `why`를 재실행해 확인했으며 의존 경로 부재로 취급하지 않았다.

## 결과와 증거

### 경고별 조치

| 알림                                                                          | 패키지·등급          | 조건과 조치                                                                                                                          |
| ----------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| #339 [GHSA-p8wg-vrv2-v86f](https://github.com/advisories/GHSA-p8wg-vrv2-v86f) | handlebars, critical | prototype의 own `constructor` 조회가 접근 제한을 우회. 공격자 템플릿과 prototype method 허용 같은 전제조건이 있으며, 4.7.10으로 수정 |
| #337 [GHSA-8r5x-fm3f-whwj](https://github.com/advisories/GHSA-8r5x-fm3f-whwj) | handlebars, critical | 신뢰할 수 없는 객체 AST의 검증 누락으로 코드 생성 오염 가능. 문자열 템플릿만 받는 경로와 구분하며 4.7.10으로 수정                    |
| #338 [GHSA-xw65-4hp5-5hc7](https://github.com/advisories/GHSA-xw65-4hp5-5hc7) | handlebars, moderate | precompile 결과를 inline script에 넣으면 닫는 script 문자열이 HTML 경계를 탈출. 4.7.10으로 수정                                      |
| #336 [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | braces, high         | 깊은 중첩 패턴의 재귀 AST 처리로 스택 소진 가능. **공식 패치 없음, 미해결 유지**                                                     |

수정은 기존 전역 override의 하한 `^4.7.9 → ^4.7.10`과 lockfile의 실제 `handlebars@4.7.10`으로 한정했다. 무관한 패키지 버전 변경은 없다. 공식 registry 최신도 4.7.10이며 Node 24를 지원한다.

Handlebars는 두 백엔드의 **개발 의존성 `ts-jest@29.4.9`**에서 해석된다. 직접 소비 코드는 `ts-jest/dist/cli/config/init.js`의 고정된 Jest config 템플릿 compile이다. 앱 코드의 직접 Handlebars 호출이나 prototype 허용 옵션은 검색되지 않았다. 패키지 경고가 존재한다는 사실을 현재 HTTP 경로의 RCE 악용 가능성 확인으로 확대하지 않는다.

### 회귀 결과

| 검사                           | 관측 결과                                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 새 Handlebars 검사             | 4.7.9에서 6개 모두 실패, 4.7.10에서 6개 모두 통과. 두 백엔드에서 같은 3개 조건 확인                                           |
| 전체 저장소 테스트             | 43개 통과. 기존 CI의 `pnpm test:repo` 호출에 새 검사도 자동 포함                                                              |
| docs-backend check             | lint·타입·단위 13개·HTTP E2E 34개·build 통과                                                                                  |
| workspace 단위 테스트          | 콘텐츠 계약 20개, docs-backend 13개, vuln-radar-backend 19개, UI 5개 통과. Turbo 6개 task 모두 성공·캐시 0개                  |
| vuln-radar-backend build       | 로컬 Prisma generate와 Nest build 통과. DB migration·운영 DB 접속은 하지 않음                                                 |
| 전체 lint·타입·catalog         | 통과. lint 7 task 중 캐시 3개, 타입 9 task 중 캐시 2개. catalog는 11개 manifest 확인                                          |
| 운영 glob 재유입·카테고리 경계 | production build와 모바일/데스크톱 22개 통과. 로컬 콘텐츠 trace에 braces/fast-glob/micromatch 경로가 없고 기존 allowlist 유지 |

회귀에서는 생성자 **조회 결과만 검사**하고 `Function`을 호출하거나 시스템 명령을 실행하지 않는다. 변조 AST는 `precompile()`으로 거부 여부만 확인하며 생성된 소스를 평가하지 않는다. inline script 사례도 브라우저에서 악성 스크립트를 실행하지 않고 출력 문자열을 검사한다. 정상 템플릿 렌더링·escaping도 함께 확인한다.

[정제한 audit 및 로그 해시](../artifacts/2026-10-18-handlebars-security-audit.json)에 전후 결과·종료 코드·소비 경로와 실행 로그 해시를 보관했다.

| audit 범위        | 변경 전                        | 변경 후                   | 종료 코드    |
| ----------------- | ------------------------------ | ------------------------- | ------------ |
| 전체 의존성       | critical 2, high 1, moderate 1 | **high 1: braces만 남음** | 전/후 모두 1 |
| production 의존성 | 0건                            | **0건 유지**              | 전/후 모두 0 |

### 미해결 braces와 기존 완화 조치

GitHub advisory의 patched version은 `None`이며 npm registry 최신도 **3.0.3**이다. audit 응답의 비취약 범위 `>=3.0.4`를 실제 배포된 패치로 오인하지 않는다. 존재하지 않는 override·비공식 alias·검증하지 않은 backport·경고 무시는 추가하지 않았다.

현재 main에는 [ADR-0014](../../architecture/adr-0014-local-content-file-discovery.md)의 기본 파일 탐색이 이미 병합돼 있다. 과거 10-09 보고서의 main 운영 glob 잔여 문장은 당시 기준이며 현재 상태와 다르다. 이번에 production audit 0건과 파일 trace로 기존 제거를 재확인했다.

남은 개발 경로는 `eslint-config-next/@next/eslint-plugin-next → fast-glob → micromatch → braces`와 두 백엔드의 `ts-loader → micromatch → braces`다. 신뢰할 수 없는 glob·빌드 설정을 도구에 입력하지 않는 기존 경계를 유지하지만, 개발 의존성도 안전하다고 단정하지 않는다. 상위 공식 패치 또는 검증된 경로 제거가 있어야 경고를 해소할 수 있다. Dependabot 알림은 임의로 dismiss하지 않았다.

## 한계와 후속 작업

- 이 결과는 패치 브랜치의 로컬 검증이다. PR CI·main 병합·배포 브랜치 전파와 실제 배포는 별도 확인한다. main에 병합되기 전에는 기본 브랜치 알림 3건의 자동 종료도 기대하지 않는다.
- braces 때문에 전체 audit은 **실패 상태 1**을 유지한다. 이 PR을 전체 취약점 해결이나 audit 전체 통과로 설명하지 않는다.
- Node 24·macOS arm64의 대표 fixture 검증이다. 모든 Handlebars API·모든 템플릿의 호환성과 Linux/NAS 이미지의 실제 설치 버전까지 보장하지 않는다.
- 기존 [KAN-3](https://web-tech-service.atlassian.net/browse/KAN-3)의 braces 후속 과제와 연결하되, 이 PR로 해당 과제 전체를 완료 처리하지 않는다. Jira 상태·보안 경고·운영 설정은 변경하지 않았다.
- 문제가 생겨도 취약한 4.7.9로 무조건 되돌리지 않고 해당 소비 경로를 격리하거나 후속 공식 패치를 검증한다.

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-18-handlebars-security-patch.md)
- [개발 의존성 패치 추적](../../todo/todo.md#dependency-security)
- [10-09 당시 보안 결과](2026-10-09-security-patches.md)
- [운영 glob 제거 검증](2026-10-09-braces-runtime-removal.md)
