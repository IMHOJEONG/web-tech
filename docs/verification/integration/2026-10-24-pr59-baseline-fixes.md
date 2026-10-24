# PR #59 기준선 리뷰 보완과 커밋 후 재현 회귀

## 대상과 조건

- 검증일: 2026-10-24 KST, artifact 시간 UTC. Node 24.12.0·pnpm 12.14.0.
- [PR #59](https://github.com/IMHOJEONG/web-tech/pull/59)의 초기 head `096aad7`에서 확인한 [리뷰 점검](2026-10-24-pr59-ci-review.md) 후속이다. 구현 커밋은 `cdfc513`, 선행 점검 문서 커밋은 `821b398`다.
- 비교 기준은 main의 고정 SHA `16c51e9911f041b125a445b3939966986426a0b4`다. CLI·분석·대조 실행은 구현 미커밋 상태에서 실행하고, 실제 커밋 후 변경 탐지는 임시 Git 저장소 회귀로 검증했다. source fingerprint는 CLI artifact에 보존한다.
- 로컬 합성 데이터/loopback과 오프라인 대조 설치만 사용한다. 패키지 manifest·lockfile·기존 보안 경고 버전은 이번 보완에서 변경하지 않는다. Railway 배포·운영 데이터·실제 비밀값은 사용하지 않았다.

## 재현 방법

저장소 루트에서 실행한다. 아래 명령은 명시적인 Git 커밋 객체가 checkout에 있어야 한다. 얕은 clone에 없다면 해당 기준 커밋을 먼저 확보해야 하며, 임의 HEAD로 대체하지 않는다.

```sh
BASE=16c51e9911f041b125a445b3939966986426a0b4
mise exec -- node --experimental-strip-types --test scripts/verification-baseline.test.mts
mise exec -- pnpm test:repo
mise exec -- pnpm exec tsc -p tsconfig.vuln-integration.json
mise exec -- pnpm peers check
mise exec -- node --experimental-strip-types scripts/analyze-vuln-radar-lockfile.mts --base "$BASE"
mise exec -- node --experimental-strip-types scripts/verify-viteplus-consumer-impact.mts --base "$BASE"
mise exec -- node --experimental-strip-types scripts/verify-vuln-radar-viteplus.mts --base "$BASE"
```

3개 CLI는 baseline을 생략하거나 잘못 지정하면 임시 폴더·서버·설치·artifact 생성 전에 실패한다. consumer 도구의 `--probe <directory>`는 내부 자식 프로세스용 단일 소비자 검사 경로이며 baseline 설치 경로가 아니다. `--base HEAD`를 명시하면 의도적인 자기 비교가 가능하므로 원래 실험 재현에는 위 고정 SHA를 사용한다.

기존 검증 보고서의 재현 명령에도 `--base`를 보완했다. 당시 실행은 HEAD가 위 main이던 미커밋 실험이었으며, 기존 결과·artifact는 덮어쓰지 않는다.

## 결과와 증거

### 리뷰 보완

| 리뷰                            | 수정                                                                                            | 검사                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| CLI 검증기의 HEAD 비교          | 공통 baseline에서 도구 파일·보존할 app scripts·lockfile 조회. 보고서도 같은 SHA                 | main과 다른 도구·test script를 실제 커밋해도 거부하는 회귀와 CLI 8개 통과                    |
| lockfile 분석기 before/metadata | 명시 ref를 SHA로 한 번 확정하고 파일과 baseline 필드에 공유                                     | 원래 artifact의 모든 workspace 그래프·양쪽 lockfile 해시가 재실행과 정확히 일치              |
| 소비자 대조군 복사              | SHA의 `ls-tree`에서 파일을 열거하고 SHA의 파일 내용만 복사. 설치 후 lockfile도 같은 원본과 대조 | HEAD에서 지워진 baseline manifest 포함·새 manifest 제외 회귀, 실제 오프라인/frozen 대조 성공 |
| architecture 미푸시 상태        | PR #59·원격 검토·main 미병합·장기 채택/운영 배포의 별도 결정을 명시                             | 현재 정책을 수정하고 과거 worklog/검증의 당시 결과는 보존                                    |

### 회귀와 실제 실행

- 기준선 회귀 9개 통과. 실제 임시 Git 저장소의 baseline과 실험 커밋, 기준 브랜치 이동과 추가 커밋, 기존/삭제/신규 파일의 tree 불일치, 잘못된 ref·commit이 아닌 객체·없는 파일 거부를 검사했다. 세 실제 CLI의 인자 누락 실패도 자식 프로세스로 확인했다.
- 저장소 전체 129개 통과(기존 120+신규 9), `tsc -p tsconfig.vuln-integration.json` 종료 0, peer 0건.
- [분석 결과](../artifacts/2026-10-24T12-22-01-870Z-viteplus-lockfile-impact.json)의 baseline SHA와 이전 [동일 기준 증거](../artifacts/2026-10-24T07-01-06-763Z-viteplus-lockfile-impact.json)의 `workspaces`·`lockfileHashes`를 `assert.deepEqual`로 비교해 일치했다. docs withDev 추가 26·제거 3·edge 10, vuln-radar 추가 147·제거 42·edge 5로 자기 비교 0건 문제가 재발하지 않았다.
- [소비자 결과](../artifacts/2026-10-24T12-22-21-670Z-viteplus-consumer-control.json)는 main optional Babel 8.0.1의 `BABEL_VERSION_UNSUPPORTED`, 실험 optional Babel 7.29.6의 실제 JSX 변환 성공을 구분한다. 양쪽 Next 내장 Babel 7.26.10은 성공한다. 임시 baseline 제거와 실험 lockfile 불변 확인도 성공했다.
- [CLI 재실행](../artifacts/2026-10-24T12-23-21-834Z-vuln-radar-viteplus.json)은 8개 통과·cleanupErrors 빈 배열·종료 0이다. 합성 토큰이 결과물에 포함되지 않고 dev/preview 프록시의 인증 교체를 확인했다.

### 선행 정리 실패 보존

[첫 CLI 실행](../artifacts/2026-10-24T12-22-04-534Z-vuln-radar-viteplus.json)은 8개 기능을 통과했으나 임시 Node compile-cache 삭제의 `ENOTEMPTY`로 종료 1이었다. 이 결과를 성공으로 바꾸거나 실패 artifact를 제거하지 않았다. 동일 명령 재실행은 정리까지 성공했다. 첫 실행이 생성한 잔여 임시 폴더만 삭제 재시도로 정리했으며 운영 파일·다른 세션 폴더는 건드리지 않았다. 영구적인 cleanup 경합 보완은 별도 후속으로 남긴다.

### 추가 리뷰: 호출자의 Git 환경 격리

후속 [리뷰](https://github.com/IMHOJEONG/web-tech/pull/59#discussion_r4367128566)는 `cwd`만 지정해도 상속된 `GIT_DIR`·`GIT_WORK_TREE`·`GIT_INDEX_FILE` 등이 다른 저장소와 인덱스를 선택할 수 있다고 지적했다. 기존 4건과 별도로 이번에 추가한 helper·fixture의 안전성을 보완한다.

- `verificationGitEnvironment`가 대소문자 구분 없이 `GIT_*` 키를 제외한 자식 환경 사본을 반환한다. 기준선 helper의 모든 Git 조회와 fixture의 init/add/commit/branch 호출에 같은 함수를 적용했다. 부모 `process.env`나 사용자 Git 설정 파일은 수정하지 않는다.
- 필터 회귀는 저장소·공통 Git 디렉터리·인덱스·object directory·config 주입 변수를 제외하고 `PATH`·`HOME`을 보존하는지 검사한다.
- 실제 자식 테스트에는 별도로 만든 임시 caller 저장소의 Git 환경을 주입한다. fixture 커밋과 baseline 조회가 자신의 임시 저장소를 사용하고, caller의 HEAD·worktree status·인덱스 bytes가 그대로인지 확인한다. 운영 저장소를 오염 대조군으로 사용하지 않는다.
- 위 재현 명령으로 관련 테스트 11개(기존 9+환경 격리 2), 전체 저장소 131개, 검증 도구 타입 검사를 통과했다. `--base` 파일 복사를 설명하는 기존 보고서의 현재 동작 문구도 보완했다.
- 이는 상속된 Git 선택/설정 변수의 격리다. `HOME`의 Git 설정·사용자 hook까지 포함하는 OS sandbox를 구현했다는 뜻은 아니다. 새 패키지/lockfile·운영 환경·보안 경고 13건은 변경하지 않았다.

선행 baseline 수정 head `5a1ea5f829ad92ec77fd647a315222869fea132b`는 [CI 13개 job](https://github.com/IMHOJEONG/web-tech/actions/runs/40094043724)과 [CodeQL 두 분석](https://github.com/IMHOJEONG/web-tech/actions/runs/40094041032)을 통과했다. 위 Git 환경 격리 후속 커밋은 새 head의 CI·CodeQL·리뷰 해결 여부를 따로 확인한다. 선행 성공을 후속 코드의 원격 검증으로 간주하지 않는다.

## 한계와 후속 작업

- 커밋·push 후 새 PR head의 CI·CodeQL·리뷰를 별도로 확인한다. 초기 head `096aad7`의 성공을 후속 head에 그대로 적용하지 않는다. 원격 검증 완료 기록은 Jira·Confluence의 동일 작업 표에 새 SHA/run으로 연결한다.
- 이번 변경은 기준선 선택과 재현성 보완이다. 과거 main 소비자 장애·의존성 audit 13건·Railway 보안 게이트를 해결했다는 뜻이 아니다. [KAN-35](https://web-tech-service.atlassian.net/browse/KAN-35)는 미조치 별도 작업, [KAN-32](https://web-tech-service.atlassian.net/browse/KAN-32)는 배포 보류로 유지한다.
- CodeRabbit docstring 80% 제안만을 위해 반복 주석을 추가하지 않았다. 고정 SHA 계약의 비자명한 이유는 공통 helper에 설명했다. CI에서 정책·baseline 회귀는 실행하지만 세 CLI의 전체 격리 설치/서버 검사는 여전히 로컬 재현 도구다.

## 관련 문서

- [실험 설계와 현재 적용 범위](../../architecture/vuln-radar-viteplus-experiment.md)
- [리뷰 수정 작업 기록](../../worklog/2026-10/2026-10-24-viteplus-review-fixes.md)
