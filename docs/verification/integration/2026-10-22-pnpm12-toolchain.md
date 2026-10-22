# pnpm12 전환과 설치 서명 검증

## 대상과 조건

2026-10-22 KST, main `9a208e09eed76b32a68f7f3a310a241dabaa2a50` 기반 `codex/pnpm12-toolchain`의 미커밋 작업 트리다. PR #54의 통계·KEV와 분리했다. 로컬 macOS arm64·Node24.12.0, Docker Desktop29.9.2의 linux/amd64·Node24.22.1을 사용했다. 실제 NAS·Railway·운영 DB·실제 토큰은 사용하지 않았다.

공식 npm `latest`와 GitHub Latest release는 12.14.0, `next-12`는 12.15.0이었다. 지원 action v6.1.0 태그의 verified 서명과 commit `ea17c68df8912ef543352723c149a84f56e3d413`를 대조했다. 기존 프로젝트 Node24는 유지한다.

## 재현 방법

[툴체인 절차](../../runbooks/pnpm-toolchain-upgrade.md)의 설치·테스트·Docker 명령을 따른다. 이번 설치 도우미의 실제 로컬 서명 검사는 아래 명령으로 실행했다. 임시 bin 디렉터리는 미리 존재하는 pnpm을 덮어쓰지 않도록 새로 고른다.

```sh
mise exec -- node --experimental-strip-types scripts/install-pnpm.mts "$PWD" "$PWD/scripts/pnpm-bootstrap" /tmp/web-tech-pnpm12-verified-bin
mise exec -- pnpm install --lockfile-only --ignore-scripts
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm typecheck:toolchain
mise exec -- pnpm test:repo
mise exec -- pnpm exec turbo lint --force
mise exec -- pnpm exec turbo typecheck --force
mise exec -- pnpm exec turbo test --force
docker build --platform linux/amd64 -t web-tech-docs-backend:pnpm12-local -f apps/docs-backend/Dockerfile .
docker build --platform linux/amd64 -t web-tech-vuln-radar-backend:pnpm12-local -f apps/vuln-radar-backend/Dockerfile .
```

최종 runtime 이미지는 `--network none`에서 `dist/src/app.module.js`를 require해 의존성 해석을 검사하고 `/opt/pnpm-bootstrap`이 없는지 확인했다. 서버 기동·인증·DB 연동 검사는 아니다.

## 결과와 증거

| 조건              | 실제 결과                                                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 기존 PR #54 실패  | [run39698975685 attempt1](https://github.com/IMHOJEONG/web-tech/actions/runs/39698975685/attempts/1)의 tablet job이 테스트 전 11.7.0→11.10.0 self-update에서 `UNVERIFIABLE (terminated)`로 중단           |
| 원인 분류         | pnpm11.7.0의 원본 구현에서 해당 결과는 `unreachable`. 실제 서명 불일치 결과와 구분. 당시 어느 전송 구간이 끊겼는지는 미확정                                                                               |
| 원본 설정 재실행  | [동일 head32c86f8 attempt2](https://github.com/IMHOJEONG/web-tech/actions/runs/39698975685/attempts/2)에서 tablet·최종 Test 성공. 서명 검증 우회나 코드 변경 없이 1회 재실행                              |
| 기존 release 대조 | 현재 공식 npm pnpm11.10.0의 서명은 유효하고 기존 packageManager SHA512와 일치. 과거 응답 내용까지 복구한 것은 아님                                                                                        |
| pnpm12 lockfile   | 첫 frozen 설치는 PM dependency 누락으로 거부. PM lock 문서158줄 추가 후 frozen 설치 성공. 기존 앱 lock 문서의 바이트·SHA256 `6ebb945ea6ca83b67ee3815e053a541288587b89f6864450dadaeb89260321c2` 그대로     |
| 로컬 도구         | mise의 GitHub artifact attestation·checksum 검사 후12.14.0 설치. pnpm을 Node보다 먼저 선언해 Corepack shim의 PATH 가림 해결. 전역 기본값 미변경                                                           |
| 설치 서명         | macOS bootstrap2개, Docker linux/amd64 bootstrap3개 package의 registry signatures·attestations 검증 후 installer 실행                                                                                     |
| 설치 회귀         | 저장소 도구73개 통과. 신규9개는 실행 순서·서명 실패/통신 중단/SRI 오류의 fail-closed·버전 불일치·native 누락·CI pin·Docker 경로 검사. 실패 조건은 주입된 runner 오류이며 실제 npm 장애를 일으킨 것은 아님 |
| 타입·lint·unit    | installer strict/erasable 타입 검사 통과. Turbo `--force`로 lint7개·typecheck9개·test6개 task 모두 성공, task cache0                                                                                      |
| 컨테이너 빌드     | 두 backend linux/amd64 빌드·legacy production deploy 성공. 두 runtime에서 네트워크 없이 모듈 require 성공·bootstrap 디렉터리 없음                                                                         |

로컬 이미지 ID는 docs-backend `sha256:dfd89343bd81355cd2405066ce638548874f8b8cc450f4dd7fcfa748ba012915`, vuln-radar-backend `sha256:ae08f71b01959c4eb02fe64f75aa3cfa1be40587b0a0f94861b058697538147d`다. 레지스트리로 push하지 않았다.

처음 로컬 typecheck는 기존 사용자 Prisma 캐시의 utime EPERM으로 중단됐다. 캐시 접근 승인을 받아 `--force`로 재실행해 통과했으며 서명 오류로 취급하지 않았다. Docker에서는 다운로드 속도·Git 부재의 prepare·Prisma OpenSSL 감지·legacy deploy 경고가 있었다. 빌드/모듈 검사는 성공했지만 경고가 없었다고 주장하지 않는다. 미승인 dotenv agent skill을 자동 승인하지 않았다.

## 한계와 후속 작업

위 결과는 로컬 작업 트리의 결과다. 새 툴링 PR의 CI·CodeQL·Preview·image workflow 결과는 푸시 후 Jira·Confluence에서 실제 head와 연결한다. 원격 완료를 아직 성공으로 표시하지 않는다. 기존 PR #54의 재실행 성공은 새 pnpm12 CI 성공의 증거가 아니다.

원래 전송 중단의 물리적 원인·다른 네트워크·실제 NAS/Railway 배포·다른 Docker libc/플랫폼은 미검증이다. 기본 builder/runtime 이미지는 기존 Node24 태그를 유지했으며 신규 이미지의 patch 버전이 로컬과 다르다. 통계·KEV·TCP·다른 세션의 변경을 이 브랜치로 옮기지 않았다.

## 관련 문서

- [설치·실패 대응 절차](../../runbooks/pnpm-toolchain-upgrade.md)
- [작업 기록](../../worklog/2026-10/2026-10-22-pnpm12-toolchain.md)
- [KAN-25](https://web-tech-service.atlassian.net/browse/KAN-25)
- [기존 pnpm 서명 오류 분류 소스](https://github.com/pnpm/pnpm/blob/v11.7.0/engine/pm/commands/src/self-updater/verifyPnpmEngineIdentity.ts)
