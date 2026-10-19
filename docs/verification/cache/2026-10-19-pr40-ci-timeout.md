# PR #40 테스트 시간 초과 조사

## 대상과 조건

- 검증일: 2026-10-19 KST. 아래 Actions 시각은 UTC 원본이다.
- 대상 HEAD: `d05eae0537ae4d4bc9eaa9e275144acebef7d829`, `feature/docs`, PR #40.
- [push CI](https://github.com/IMHOJEONG/web-tech/actions/runs/39207655801/job/117913889862)와 [PR CI](https://github.com/IMHOJEONG/web-tech/actions/runs/39207658423/job/117913897927)의 Test job 로그·단계 시각·종료 주석을 비교했다.
- PR checkout은 HEAD 자체가 아니라 가상 병합 커밋 `95839e60d5707a3817ff37cec6af0e78d5a08529`였다. GitHub compare의 파일 목록은 비어 있어 이번 두 실행의 파일 내용 차이는 없었다. 일반적으로 같은 PR HEAD가 같은 checkout을 의미하지는 않는다.
- 두 runner의 Ubuntu 이미지는 `ubuntu-24.04 / 20261012.334.1`로 같았지만 실행 인스턴스와 리전은 달랐다(push `westus3`, PR `westcentralus`). 리전 차이를 지연 원인으로 단정하지 않는다.
- 로컬은 macOS, Node.js 24.12.0, pnpm 11.10.0이다. GitHub의 Linux runner 성능과 동일하다고 가정하지 않는다.

## 재현 방법

저장소 루트에서 기존 실행의 증거를 조회한다.

```sh
gh api repos/IMHOJEONG/web-tech/actions/jobs/117913897927
gh api repos/IMHOJEONG/web-tech/actions/jobs/117913889862
gh api repos/IMHOJEONG/web-tech/check-runs/117913897927/annotations
gh run view 39207658423 --repo IMHOJEONG/web-tech --job 117913897927 --log
gh run view 39207655801 --repo IMHOJEONG/web-tech --job 117913889862 --log
gh api repos/IMHOJEONG/web-tech/compare/d05eae0537ae4d4bc9eaa9e275144acebef7d829...95839e60d5707a3817ff37cec6af0e78d5a08529
```

수정 후 검사 명령은 다음과 같다. `DOCS_E2E_PORT`는 검증 서버용 빈 포트를 사용한다. 전체 회귀에는 임의의 기존 개발 서버 대신 env를 통제한 독립 checkout을 사용한다.

```sh
pnpm test:repo
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.12 -shellcheck= .github/workflows/ci.yml
DOCS_E2E_PORT=3013 CI=1 pnpm --filter docs exec playwright test --project=chromium-mobile --retries=0 --workers=2
DOCS_E2E_PORT=3013 CI=1 pnpm --filter docs exec playwright test --project=chromium-tablet --retries=0 --workers=2
DOCS_E2E_PORT=3013 CI=1 pnpm --filter docs exec playwright test --project=chromium-desktop --retries=0 --workers=2
CI=1 pnpm --filter docs test:article:prod
CI=1 pnpm test:crp-lab:browser
```

## 결과와 증거

### 원격 원인

| 단계                 | push                          | PR                                |
| -------------------- | ----------------------------- | --------------------------------- |
| Test job 시작        | 06:02:38                      | 06:02:40                          |
| 반응형 검사 시작     | 06:04:17                      | 06:04:33                          |
| 반응형 검사 종료     | 06:12:48, 8분 31초            | 06:15:26, 10분 53초               |
| 반응형 결과          | 358 passed / 50 skipped       | 356 passed / 2 flaky / 50 skipped |
| production 본문 검사 | 06:12:48~06:15:02, 148 passed | 06:15:26~06:17:53, 실행 도중 취소 |

- 종료 주석: `The job has exceeded the maximum execution time of 15m0s`. 이 제한은 Vercel 요청 제한이나 Playwright 개별 테스트 30초 제한이 아니라, 워크플로의 **job 전체** `timeout-minutes: 15`이다. 준비·설치·앞선 검사도 같은 예산을 사용했다.
- 본문 검사가 약 2분 27초 진행되는 동안 118번까지 통과 로그가 이어졌다. 한 본문 테스트가 15분 멈췄다는 증거는 없다. 시작할 때 남은 job 예산이 부족했다.
- PR에서 재시도한 두 검사는 모바일·태블릿의 `dark /docs/web/javascript-event-loop-runtime` 스켈레톤 검사다. `Expected: true / Received: false`는 테마 스크립트 실행 전 `html.classList`를 한 번만 읽은 assertion이었다. 재시도는 통과했다.
- PR의 지연 전체를 두 재시도 때문이라고 단정하지 않는다. 로그상 다른 묶음도 전반적으로 오래 걸렸다. 예를 들어 개별 테스트 시간의 합은 검색 전환 79→96초, 본문 바로가기 75→96초, 스켈레톤 138→178초였다. 이 합은 2-worker wall time과 다르며, CPU·I/O 계측이 없어 runner 수준 원인은 미확정이다.

### 수정과 로컬 검증

- 단위·계약 검사를 별도 job으로, 반응형 검사를 기존 3개 Playwright project별 matrix로, production 본문·CRP 브라우저 검사를 각각 독립 runner로 분리했다. production 본문의 공유 fixture와 1-worker 순서는 유지했다.
- 각 실행 job의 15분 제한은 유지한다. 최종 `Test`는 `always()`와 `needs`로 모든 하위 검사 성공을 요구하며 실패·취소·skipped를 성공으로 취급하지 않는다. 기존 필수 check 이름 `Test`를 보존한다.
- 테마 class 검사는 고정 sleep이나 timeout 상향 대신 Playwright의 재시도형 locator assertion으로 바꿨다. 실제 다크모드 적용 실패는 여전히 실패한다.
- 공식 actionlint v1.7.12: 통과. shellcheck는 설치되지 않아 해당 외부 검사는 제외했다.
- 저장소 회귀: 45개 통과. 기기별 검사·명령 누락 방지와 최종 게이트의 성공/실패/취소/skipped 16조합을 포함한다.
- 실패했던 다크모드 본문 검사: 3개 기기 × 10회, 재시도 0으로 30개 통과(29.2초).
- 수정한 스켈레톤 테스트 ESLint 및 docs TypeScript 검사: 통과.
- 독립 환경의 production 빌드·본문 전체 검사: 148개 통과(1.8분). 공유 fixture·단일 worker와 기존 스트림 경고는 유지했으며, 로그 경고를 전부 해결했다고 판단하지 않는다.
- 독립 CRP 브라우저 검사: 3개 통과(2.2초).
- 독립 모바일 반응형 검사: 126 passed / 기존 조건부 10 skipped(2.1분), 재시도·실패 0.
- 독립 태블릿 반응형 검사: 112 passed / 기존 조건부 24 skipped(1.8분), 재시도·실패 0.
- 생성 캐시를 비운 독립 데스크톱 반응형 검사: 120 passed / 기존 조건부 16 skipped(2.2분), 재시도·실패 0.
- 반응형 합계: **358 passed / 기존 조건부 50 skipped / 실패·재시도 0**, 기존 408개 선택 범위를 유지했다. 로컬 실행 시간은 각 Playwright 실행의 표시값이며 CI wall time 개선을 보증하는 수치가 아니다.

### 중간 검증 실패 보존

- 기존 3011 개발 서버를 재사용한 전체 회귀는 카드·헤더 검사 실패 후 중단했다. 44 passed / 18 failed / 2 interrupted / 7 skipped / 337 미실행이었다. 해당 서버 화면에는 `Could not find the Next.js package` 개발 오류 오버레이가 있었으며, 통제된 CI 환경과 동일한 검증으로 인정하지 않는다.
- 첫 임시 production 시도에서 `node_modules`를 원본과 심볼릭 링크로 공유했다. pnpm의 자동 설치가 공유 importer의 일부 링크를 임시 경로로 바꿨고, Turbopack도 외부 링크를 거부하여 테스트 시작 전에 실패했다. 이는 이번 로컬 검증 준비의 부작용이다. 공유 링크를 제거하고 임시 checkout에 의존성을 독립 설치했다. 원본도 동일 lockfile로 offline 재설치하여 내부 경로 연결을 복구했다. 원본 3011 서버를 종료하지 않은 상태에서 `/ko/about` HTTP 200, main 1개, Build Error dialog 0개를 확인했다. 소스·lockfile·Next 빌드 설정은 변경하지 않았다.
- 임시 환경을 재사용한 첫 데스크톱 검사는 초기 화면부터 404가 반환되어 중단했다(16 failed / 2 interrupted / 118 미실행). 생성된 `.next` 캐시를 별도로 보존하고, 원격 matrix처럼 캐시 없는 상태에서 다시 실행해 위의 데스크톱 결과를 얻었다. 404의 상세 원인을 캐시 하나로 확정하지 않으며, 이 중간 실패를 원격 PR 시간 초과의 증거로 혼합하지 않는다.

## 한계와 후속 작업

- 코드 수정은 `8e210a0`(테마 대기)와 `3a54288`(CI 분리·게이트)로 나눠 커밋했다. 사용자 후속 승인으로 이 보고서를 별도 커밋하고 함께 푸시하여 PR #40의 새 HEAD를 재검증한다. 이 문서 작성 시점에는 수정 후 원격 CI가 아직 미검증이며 기존 SHA의 성공으로 대체하지 않는다.
- 두 실행만으로 PR 이벤트가 push보다 항상 느리다고 일반화하지 않는다. 독립 job으로 누적 예산 결합을 제거하는 것이 이번 조치다.
- matrix는 runner·설치 비용을 늘리지만 한 브라우저 묶음의 지연이 다른 묶음의 실행 시간을 소진하지 않게 한다. 단순 제한 시간 상향이나 테스트 삭제는 하지 않았다.
- 스트림 조기 종료 경고는 별도 [요청 종료 조사](2026-10-18-stream-termination-investigation.md) 범위이며 이번 시간 초과의 원인으로 확인되지 않았다.

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-19-pr40-ci-timeout.md)
