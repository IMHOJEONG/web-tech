# Vite·콘텐츠 의존성 보안 패치 검증

## 대상과 조건

- 날짜: 2026-10-21 KST. 기준 main `c3a93c9a849cf23ffe0cebab734a64ad582b1b54`, 브랜치 `codex/security-default-alerts-20261021`.
- Node 24.12.0, pnpm 11.10.0, TypeScript 6.0.3, macOS 로컬. Linux·Windows·WSL 실제 환경과 NAS 배포는 미검증이다.
- [KAN-20](https://web-tech-service.atlassian.net/browse/KAN-20), 담당자 임호정. 기존 미해결 braces 과제는 [KAN-3](https://web-tech-service.atlassian.net/browse/KAN-3)과 구분한다.
- GitHub open Dependabot는 **5개 경고·3개 패키지**였다. 같은 시점의 registry audit은 **11개 advisory·5개 패키지**를 반환했다. 서로 다른 데이터의 집계 시점·범위를 혼동하지 않는다.

## 재현 방법

저장소 루트에서 다음을 실행한다. audit은 경고가 남으면 종료 코드 1이 정상적으로 유지되므로 성공 처리하지 않는다.

```bash
gh api 'repos/IMHOJEONG/web-tech/dependabot/alerts?state=open'
mise exec -- pnpm why -r vite sanitize-html hono markdown-it braces
mise exec -- pnpm view braces version --json
mise exec -- pnpm audit --json
mise exec -- pnpm audit --prod --json
mise exec -- pnpm install --frozen-lockfile --ignore-scripts
mise exec -- node --experimental-strip-types --test scripts/security-content-dependencies.test.mts
mise exec -- pnpm exec tsc --ignoreConfig --noEmit --module nodenext --target es2023 --strict --skipLibCheck --erasableSyntaxOnly --types node scripts/security-content-dependencies.test.mts
mise exec -- pnpm test:repo
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs-backend check
mise exec -- pnpm --filter vuln-radar lint
mise exec -- pnpm --filter vuln-radar typecheck
mise exec -- pnpm --filter vuln-radar test:lib
mise exec -- pnpm --filter vuln-radar build
mise exec -- pnpm --filter vuln-radar-backend typecheck
mise exec -- pnpm --filter vuln-radar-backend test --runInBand
mise exec -- pnpm --filter vuln-radar-backend build
```

기존 3001 개발 서버와 `.next`를 공유하지 않도록 docs production 검사는 별도 작업 트리에서 수행한다. 기준 커밋에 검토한 변경 파일만 복사하고 frozen install 후 `mise exec -- pnpm --filter docs test:article:prod`를 실행한다. 테스트 설정은 loopback 원격 콘텐츠 fixture와 테스트 전용 토큰을 사용한다. `.env`·NAS 인증·운영 토큰을 복사하지 않는다. 이 검사에는 production build와 모바일·데스크톱 상세/게시 계약이 포함된다.

## 결과와 증거

### 경고 조사와 변경

| 대상                                 | 원인·도달 조건                                                                                                                                                                         | 변경·판정                                                                                                           |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Dependabot #341~#343, Vite           | 내장 launch-editor의 Windows 경로 존재 검사·percent escaping·일부 에디터 flag 처리. Windows/WSL 및 공격자 파일·환경변수 등 advisory별 조건이 필요하다. 실제 악용을 관측한 것은 아니다. | `8.2.1 → 8.2.4`, catalog `~8.2.4`. 8.3으로 범위를 넓히지 않고 공식 패치가 있는 현재 minor를 유지한다.               |
| #340와 audit 추가 2건, sanitize-html | namespace가 붙은 SMIL 태그의 URL 검사 우회, implied close의 nonTextTags 조기 종료, meta refresh URL 검사 누락. 현재 docs는 SVG·meta를 허용하지 않지만 취약 의존성은 별도로 갱신한다.   | `2.17.7 → 2.18.1`, 최소 `^2.18.0`. 공식 수정 버전 이상으로 해결한다.                                                |
| audit 추가 1건, Hono                 | `serveStatic`의 두 번째 경로 decode로 prefix middleware를 건너뛸 수 있다. Prisma 개발 도구 경로에서 설치되며 앱의 공개 Hono 서버가 공격당했다는 증거는 아니다.                         | `4.13.7 → 4.13.13`, 기존 override를 `^4.13.11`로 보완한다.                                                          |
| audit 추가 3건, markdown-it          | smartquotes, HTML inline, 미완료 reference의 quadratic parsing. docs-backend는 html/typographer를 끄지만 기본 reference 경로 문제는 별개다.                                            | `14.3.1 → 14.3.3`, 직접 의존성 최소 `^14.3.3`. major 15로 전환하지 않는다.                                          |
| #336, braces                         | 깊은 AST의 재귀 처리로 stack exhaustion. registry 최신 3.0.3, 공식 patched version 없음. ESLint·두 백엔드 ts-loader 개발 경로에 남는다.                                                | **미해결 high 1건 유지**. 미출시 3.0.4 override·비공식 alias·미검증 backport·audit 무시·경고 dismiss는 하지 않는다. |

Vite 수정은 번들 내부 코드이므로 launch-editor만 별도 override하는 것으로 대체하지 않는다. sanitize-html 갱신에 따른 launder·dayjs와 peer snapshot의 lockfile 변경은 해당 패키지의 해석 결과다. 그 밖의 전체 의존성 최신화는 하지 않았다. 선택 버전은 모두 Node 24에서 사용 가능하며 install scripts를 임의 활성화하지 않았다.

### 회귀와 audit

| 검사                 | 결과                                         | 한계                                                                                                                                                                     |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 패치 전 새 보안 검사 | 5개 실패                                     | SMIL·noscript·Hono는 문자열/메모리 fixture에서 잘못된 출력·200을 재현. Vite·markdown-it은 최소 버전 gate 실패이며 Windows 명령 실행·무제한 DoS는 재현하지 않음.          |
| 패치 후 새 보안 검사 | 5개 통과                                     | namespace/태그 조합 20개, noscript·meta·정상 HTML, Hono 401/404와 공개 파일 200, Vite 버전, Markdown 자식 프로세스의 제한된 입력 완료. 복잡도 전체의 수학적 증명은 아님. |
| 저장소 회귀          | 63개 통과                                    | 기존 58개와 새 5개. 새 TypeScript 검사는 기존 test:repo glob으로 CI에서 실행됨.                                                                                          |
| docs 라이브러리      | 254개 통과                                   | 실제 sanitizer의 SVG/meta 차단과 figure·caption 유지 회귀 포함.                                                                                                          |
| docs-backend check   | lint·typecheck·단위 13개·E2E 34개·build 통과 | NAS 컨테이너 배포가 아님.                                                                                                                                                |
| vuln-radar           | lint·typecheck·단위 6개·Vite build 통과      | Windows/WSL 에디터 통합은 미검증.                                                                                                                                        |
| vuln-radar-backend   | typecheck·단위 26개·build 통과               | 격리 mock 기반 검사이며 운영 DB·수집을 실행하지 않음.                                                                                                                    |
| 전체 audit           | **11개 → high 1개, exit 1 유지**             | 잔여 braces를 숨기지 않음.                                                                                                                                               |
| production audit     | **0개, exit 0**                              | dependency 분류 기준이며 모든 취약점 부재나 모든 실행 경로의 안전을 보장하지 않음.                                                                                       |

정제한 전후 데이터는 [audit 증거](../artifacts/2026-10-21-security-content-audit.json)에 연결한다. 격리 작업 트리의 docs production build와 모바일·데스크톱 E2E **148개가 통과**했다. trace의 로컬 콘텐츠 유지·braces/fast-glob/micromatch 제거, 원격 HTML·상세 본문·게시 웹훅·요청 생명주기 대조를 포함한다. upstream 503·서버 destroy 등 의도적으로 실패를 주입하는 테스트의 로그가 있으며 전체 로그에 오류가 없다고 주장하지 않는다. TCP 글의 기존 `임시 포트` 휴리스틱 경고는 유지했고 관련 없는 본문을 수정하지 않았다. 테스트 종료 후 3111·3112 리스너는 없고 기존 3001 개발 서버는 유지됐다.

초기 준비 오류도 구분한다. sandbox 안의 pnpm why SQLite 접근·ESLint cache 쓰기는 권한 오류여서 허용된 재실행으로 해결했다. 최초 시험 fixture는 Prisma의 기본 export가 types.js를 가리켜 실패했으며 package.json 기준의 실제 의존 경로로 보완했다. TS6의 파일 직접 검사에는 `--ignoreConfig`와 `--types node`가 필요해 명령을 수정했으며 기존 tsconfig를 바꾸거나 타입 검사를 끄지 않았다. permissive sanitizer fixture는 script/style까지 열지 않도록 검사 대상 SVG 태그만 명시했다. markup·OS 명령을 브라우저나 에디터에서 실행하지 않았다.

## 한계와 후속 작업

- PR 병합 전 기본 브랜치의 Dependabot 5건이 남아 있을 수 있다. 병합 후 #340~#343 자동 종료를 확인하며 수동 dismiss하지 않는다. 추가 audit 6건과 GitHub 5건을 같은 목록으로 설명하지 않는다.
- 전체 audit의 잔여 braces는 기존 개발 입력 경계를 유지하고 공식 패치·검증된 경로 제거를 KAN-3에서 추적한다. production audit 0건으로 개발 도구의 문제를 해결했다고 표현하지 않는다.
- docs production E2E의 로컬 성공과 PR CI·리뷰·main 병합·배포는 각각 별도 결과로 기록한다. 기존 초안 스냅샷과 다른 feature 브랜치는 수정하지 않는다.

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-21-security-content-patches.md)
- [이전 Handlebars·braces 결과](2026-10-18-handlebars-advisories.md)
- [운영 glob 제거](2026-10-09-braces-runtime-removal.md)
- [Vite 경로 검사 advisory](https://github.com/vitejs/launch-editor/security/advisories/GHSA-587h-7wmj-h5pm), [percent escaping](https://github.com/vitejs/launch-editor/security/advisories/GHSA-698v-4r3x-3vcv), [에디터 flag](https://github.com/vitejs/launch-editor/security/advisories/GHSA-r825-w8mm-5pxw)
- [sanitize-html SMIL](https://github.com/apostrophecms/apostrophe/security/advisories/GHSA-374f-7chj-9948), [nonTextTags](https://github.com/apostrophecms/apostrophe/security/advisories/GHSA-x3q4-9hxx-gx8m), [meta refresh](https://github.com/apostrophecms/apostrophe/security/advisories/GHSA-cv27-6wvh-8x7j)
- [Hono 경로 decode](https://github.com/honojs/hono/security/advisories/GHSA-5r4p-p66f-jhc7)
- [markdown-it smartquotes](https://github.com/markdown-it/markdown-it/security/advisories/GHSA-r7fv-28h4-cvq7), [inline HTML](https://github.com/markdown-it/markdown-it/security/advisories/GHSA-vfgh-jcmw-g37q), [reference](https://github.com/markdown-it/markdown-it/security/advisories/GHSA-gfr2-rv44-r23c)
- [braces 미출시 패치](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
