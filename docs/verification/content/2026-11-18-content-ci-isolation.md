# 합성 PR·인증 콘텐츠 CI 분리 검증

## 대상과 조건

2026-11-18 KST 착수, 11-19 CI 전용 공개 범위 검증. 기준 main은 `a7e095c5`, Node 24.22.1·pnpm 12.14.0·Next 16.4.6이다. 기존 콘텐츠 이전 작업과 분리한 브랜치에서 CI 코드·회귀·정제 문서만 준비한다. 원문·자산·이전 로더·lock·운영 전환은 포함하지 않는다.

일반 CI는 합성 published 17개·archived 1개를 사용한다. 인증 workflow는 별도 이전 구현이 승인된 main에 없으면 키 없는 선행 단계에서 거절한다. Environment·secret·NAS·Vercel 설정은 변경하지 않는다.

## 재현 방법

아래 경계·타입·저장소 명령은 공개 코드 저장소 루트에서 실행한다. 원본 작업 트리에서 합성 corpus 교체 명령을 실행하지 않는다. 교체 CLI는 hosted runner·정확한 workspace·외부 임시 보관 위치를 요구한다. 로컬 검증용 임시 사본 생성·비밀 파일/원문 제외·`writeSyntheticCorpus`의 정확한 호출·설치 명령은 [runbook의 합성 사본 재현](../../runbooks/docs-private-content-ci.md#기대-결과)을 따른다.

```sh
node --test scripts/private-content-ci.test.mts scripts/browser-ci.test.mts
pnpm exec tsc -p tsconfig.private-content-ci.json
pnpm test:repo
```

격리 사본 루트에서는 runbook대로 고정 lockfile 의존성을 설치하고 다음 기존 검사를 실행한다. `test:content`의 선행 스크립트가 콘텐츠 계약 패키지를 빌드한다.

```sh
pnpm --filter @web-tech/ui build
pnpm --filter docs test:content
pnpm --filter docs test:lib
```

실제 인증 job의 준비 조건은 [CI 실행 절차](../../runbooks/docs-private-content-ci.md)를 따른다. PR 코드에 키를 주거나 수동 인증 workflow를 PR에서 실행하지 않는다.

## 결과와 증거

| 검사                   | 관측 결과                                                                                                                                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI 경계 회귀           | 14개 통과. 별도 이전 구현·고정 lock 누락, PR/target/다른 저장소/태그/가변·불일치 SHA, 보호 정책 누락·완화, 일반 CI 키 혼입·로컬 원문 교체를 거절한다. 검색 집합 오류·stale 빌드·키 직렬화도 실패한다.                                                    |
| 기존 브라우저 CI 계약  | 6개 통과. 이미지 digest·버전·실제 렌더 준비 검사를 유지한다.                                                                                                                                                                                             |
| 저장소 전체 검사       | 초기 272개, mount 보완 후 274개, 이미지 보완 후 275개, 날짜 정렬 보완 후 276개 통과. 위 20개를 포함하므로 별도로 더하지 않는다. 최초 샌드박스 실행의 기존 보안 검사 2개는 localhost listen EPERM으로 실패했고, 포트 권한 후 동일 전체 검사에서 통과했다. |
| 전용 타입 검사         | 통과. 공개 main의 공통 tsconfig를 직접 확장하며 이전 작업의 타입 설정·로더를 가져오지 않는다.                                                                                                                                                            |
| 합성 콘텐츠·라이브러리 | CI 전용 격리 사본에서 콘텐츠 36개·라이브러리 370개 통과. 합성 문서 18개 frontmatter·본문 검사 통과. 콘텐츠 검사의 최초 localhost EPERM 실패는 권한 후 같은 검사로 재확인했다. 이전 통합 사본의 47개·373개와 구분한다.                                    |
| 원격 CI                | [PR #97](https://github.com/IMHOJEONG/web-tech/pull/97)의 첫 실행 실패와 보완 재실행을 구분한다. 최종 head·job 결과는 PR checks와 KAN-80의 3열 검증 표에서 확인한다.                                                                                     |
| 인증 경로              | 미실행. 이전 구현·보호 Environment·별도 승인자가 준비되지 않은 상태이며 실제 키 fetch 성공으로 표현하지 않는다.                                                                                                                                          |

### PR #97 첫 원격 실행과 컨테이너 보완

[첫 일반 CI](https://github.com/IMHOJEONG/web-tech/actions/runs/44414299715)는 lint·타입·단위·커밋 검사에 성공했으나 컨테이너 8개 job이 모두 합성 준비 단계에서 실패했다. 본 테스트를 실행한 뒤 실패한 것이 아니다. 최초 CLI가 원시 오류를 출력하지 않았으므로 당시 errno를 직접 확인했다고 단정하지 않는다. 컨테이너의 workspace·temp 분리 mount와 rename의 EXDEV 경로를 점검해, 해당 경우만 copy → 디렉터리 목록·파일 bytes·symlink 일치 검증 → 원본 제거 순서로 보완했다. 복사 실패·불일치·다른 권한 오류는 원본을 보존하며 계속 실패한다. 실패 단계와 allowlist 오류 코드만 출력하고 실제 경로·내용·stack은 공개하지 않는다.

EXDEV 주입·symlink 보존과 복사 실패·불일치·권한 거절 회귀 2개를 추가했다. 새 경계 12개와 기존 브라우저 CI 6개, 타입 검사는 통과했다. [보완 재실행](https://github.com/IMHOJEONG/web-tech/actions/runs/44422823588)에서 컨테이너 8개 모두 준비 단계에 성공했고 UI 두 suite·단위·타입·lint도 통과했다. 이 시점의 브라우저 전체는 진행 중이므로 최종 성공과 구분한다. CodeRabbit의 mount 경계·ADR 상태 목록·격리 사본 재현 절차 지적도 같은 범위에서 보완했다. 문서의 git archive → 원문/비밀 파일 제외 → export 함수 호출은 별도 임시 사본에서 직접 실행해 published 17개 준비를 확인했다.

### 합성 이미지 계약 보완

보완 재실행에서 모바일·태블릿·데스크톱 responsive suite와 CRP·공용 UI·단위 검사는 성공했다. 오프라인 suite는 58개 통과·이미지 fallback 4개 실패였다. 합성 metadata에 thumbnail이 없어 이미지 카드가 렌더되지 않은 것이 해당 assertion 실패 원인이다. 기존 공개 도식 하나를 합성 thumbnail로 지정하고 실제 에셋 존재·비기본 경로 회귀 1개를 추가했다. 검사 파일·기대값·timeout·retry는 바꾸지 않았다.

로컬 격리 사본에서 기존 이미지 장애 검사를 그대로 실행해 모바일·데스크톱 4개 모두 통과(31.4초), 전체 저장소 275개와 lib 370개도 통과했다. 해당 E2E가 이미지의 loading 속성을 직접 바꾸는 과정에서 hydration 경고가 발생했으나 실제 assertion 실패는 없었다. 경고 제거를 이번 작업의 완료 항목으로 주장하지 않는다. 아래 명령은 runbook에서 만든 합성 사본 루트에서 실행한다.

```sh
pnpm --filter docs exec playwright test --config=playwright.offline.config.ts offline-e2e/image-fallback.spec.ts
```

### 합성 날짜·prefetch 링크 정렬 보완

[이미지 보완 head의 CI](https://github.com/IMHOJEONG/web-tech/actions/runs/44424954622)는 오프라인·responsive 세 폭·공용 UI·단위·타입·lint·CRP가 통과했지만 상세 production은 176개 통과·기존 opt-in 2개 skip·22개 실패였다. 관련 글 Link/prefetch를 기다리는 사례에서 30초 timeout이 발생했고 후속 cleanup 요청도 timeout 상태로 종료됐다. 단순 네트워크 장애로 분류하지 않는다.

합성 글의 일괄 11월 날짜가 원격 held-body fixture(9월)보다 새로워 관련 글 3개에서 해당 링크가 빠지는 것을 실제 `buildArticleRelatedDocuments` 함수로 재현했다. 다른 코드·원격 fixture·기대값은 유지하고 기본 합성 날짜를 8월로 고정했다. 최신 글 UI용 Brotli fixture의 11월 날짜는 유지한다. 실제 정렬 회귀는 변경 전 날짜에서 링크 탈락, 보완 날짜에서 링크 포함을 모두 확인한다.

로컬 격리 production 빌드 후 기존 상세 E2E 200개 대상을 workers 1·retry 0·기존 timeout으로 실행해 198개 통과·기존 opt-in 2개 skip·실패 0개(2.3분)를 확인했다. 저장소 전체 276개와 전용 타입 검사도 통과했다. 이 로컬 성공은 최종 원격 head의 성공으로 대신 계산하지 않으며 PR checks와 KAN-80에서 원격 결과를 따로 확인한다. 첫 원격 실패·중간 취소 기록은 성공으로 덮지 않는다.

### 이전 통합 작업 트리의 관측과 구분

분리 전 미커밋 이전 구현을 포함한 통합 사본에서는 CI 9개/저장소 271개·콘텐츠 47개·lib 373개·합성 빌드가 통과했다. 초기 UI 사전 빌드 누락과 PostCSS 포트 EPERM 실패 뒤 준비·권한을 갖춰 다시 검사한 결과다. 첫 태블릿 검사에서는 fixture 제목 3건과 IME 1건이 실패했다. 제목 계약만 보충했고 검사·timeout·retry는 변경하지 않았다. 두 번째는 145개 통과·기존 조건 25개 skip·ECONNRESET 1건 실패, 최종 세 번째는 같은 171개 대상에서 146개 통과·25개 skip·실패 0개였다. IME·연결 실패의 근본 원인은 미확정이다.

그 통합 사본의 실제 발행본도 동일 SHA로 새 빌드 후 키 없이 검색·목록·한영 상세 34개를 확인했지만, 이번 CI 전용 변경만으로 재현한 결과가 아니며 원격 승인 job 성공도 아니다. 이전 Environment 조회 404와 실제 승인·키 등록 미실행을 유지한다.

## 한계와 후속 작업

### 2026-11-19 실행 Bot·사람 승인 분리 보완

기준 main `7fc4d12785059c3baade6fbfee92b3d1f41d11b3`, Node 24.22.1·pnpm 12.14.0의 별도 로컬 브랜치에서 검사했다. 기존 미커밋 작업 트리는 전환하거나 복사하지 않았다. 이 절은 실제 인증 CI 활성화 결과가 아니라 미커밋 코드의 합성 회귀 결과다.

```sh
node --test scripts/private-content-ci.test.mts scripts/browser-ci.test.mts
pnpm exec tsc -p tsconfig.private-content-ci.json
pnpm test:repo
```

| 검사                  | 관측 결과                                                                                                                                                                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 인증 경계 회귀        | 27개 통과. 기존 입력·합성 corpus·runtime 검사를 유지하고 실행 Bot/사람 ID 누락·혼동, 다른 sender/실행자, 재실행, workflow SHA/경로 불일치, 콘텐츠 revision 불일치, 다른 reviewer/Team/Bot, 승인 누락·거절·중복·다른 Environment, 원격 run 교체, 403/404·네트워크 오류, 승인 후 정책 약화를 거절한다.  |
| 기존 브라우저 CI 계약 | 6개 통과. 일반 CI에는 키·Environment를 추가하지 않았고 기존 이미지·실행 기준도 유지했다. 위 경계와 합쳐 33개이며 저장소 전체에 포함되므로 중복 합산하지 않는다.                                                                                                                                       |
| 저장소 전체·타입      | 298개 통과, 전용 TypeScript 검사 통과. 최초 타입 검사는 합성 fixture의 배열 요소 nullability 한 건을 지적했고 검사를 낮추지 않고 fixture의 존재를 명시해 수정했다.                                                                                                                                    |
| 설치 조건             | 격리 작업 트리의 첫 offline 설치는 캐시에 없는 tarball로 실패. 동일 frozen lockfile·ignore-scripts 온라인 설치 후 검증. package/lockfile 변경이나 새 의존성·설치 훅 승인 없음.                                                                                                                        |
| 공개 경계             | 합성 입력과 정제 절차·결과만 변경. 실제 원문·키·API 응답·원시 로그·화면은 공개 파일에 추가하지 않는다. 바뀐 문서는 새 공개 승인을 받아 해시를 갱신하기 전 업로드하지 않는다.                                                                                                                          |
| 실제 플랫폼           | 미실행. App 메타데이터는 404여서 소유자·설치 범위·권한은 미확인이다. 별도 공개 사용자 API에서는 실행 Bot과 소유자 User의 실제 login·숫자 ID를 확인했다. 보호 Environment·non-secret 변수·전용 키 설정은 사용자 승인 대기이며 실제 Bot dispatch·사람 승인·private fetch·빌드 성공으로 계산하지 않는다. |

최초 로컬 점검에서 변경 12개 파일의 bytes를 공개 검사기의 `inspect`로 읽기 전용 검사했다. 결과는 정제 Markdown 8개의 `public-review-required`뿐이며 당시 공개 승인은 없었다. 기존 manifest를 자동 갱신하지 않고 업로드 차단을 유지했다. 이는 대표 패턴·변경 파일 검사이며 전체 비밀 전수 감사가 아니다. 기존 작업 트리 20곳의 HEAD·인덱스·status·수정 파일 해시와 작업 시작 시 stash 목록도 모두 동일했다.

별도 지식 문서 [실행 봇과 사람 승인](https://web-tech-service.atlassian.net/wiki/pages/19922945)의 본문과 상위 경로를 확인하고 로컬 정책 원본과 연결한다. 지식 게시와 코드 원격 반영은 다르며 아직 새 커밋·푸시·PR·원격 CI·배포는 하지 않았다. 필요한 실제 변경의 최소 범위와 요금제 제약은 [runbook](../../runbooks/docs-private-content-ci.md#승인-전-확인할-최소-설정)을 따른다.

### 2026-11-19 사용자 설정 후 실제 Environment 대조

사용자가 Environment와 Repository variables를 직접 설정한 뒤 비밀값 없는 메타데이터만 조회했다. 첫 조회에서는 `prevent_self_review: false`여서 로컬 정책 검사기가 거절했다. 메모리 사본에서 그 필드만 `true`로 바꾸면 통과해 차단 지점을 확인했다. 원격 설정을 코드로 수정하거나 임시 승인 이력을 만들지 않았다.

사용자가 `Prevent self-review`를 켜고 저장한 뒤 같은 API를 다시 조회했다. `readContentCiIdentity`와 `assertProtectedContentEnvironment`에 실제 응답을 메모리에서 전달해 전체 검사를 통과했다. 실제 응답·원문·비밀값은 파일이나 artifact로 저장하지 않았다.

| 항목               | 최종 관측                                                                        |
| ------------------ | -------------------------------------------------------------------------------- |
| 신원 변수          | Bot·사람 login/숫자 ID 네 개가 기존 확인한 공개 신원과 일치.                     |
| 승인 정책          | 지정한 사람 한 명, 자기 승인 금지, 관리자 우회 금지.                             |
| 브랜치 제한        | custom 정책 한 개: `main`, 종류 `branch`. 태그·wildcard 없음.                    |
| Environment secret | 목록 조회 결과 0개. 키 생성·등록·기존 Vercel 키 재사용 없음.                     |
| 로컬 회귀          | 같은 경계·브라우저 CI 33개 재실행 통과. 검사 기준·timeout·retry 유지.            |
| 실제 인증 CI       | 미실행. 이번 조회 성공은 Bot dispatch·사람 승인·콘텐츠 fetch 성공을 뜻하지 않음. |

조회 명령은 코드 저장소 루트에서 실행한다. 아래는 설정 메타데이터와 비밀이 아닌 변수만 읽으며 secret의 값은 읽지 않는다.

```sh
gh api repos/IMHOJEONG/web-tech/environments/docs-private-content \
  --jq '{name,can_admins_bypass,protection_rules,deployment_branch_policy}'
gh api repos/IMHOJEONG/web-tech/environments/docs-private-content/deployment-branch-policies \
  --jq '{total_count,branch_policies:[.branch_policies[]|{name,type}]}'
gh api repos/IMHOJEONG/web-tech/actions/variables \
  --jq '[.variables[]|select(.name|startswith("DOCS_CONTENT_CI_"))|{name,value}]'
gh api repos/IMHOJEONG/web-tech/environments/docs-private-content/secrets \
  --jq '{total_count,names:[.secrets[].name]}'
node --test scripts/private-content-ci.test.mts scripts/browser-ci.test.mts
```

다음 단계는 로컬 보완 코드의 공개 검수·PR·main 반영과 소유자 인증에 접근하지 않는 실행 환경·런처 준비다. App 개인키와 CI 전용 read-only deploy key는 별개이며 아직 생성하지 않는다. 실제 키 사용과 인증 CI는 준비가 끝난 뒤 검증한다.

### 2026-11-19 공개 승인 후 PR 준비 범위

사용자가 CI 코드·workflow 4개와 기존 정제 문서 8개만 공개 검수·해시 등록·작업별 커밋·푸시·PR 준비하도록 명시 승인했다. 검수 목록은 이 문서 8개의 최종 인덱스 bytes에만 갱신한다. 실제 키·원문·원시 자료·다른 미커밋은 제외하며 main 병합과 실제 인증 CI 실행은 별도 승인 대상이다. 검사와 커밋·PR 결과는 KAN-80과 해당 PR에서 기준 head에 연결하고, 이전 로컬 결과를 원격 CI 성공으로 대체하지 않는다.

커밋 전 전체 298개를 다시 실행했다. 첫 샌드박스 실행은 기존 보안 검사 두 개가 `127.0.0.1` listen `EPERM`으로 실패했고, 포트 사용을 허용한 동일 명령에서 298개 전부 통과했다. 전용 타입·문서 delta·stage 포맷·코드 공개 검사를 통과했으며 검사 기준·timeout·retry·의존성은 변경하지 않았다.

### PR #101 첫 원격 검증과 문서 리뷰 보완

코드·회귀 `31b45634`와 정제 문서·검수 해시 `a4feed93`를 분리해 푸시했다. head `a4feed936e14002ece65c417b4dbea64dbc710b7`의 [일반 CI](https://github.com/IMHOJEONG/web-tech/actions/runs/44543884457)는 attempt 1에서 13개 job 모두 성공했다. [문서 검사](https://github.com/IMHOJEONG/web-tech/actions/runs/44543884328), [CodeQL 분석](https://github.com/IMHOJEONG/web-tech/actions/runs/44543877449), 보안 검사·두 Preview도 성공했다. 이는 일반 합성 CI 결과이며 실제 인증 콘텐츠 workflow 실행은 아니다. job 재실행은 없었으나 이 메타데이터만으로 개별 E2E 내부 재시도 0회를 주장하지 않는다.

CodeRabbit 첫 리뷰는 완료했고 문서 보완 2건을 남겼다. 검증 목차의 Environment·신원 변수 상태를 실제 조회 결과에 맞췄다. 사용자 추가 승인 후 새 [ADR-0034](../../architecture/adr-0034-content-ci-identity-approval.md)에 신원 고정·재실행 금지 결정을 분리하고 ADR-0033의 기존 결정 본문은 보존한다. ADR-0033의 경로 분리는 유지하므로 대체됨으로 표시하지 않는다. 보완 후 head의 CI·리뷰는 별도 확인하며 최초 head의 성공을 재사용하지 않는다.

인증 사전 검사는 별도 이전 구현이 main에 반영되기 전에는 의도적으로 실패한다. 파일 존재·빌드 명령·lock 검사만으로 코드의 안전성을 증명하지 않으며, 승인된 main 검토와 사람 승인이 별도로 필요하다. 자기 승인을 금지하므로 실행자와 승인자가 다른 신원이어야 한다. 공유 관리자 계정의 사용자·AI 권한 분리도 별도 과제다.

이번 범위에는 main 병합·수동 인증 CI 실행·운영 전환·NAS 변경이 없다. 원시 로그·trace·실제 응답·키는 공개하지 않는다. 기존 미커밋과 stash를 보존하고, CI 전용 브랜치에서만 공개 검수와 커밋을 수행한다.

### 2026-11-20 PR #101 병합·일반 CI·Production 확인

사용자 병합 승인 후 최종 head `cc8fc5ca9a50cfa72a14bfd37a243f51fd9b5717`와 미해결 리뷰 0개를 다시 확인했다. 위 절의 미병합 기록은 당시 상태이며 아래는 별도 승인 후의 결과다. 키 생성·등록과 실제 인증 콘텐츠 workflow 실행은 계속 제외했다.

| 항목              | 관측 결과                                                                                                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 최종 메시지       | 저장소 `pr:squash`의 check-only와 `--merge` 모두 통과. 전달 메시지 SHA-256 `96c58e495350bd335fe57a72fc845227158549a1f529b9e3c2f024106e4e7b03`가 실제 main 커밋 메시지와 일치.                                     |
| 병합              | [PR #101](https://github.com/IMHOJEONG/web-tech/pull/101) MERGED. main [c6465f48](https://github.com/IMHOJEONG/web-tech/commit/c6465f48c96aef681a42de77a584b25e69fd8525). 기존 main 이력 재작성·브랜치 삭제 없음. |
| CodeRabbit        | 예상 head의 공식 check `135649077199`가 정확한 한도 초과 결과라 기존 정책으로 예외 처리. `reviewPerformed: false`이며 새 코드 분석 성공으로 계산하지 않음. 기존 문서 의견 2건은 보완·해결 상태 재조회.            |
| main CI           | [44554030341](https://github.com/IMHOJEONG/web-tech/actions/runs/44554030341) attempt 1의 13개 job 모두 성공. 개별 E2E 내부 재시도 0회를 메타데이터만으로 주장하지 않음.                                          |
| 문서·CodeQL       | 동일 main SHA의 [문서 44554030272](https://github.com/IMHOJEONG/web-tech/actions/runs/44554030272)와 [CodeQL 44554029236](https://github.com/IMHOJEONG/web-tech/actions/runs/44554029236) 성공.                   |
| 블로그 Production | `READY`, target `production`, branch `main`, source SHA `c6465f48…`. 읽기 전용 배포 API와 공개 도메인의 배포가 일치. 배포 전 source는 `7fc4d127…`로 구분하며 provider 배포 ID는 정제본에서 생략.                  |
| 공개 독자 검증    | 인증 없이 ko/en 각 목록 17개·3페이지, 상세 34개, 사이트맵 상세 34개 확인. 일반·본문 코드·빈 검색 10/1/0개와 승인 자산 15개 SHA-256 일치. 콘텐츠 revision은 기존 고정 발행본 유지.                                 |
| 실제 Chromium     | ko/en × 1280/390px의 4조건에서 검색 제출 → 실제 Link 클릭 → 본문 확인. main 1개, pageerror·관측한 NAS 도메인 요청·가로 overflow 모두 0. 화면·trace·원문을 보관하지 않음.                                          |
| 비공개 경계       | Git·검수 목록·release lock·빌드 스크립트·생성 원문 경로의 공개 요청 5개가 404이고 원문 표식 없음. 이는 해당 표본이며 전체 경로 보안 감사가 아님.                                                                  |
| 미실행 확인       | 인증 콘텐츠 workflow 실행 수 0, Environment secret 수 0. 키 발급·등록·회전·NAS 변경 없음. 기존 Vercel 키 교체·이동 없음.                                                                                          |
| 보존              | 다른 작업 트리 20곳의 HEAD·인덱스·status·수정 파일 해시와 작업 시작 stash 목록이 동일. 이번 브랜치에는 승인된 보고서·worklog 두 파일의 정제 결과만 로컬 기록.                                                     |

실행 위치는 공개 코드 저장소 루트다. 첫 사전검사 명령은 병합 전에 사용한 형식이며 메시지 파일 경로는 예시다. 실제 검수한 제목·본문·footer만 넣고 키·원문은 넣지 않는다. 현재 PR은 이미 MERGED이므로 사전검사도 상태 검사에서 거절하는 것이 정상이며 `--merge`를 다시 실행하지 않는다. 나머지 명령은 병합 후 상태를 읽기 전용으로 확인한다.

```sh
pnpm pr:squash --repo IMHOJEONG/web-tech --pr 101 \
  --expected-head cc8fc5ca9a50cfa72a14bfd37a243f51fd9b5717 \
  --message-file /tmp/reviewed-squash-message.txt
gh pr view 101 --repo IMHOJEONG/web-tech --json state,mergeCommit,mergedAt
gh api repos/IMHOJEONG/web-tech/actions/runs/44554030341 \
  --jq '{head_sha,status,conclusion,run_attempt}'
vercel inspect heap-forge.app
gh api 'repos/IMHOJEONG/web-tech/actions/workflows/docs-private-content.yml/runs?per_page=1' \
  --jq '{total_count}'
gh api repos/IMHOJEONG/web-tech/environments/docs-private-content/secrets \
  --jq '{total_count,names:[.secrets[].name]}'
```

실제 검증은 저장소의 Node 24.22.1·pnpm 12.14.0을 사용했다. Vercel CLI 도움말 조회에서 sandbox의 mise/cache 쓰기 EPERM을 관측했고 실제 인증 메타데이터 조회는 권한을 승인받아 읽기 전용으로 수행했다. 배포 자체의 실패나 인증 CI 실행으로 분류하지 않는다. 공개 응답은 메모리에서만 검사했고 정제 집계만 저장소 밖 소유자 전용 임시 공간에 남겼다. 새 artifact 업로드·커밋·푸시는 하지 않았다.

후속은 소유자 자격 증명과 분리된 실행 환경·App 런처·CI 전용 키를 준비한 뒤 실제 Bot dispatch와 사람 승인을 검증하는 것이다. 일반 CI·Vercel Production 성공으로 이 후속 완료를 대신하지 않는다. 다른 앱의 Vercel 자동 배포 성공은 메타데이터만 확인했으며 해당 앱의 기능 재검사는 이번 범위가 아니다.

## 관련 문서

- [ADR-0033](../../architecture/adr-0033-content-ci-trust-boundary.md)
- [ADR-0034](../../architecture/adr-0034-content-ci-identity-approval.md)
- [CI 실행 절차](../../runbooks/docs-private-content-ci.md)
- [작업 기록](../../worklog/2026-11/2026-11-18-content-ci-isolation.md)
- [KAN-80](https://web-tech-service.atlassian.net/browse/KAN-80)
- [Confluence 기존 구현 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=18415624)
