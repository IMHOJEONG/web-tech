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

| 검사                   | 관측 결과                                                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CI 경계 회귀           | 13개 통과. 별도 이전 구현·고정 lock 누락, PR/target/다른 저장소/태그/가변·불일치 SHA, 보호 정책 누락·완화, 일반 CI 키 혼입·로컬 원문 교체를 거절한다. 검색 집합 오류·stale 빌드·키 직렬화도 실패한다.                                |
| 기존 브라우저 CI 계약  | 6개 통과. 이미지 digest·버전·실제 렌더 준비 검사를 유지한다.                                                                                                                                                                         |
| 저장소 전체 검사       | 초기 272개, mount 보완 후 274개, 이미지 계약 보완 후 275개 통과. 위 19개를 포함하므로 별도로 더하지 않는다. 최초 샌드박스 실행의 기존 보안 검사 2개는 localhost listen EPERM으로 실패했고, 포트 권한 후 동일 전체 검사에서 통과했다. |
| 전용 타입 검사         | 통과. 공개 main의 공통 tsconfig를 직접 확장하며 이전 작업의 타입 설정·로더를 가져오지 않는다.                                                                                                                                        |
| 합성 콘텐츠·라이브러리 | CI 전용 격리 사본에서 콘텐츠 36개·라이브러리 370개 통과. 합성 문서 18개 frontmatter·본문 검사 통과. 콘텐츠 검사의 최초 localhost EPERM 실패는 권한 후 같은 검사로 재확인했다. 이전 통합 사본의 47개·373개와 구분한다.                |
| 원격 CI                | [PR #97](https://github.com/IMHOJEONG/web-tech/pull/97)의 첫 실행 실패와 보완 재실행을 구분한다. 최종 head·job 결과는 PR checks와 KAN-80의 3열 검증 표에서 확인한다.                                                                 |
| 인증 경로              | 미실행. 이전 구현·보호 Environment·별도 승인자가 준비되지 않은 상태이며 실제 키 fetch 성공으로 표현하지 않는다.                                                                                                                      |

### PR #97 첫 원격 실행과 컨테이너 보완

[첫 일반 CI](https://github.com/IMHOJEONG/web-tech/actions/runs/44414299715)는 lint·타입·단위·커밋 검사에 성공했으나 컨테이너 8개 job이 모두 합성 준비 단계에서 실패했다. 본 테스트를 실행한 뒤 실패한 것이 아니다. 최초 CLI가 원시 오류를 출력하지 않았으므로 당시 errno를 직접 확인했다고 단정하지 않는다. 컨테이너의 workspace·temp 분리 mount와 rename의 EXDEV 경로를 점검해, 해당 경우만 copy → 디렉터리 목록·파일 bytes·symlink 일치 검증 → 원본 제거 순서로 보완했다. 복사 실패·불일치·다른 권한 오류는 원본을 보존하며 계속 실패한다. 실패 단계와 allowlist 오류 코드만 출력하고 실제 경로·내용·stack은 공개하지 않는다.

EXDEV 주입·symlink 보존과 복사 실패·불일치·권한 거절 회귀 2개를 추가했다. 새 경계 12개와 기존 브라우저 CI 6개, 타입 검사는 통과했다. [보완 재실행](https://github.com/IMHOJEONG/web-tech/actions/runs/44422823588)에서 컨테이너 8개 모두 준비 단계에 성공했고 UI 두 suite·단위·타입·lint도 통과했다. 이 시점의 브라우저 전체는 진행 중이므로 최종 성공과 구분한다. CodeRabbit의 mount 경계·ADR 상태 목록·격리 사본 재현 절차 지적도 같은 범위에서 보완했다. 문서의 git archive → 원문/비밀 파일 제외 → export 함수 호출은 별도 임시 사본에서 직접 실행해 published 17개 준비를 확인했다.

### 합성 이미지 계약 보완

보완 재실행에서 모바일·태블릿·데스크톱 responsive suite와 CRP·공용 UI·단위 검사는 성공했다. 오프라인 suite는 58개 통과·이미지 fallback 4개 실패였다. 합성 metadata에 thumbnail이 없어 이미지 카드가 렌더되지 않은 것이 해당 assertion 실패 원인이다. 기존 공개 도식 하나를 합성 thumbnail로 지정하고 실제 에셋 존재·비기본 경로 회귀 1개를 추가했다. 검사 파일·기대값·timeout·retry는 바꾸지 않았다.

로컬 격리 사본에서 기존 이미지 장애 검사를 그대로 실행해 모바일·데스크톱 4개 모두 통과(31.4초), 전체 저장소 275개와 lib 370개도 통과했다. 해당 E2E가 이미지의 loading 속성을 직접 바꾸는 과정에서 hydration 경고가 발생했으나 실제 assertion 실패는 없었다. 경고 제거를 이번 작업의 완료 항목으로 주장하지 않는다. 아래 명령은 runbook에서 만든 합성 사본 루트에서 실행한다.

```sh
pnpm --filter docs exec playwright test --config=playwright.offline.config.ts offline-e2e/image-fallback.spec.ts
```

### 이전 통합 작업 트리의 관측과 구분

분리 전 미커밋 이전 구현을 포함한 통합 사본에서는 CI 9개/저장소 271개·콘텐츠 47개·lib 373개·합성 빌드가 통과했다. 초기 UI 사전 빌드 누락과 PostCSS 포트 EPERM 실패 뒤 준비·권한을 갖춰 다시 검사한 결과다. 첫 태블릿 검사에서는 fixture 제목 3건과 IME 1건이 실패했다. 제목 계약만 보충했고 검사·timeout·retry는 변경하지 않았다. 두 번째는 145개 통과·기존 조건 25개 skip·ECONNRESET 1건 실패, 최종 세 번째는 같은 171개 대상에서 146개 통과·25개 skip·실패 0개였다. IME·연결 실패의 근본 원인은 미확정이다.

그 통합 사본의 실제 발행본도 동일 SHA로 새 빌드 후 키 없이 검색·목록·한영 상세 34개를 확인했지만, 이번 CI 전용 변경만으로 재현한 결과가 아니며 원격 승인 job 성공도 아니다. 이전 Environment 조회 404와 실제 승인·키 등록 미실행을 유지한다.

## 한계와 후속 작업

인증 사전 검사는 별도 이전 구현이 main에 반영되기 전에는 의도적으로 실패한다. 파일 존재·빌드 명령·lock 검사만으로 코드의 안전성을 증명하지 않으며, 승인된 main 검토와 사람 승인이 별도로 필요하다. 자기 승인을 금지하므로 실행자와 승인자가 다른 신원이어야 한다. 공유 관리자 계정의 사용자·AI 권한 분리도 별도 과제다.

이번 범위에는 main 병합·수동 인증 CI 실행·운영 전환·NAS 변경이 없다. 원시 로그·trace·실제 응답·키는 공개하지 않는다. 기존 미커밋과 stash를 보존하고, CI 전용 브랜치에서만 공개 검수와 커밋을 수행한다.

## 관련 문서

- [ADR-0033](../../architecture/adr-0033-content-ci-trust-boundary.md)
- [CI 실행 절차](../../runbooks/docs-private-content-ci.md)
- [작업 기록](../../worklog/2026-11/2026-11-18-content-ci-isolation.md)
- [KAN-80](https://web-tech-service.atlassian.net/browse/KAN-80)
- [Confluence 기존 구현 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=18415624)
