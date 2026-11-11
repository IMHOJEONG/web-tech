# main CI의 apt DNS 실패와 브라우저 런타임 격리 검증

## 대상과 조건

- 조사: 2026-11-11~12 KST. 기준 main `3408b1950d340d814bf671412d1519f2b753a761`, PR #89 병합 후 CI.
- 성공 대조: [PR CI 43031357715](https://github.com/IMHOJEONG/web-tech/actions/runs/43031357715), head `f2db82df8e133eed123bc51ae353af539866d863`.
- 실패 대조: [main CI 43032686880](https://github.com/IMHOJEONG/web-tech/actions/runs/43032686880)의 attempt 1·2. 이전 운영 검증과 다른 SHA의 성공으로 대체하지 않는다.
- 로컬: mise Node 24.22.1·pnpm 12.14.0, Docker Desktop linux/arm64. 원격 GitHub Linux amd64는 [PR #90](https://github.com/IMHOJEONG/web-tech/pull/90)의 정확한 head별 결과로 구분한다. ZIP 검사에는 고정 이미지의 Python 3 표준 라이브러리를 사용한다.
- 운영 DB·수집·토큰·DNS·Railway 배포는 변경하지 않는다. 공개 자료는 아래 정제 요약이며 원시 로그·실제 응답·캡처는 첨부하지 않는다.

## 재현 방법

저장소 루트에서 인증된 GitHub CLI로 job별 실패 단계와 기준 SHA를 조회한다. 로그 대조는 각 실행의 `Set up job`에 기록된 OS·이미지 버전과 `Install Playwright Chromium` 단계의 오류를 확인했다.

```sh
gh run view 43031357715 --repo IMHOJEONG/web-tech --json headSha,conclusion,jobs
gh run view 43032686880 --repo IMHOJEONG/web-tech --attempt 2 --json headSha,conclusion,jobs
mise exec -- node --test scripts/browser-ci.test.mts
mise exec -- node --test scripts/trace-zip-integrity.test.mts
mise exec -- pnpm test:repo
mise exec -- pnpm typecheck:toolchain
mise exec -- node scripts/check-browser-runtime.mts
mise exec -- pnpm --filter docs verify:offline-evidence
```

네트워크가 차단된 Linux에서도 내장 브라우저와 OS 라이브러리만으로 실행되는지 검사했다. 같은 Docker 인수의 마지막 명령을 `node --test scripts/trace-zip-integrity.test.mts`로 바꿔 ZIP 검증 6개도 실행했다. 아래 `ROOT`는 실행한 checkout이며 호스트 의존성이 준비된 로컬 smoke다. macOS node_modules로 전체 Linux 앱 테스트를 했다는 뜻은 아니다.

```sh
ROOT="$PWD"
IMAGE=mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e
docker buildx imagetools inspect "$IMAGE" --format '{{json .Manifest}}'
docker run --rm --platform linux/arm64 --network none --read-only \
  --tmpfs /tmp --init --ipc=host \
  --mount "type=bind,src=$ROOT,dst=/work,readonly" --workdir /work \
  "$IMAGE" node scripts/check-browser-runtime.mts
```

같은 Docker 인수에 `-e PLAYWRIGHT_BROWSERS_PATH=/missing-ci-browser`를 이미지 앞에 추가한 음성 대조도 실행했다. 별도 Node 부모 프로세스에서 종료 코드가 정확히 1이고 missing executable·사전 검사 실패 문구가 있는지 assertion으로 확인했다. 실패를 허용하는 설치 단계나 `continue-on-error`를 CI에 넣지 않았다.

## 결과와 증거

### 최초 로컬 검증: PR 실행 전

| 항목                | 관측 결과                                                                                                             | 판단                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 이미지 대조         | 성공 PR·실패 main의 브라우저 job 8개 모두 ubuntu-26.04, image 20261101.186.1                                          | OS 전환이 직접 원인이라는 근거 없음                                                                        |
| main attempt 2      | 각 브라우저 job의 Ubuntu apt DNS 오류 52줄·설치 exit 100                                                              | 테스트 assertion 전 준비 단계 실패. 8개 실패와 집계 실패 보존                                              |
| 도메인 차이         | packages.microsoft.com InRelease 응답 존재, azure.archive.ubuntu.com·archive.ubuntu.com·security.ubuntu.com 해석 실패 | 일부 패키지 도메인의 DNS 실패는 확인. 전체 인터넷 단절·Playwright 바이너리 오류를 뜻하지 않음              |
| 공식 이미지         | OCI index `dcc5531e…7580e`, linux/amd64·arm64 manifest 확인                                                           | 태그만 아니라 digest 고정. 도구·lockfile 버전 변경 없음                                                    |
| 신규 합성 회귀      | 6개 통과                                                                                                              | 버전·digest·준비 순서, 실제 렌더링 계약, 실행/렌더/정리 실패 및 선행 오류 보존                             |
| 저장소 회귀         | 245개 통과, 실패·skip 0                                                                                               | 최초 sandbox 실행은 포트 권한 EPERM으로 기존 2개 실패. 권한 승인 후 재실행했으며 검사 조건은 변경하지 않음 |
| 타입                | typecheck:toolchain 통과                                                                                              | 새 사전 검사·회귀도 기존 noEmit·erasableSyntaxOnly 범위에 포함                                             |
| macOS 실제 Chromium | Playwright 1.62.1·Chromium 151.0.7922.34, 렌더링 통과                                                                 | 로컬 실제 브라우저 검증                                                                                    |
| Linux network none  | 같은 버전의 실제 Chromium 렌더링 성공                                                                                 | apt·외부 DNS 없이 실행 가능한 준비 상태 입증. 전체 suite 실행 증거와 구분                                  |
| Linux 브라우저 누락 | 사전 검사 exit 1                                                                                                      | 네트워크 fallback 없이 누락을 실패로 처리                                                                  |
| 변경본 원격 CI      | 미검증                                                                                                                | 별도 PR 생성 후 같은 head의 결과로 갱신                                                                    |

### PR #90 최초 원격 실행과 ZIP 검사 보완

2026-11-12 KST, head `8e4e2c394a8bda97834a441da1364bdefc6c2650`의 [CI 43045882622](https://github.com/IMHOJEONG/web-tech/actions/runs/43045882622)에서 브라우저 사전 검사와 제품 suite 8개가 모두 성공했다. apt 설치 단계는 없었다. 그러나 오프라인 증거 단계가 `spawnSync unzip ENOENT`로 실패해 CI 전체는 failure였다. 이는 최초 DNS 오류가 아니라 공식 이미지에 `unzip`이 없는 호환성 문제다. 검사·집계를 끄지 않았기 때문에 실패가 그대로 드러났다.

이미지에 존재하는 Python 3 표준 라이브러리의 `zipfile.testzip()`으로 모든 멤버·CRC를 검사하도록 TypeScript 실행기를 보완했다. 정상·CRC 변조·잘린 ZIP·비 ZIP·빈 ZIP·파일 및 Python 누락 거부를 검사하는 6개 회귀가 로컬과 network-none Linux에서 모두 통과했다. 기존 JSON·HTML·trace·navigation 검사를 그대로 둔 실제 `verify:offline-evidence`도 통과했다. 보완 후 `test:repo`는 251개 통과·skip 0이며 타입·변경 스크립트 ESLint도 통과했다. 단순 파일 존재 확인이나 ZIP 헤더 확인으로 약화하지 않았다.

Python은 고정 이미지에 포함된 도구이며 새 패키지·apt 설치·Playwright 내부 ZIP API에 의존하지 않는다. [Python 공식 검사 계약](https://docs.python.org/3/library/zipfile.html#zipfile.ZipFile.testzip)을 따르며, 격리 모드 `-I`·30초 제한·인수 배열 실행·비추출을 사용한다. 후속 head의 원격 결과는 다음 검증 단계다.

## 한계와 후속 작업

실패 실행에 resolver 설정·질의 패킷·당시 upstream 장애 기록이 없어 왜 DNS가 실패했는지의 더 깊은 원인은 확정하지 못했다. 외부 서버나 GitHub 전체 장애로 단정하지 않는다. [GitHub의 Ubuntu 전환 공지](https://github.com/actions/runner-images/issues/14748)는 배경 정보이지 이번 DNS 원인의 증거가 아니다.

이 변경은 apt 서버를 복구하는 조치가 아니라 브라우저 테스트 준비의 apt 의존 경로를 제거한다. 이미지 pull·npm·Node 설치 등 다른 외부 경로는 남고 실패하면 CI도 실패한다. 호스트 OS만 고정하는 대안과 차이, 이미지 갱신 책임은 ADR에 기록했다. 기존 테스트·8개 suite·필수 성공 집계는 유지한다.

로컬 arm64 smoke로 GitHub amd64나 main 성공을 선언하지 않는다. 사용자 승인에 따라 전용 브랜치 커밋·푸시·main 대상 PR과 자동 Preview만 허용하며 병합·운영 배포는 하지 않는다. 기존 실패 run은 그대로 보존한다.

## 관련 문서

- [ADR-0030](../../architecture/adr-0030-browser-ci-runtime-image.md)
- [작업 기록](../../worklog/2026-11/2026-11-11-ci-browser-runtime.md)
- [이전 운영·배포 검증](../../worklog/2026-11/2026-11-10-vuln-radar-feed-search.md)
- [KAN-67](https://web-tech-service.atlassian.net/browse/KAN-67)
