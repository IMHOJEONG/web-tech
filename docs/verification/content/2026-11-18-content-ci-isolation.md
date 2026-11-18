# 합성 PR·인증 콘텐츠 CI 분리 검증

## 대상과 조건

2026-11-18 KST 착수, 11-19 CI 전용 공개 범위 검증. 기준 main은 `a7e095c5`, Node 24.22.1·pnpm 12.14.0·Next 16.4.6이다. 기존 콘텐츠 이전 작업과 분리한 브랜치에서 CI 코드·회귀·정제 문서만 준비한다. 원문·자산·이전 로더·lock·운영 전환은 포함하지 않는다.

일반 CI는 합성 published 17개·archived 1개를 사용한다. 인증 workflow는 별도 이전 구현이 승인된 main에 없으면 키 없는 선행 단계에서 거절한다. Environment·secret·NAS·Vercel 설정은 변경하지 않는다.

## 재현 방법

원본 작업 트리에서 합성 corpus 교체 명령을 실행하지 않는다. 교체 도구는 hosted runner·정확한 workspace·외부 임시 보관 위치를 요구한다. 로컬 검증은 비밀 파일과 원문 디렉터리를 제외한 별도 사본에 `writeSyntheticCorpus`로 입력을 준비한다.

```sh
node --test scripts/private-content-ci.test.mts scripts/browser-ci.test.mts
pnpm exec tsc -p tsconfig.private-content-ci.json
pnpm test:repo
```

격리 사본에서는 고정 lockfile로 의존성을 설치하고 공용 UI·콘텐츠 계약 패키지를 빌드한 뒤 기존 검사를 실행한다.

```sh
pnpm --filter @web-tech/ui build
pnpm --filter docs test:content
pnpm --filter docs test:lib
```

실제 인증 job의 준비 조건은 [CI 실행 절차](../../runbooks/docs-private-content-ci.md)를 따른다. PR 코드에 키를 주거나 수동 인증 workflow를 PR에서 실행하지 않는다.

## 결과와 증거

| 검사                   | 관측 결과                                                                                                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI 경계 회귀           | 10개 통과. 별도 이전 구현·고정 lock 누락, PR/target/다른 저장소/태그/가변·불일치 SHA, 보호 정책 누락·완화, 일반 CI 키 혼입·로컬 원문 교체를 거절한다. 검색 집합 오류·stale 빌드·키 직렬화도 실패한다.                 |
| 기존 브라우저 CI 계약  | 6개 통과. 이미지 digest·버전·실제 렌더 준비 검사를 유지한다.                                                                                                                                                          |
| 저장소 전체 검사       | 272개 통과. 위 16개를 포함하므로 별도로 더하지 않는다. 최초 샌드박스 실행의 기존 보안 검사 2개는 localhost listen EPERM으로 실패했고, 포트 권한 후 동일 전체 검사에서 통과했다.                                       |
| 전용 타입 검사         | 통과. 공개 main의 공통 tsconfig를 직접 확장하며 이전 작업의 타입 설정·로더를 가져오지 않는다.                                                                                                                         |
| 합성 콘텐츠·라이브러리 | CI 전용 격리 사본에서 콘텐츠 36개·라이브러리 370개 통과. 합성 문서 18개 frontmatter·본문 검사 통과. 콘텐츠 검사의 최초 localhost EPERM 실패는 권한 후 같은 검사로 재확인했다. 이전 통합 사본의 47개·373개와 구분한다. |
| 원격 CI                | PR 생성 후 확인한다. 로컬 검사를 원격 성공으로 표시하지 않는다.                                                                                                                                                       |
| 인증 경로              | 미실행. 이전 구현·보호 Environment·별도 승인자가 준비되지 않은 상태이며 실제 키 fetch 성공으로 표현하지 않는다.                                                                                                       |

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
