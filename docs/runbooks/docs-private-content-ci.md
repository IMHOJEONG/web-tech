# 합성 PR 검사와 승인 콘텐츠 CI 실행

## 목적과 준비 조건

일반 PR에는 비공개 원문과 자격 증명을 주지 않는다. 실제 콘텐츠 검증은 별도 승인 경로로 실행한다. 이 절차는 KAN-80의 CI 경계만 다루며 콘텐츠 이전·Production 전환 절차가 아니다.

Node 24.22.1·pnpm 12.14.0과 고정 lockfile을 사용한다. 이번 작업에서 Environment·secret·NAS·Vercel 설정을 생성하거나 변경하지 않는다.

## 실행 순서

1. 일반 PR은 기존 CI를 실행한다. 각 코드 job은 의존성 설치 전에 hosted checkout의 콘텐츠를 공개 합성 corpus로 교체한다. 이전 checkout 입력과 대체할 그림은 runner 임시 공간에 보존하고 키 혼입·로컬 실행·연결 경로는 거절한다. 글 17개·archived 1개와 유효한 합성 PNG 9개를 코드에서 만들며 실제 원문·그림을 복제하지 않는다. 기존 검사 명령과 timeout·retry는 유지한다.
2. 승인된 main에 `apps/docs/scripts/build.ts`, `prepare-private-content.ts`, `content-release.lock.json`과 해당 빌드 명령이 있어야 한다. PR #98로 이 통합은 반영됐다. 보호 Environment·신원 변수의 실제 조회 결과와 미준비인 실행 환경·키는 [후속 검증](../verification/content/2026-11-18-content-ci-isolation.md#2026-11-19-사용자-설정-후-실제-environment-대조)에서 구분한다. 준비되지 않은 보호 정책에서는 인증 사전 검사가 계속 실패해야 한다. Vercel Production 검증과 GitHub 인증 CI 성공을 혼동하지 않는다.
3. 사용자 승인 후 공개 `web-tech` 저장소의 `docs-private-content` Environment를 준비한다. reviewer는 지정한 사람 한 명, 자기 승인 금지·관리자 우회 금지·정확히 main branch만 허용하는 custom deployment branch 정책이 필요하다. `protected branches only`로 대신하지 않는다. 보호 브랜치가 없을 때 그 옵션이 모든 branch를 허용할 수 있기 때문이다.
4. 아래 최소 설정 표의 실행 Bot·사람 ID를 먼저 확인한다. 콘텐츠 CI 전용 read-only SSH 키는 승인 후 해당 Environment의 `DOCS_PRIVATE_CONTENT_SSH_KEY`에만 등록한다. Vercel Production 키와 재사용하지 않고 일반 repository secret·PR·문서에는 넣지 않는다. 현재 소유자 관리자 인증과 AI가 실제로 분리된 실행 환경이 준비돼야 한다.
5. 검토된 workflow를 main에 반영한 뒤 전용 App의 installation token으로 dispatch한다. `approved_sha`는 실행할 앱/workflow main SHA, `approved_content_revision`은 그 SHA의 release lock에 적힌 콘텐츠 SHA다. 두 값과 workflow ref가 정확해야 한다. 일반 사람 계정의 Run workflow나 사람/Bot의 재실행은 거절하며 새 dispatch로 다시 승인받는다. 다음은 신원을 분리한 런처의 명령 형식이며 현재 소유자 CLI에서 실행하는 절차가 아니다.

```sh
# 별도 런처가 단기 App installation token을 환경 변수로 제공한다.
# 실제 토큰을 명령 인수·터미널 출력·문서에 적지 않는다.
gh workflow run docs-private-content.yml --repo IMHOJEONG/web-tech --ref main \
  -f approved_sha="$APPROVED_CODE_SHA" \
  -f approved_content_revision="$APPROVED_CONTENT_REVISION"
```

6. 선행 job은 키 없이 신원·코드 SHA·콘텐츠 lock·실제 run 메타데이터·Environment 보호를 검사한다. 사람이 비공개 원문의 공개 대상과 해당 SHA를 검토한 뒤 GitHub의 Review deployments에서 승인한다. 후속 job은 같은 SHA checkout → 키 없는 `--ignore-scripts` 설치 → 현재 정책·실제 승인 이력 재조회 → 마지막 검증 step의 키 전달 순서다. 고정 revision 빌드 후 키를 제거한 로컬 production 서버에서 목록·검색·한영 상세를 확인한다. 공유 캐시·원문·빌드·원시 로그·trace는 업로드하지 않는다. 이 workflow는 배포하지 않는다.

