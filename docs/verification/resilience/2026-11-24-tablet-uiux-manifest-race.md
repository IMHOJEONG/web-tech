# 태블릿 UI/UX 검사와 개발 서버 manifest 경쟁 조건

## 대상과 조건

- 최초 검증일: 2026-11-24, KST. 당시 로컬 검증 결과이며 후속 공개·원격 검증 상태는 11-27 항목에서 구분한다.
- 이슈: [KAN-90](https://web-tech-service.atlassian.net/browse/KAN-90). 기존 [KAN-58](https://web-tech-service.atlassian.net/browse/KAN-58)의 후속 버그를 분리했다.
- 최초 실패: [CI 45036440225](https://github.com/IMHOJEONG/web-tech/actions/runs/45036440225), 기준 `8e54a6665a62d6d358973786102e5eee1ff1baf9`.
- 수정 기준: main `136ef3c494e92497e38cb453f03e012bb3a13064`, 전용 브랜치 `codex/docs-tablet-uiux-readiness-20261124`.
- Node 24.22.1, pnpm 12.14.0, Next 16.4.6, Playwright 1.62.1, Chromium 태블릿 768×1024, worker 2개.
- 기대 조건 5초·테스트 30초·기존 main 개수와 loading 종료·카드/링크·마우스/키보드 검사는 변경하지 않았다. 로컬 반복은 재시도 0회다.
- E2E는 `.git`·환경 파일·실제 원문을 제외한 격리 실행 사본의 공개 합성 문서만 사용했다. NAS·비공개 콘텐츠 Git·인증 키는 사용하지 않았다.

## 재현 방법

루트에서 필요한 공용 패키지를 빌드하고 설치된 Next의 실제 내부 메서드를 검사한다.

```sh
pnpm --filter @web-tech/docs-content-contract build
pnpm --filter @web-tech/ui build
pnpm --filter docs typecheck:node-test
pnpm --filter docs exec node --test lib/next-dev-manifest.test.ts
pnpm --filter docs test:lib
```

`next-dev-manifest.test.ts`는 임시 합성 파일에만 쓰기 gate를 걸고 실제
`DevServer.getStaticPaths`와 `loadManifest(path, false)`를 호출한다. 원본 구현을
복제하거나 운영 파일을 조작하지 않는다. 테스트 종료 시 gate·mock·임시 파일을 정리한다.

합성 콘텐츠를 준비한 격리 사본의 루트에서 실행한 화면 검사:

```sh
DOCS_CONTENT_SOURCE=legacy DOCS_E2E_PORT=3187 \
  pnpm --filter docs test:e2e uiux-compact-cards.spec.ts \
  --project=chromium-tablet --repeat-each=10 --workers=2 --retries=0 \
  --trace=retain-on-failure

DOCS_CONTENT_SOURCE=legacy DOCS_E2E_PORT=3187 \
  pnpm --filter docs test:e2e --project=chromium-tablet --workers=2 --retries=0
```

전용 포트가 비었는지 먼저 확인한다. 다른 서버를 재사용하거나 종료하지 않는다.
첫 수정 후 반복은 이전의 자체 생성 `.next`를 다른 이름으로 보존하고 새로 컴파일했다.
위 명령만으로 실제 원문을 합성 문서로 바꾸지는 않는다. 합성 사본 준비 절차는
[비공개 Git 전환 검증](../../runbooks/docs-private-git-content.md)을 따른다.

## 결과와 증거

### 최초 CI와 이번 재현의 경계

최초 CI는 `uiux-compact-cards.spec.ts`의 한국어/light 조건에서
`expectUiUxHubReady`가 ready main 1개 대신 0개를 관측해 실패했다. 직전에 서버와
브라우저에 `Unexpected end of JSON input`, 서버 오류의 page에 `/ko/ui-ux`가 남았다.
같은 조건은 재시도 1회 후 통과했다. 단, 요청 ID와 최초 실패 trace가 없어 당시
어떤 JSON 파일을 읽었는지까지 확정할 수 없다.

설치된 Next 16.4.6에는 비동기 read → JSON 수정 → 비동기 write가 남아 있었다.
`[locale]/layout.tsx`의 `generateStaticParams`를 사용하는 첫 병렬 요청은 이 공유
prerender manifest 경로를 사용한다. 쓰기가 파일을 먼저 비운 뒤 내용을 채우는 동안
다른 개발 요청이 uncached read를 하면 JSON 파싱이 실패할 수 있다. 두 writer가 같은
이전 내용을 읽으면 경로 갱신이 사라지거나 파일 내용이 겹칠 위험도 있다.

이는 [Next 공식 수정 #100521](https://github.com/vercel/next.js/pull/100521)의
설명과 일치한다. **확인된 위험 경로**와 **과거 CI의 정확한 원인 확정**은 구분한다.

### 통제 회귀와 실제 화면 검사

| 검사                                 | 수정 전                  | 수정 후             | 판정 범위                                   |
| ------------------------------------ | ------------------------ | ------------------- | ------------------------------------------- |
| 실제 Next 메서드·reader 동작 5개     | 3통과·2실패              | 5통과               | truncate 구간 읽기와 병렬 갱신 위험 방어    |
| CJS/ESM 갱신·초기화 parity 2개       | 수정 후 추가             | 2통과               | 배포본 양쪽 경로의 동기 처리 확인           |
| 태블릿 카드 10회 반복                | 38통과·2실패·10기존 skip | 40통과·10기존 skip  | ko/en × light/dark의 실제 이동              |
| 태블릿 전체, 수정 전 진단 실행       | 175통과·25기존 skip      | 해당 없음           | 앞선 컴파일 산출물 재사용, JSON 오류 미관측 |
| 태블릿 전체, 수정 후                 | 해당 없음                | 175통과·25기존 skip | 기존 200개 배치·판정 유지, 재시도 0회       |
| 모바일·데스크톱 UI/UX 카드·준비 회귀 | 미실행                   | 19통과·1기존 skip   | 두 폭·ko/en·light/dark·합성 준비 부정 조건  |
| docs 라이브러리 전체, 최종           | 미실행                   | 392통과             | 신규 7개 포함, 타입 검사도 통과             |
| frozen 설치·변경 테스트 lint         | 미실행                   | 통과                | 패치 hash 연결·동일 lockfile·경고 0개       |

수정 전 반복에서 이번에 생긴 2건은 ready main 0개가 아니라, 카드 클릭 뒤 URL의
5초 기대 조건에서 실패했다. 로컬 trace에서는 상세 경로 요청이 시작됐지만 관측
종료까지 완료되지 않았다. 이 2건을 과거 CI의 JSON 오류 재현이나 패치 효과의
독립적 증명으로 세지 않는다. 변경 전후 시간·컴파일 상태·동시 부하가 달라 성능
향상 수치로도 사용하지 않는다.

회귀는 손상 JSON과 쓰기 실패를 계속 거절하고 paths cache에 성공을 남기지 않는지,
동일 bytes를 불필요하게 다시 쓰지 않는지도 검사한다. 기존 UI 준비 조건을 추가
sleep·timeout 연장·retry 증가·worker 축소·skip으로 대체하지 않았다.

원시 로그·trace·스크린샷·실제 응답은 Git 밖 비공개 임시 디렉터리에만 보존한다.
이 보고서는 정제 결과이며 원시 artifact를 공개 저장소에 연결하지 않는다.

## 한계와 후속 작업

### 2026-11-27 공개 검수·재검증

이번 패치·회귀·정제 문서만 공개 검수·커밋·푸시·PR 대상으로 승인받았다.
처음 조사한 `136ef3c4`와 최신 main `5dc0e252`의 차이는 보안·IME 관련 별도 변경이며,
이번 PR의 기능으로 포함하지 않는다. 겹치는 lockfile과 목차 항목은 보존 통합하고
최종 검수 해시를 다시 기록한다. 기존 카드 E2E·준비 helper·Playwright 설정의
판정·worker·timeout·retry 변경은 없다. 원격 결과는 새 head 기준으로 별도 기록한다.

PR [#114](https://github.com/IMHOJEONG/web-tech/pull/114)의 최초 head `904611ab`에서
lint·타입·단위·CodeQL·Preview 빌드는 통과했지만 이미지 검사는
`ERR_PNPM_PATCH_NOT_FOUND`로 실패했다. 원인은 두 백엔드 Dockerfile이 루트
pnpm 설정만 복사하고 등록된 `patches/`는 설치 단계에 복사하지 않는 구성이다.
이는 과거 JSON 오류와 별개의 새 패치 통합 누락이다. 사용자 추가 승인 후 두
Dockerfile에 설치 전 패치 복사를 넣고 기존 설치 회귀에 누락·잘못된 순서의
부정 조건을 추가했다. 이미지 tag·Node base·실제 NAS·배포 설정은 변경하지 않는다.
이후 head의 실제 이미지 검사 결과는 최초 실패와 분리해 확인한다.

설치·Node 보안 정책 회귀 23개와 `pnpm typecheck:toolchain`은 통과했다.
CodeRabbit의 최초 리뷰도 동일한 Docker 입력 누락 1건을 지적했다. 제안은 실제
실패 로그와 대조했으며 별도 CLI 설치나 유료 리뷰·검사 우회는 하지 않았다.
실제 이미지 CI는 docs-backend 대상이고, vuln-radar-backend는 소스 입력·순서와
기존 보안 정책의 회귀를 검사한 범위다. 후자의 실제 이미지 빌드는 미실행이다.

### 미확정 범위와 적용 한계

- 승인된 backport는 Next의 개발 서버 CJS/ESM 갱신과 초기 manifest 쓰기에만 적용했다. `next start`·운영 콘텐츠 계약은 변경하지 않는다.
- 동기 read-modify-write는 한 개발 서버 프로세스의 요청 사이에서 await 경계를 없앤다. 여러 프로세스가 같은 `.next`를 공유하는 경우의 파일 잠금이나 정전·디스크 장애에 대한 원자적 쓰기를 보장하지 않는다.
- 초기 CI의 JSON 입력·상관 ID가 없어 과거 원인을 확정하지 않는다. 후속 CI에서 동일 오류가 다시 나면 파일 식별과 요청 연계를 먼저 추가 조사한다.
- `pnpm install --frozen-lockfile --ignore-scripts`와 이후 392개 회귀·타입·변경 파일 lint를 통과했다. offline 설치는 로컬 캐시 누락으로 실패했으며 온라인 frozen 재설치로 복구했다. 이 중간 설치 중 발생한 lint의 모듈 누락도 완결된 설치 후 재검사해 통과했다. 버전과 lockfile을 바꾸어 해결한 것이 아니다.
- 원격 CI·태블릿 실기기·Production은 미검증이다. E2E는 격리 실행본에 적용한 같은 동작 변경이며 최종 등록본의 새 원격 설치·실행은 후속이다.
- upstream 수정이 포함된 안정 버전을 확인하면 패치·등록·lockfile을 함께 정리하고 같은 회귀를 실행한다. 버전 문자열만 보고 패치를 제거하지 않는다.

## 관련 문서

- [기존 UI/UX 스트리밍 준비 상태](2026-11-22-uiux-stream-readiness.md)
- [테스트 작성·실패 조사 가이드](../../runbooks/test-authoring-ide-guide.md)
- [이번 작업 기록](../../worklog/2026-11/2026-11-24-tablet-uiux-manifest-race.md)
- [Confluence 개념·판단 기준](https://web-tech-service.atlassian.net/wiki/pages/21692418)
- [공식 문제 보고 #96259](https://github.com/vercel/next.js/issues/96259)
- [공식 수정 diff](https://github.com/vercel/next.js/pull/100521/files)
