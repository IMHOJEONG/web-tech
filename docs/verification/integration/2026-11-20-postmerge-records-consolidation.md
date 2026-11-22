# 병합 후 검증 기록의 보존형 통합

## 대상과 조건

2026-11-20 KST, [KAN-51](https://web-tech-service.atlassian.net/browse/KAN-51)의 미커밋 후속 분류에서 병합 후 기록17개 항목을 비교했다. 기존 정리 완료 상태를 취소하거나 파일 삭제 승인을 추정하지 않는다. 기준은 GitHub API와 대조한 main `2cf837f04954d05d5ff409bdec6794ec28fd7f07`, 별도 로컬 브랜치는 `codex/docs-postmerge-records-20261120`다. Node 24.22.1·pnpm 12.14.0을 사용한다.

대상은 인증 CI·초안 작성 정책·Production 전환/공개 사본 정리·목차·Hono·Next 보안의 기존 정제 문서와 합성 판정 회귀다. 원본7개 작업 트리의 파일·HEAD·index·status와 stash를 보존하며 앞서 만든 운영 기록 커밋2개도 변경하지 않는다. 실제 원문·자산·원시 로그·응답·trace·키는 읽거나 옮기지 않는다. 초기 로컬 준비와 아래 후속 공개 범위 승인을 구분한다. 푸시·PR 종료·병합·배포·운영 재검증은 하지 않는다.

## 재현 방법

원본 작업 트리마다 `git status --porcelain=v1 -z --untracked-files=all`, `git rev-parse HEAD`, `git ls-files --stage -z`와 수정 파일 SHA-256을 먼저 기록한다. `git diff HEAD -- <file>`의 고유 추가 절을 main과 비교한다. 원문 전체로 최신 main을 덮어쓰지 않는다.

추적 문서는 최신 main blob·원본 HEAD blob·현재 파일 blob의 3방향 결과를 읽는다. `git hash-object -w`로 만든 비교용 객체는 로컬 Git DB에만 두고 index·ref·원본 파일을 변경하지 않는다. 파이프/가상 파일 경로로 Git의 파일 병합을 대신하지 않는다.

```sh
git hash-object -w -- <검토할-정제-문서>
git merge-file -p --object-id \
  <최신-main-blob> <원본-HEAD-blob> <현재-파일-blob>
```

위 꺾쇠 항목은 실제 식별자·경로로 바꿔야 하는 설명 표기이며 그대로 실행할 명령이 아니다. 이미 main에 있는 절·수정된 앵커·현재 ADR 상태를 먼저 확인한 뒤 충돌을 판단한다. 이 통합의 검사는 새 작업 트리 루트에서 실행한다.

```sh
pnpm install --offline --frozen-lockfile --ignore-scripts
node --test scripts/security-next-critical.test.mts scripts/security-next-upgrade-assessment.test.mts
pnpm exec tsc --ignoreConfig --noEmit --types node --module NodeNext --moduleResolution NodeNext --target ES2023 --strict --skipLibCheck --allowImportingTsExtensions --erasableSyntaxOnly scripts/security-next-upgrade-assessment.test.mts
pnpm test:repo
git diff --check
```

후속 공개 승인 후에는 최종 bytes와 검수 목록을 함께 stage하고 `pnpm format:staged:check`, `pnpm validate:docs --staged`, `pnpm publication:staged`를 다시 실행한다. 비어 있는 index의 통과를 후보 파일의 검수로 사용하지 않는다.

## 결과와 증거

| 원본 작업군             | 통합 판단                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 인증 CI2개·초안 정책1개 | PR #101·#103 병합 후의 정제 결과만 추가. 일반 CI/Production 성공과 실제 인증 workflow 미실행을 구분                               |
| Production 전환3개      | main에 이미 반영. ADR-0032의 현행 `적용 중` 상태·공개 사본 정리 절과 수정된 runbook 앵커를 보존하고 구형 사본을 재적용하지 않음   |
| 공개 사본 정리2개       | 위와 같은 두 파일에 PR #99의 후속 결과·최초 요청 실패·미확정 원인·당시 인증 경계 검토를 추가. 현재 권한/키 상태로 일반화하지 않음 |
| 목차2개                 | PR #91의 당시 병합·운영 관측·브라우저 조건과 한계를 추가. 원시 config·화면·로그는 포함하지 않음                                   |
| Hono4개                 | PR #95의 당시 CI·플랫폼 교차 확인·fixed 관측과 최초 연결 실패를 보존. 최신 main의 다른 목차 항목은 유지                           |
| Next3개                 | PR #96의 당시 결과와 추가 판정 회귀를 구분. 공급/검색 캐시 코드를 수정하거나 새 보안 패치 완료를 주장하지 않음                    |

17개 원본 항목 중3개는 main 반영/구형 상태라 재적용하지 않았다. 나머지14개 후보에 이번 보고서·작업 기록2개를 더한16개 파일을 로컬로 준비했다. 이 중15개는 Markdown, 1개는 실행 가능한 합성 테스트다. 목차 충돌은 Hono 항목 설명만 고치며 최신 main의 모든 링크를 보존했다.

새로 추가한 절에서 불필요한 provider 배포 ID와 개인 Vercel scope를 줄였다. GitHub PR·main SHA·공개 검사 링크·관측 날짜·실패·재시도·제약은 유지했다. 이미 main에 있는 과거 본문이나 원본 작업 트리를 소급 변경하지 않는다. 일반 운영 명령의 현재 결과를 과거 관측으로 대체하지 않는다.

### 11-20 로컬 재검증

- 정상 설치는 오프라인으로 기존 패키지1418개를 재사용했고 다운로드0개·lockfile 변경0개다. 첫 sandbox 설치는 store 접근 제한으로 실패해 같은 조건을 권한 허용 환경에서 재실행했다. dotenv skill 승인은 하지 않았다.
- 기존 보안 하한6개·새 판정4개, 총10개 통과. 새4개는 설치 Next의 실제 판정 함수에 합성 registry 응답을 주입하며 외부 registry 요청·공격 재현이 아니다. strict·erasableSyntaxOnly 타입 검사도 통과했다.
- 전체 저장소 첫 실행은308개 중306개 통과·2개 실패였다. 두 실패 모두 기존 body-parser 회귀의 `listen EPERM`이었다. 동일 코드·기준을 포트 사용 허용 환경에서 재실행해308개 통과·실패/skip0개, 약20.2초를 확인했다. timeout/retry·기대값은 변경하지 않았다. 앞의10개는 이308개에 포함되므로 합산하지 않는다.
- 후보16개를 공식 문서 `validate`의 읽기 전용 view로 검사해 오류0개를 확인했다. 공식 공개 `inspect`는 사용자 승인 요구15개만 남았고 다른 자동 탐지0개다. 이는 안전성 전수 감사나 사람 승인·커밋 훅 통과가 아니며 index는 비어 있다.
- 원본7개 작업 트리의17개 파일 SHA-256·HEAD·index·status가 모두 동일하다. 후보 목차2개는 main의 기존 링크를 모두 보존했고 추가 테스트도 원본 bytes와 같다. stash 조작은 없고 현재 목록0개를 확인했다.
- 명시한 후보 경로만 포맷하고 `git diff --check`를 통과했다. 승인 목록·앱·패키지·lockfile·워크플로·ignore·공통 지침·ADR은 main과 같다. 과거 E2E·빌드·배포 결과를 이번 재실행으로 계산하지 않는다.

## 한계와 후속 작업

위 읽기 전용 검사 시점에는 공개 검수 해시·stage·새 커밋을 만들지 않았다. 후속으로 사용자가 정제 문서15개·합성 Next 판정 회귀1개와 해당 검수 목록만 공개 검수·작업별 로컬 커밋하도록 승인했다. 테스트1개와 정제 문서15개를 분리하고 최종 index bytes의 해시·실제 커밋 훅·main 기준 전체 공개 이력 검사를 적용한다. 실행 결과는 연결된 작업 기록과 KAN-51의 로컬-only 후속 표에서 추적한다.

원본 파일 삭제·중복 사본 물리 정리·기존 PR 닫기·브랜치 삭제·푸시는 승인 범위가 아니다. 글 이전·게시·실제 키 생성/등록·인증 CI 활성화·운영 설정 변경도 수행하지 않는다. 이미 main인 Production 기록3개·원시 자료·다른 미커밋·stash는 새 커밋에 포함하지 않는다.

이 작업은 기존 ADR의 상태·공개 경계를 보존하는 기록 통합이며 새 구조·데이터 계약 결정이 없다. ADR-0032 본문을 다시 쓰거나 새 ADR을 만들지 않는다. 새 지식 페이지 대신 기존 작업 추적의 정제 진행 기록을 갱신하며 지식 문서화 완료로 표시하지 않는다.

### 2026-11-22 최신 main 통합과 PR 준비

기준 main은567398255f3c00a35fc52432beb30a68e86ed2bb, 작업 브랜치는codex/docs-records-pr-20261122다. 운영 기록2개·병합 후 기록2개·워커1개·Atlassian1개 커밋을 정제 기록 PR로 모았다. 원문 발췌가 있는 원본 JSON·원시 자료·NAS 설정은 재업로드하지 않는다. 기존 #69·#70·#72·#73은 원본 추적용으로 유지하며 닫거나 병합하지 않는다. 원본14개 로컬 커밋·기존 미커밋·stash·비공개 자료는 원래 위치에 보존하며 새 브랜치에서만 정리한다. 겹친 목차는 새 main의 링크를 유지해 합치고 이전 승인 기록은 동일 bytes에만 사용한다.

저장소308개를 실패/skip 없이 통과했고 정상 Brotli 최소 앱에서 Node24.22.1·Nest11.1.19·403·Guard1회·거부 전 해독을 확인했다. 공격/실제 서비스 안전성 검증은 아니며 운영 조회를 수행하지 않는다. 예제 타입 검사와 원격 CI는 각각 구분한다. 실행 환경은Node24.22.1·pnpm12.14.0이며 의존성은 frozen lockfile·ignore-scripts·offline으로 재사용했다. 설치 훅·dotenv skill은 승인하지 않았다.

사용자가 기존 목차4개와 관련 보고서/worklog6개의 정제 보완·재검수·해시 갱신을 승인했다. 최종 staged bytes의 공개·포맷·문서·메시지 검사 후 작업별 커밋과 푸시·main 대상 PR을 준비한다. 실제 원격 SHA·CI 결과는 같은 Jira/Confluence 추적 기록에 연결하며 로컬 통과를 원격 성공으로 바꾸지 않는다. main 병합·Production 배포·기존 PR 종료·브랜치/원본 삭제는 범위 밖이다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-20-postmerge-records-consolidation.md)
- [초기 미커밋 분류의 정제 추적 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=20250686): 로컬 감사 원문은 이번 후보에 추가하지 않는다.
- [공개 검수 경계](../../process/publication-review.md)
- [ADR 상태 관리](../../process/adr-management.md)
