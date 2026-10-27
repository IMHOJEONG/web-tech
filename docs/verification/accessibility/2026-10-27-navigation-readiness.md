# 모바일 메뉴와 카테고리 탐색 검사의 준비 시점

## 대상과 조건

- 2026-10-27 KST, PR #66 head `edd297a52f8f2104b126646b5c3da043cbdb2ee3` 위 로컬 미커밋 수정.
- Node.js 24.12.0, pnpm 12.14.0, Next.js 16.4.3, Playwright 1.62.1 Chromium.
- 원격 콘텐츠 인덱스를 끈 loopback 개발 서버, 모바일 390×844·태블릿 768×1024·데스크톱 1280×800. ko/en 카테고리와 light/dark shell을 검사한다.
- [KAN-39](https://web-tech-service.atlassian.net/browse/KAN-39)의 잔여 flaky 2건이다. 이전 스켈레톤 7건의 원인·해결과 구분한다.

## 재현 방법

저장소 루트에서 실행한다. 3057 포트가 비어 있어야 하며, 각 브라우저 명령은 순서대로 실행한다. `CI=1`은 기존 서버 재사용을 막고 `--retries=0`은 재시도를 끈다.

```sh
mise exec -- env CI=1 DOCS_E2E_PORT=3057 pnpm --filter docs exec playwright test category-localization.spec.ts shell-focus-contrast.spec.ts mobile-drawer-close.spec.ts navigation-readiness.spec.ts --retries=0 --repeat-each=3 --workers=3 --reporter=json > /tmp/interaction-navigation-repeat.json
mise exec -- env CI=1 DOCS_E2E_PORT=3057 pnpm --filter docs exec playwright test --retries=0 --workers=3 --reporter=json > /tmp/interaction-responsive-full.json
mise exec -- pnpm --filter docs exec tsc --noEmit
mise exec -- pnpm --filter docs exec eslint e2e/helpers/follow-link.ts e2e/navigation-readiness.spec.ts e2e/category-localization.spec.ts e2e/shell-focus-contrast.spec.ts --max-warnings 0
mise exec -- pnpm test:repo
```

새 `navigation-readiness.spec.ts`에는 의도적인 음성 대조가 있다. 모바일에서는 외부 스크립트를 보류하고 비활성 버튼의 Enter가 아무 메뉴도 열지 않는 것을 확인한다. 데스크톱에서는 카테고리 RSC 응답을 보류하고 **기존 URL assertion의 5초 만료를 예상된 거절로 검사**한다. 이후 보류를 해제하고 정상 탐색·제목을 확인한다. 임의 sleep, 재클릭, 전역 timeout 증가는 없다.

## 결과와 증거

### 원격 CI에서 확인한 사실

[CI 40451483260](https://github.com/IMHOJEONG/web-tech/actions/runs/40451483260)은 전체 성공이지만 두 검사가 retry #1로 통과했다.

| 검사                              | 첫 실패                                                                                  | 증거                                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 모바일 light shell focus/contrast | Enter 후 `주요 메뉴` navigation 기대1·실제0, 5초 만료                                    | [모바일 job](https://github.com/IMHOJEONG/web-tech/actions/runs/40451483260/job/122014977933)   |
| 데스크톱 ko category index        | 클릭 후 `/ko/category/fe` 대신 이전 `/ko/category`, 5초 만료. `html.nprogress-busy` 관측 | [데스크톱 job](https://github.com/IMHOJEONG/web-tech/actions/runs/40451483260/job/122014978074) |

모바일의 당시 disabled 속성, 데스크톱의 정확한 서버 컴파일·네트워크 소요 시간까지 CI 로그에 남아 있는 것은 아니다. 다음 직접 재현은 같은 실패 기전을 확인한 것이며 당시 모든 타이밍을 복원했다는 뜻이 아니다.

### 직접 재현과 수정

- 모바일 drawer는 서버에서 disabled이며 `useSyncExternalStore`의 클라이언트 snapshot 이후 활성화된다. `locator.press('Enter')`는 클릭처럼 enabled 상태를 기다리지 않는다. 스크립트 보류 중 press가 완료되어도 메뉴는0이었다. 해제 후 `toBeEnabled()`를 기다려 Enter를 보내면 메뉴1·Escape 닫기·트리거 초점 복귀를 확인했다. shell 검사에도 같은 enabled 대기를 추가하고 키보드 검사는 유지했다.
- 카테고리에서는 RSC 요청이 시작되고 로딩 표시가 있어도 URL은 응답 commit 전까지 이전 주소일 수 있다. 응답 보류 중 기존 `toHaveURL`의 5초가 만료됐고, 해제 후 정상 이동했다. `followLink`가 클릭 전에 `waitForURL(..., {waitUntil: 'commit'})`를 등록해 기존 테스트/탐색 예산 내에서 이동을 기다린다. 이후 정확한 URL·번역된 제목 assertion은 그대로 남긴다.
- 로컬 Next.js 문서 `01-app/01-getting-started/04-linking-and-navigating.md`의 client-side transitions·slow networks·hydration 절을 대조했다. 새로운 앱 loading UI나 캐시 정책으로 우회하지 않았다.

| 검사                         | 결과                                |
| ---------------------------- | ----------------------------------- |
| 지연 재현 검사 재실행        | 2통과·2제외·실패0·재시도0           |
| 관련 4개 spec, 세 화면 × 3회 | 90통과·36제외·실패0·flaky0·재시도0  |
| 전체 반응형 E2E              | 372통과·54제외·실패0·flaky0·재시도0 |
| 앱 타입·변경 파일 lint       | 통과                                |
| 저장소 회귀                  | 156통과·실패0                       |

관련 반복의 화면별 통과/제외는 모바일39/3, 태블릿24/18, 데스크톱27/15다. 전체 검사는 각각131/11, 116/26, 125/17이다. 제외는 모바일 전용 drawer 및 플랫폼별 지연 재현 조건 등 기존 플랫폼 조건이며 실패를 제외 처리한 것이 아니다. 첫 신규 검사에서는 제목 기대값을 잘못 하드코딩해 1통과·2제외·1실패였다. 실제 `ko.category.main.title`로 연결한 뒤 재실행했다. 저장소 회귀의 최초 sandbox 실행은 loopback `listen EPERM`으로 실패했으며 listen 허용 후156개가 통과했다.

[관련 반복의 원본 JSON 정제본](../artifacts/2026-10-27-navigation-readiness.playwright.json)은 개별 결과126개와 인라인 JSON 첨부6개를 보존한다. 세 데스크톱 대조에서 기존 URL assertion은 응답 보류 중 각각5018·5236·5010ms 후 만료됐고 이후 정상 이동했다. checkout·개인 홈 경로 치환과 Prettier 공백 정렬만 수행했다. 모든 필드·개별 결과·첨부의 구조적 동일성을 대조했으며 원본·정제본 SHA-256, 테스트 소스 hash, 전체 결과 집계는 [출처 기록](../artifacts/2026-10-27-navigation-readiness-provenance.json)에 있다.

전체 원본 `interaction-responsive-full.json`은1,260,944바이트로 저장소1MiB 제한을 넘는다. 분할·압축으로 우회하거나 첨부를 삭제한 파일을 원본이라 부르지 않고, 로컬 임시 파일로만 유지하며 출처 기록에 해시·크기·파생 집계를 남겼다. 임시 파일의 장기 보관은 보장하지 않는다. 전체 보고서의 첨부 참조93개에 포함된 PNG 파일 등이 저장소에 업로드됐다는 의미는 아니다.

앱 타입·lint와 문서 delta 검사(실제 Git 인덱스를 바꾸지 않은 작업 트리 overlay)도 통과했다. 테스트 간 `.next` 캐시는 삭제하지 않았으므로 최초 빌드의 cold compile 비용을 측정한 실행은 아니다. 전용 서버는 검증 후 종료했다.

## 한계와 후속 작업

- 수정은 테스트 동기화에 한정한다. 제품 런타임·시각 스타일·전역 expect 5초·테스트 30초·CI retries 설정은 변경하지 않았다.
- 테스트 예산을 초과하는 실제 탐색 실패, JavaScript를 받지 못하는 사용자 환경을 해결하는 변경은 아니다. 로컬 성공을 새 head의 원격 CI 무재시도 성공으로 대신하지 않는다.
- Safari/Firefox·실기기·운영 지연과 이번 미커밋 변경의 PR CI는 미검증이다. 커밋·푸시·병합하지 않았다.
- ADR-0003·0005와 기존 로딩 UX 결정을 유지하는 회귀 수정으로, 새 ADR은 추가하지 않는다.

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-27-navigation-readiness.md)
- [스켈레톤 hydration 격리](2026-10-27-skeleton-hydration-isolation.md)
- [로딩 UX 정책](../../architecture/docs-loading-ux-policy.md)
