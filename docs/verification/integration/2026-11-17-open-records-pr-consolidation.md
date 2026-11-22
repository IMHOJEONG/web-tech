# 운영 기록 PR 네 건의 통합 준비

## 대상과 조건

- 2026-11-20 후속 상태: GitHub main `2cf837f04954d05d5ff409bdec6794ec28fd7f07`과 네 원본 PR head가 유지됨을 읽기 전용으로 확인했다. 이전24개 stage는 그대로 두고 `codex/docs-operating-records-20261120`의 새 작업 트리에 재구성했다. 아래 11-17 관측과 11-20 재검증을 구분하며 새 커밋·푸시·운영 조치는 하지 않았다.
- 최초 검토: 2026-11-17 KST, 후속 검토: 2026-11-20 KST. [KAN-81](https://web-tech-service.atlassian.net/browse/KAN-81).
- [Confluence 정리 입구](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=18153485): 로컬 준비·공개 대기 범위를 별도 댓글로 기록하며 기존 본문은 변경하지 않는다.
- 최초 기준 main: `3b5444edabe021dc18b62baa7e7060c9353c9c3a`. 이후 보안 PR #95의 `6b807f26fd878af38bdc144fdfe8f4af02585281`이 반영돼 재통합이 필요했다. 11-20에는 위 `2cf837f0`에서 다시 준비했으며 기존 기준의 관측은 아래에 역사적 기록으로 남긴다.
- 최초 `codex/docs-records-consolidation-20261116` 작업 트리의 stage는 그대로 보존한다. 새 PR 생성·공개 푸시·기존 PR 닫기·main 병합·운영 배포는 승인 전 미실행이다.
- 현재 원격 CI의 과거 성공과 이 통합본의 로컬 검증을 구분한다. NAS·Production·실제 자격 증명은 조회하거나 변경하지 않는다.

## 재현 방법

11-17 최초 준비는 원본 네 head를 읽을 수 있는 저장소의 별도 깨끗한 작업 트리에서 아래 명령으로 수행했다. 이는 당시 기준에서의 재현 절차이며 최신 main에서 무충돌을 보장하지 않는다. squash는 로컬 작업 트리에만 변경을 모으며 커밋하지 않는다.

```sh
git merge --squash --no-commit \
  df6508101d0fd396a4819525d940edf60a61101f \
  5afbf92d522565213da82c3bd3d7f70405a83415 \
  676de559debe3f74617b003fd11168735ffa97de \
  83a59cc3716e0309338332ed2c628e729547f023
git diff --cached --check
```

11-20 재구성은 최초 base·보존된 index·새 main의 blob을 `git merge-file -p --object-id`로 3방향 병합하고 목차 충돌을 수동 검토했다. 원본 index를 새 작업 트리로 복사하거나 실제 응답을 그대로 stage하지 않았다. 이후 원본 JSON의 실제 응답과 공개할 정제 요약을 분리한다. 단순 merge 결과를 바로 커밋하지 않는다. 고정 의존성 설치 후 예제와 문서를 검증한다.

```sh
pnpm exec tsc -p docs/examples/node-runtime-security/tsconfig.json
node docs/examples/node-runtime-security/safe-brotli-probe.mts
pnpm format:staged:check
pnpm validate:docs --staged
pnpm publication:staged
```

`publication:staged`는 사용자 공개 승인과 정확한 검수 해시가 없으면 차단돼야 한다. 검사를 위해 승인을 임의로 추가하지 않는다. loopback 제한의 `EPERM`은 진단 로직 실패와 구분해 승인된 동일 조건에서 재검사한다.

## 결과와 증거

| PR                                                   | 보존할 고유 내용                                           | 준비 판정                                              |
| ---------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| [#69](https://github.com/IMHOJEONG/web-tech/pull/69) | Node 보안 선행 조사·정상 Brotli 진단기·당시 한계           | 최신 main에 없는 내용. 단순 중복 닫기 대상 아님        |
| [#70](https://github.com/IMHOJEONG/web-tech/pull/70) | PR #68 보류·재시도·병합·배포 기록                          | 패치 코드와 분리해 당시 시점·실패를 보존               |
| [#72](https://github.com/IMHOJEONG/web-tech/pull/72) | NAS 재기동의 읽기 전용 관측·사용자 제공 이미지 확인의 한계 | 원본 실제 health 본문은 제외하고 새 정제 요약으로 분리 |
| [#73](https://github.com/IMHOJEONG/web-tech/pull/73) | 대비 변경의 병합·배포 식별자 검증                          | 디자인 토큰을 중복 적용하지 않고 기록만 보존           |

11-17 네 head의 로컬 squash 통합은 충돌 없이 완료됐다. 아래 세 문단은 그때의 관측이며 오늘 재실행한 결과와 구분한다. 기존 원본 PR·브랜치는 아직 그대로다. 이 결과는 새 통합본 CI 통과나 공개 승인이 아니다.

새 통합본의 예제 타입 검사와 정상 Brotli loopback 진단은 통과했다. 진단은 Node24.22.1·Nest11.1.19에서403·Guard1회·정상 body 선행 해독을 확인했으며 실제 AppModule·운영 비밀값은 로드하지 않았다. 최초 sandbox의 `listen EPERM`은 승인된 동일 코드 실행과 구분한다. staged 포맷·문서 delta·diff 검사도 통과했다.

공개 검사에서 원본문서의 가짜 DB 사용자/비밀번호 예시가 credential 패턴으로 탐지돼 인증 부분 없는 loopback 타입 검사 URI로 고쳤다. 실제 비밀 유출은 아니다. 남은 공개 검수 요구는 승인 전 차단으로 유지하며, 검수 해시나 공개 승인을 임의로 등록하지 않는다.

### 원본 보존

과거 JSON 여섯 개는 제한된 저장소 밖 보관본과 bytes가 같은지 먼저 대조했다. 다섯 정제 집계는 원본을 유지하고, NAS 원본에 실제 health JSON이 있어 새 요약을 별도로 작성했다. 원본은 과거 head와 별도 보관본에 남아 있으며 여기서 덮어쓰지 않았다. 이미 공개된 과거 PR을 소급 비공개로 바꾼 것은 아니다.

NAS 원본의 Git blob은 `6a5465892f39f03097a1c33f3df2aa757289fd32`, SHA-256은 `c35f5db923680463ee58927d70c1b6093ca159a2f2c662a479e63399abbb96b7`다. [새 요약](../artifacts/2026-11-17-nas-restart-review-summary.json)은 과거 HTTP 상태·개수·제약만 고정 필드로 옮겼고 실제 응답 본문·인증 헤더·비밀값·로컬 환경 파일은 없다.

## 한계와 후속 작업

### 2026-11-20 재구성과 공개 경계

최신 main의 Effect 보안·비공개 Git/초안 정책 링크와 원본 기록이 목차2개에서 충돌했다. 한쪽 전체 파일을 선택하지 않고 최신 목차를 보존하면서 통합 기록의 링크만 합쳤다. 나머지22개는 공통 base와 index blob을 이용한 3방향 병합 결과를 검토해 반영했다. 기존 원격 head·과거 이력·원래 stage24개는 변경하지 않는다.

PR #68 병합 후 JSON에도 실제 응답에서 추출한 `health`·`storage`가 남아 있어 새 통합본에서 제외했다. HTTP 상태·content type·공개 GitHub 검사/실패·재시도 집계는 유지하며 Vercel/Railway의 불필요한 배포 ID·별칭·플랫폼 응답 메타는 줄였다. 보류/병합 후 JSON의 `publicReview`에 원본 blob·제외 필드·검토일을 남겼다. 과거 원본을 소급 수정하거나 새 응답이라고 주장하지 않는다. 연결된 보고서도 실제 응답 값·개별 provider ID를 다시 적지 않도록 맞췄다.

정상 Brotli 진단 코드3개는 현재 main의 `docs/examples/**/*` ignore 대상이다. 로컬 검사는 가능하지만 아직 추적에 추가하지 않았다. 공개 범위 승인 때 합성 코드3개의 포함 여부도 명시적으로 확인하며 ignore·공개 검사 규칙을 바꾸거나 우회하지 않는다. 공개 승인·검수 해시·새 커밋·푸시는 여전히 미실행이다.

새 기준의 로컬 검증 결과는 다음과 같다. 이전 NAS 관측·배포 결과는 역사적 증거이며 이번에 API·NAS·Vercel·Railway를 다시 호출한 것은 아니다.

| 검사                  | 11-20 결과와 한계                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 설치·타입             | Node 24.22.1·pnpm 12.14.0에서 `pnpm install --offline --frozen-lockfile --ignore-scripts`와 예제 `tsc` 통과. lockfile·공통 설정 변경 없음                                 |
| 정상 Brotli 합성 진단 | 127.0.0.1의 임시 포트에서 Nest 11.1.19·Brotli 1.2.0·HTTP 403·Guard 1회·거부 전 해독 확인. 앱 종료 후 포트 해제. 비정상 입력·실제 AppModule·운영 자격 증명은 사용하지 않음 |
| 문서 검사             | 공식 `validate`에 HEAD와 후보24개 bytes를 합친 읽기 전용 view를 전달해 오류0개. index는 비어 있으므로 staged 검사 통과로 표현하지 않음                                    |
| 포맷·diff             | 명시한21개 경로의 포맷과 ignored 예제3개의 별도 `prettier --check --ignore-path /dev/null`, `git diff --check` 통과. 후자는 포맷 조회만 하며 추적·공개 규칙 변경 아님     |
| 정제 집계             | JSON6개를 원래 stage와 구조 대조. 4개는 동일, 2개는 명시된 제외 필드와 `publicReview`만 차이. 과거 실패·재시도·제약 보존                                                  |
| 보존                  | 원본 HEAD와 `git ls-files --stage -z`의 SHA-256 동일. 충돌 목차2개에서 기존 main 링크 대상이 모두 남아 있음. 새 index는 비어 있음                                         |
| 공개 검사             | 공식 `inspect`로 후보24개를 조회해 `public-review-required`22개만 확인. 다른 자동 탐지0개는 안전성 보증이나 사람 승인 아님. 검수 해시·stage·커밋 미실행                   |

공개 범위 승인 뒤 최종 bytes를 stage하고 위 staged 검사 세 가지를 다시 실행해야 한다. 현재 읽기 전용 검사를 pre-push 이력 검사나 원격 CI의 대체로 사용하지 않는다.

### 2026-11-20 공개 범위 승인과 로컬 커밋 준비

위 미승인 상태의 로컬 검증을 마친 뒤 사용자가 정제 기록21개와 합성 진단 예제3개, 총24개의 공개 검수·해시 등록·작업별 로컬 커밋을 승인했다. 합성 실행 코드와 타입 설정2개를 먼저, 예제 설명을 포함한 정제 문서·증거22개와 검수 목록을 다음 커밋으로 분리한다. ignored 예제는 승인한3개 경로만 개별 추적하며 ignore·훅·CI 규칙을 변경하지 않는다. 실제 staged 검사와 커밋 이력 검사를 추가로 수행하고 결과는 연결된 작업 기록에 남긴다. 원시 자료·다른 미커밋·stash·기존24개 stage와 원본 PR은 제외하며 푸시·PR 종료·병합·운영 조치는 승인 범위가 아니다.

- 열린 PR은7개다. [#66](https://github.com/IMHOJEONG/web-tech/pull/66)은 offline UTF-8 byte 계약과 ADR 검토 기능이 아직 main에 없고 문서 충돌도 있어 별도 유지한다.
- [#75](https://github.com/IMHOJEONG/web-tech/pull/75)는 공통 설정·신원 분리의 Draft이며 main 충돌·실제 권한 분리/승인 게이트 미완료다. 기록 PR에 섞거나 운영 규칙을 활성화하지 않는다.
- [#94](https://github.com/IMHOJEONG/web-tech/pull/94)는 샤드 계측·키보드 안정화 작업으로 별도 유지한다.
- 통합 기록의 공개 검수·커밋·푸시·CI/리뷰와 통합 PR 링크를 확인한 뒤에만 기존 네 PR의 종료를 검토한다. 과거 CI의 녹색을 최신 통합본에 소급하지 않는다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-17-open-records-pr-consolidation.md)
- [공개 검수 절차](../../process/publication-review.md)
- [문서 역할과 구조](../../process/documentation-organization.md)