### 승인 전 확인할 최소 설정

이 표는 필요한 범위의 제안이다. 로컬 코드 작성만으로 설정이 생성되지 않으며 이번 작업에서 실제 키·권한·원격 변수는 변경하지 않는다.

| 대상                             | 필요한 범위와 제한                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 실행 App                         | 실제 App slug·Bot login/숫자 ID 확인. 공개 `web-tech` 한 곳에만 설치. dispatch용 Actions write·메타데이터 읽기, 필요 시 Contents read. Administration·Workflows write·PR write·비공개 콘텐츠 저장소 쓰기 권한은 불필요. Actions write는 특정 workflow 한 파일만으로 제한되는 권한이 아니므로 전용 신원과 최소 설치 범위를 유지. |
| App 개인키·실행 환경             | 개인키는 사람 승인 세션·공개 runner에서 분리한 런처의 secret 보관소. 토큰은 실행할 때 짧게 발급하고 환경 변수로 전달. 현재 관리자 인증에 접근 가능한 AI 환경을 App 인증으로 바꿨다는 이유만으로 권한 분리 완료로 보지 않음.                                                                                                     |
| 비밀이 아닌 repository variables | `DOCS_CONTENT_CI_EXECUTOR_LOGIN`, `DOCS_CONTENT_CI_EXECUTOR_ID`, `DOCS_CONTENT_CI_REVIEWER_LOGIN`, `DOCS_CONTENT_CI_REVIEWER_ID`. 앞의 두 값은 Bot, 뒤의 두 값은 사람의 실제 ID. reviewer를 Bot·Team·다른 사용자와 섞지 않음.                                                                                                   |
| Environment                      | 공개 코드 저장소의 `docs-private-content`, 지정 사람 한 명·자기 승인 금지·관리자 우회 금지·custom branch `main` 하나. `authorize`는 Environment 밖에서 키 없이 실행.                                                                                                                                                            |
| 콘텐츠 키                        | 비공개 콘텐츠 저장소 한 곳의 새 CI 전용 read-only deploy key와 Environment secret 하나. 기존 Vercel 키는 교체·이동하지 않음. 공개 원문·manifest·키의 실제 값은 이슈와 artifact에 넣지 않음.                                                                                                                                     |

### GitHub 요금제와 활성화 판정

제한은 Vercel이 아니라 GitHub 기능 정책이다. GitHub Free는 공개 저장소의 브랜치 보호를 지원하고 비공개 브랜치 보호는 Pro 등에서 지원한다. Environment required reviewer·자기 승인 금지·관리자 우회 금지의 공개/비공개 지원도 별도다. 이번 설계는 공개 `web-tech`에 승인 게이트를 두고 비공개 콘텐츠를 읽으므로, 비공개 원문을 공개하거나 인증 CI 때문에 즉시 업그레이드할 필요가 없다. 비공개 원문 저장소 자체의 강제 브랜치 보호를 도입하려면 별도 요금제/정책 검토가 필요하다. Pro가 모든 비공개 Environment 보호 기능을 제공한다고 가정하지 않는다.

운영 활성화 완료는 코드 병합과 다르다. Bot dispatch → 사람이 승인하기 전 content job 대기 → 승인 이력 재조회 → 실제 fetch·공개 검수·빌드·키 없는 목록/검색/상세 검증의 전체 성공이 필요하다. 승인 거절·설정 누락·권한 조회 실패·재실행·SHA 변경에서는 키 사용 step이 시작되지 않는지도 확인한다. 실제 원문을 공개 CI에 의도적으로 출력하거나 실패 trace를 업로드해 증명하지 않는다.

## 기대 결과

일반 CI 성공은 합성 입력의 코드 계약을 확인한 것이다. 실제 발행본 fetch·검수·URL·자산과 운영 전환 성공을 뜻하지 않는다. 사전 검사도 Environment 사람 승인을 대체하지 않는다. 인증 job에는 배포 권한이 없으며 운영 전환은 별도 승인이다.

```sh
node --test scripts/private-content-ci.test.mts scripts/browser-ci.test.mts
pnpm exec tsc -p tsconfig.private-content-ci.json
pnpm test:repo
```

