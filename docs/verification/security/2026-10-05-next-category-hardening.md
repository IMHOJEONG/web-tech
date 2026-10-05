# Next.js 패치와 카테고리 입력 경계 검증

## 대상과 조건

- 검증일: 2026-10-05, Asia/Seoul.
- 기준: main `2dde9133a766a08089bcaa5111d2db713dcfc9fa` 기반 `codex/security-fast-uri-multer`의 미커밋 작업 트리. 앞선 fast-uri·multer 변경도 유지한다.
- 환경: Node.js 24.12.0, pnpm 11.10.0, 로컬 Next.js production 서버와 Playwright Chromium. NAS·Vercel 운영 서버에 시험 입력을 보내지 않았다.
- 조사 당시 Next.js 16.3.4·brace-expansion 5.0.9에서, 최종 lockfile은 각각 16.3.8·5.0.12로 갱신했다. `@next/mdx`도 16.3.8이다.

## 재현 방법

저장소 루트에서 실행한다. 빌드·테스트는 공용 UI의 `dist`를 재생성하므로 동시에 실행하지 않는다.

의존성 갱신과 설치에 사용한 명령:

```bash
mise exec -- pnpm update -r next @next/mdx --lockfile-only --ignore-scripts
mise exec -- pnpm update -r brace-expansion --lockfile-only --ignore-scripts
mise exec -- pnpm install --frozen-lockfile --ignore-scripts
```

catalog를 패치 범위로 수정한 뒤 update가 실제 출시된 Next.js 16.3.8을 선택했다. 최종 catalog도 `^16.3.8`로 정렬됐다.

회귀 검사 명령:

```bash
mise exec -- pnpm lint
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm test
mise exec -- pnpm test:repo
mise exec -- pnpm validate:catalog
mise exec -- pnpm --filter docs-backend build
mise exec -- pnpm --filter vuln-radar-backend build
mise exec -- pnpm typecheck
mise exec -- pnpm --filter docs test:article:prod category-boundary.spec.ts article-detail.spec.ts article-legacy-redirect.spec.ts
mise exec -- pnpm --filter docs lint
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm validate:docs
git diff --check
mise exec -- pnpm audit --json
mise exec -- pnpm audit --prod --json
```

article production 설정은 인증 콘텐츠 fixture 3112와 프론트 3111을 실행하고 모든 원격 후보를 fixture로 덮어쓴다. 재빌드와 서버 종료는 Playwright가 관리한다. 실제 토큰은 사용하지 않는다.

## 결과와 증거

### 패키지와 입력 경계

- Next.js·MDX catalog `^16.3.8`, brace-expansion override `^5.0.12`로 갱신하고 frozen install을 통과했다.
- `getCategoryTopic`을 페이지와 두 공개 loader가 공유한다. loader는 잘못된 조합에서 `[]`를 반환하고, 페이지는 `notFound()`로 처리한다.
- 단위 검사에서 실제 taxonomy의 6개 조합이 두 loader에 같은 고정 패턴을 전달했다. 잘못된 22개 조합은 glob 호출이 **0회**였다.
- 잘못된 조합 표본에는 brace·wildcard·extglob·대소문자·경로 이동·인코딩·빈 값·NUL이 있다. 길게 중첩한 문자열은 mocked glob에 도달하지 않는지만 검사했다. 취약 파서로 실제 공격을 실행하지 않았다.

### 회귀 결과

| 검사                     | 결과                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| docs 라이브러리          | 189개 통과, 신규 카테고리 검사 4개 포함                                                           |
| 루트 기본 test           | contract 20개·docs-backend 13개·vuln-radar-backend 19개 통과                                      |
| 저장소 검사              | 20개 통과                                                                                         |
| lint                     | 7개 task 통과                                                                                     |
| catalog                  | 11개 manifest 통과                                                                                |
| typecheck                | 9개 task 성공, 2개 의존성 build는 캐시 사용                                                       |
| 두 NestJS backend build  | 통과. DB 연결·마이그레이션은 검사하지 않음                                                        |
| docs production build    | 순차 재실행 통과. 로컬 콘텐츠 16개 검사·정적 페이지 28개 생성                                     |
| production 브라우저 회귀 | 40개 통과: 신규 카테고리 20개·기존 상세 16개·legacy ARIA 리다이렉트 4개. Chromium 모바일·데스크톱 |

