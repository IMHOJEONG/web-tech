# 오프라인 입력 byte 계약과 ADR 후속 관계 검증

## 대상과 조건

- 검증일: 2026-10-27 KST.
- 기준: main `e8ab3bd6bc6c0f6ee890b05fa244cf9d040dc16e` 기반 `codex/docs-adr-contract-20261027`의 로컬 미커밋 변경.
- Node.js 24.12.0·pnpm 12.14.0·Next.js 16.4.3, Playwright Chromium 데스크톱 1280×800·모바일 390×844.
- 기존 감사의 F1 수정과 테스트를 먼저 완료한 후 F2의 부분 대체 관계를 정리했다. [KAN-39](https://web-tech-service.atlassian.net/browse/KAN-39)에서 후속 승인을 구분한다.
- 기존 저장소의 미커밋 감사 문서는 그대로 보존했다. 별도 작업 공간에는 개인 환경 파일을 복사하지 않았고 기존 lockfile·오프라인 캐시로만 설치했다. 승인 대기 skill이나 설치 스크립트를 새로 활성화하지 않았다.

## 재현 방법

수정 작업 공간 루트에서 실행한다. 개발 브라우저와 Production 빌드/브라우저는 같은 `.next`와 포트3018을 사용하므로 순서대로 실행한다. 실제 NAS·토큰·로그인 프로필은 필요하지 않다.

```sh
mise exec -- node --test apps/docs/lib/offline-input-budget.test.ts scripts/adr-workflow.test.mts
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs exec tsc --noEmit
mise exec -- pnpm --filter docs exec eslint feature/offline/model/offline-input-budget.ts feature/offline/model/offline-snapshot.ts lib/offline-input-budget.test.ts offline-e2e/snapshot-budget.spec.ts --max-warnings 0
mise exec -- pnpm --filter docs test:offline
mise exec -- pnpm test:repo
env BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false BLOG_CONTENT_API_BASE_URL= BLOG_CONTENT_API_BASE_URL_PUBLIC= BLOG_CONTENT_API_BASE_URL_INTERNAL= BLOG_PUSH_ENABLED=false DOCS_ENABLE_REACT_INSPECTION=false DOCS_BETTER_STACK_SOURCE_TOKEN= DOCS_BETTER_STACK_INGESTING_URL= mise exec -- pnpm --filter docs build
NODE_ENV=production mise exec -- pnpm --filter docs exec playwright test --config=playwright.offline.config.ts snapshot-budget.spec.ts --reporter=list
```

수정 전에는 새 브라우저 spec을 추가한 뒤 `snapshot-budget.spec.ts --project=offline-desktop --grep 한글 --reporter=list`만 실행했다. 한도 초과 거절을 기대했으나 실제 성공 문구가 나와 실패했다. assertion이나 상한을 완화하지 않고 입력 검사만 수정했다.

## 결과와 증거

| 검사                     | 결과                                                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 수정 전 실패 재현        | 한글 raw HTML 1,048,577바이트가 저장 성공으로 처리됨. 신규 브라우저 테스트 1개 실패                                          |
| 입력 단위 회귀           | 12개 통과. ASCII·한글·이모지 각각 1MiB-1/정확히1MiB/+1, 기존 1,200,007바이트 한글 표본, markup/attribute·고립 surrogate 검사 |
| 전체 docs 로직           | 319개 통과, 새 12개 포함. 테스트용 TS 검사 포함                                                                              |
| 변경 파일 lint·앱 타입   | 통과                                                                                                                         |
| 개발 브라우저 전체       | 50개 통과, 재시도0. 기존 저장/삭제/오프라인 탐색·이미지 실패·스트림 계측과 신규 byte 경계 6개 포함                           |
| Production 빌드          | 통과, 로컬 콘텐츠만 사용. 기존 공개 TCP 글의 placeholder 경고1개는 유지                                                      |
| Production 경계 브라우저 | 6개 통과, 재시도0. 3종 문자 × 두 화면, 각 테스트가 한도 직전·정확한 한도·초과와 저장본 보존을 검사                           |
| ADR·지침 연결 회귀       | 3개 통과. 부분 대체 양방향·유지 범위·목차, AGENTS/CLAUDE 참조와 PR 입력란 확인                                               |
| 저장소 회귀              | 재실행 156개 모두 통과, 새 ADR 회귀3개 포함                                                                                  |
| 과거 결정 보존           | 두 ADR의 배경·결정·대안 본문을 HEAD와 추출 비교해 동일함을 확인                                                              |

### 입력 계약 수정

`OFFLINE_INPUT_MAX_BYTES`와 순수 검사를 `feature/offline/model/offline-input-budget.ts`로 분리해 실제 DOM 스냅샷 생성 경로에 연결했다. `innerHTML.length`가 이미 한도를 넘으면 먼저 거절하고, 나머지는 `TextEncoder`로 UTF-8 바이트를 확인한다. UTF-8은 UTF-16 코드 단위 수보다 작지 않으므로 첫 검사는 명백한 초과의 추가 인코딩 할당만 피한다. 문자열 길이를 byte 계약의 최종 기준으로 쓰지 않는다.

기준은 Markdown 원문 길이나 눈에 보이는 텍스트가 아니라 **변환 전 본문 DOM의 직렬화 HTML**이다. 한도 초과 시 변환·메시지 전송 전에 기존 `size` 오류를 사용한다. 최종 Worker 스냅샷 2MiB, 이미지·글 개수 제한, 성공·실패 UI는 바꾸지 않았다. 초과 업데이트 후 CacheStorage의 기존 응답 SHA-256이 그대로인지 실제 브라우저에서 확인했다.

### 부분 대체와 항상 검토하는 절차

ADR-0009는 적용 중을 유지한다. 상태/범위에 ADR-0015가 Worker의 fetch·오프라인 캐시 책임만 대체했음을 쓰고 후속 링크를 추가했다. ADR-0015에는 역링크·대체/유지 범위·이번 계약 구현 검증을 연결했다. 당시 결정일과 본문은 보존하며 연결 보완일을 과거 결정일로 바꾸지 않았다.

루트 `AGENTS.md`와 [관리 규칙](../../process/adr-management.md)에 착수→구현→PR/마감→병합/배포의 검토 지점을 명시했다. `CLAUDE.md`의 `@AGENTS.md` 참조는 그대로다. PR에는 검토한 ADR과 `기존 결정 유지 / 새 결정 / 전체·부분 대체 / 해당 없음`, 근거·남은 검증을 적는다. 단순 버그 수정에 새 ADR을 강제하지 않는다.

추가한 `scripts/adr-workflow.test.mts`는 기존 `test:repo` 및 CI가 이미 수집하는 `*.test.mts`에 포함된다. 이는 지침 연결과 이번 관계의 회귀 검사이지, 모든 PR 본문의 작성 여부를 강제하거나 설계 선택을 자동 승인하는 서비스가 아니다.

### 검사 환경의 초기 실패

첫 저장소 회귀는 154개 통과·2개 실패였다. 기존 두 body-parser 보안 테스트의 localhost `listen`이 sandbox EPERM으로 거부됐다. 코드나 검사를 바꾸지 않고 실행 권한을 받은 뒤 동일 명령을 재실행해 156개 모두 통과했다. 이를 제품 결함 수정이나 테스트 제거로 처리하지 않았다.

요약과 검증한 소스 SHA-256은 [증거 집계](../artifacts/2026-10-27-offline-byte-contract-and-adr-followup.json)에 남겼다. 원시 Playwright trace·보고서는 로컬의 ignored 결과 디렉터리에만 두며 실제 토큰·쿠키·비공개 초안을 사용하지 않았다.

## 한계와 후속 작업

- 로컬 미커밋 검증이다. 원격 CI·PR·main 반영·Vercel/NAS 배포는 실행하지 않았다. Safari/Firefox·실기기 검증도 아니다.
- ADR-0015의 기존 1MiB 계약을 구현한 것이며 새 저장 모델을 결정한 작업이 아니다. 별도 ADR은 추가하지 않았다.
- 초기 바이트 검사도 이미 생성된 DOM/HTML 문자열의 비용을 없애거나 메모리 OOM 방지를 보장하지 않는다. Worker 최종 제한을 대체하지 않는다.
- 지침이 다른 작업의 기본값이 되려면 승인 후 main에 반영하고 다음 작업을 최신 main에서 시작해야 한다. 아직 모든 브랜치에 자동 적용됐다고 표시하지 않는다.
- 감사 F3 채택 상태, F4 다른 ADR의 병합/배포 근거, F5 범용 ADR 정적 검사는 이번 변경으로 완료하지 않았다. PR 작성자와 리뷰어의 의미 대조는 계속 필요하다.

## 관련 문서

- [ADR-0009](../../architecture/adr-0009-docs-web-push-experiment.md)
- [ADR-0015](../../architecture/adr-0015-explicit-offline-article-snapshots.md)
- [작업 기록](../../worklog/2026-10/2026-10-27-offline-byte-contract-and-adr-followup.md)
- [기존 오프라인 실행 절차](../../runbooks/docs-offline-reading.md)