로컬 원본 작업 트리에 hosted corpus 교체 명령을 실행하지 않는다. 아래는 저장소 루트에서 실행하는 **공개 검수·커밋 완료 후**의 재현 절차다. `git archive HEAD`는 미커밋·미추적 파일을 읽지 않으며 개인 키·원시 자료를 포함한 checkout을 rsync로 통째로 복제하지 않는다. 앱 공용 public 에셋·합성 예제 코드는 유지하되 합성 PNG와 같은 경로의 원본은 export에서 제외한다. 운영 `.env`·Git·이전 출력물과 원문 두 디렉터리는 가져오지 않는다. 임시 디렉터리에는 소유자 전용 권한을 사용한다.

```sh
# 시작 위치: 공개 코드 저장소 루트. POSIX shell과 tar가 필요하다.
FIXTURE=$(mktemp -d)
chmod 700 "$FIXTURE"
git archive --format=tar HEAD | tar -xf - -C "$FIXTURE" \
  --exclude='apps/docs/data' --exclude='apps/docs/category' \
  --exclude='*/.env' --exclude='*/.env.*' --exclude='.env*' \
  --exclude='*/.next' --exclude='*/.vercel' --exclude='*/node_modules' \
  --exclude='apps/docs/public/diagrams/http-response-*.png' \
  --exclude='apps/docs/public/diagrams/tcp-socket-endpoints.png'

# 아래 명령은 반드시 생성한 임시 사본 안에서 실행한다.
cd "$FIXTURE"
export DOCS_CONTENT_SOURCE=legacy
node --input-type=module -e 'import {writeSyntheticCorpus} from "./scripts/prepare-ci-docs-content.mts"; console.info({documents:writeSyntheticCorpus("apps/docs")});'
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @web-tech/ui build
pnpm --filter docs test:content
pnpm --filter docs test:lib
```

`documents: 17`과 archived 1개, 총 18개의 frontmatter·본문 검사 통과를 확인한다. PNG는 CRC·압축 이미지 데이터를 가진 체커보드이며 반응형 폭·높이와 44px 등 기존 UI 검사 기준을 줄이지 않는다. 로컬 이미지 생성은 기존 파일·심볼릭 링크를 덮어쓰지 않는다. 임시 사본에 `.git`이 없으므로 Git 이력·staged 및 원문 재추적 방지 검사는 원래 코드 저장소 루트에서 실행한다. 위 로컬 export 함수를 쓰는 경로에는 hosted 환경 변수를 위조할 필요가 없다. 실제 CI CLI만 `GITHUB_ACTIONS=true`, `RUNNER_ENVIRONMENT=github-hosted`, `DOCS_CI_SYNTHETIC=1`, 정확한 `GITHUB_WORKSPACE`와 그 밖의 `RUNNER_TEMP`를 요구한다.

## 실패 대응과 복구

사전 검사 실패 시 누락된 통합 파일·고정 lock·보호 정책을 따로 확인한다. 키나 빌드 원문을 디버그 출력하지 않고 원시 응답도 공개 artifact로 올리지 않는다. 승인 정책을 낮추거나 PR 문맥에 키를 전달해 우회하지 않는다. 수동 검증이 실패해도 기존 NAS·Production은 변경되지 않는다.

허용 Bot 이름·숫자 ID, event sender, 초기 actor와 triggering actor, 실제 run 메타데이터 중 하나라도 다르면 새 dispatch 전에 신원 설정부터 확인한다. `--after-approval` 검사는 승인 이력이 없거나 Environment ID가 다르거나 정책이 완화됐으면 실패한다. Re-run jobs로 기존 승인을 재사용하지 않는다. 콘텐츠 bytes가 바뀌었으면 기존 검수 해시를 자동 갱신하지 말고 공개 재검수·새 콘텐츠 커밋과 lock 검토를 거친다.

## 관련 검증

- [ADR-0033](../architecture/adr-0033-content-ci-trust-boundary.md)
- [ADR-0034: 실행·승인 신원 고정과 신규 dispatch](../architecture/adr-0034-content-ci-identity-approval.md)
- [검증 결과와 미검증 범위](../verification/content/2026-11-18-content-ci-isolation.md)
- [작업 기록](../worklog/2026-11/2026-11-18-content-ci-isolation.md)
- [공개 검수](../process/publication-review.md)
- [지식: 실행 봇과 사람 승인](https://web-tech-service.atlassian.net/wiki/pages/19922945)
- [GitHub 브랜치 보호 요금제](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) · [Environment 지원 범위](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