초기 Next.js 빌드는 타입 검사 도중 공용 UI export를 찾지 못해 실패했다. 동시에 실행하던 다른 검사가 `packages/ui/dist`를 지우고 재생성한 시점과 겹쳤다. 검사가 끝난 뒤 같은 앱 코드로 순차 빌드를 실행하자 통과했다. 앱 코드 수정으로 숨기지 않고 동시 실행 제약을 기록한다.

카테고리 E2E 초회는 `noindex` 태그가 정확히 1개라고 가정해서 4개 실패, 1개 중단, 15개 미실행이었다. 실제 오류 화면은 표시됐고 메타데이터와 페이지 차단으로 태그가 2개였다. 태그 개수가 아닌 색인 차단 존재 여부를 검사하도록 수정하고 기존 상세 회귀와 함께 재실행해 **40개 모두 통과**했다. 재실행 전체 소요 시간은 빌드·서버 준비를 포함한 47.0초였다.

별도 로컬 HTTP smoke 10건에서는 정상 카테고리 3건 HTTP 200·noindex 없음, 잘못된 카테고리 6건 HTTP 200·noindex 존재, 정상 legacy 상세 1건 HTTP 200·canonical meta redirect를 확인했다. HTTP 200만으로 성공·차단 실패를 판정하지 않는다. 위 브라우저 검사는 hydration 후 오류 화면과 최종 URL·본문까지 확인하도록 작성했다.

### 잔여 audit

E2E 추가 후 docs lint·typecheck를 재실행했고 모두 통과했다. 문서 delta 검사와 `git diff --check`도 통과했다. 이 작업이 실행한 로컬 production 서버 3007 및 Playwright fixture 3111·3112는 종료됐다.

전체·production audit 모두 **high 1개**, `braces@3.0.3`의 `GHSA-vfj7-8cjw-p6xm`만 남는다. 두 명령 모두 종료 코드 **1**이다. audit 통과 또는 전체 취약점 해결로 표시하지 않는다. [전체 audit 원본](../artifacts/2026-10-05-security-audit.json).

Next.js critical과 brace-expansion 3개 경고는 사라졌고 이전 fast-uri·multer 경고도 다시 나타나지 않았다. `braces`와 `brace-expansion`은 서로 다른 패키지다. 출시되지 않은 `braces@3.0.4`를 강제하거나 다른 패키지로 alias하지 않았다. 패치 가용성의 근거는 [선행 조사](2026-10-05-remaining-advisories.md)에 보관한다.

## 한계와 후속 작업

- 이 작업은 카테고리 URL의 glob 입력 경계를 보강했으며 `braces` 전체를 제거하지 않았다. 상위 패치 추적 또는 디렉터리 순회로 대체하는 후속 검토가 필요하다.
- main에는 ImageResponse 사용처가 없으므로 이번 로컬 검사로 배포 브랜치의 `/og/article.png` 동작·RCE 도달 가능성을 판정하지 않는다. 패치 전달 후 해당 경로의 정상 이미지 출력도 확인한다.
- Chromium 모바일·데스크톱 viewport 검사는 실제 기기·Firefox·WebKit 검사를 대신하지 않는다. 전체 article suite와 다른 UI 전용 E2E는 이번 범위에 포함하지 않는다.
- 커밋·PR·원격 CI·main 병합·feature/docs 동기화·NAS/Vercel 배포는 미수행이다. 의존성 및 앱 변경을 PR에서 검토한 뒤 배포 브랜치에 전달한다.

## 관련 문서

- [카테고리 입력 경계 정책](../../architecture/docs-content-routing-policy.md#category-input-boundary)
- [선행 조사](2026-10-05-remaining-advisories.md)
- [작업 기록](../../worklog/2026-10/2026-10-05-next-category-security-hardening.md)
- [보안 후속 TODO](../../todo/todo.md#dependency-security)
