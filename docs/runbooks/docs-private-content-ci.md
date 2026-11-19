# 합성 PR 검사와 승인 콘텐츠 CI 실행

## 목적과 준비 조건

일반 PR에는 비공개 원문과 자격 증명을 주지 않는다. 실제 콘텐츠 검증은 별도 승인 경로로 실행한다. 이 절차는 KAN-80의 CI 경계만 다루며 콘텐츠 이전·Production 전환 절차가 아니다.

Node 24.22.1·pnpm 12.14.0과 고정 lockfile을 사용한다. 이번 작업에서 Environment·secret·NAS·Vercel 설정을 생성하거나 변경하지 않는다.

## 실행 순서

1. 일반 PR은 기존 CI를 실행한다. 각 코드 job은 의존성 설치 전에 hosted checkout의 콘텐츠를 공개 합성 corpus로 교체한다. 이전 checkout 입력은 runner 임시 공간에 보존하고 키 혼입·로컬 실행·연결 경로는 거절한다. 기존 검사 명령과 timeout·retry는 유지한다.
2. 콘텐츠 이전 구현을 별도 PR에서 검수한다. 승인된 main에 `apps/docs/scripts/build.ts`, `prepare-private-content.ts`, `content-release.lock.json`과 해당 빌드 명령이 있어야 한다. 이 CI 전용 PR은 해당 구현과 원문을 포함하지 않는다. 준비되지 않은 현재 main에서는 승인 사전 검사가 실패하는 것이 기대 동작이다.
3. 관리자가 별도 승인으로 `docs-private-content` Environment를 준비한다. required reviewer, 자기 승인 금지, 관리자 우회 금지와 정확히 main branch만 허용하는 custom deployment branch 정책이 필요하다. 실행자와 승인자가 달라야 하며 해당 요금제·저장소에서 정책을 실제 사용할 수 있는지 확인한다. 자동 생성·완화하지 않는다.
4. 콘텐츠 저장소 하나의 읽기 전용 SSH 키만 해당 Environment의 `DOCS_PRIVATE_CONTENT_SSH_KEY`로 등록한다. 실제 값을 문서·PR·일반 repository secret에 넣지 않는다. 키 발급·등록은 이번 범위 밖이다.
5. main에 반영된 `docs-private-content.yml`의 수동 실행에서 `approved_sha`에 실행할 main의 전체 40자리 SHA를 지정한다. workflow ref도 main이어야 한다. 선행 job은 입력·실행 SHA 일치와 콘텐츠 통합 준비 상태·원격 보호 정책을 키 없이 검사한다. PR 코드·태그·다른 SHA·정책 조회 실패는 거절한다.
6. 별도 승인 후 후속 job이 동일 SHA를 checkout한다. 의존성은 키 없이 `--ignore-scripts`로 설치하고 마지막 검증 step에만 키를 전달한다. 고정 revision 빌드 후 키를 제거한 로컬 production 서버에서 목록·검색·한영 상세를 확인한다. 공유 캐시·원문·빌드·원시 로그·trace는 업로드하지 않는다.

## 기대 결과

일반 CI 성공은 합성 입력의 코드 계약을 확인한 것이다. 실제 발행본 fetch·검수·URL·자산과 운영 전환 성공을 뜻하지 않는다. 사전 검사도 Environment 사람 승인을 대체하지 않는다. 인증 job에는 배포 권한이 없으며 운영 전환은 별도 승인이다.

```sh
node --test scripts/private-content-ci.test.mts scripts/browser-ci.test.mts
pnpm exec tsc -p tsconfig.private-content-ci.json
pnpm test:repo
```

로컬 원본 작업 트리에 hosted corpus 교체 명령을 실행하지 않는다. 아래는 저장소 루트에서 실행하는 **공개 검수·커밋 완료 후**의 재현 절차다. `git archive HEAD`는 미커밋·미추적 파일을 읽지 않으며 개인 키·원시 자료를 포함한 checkout을 rsync로 통째로 복제하지 않는다. 추적된 public 에셋·합성 예제 코드는 기존 회귀에 필요하므로 유지한다. 운영 `.env`·Git·이전 출력물과 원문 두 디렉터리는 가져오지 않는다.

```sh
# 시작 위치: 공개 코드 저장소 루트. POSIX shell과 tar가 필요하다.
FIXTURE=$(mktemp -d)
git archive --format=tar HEAD | tar -xf - -C "$FIXTURE" \
  --exclude='apps/docs/data' --exclude='apps/docs/category' \
  --exclude='*/.env' --exclude='*/.env.*' --exclude='.env*' \
  --exclude='*/.next' --exclude='*/.vercel' --exclude='*/node_modules'

# 아래 명령은 반드시 생성한 임시 사본 안에서 실행한다.
cd "$FIXTURE"
export DOCS_CONTENT_SOURCE=legacy
node --input-type=module -e 'import {writeSyntheticCorpus} from "./scripts/prepare-ci-docs-content.mts"; console.info({documents:writeSyntheticCorpus("apps/docs")});'
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @web-tech/ui build
pnpm --filter docs test:content
pnpm --filter docs test:lib
```

`documents: 17`과 archived 1개, 총 18개의 frontmatter·본문 검사 통과를 확인한다. 임시 사본에 `.git`이 없으므로 Git 이력·staged 검사는 원래 코드 저장소 루트에서 실행한다. 위 로컬 export 함수를 쓰는 경로에는 hosted 환경 변수를 위조할 필요가 없다. 실제 CI CLI만 `GITHUB_ACTIONS=true`, `RUNNER_ENVIRONMENT=github-hosted`, `DOCS_CI_SYNTHETIC=1`, 정확한 `GITHUB_WORKSPACE`와 그 밖의 `RUNNER_TEMP`를 요구한다.

## 실패 대응과 복구

사전 검사 실패 시 누락된 통합 파일·고정 lock·보호 정책을 따로 확인한다. 키나 빌드 원문을 디버그 출력하지 않고 원시 응답도 공개 artifact로 올리지 않는다. 승인 정책을 낮추거나 PR 문맥에 키를 전달해 우회하지 않는다. 수동 검증이 실패해도 기존 NAS·Production은 변경되지 않는다.

## 관련 검증

- [ADR-0033](../architecture/adr-0033-content-ci-trust-boundary.md)
- [검증 결과와 미검증 범위](../verification/content/2026-11-18-content-ci-isolation.md)
- [작업 기록](../worklog/2026-11/2026-11-18-content-ci-isolation.md)
- [공개 검수](../process/publication-review.md)
