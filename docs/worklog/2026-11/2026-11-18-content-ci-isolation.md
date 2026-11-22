# 일반 PR과 승인된 콘텐츠 CI 분리

## Summary

KAN-80의 비공개 콘텐츠 이전을 이어서 일반 PR은 공개 합성 문서를 사용하고, 실제 발행본은 승인된 main과 보호 Environment에서만 읽도록 로컬 구현했다. 운영 전환·원격 설정·새 키 발급은 하지 않았다.

2026-11-19 후속으로 main `7fc4d127` 기반 새 작업 트리에 실행 Bot·사람 승인 ID, 코드/콘텐츠 SHA, 실제 승인 이력의 재검사를 추가했다. 이 보완은 로컬-only이며 실제 App·Environment·키 설정이나 인증 CI 활성화 완료가 아니다.

## Changed

- 일반 CI 모든 코드 job에 비밀값 없는 합성 corpus 준비를 연결했다. 로컬 교체는 거절하고 임시 hosted checkout의 이전 입력을 runner 임시 공간에 보존한다.
- 수동 main workflow의 승인 SHA·Environment 보호 사전 검사, key의 검증 step 한정 전달, 캐시·artifact·배포 없는 인증 경로를 추가했다.
- 새 경계 회귀·정확한 검색 URL 집합 검사와 전용 타입 검사를 추가했다. 기존 suite·timeout·retry는 유지한다.
- [ADR-0033](../../architecture/adr-0033-content-ci-trust-boundary.md), [실행 절차](../../runbooks/docs-private-content-ci.md), [검증 보고서](../../verification/content/2026-11-18-content-ci-isolation.md)를 연결했다.

## Notes

### 11-19 실행자·승인자 분리

workflow의 비밀이 아닌 네 신원 변수와 콘텐츠 승인 revision 입력을 추가했다. 허용 Bot의 login/ID·event sender·초기/재실행 actor·원격 run 메타데이터·코드 SHA를 대조하고 모든 재실행을 새 dispatch로 대체한다. 지정한 사람 한 명의 Environment 정책과 실제 approval history를 키 전달 직전에 다시 확인한다. 공개 검수·고정 콘텐츠 revision·설치 훅 비활성화·키 없는 runtime·원시 자료 비공개 기준은 유지한다.

[회귀·명령·실패·미검증 범위](../../verification/content/2026-11-18-content-ci-isolation.md#2026-11-19-실행-bot사람-승인-분리-보완)에 합성 경계 27개·기존 브라우저 CI 6개·저장소 298개와 전용 타입 결과를 정리했다. 기존 작업·비공개 보관 자료는 수정하지 않고 별도 작업 트리에서만 설치·검사했다. 원격 인증 CI·키 생성·권한/보호 설정·커밋·푸시는 미실행이다.

지식 승격은 [Confluence 주제 문서](https://web-tech-service.atlassian.net/wiki/pages/19922945)에 실행자와 승인자의 차이, 자격 증명 분리와 재실행/승인 이력의 판단 기준을 정리했다. 기존 운영 안내 하위의 주제 페이지이며 작업 댓글과 구분한다. 저장소 ADR-0033·runbook은 구현 원본으로 보완하고 지식 색인에 연결했다. 공통 AGENTS/CLAUDE 지침은 바꾸지 않았다.

필요한 실제 변경은 [최소 설정 표](../../runbooks/docs-private-content-ci.md#승인-전-확인할-최소-설정)의 App 설치/최소 dispatch 권한·분리된 런처·신원 변수·Environment·CI 전용 read-only 키다. 사용자 확인 전 등록하거나 기존 Vercel 키를 옮기지 않는다. 공개 문서 재검수·해시 갱신과 커밋·PR은 후속 승인으로 구분한다.

기존 미커밋과 stash는 유지한다. 일반 CI의 fixture를 실제 앱 작업 트리에 덮어쓰지 않았으며 별도 임시 사본에서 원문 없는 검사를 수행했다. 원시 결과·화면·인증 값은 공개하지 않는다.

11-19 사용자 승인 범위에 따라 최신 main `a7e095c5` 기반 CI 전용 브랜치로 분리했다. 미커밋 콘텐츠 로더·빌드·lock·원문·자산·이전 설계 문서는 포함하지 않는다. 인증 검증기가 이전 작업의 로더를 가져오던 의존성을 없애고, 독립 lock 검증과 통합 사전 검사로 바꿨다. 별도 이전 구현이 main에 없으면 키 사용 전 차단한다. 코드·설정 7개와 정제 문서·목차 8개만 공개 검수하고 작업별 커밋·푸시·PR 및 일반 원격 CI를 확인한다. main 병합·운영 전환·수동 인증 CI 실행은 하지 않는다.

추적: [KAN-80](https://web-tech-service.atlassian.net/browse/KAN-80), [Confluence 기존 구현 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=18415624). CI의 Environment 미설정과 로컬 성공을 구분해 기록한다.

## Open Questions

- Environment와 네 신원 변수는 사용자 설정 후 정책 대조를 통과했다. 실제 실행 환경과 App 런처의 자격 증명 분리를 언제 준비할 것인가?
- 원격 CI 활성화와 전용 읽기 키 설정은 언제 승인할 것인가?

### 11-19 사용자 설정의 읽기 전용 검증

첫 조회에서 자기 승인 금지가 꺼져 있어 기존 정책 검사기가 차단했다. 사용자가 해당 옵션을 켠 뒤 재조회해 지정 사람 한 명·자기 승인 금지·관리자 우회 금지·정확한 main branch 하나와 네 신원 변수가 모두 통과했다. Environment secret은 0개이며 에이전트가 설정·키를 생성하거나 등록하지 않았다. 같은 경계/브라우저 CI 33개도 재실행해 통과했다. [조회 명령과 최종 관측](../../verification/content/2026-11-18-content-ci-isolation.md#2026-11-19-사용자-설정-후-실제-environment-대조)을 남겼다.

후속은 미커밋 보완 코드의 공개 검수·PR·main 반영, 관리자 자격 증명과 분리한 실행 환경·런처 준비다. App 개인키와 CI 전용 콘텐츠 읽기 키는 아직 만들지 않는다. 이번 조회 결과는 실제 인증 CI 활성화가 아니며 Production·NAS·기존 Vercel 키는 변경하지 않았다. 기존 지식 문서의 판단 기준을 적용한 후속 검증이므로 새 Confluence 주제 페이지는 만들지 않고 기존 진행 기록만 갱신한다. 공통 AGENTS/CLAUDE와 기존 미커밋·stash는 유지한다.

### 11-19 공개 승인 후 작업별 커밋·PR 준비

사용자가 CI 코드·workflow 4개와 위 기존 문서 8개의 공개 검수·해시 등록·커밋·푸시·PR 준비를 승인했다. 코드·회귀와 정책·정제 기록을 나눠 커밋하며 승인된 문서 8개의 최종 인덱스 해시만 등록한다. 범위 밖 원문·키·원시 자료·초안·다른 작업 트리·stash는 포함하지 않는다. 실제 원격 head와 CI 결과는 KAN-80의 기존 3열 표와 PR에서 추적한다. 이번 승인에 main 병합·키 생성/등록·실제 인증 workflow 실행은 포함되지 않는다.

[PR #101](https://github.com/IMHOJEONG/web-tech/pull/101)의 최초 head `a4feed93`는 일반 CI 13개 job·문서·CodeQL·보안·두 Preview를 통과했다. CodeRabbit 문서 의견 2건 중 설정 상태 목차를 보완했고, 사용자 추가 공개 승인에 따라 [후속 ADR-0034](../../architecture/adr-0034-content-ci-identity-approval.md)를 추가한다. 기존 ADR-0033의 결정 본문은 변경 전대로 보존하며 경로 분리 결정을 폐기하지 않는다. 관련 승인 문서·목차만 재검수하고 보완 head를 다시 확인한다. 실제 키·인증 실행·main 병합·배포는 계속 제외한다.

### 11-20 PR #101 병합과 배포 확인

사용자 승인 후 최종 메시지 전체·예상 head·공식 CodeRabbit 한도 예외를 `pr:squash`로 재검사해 [PR #101](https://github.com/IMHOJEONG/web-tech/pull/101)을 main `c6465f48`로 병합했다. 실제 메시지 해시도 일치한다. 동일 SHA의 일반 CI 13개 job·문서·CodeQL과 블로그 Production READY·공개 도메인 연결, 인증 없는 목록·검색·한영 상세·자산·실제 Chromium 4조건 검증이 통과했다. [조건·명령·결과·한계](../../verification/content/2026-11-18-content-ci-isolation.md#2026-11-20-pr-101-병합일반-ciproduction-확인)에 상세를 남겼다.

키 생성·등록·실제 인증 workflow 실행·NAS·GitHub 보호 설정은 변경하지 않았다. 인증 workflow와 Environment secret은 각각 0개를 재조회했다. 다른 작업 트리 20곳과 시작 stash 목록도 동일하다. 사용자 승인에 따라 보고서와 이 worklog 두 파일만 로컬 갱신하며 새 검수 해시·커밋·푸시는 하지 않는다. 공통 AGENTS/CLAUDE도 변경하지 않는다.

이번에는 기존 권한 분리 결정의 병합·운영 확인이므로 새 지식 페이지는 만들지 않는다. [기존 Confluence 주제](https://web-tech-service.atlassian.net/wiki/pages/19922945)에 main 반영과 실제 인증 CI 미활성 상태·원본 링크를 구분해 갱신하고, 실행 이력은 KAN-80의 3열 표와 기존 운영 댓글에서 추적한다. 실제 실행 환경·런처·전용 키는 사용자 준비·승인 후 검증할 후속이다.

## Next

이미지 보완 head의 원격 CI에서는 오프라인을 포함한 나머지 suite는 통과했지만 상세 production 22건이 관련 글/prefetch 대기에서 실패했다. 합성 날짜가 원격 fixture보다 새로워 링크가 관련 글 3개에서 탈락하는 것을 실제 정렬 함수로 재현했다. 기본 합성 날짜만 고정해 최신 Brotli fixture와 기존 검사 기준은 유지했다. 로컬 production 전체는 200개 대상 중 198개 통과·기존 opt-in 2개 skip·실패 0개(2.3분), 저장소 276개와 타입 통과. 원격 성공은 최종 head CI에서 별도로 확인한다. 원시 자료·기존 콘텐츠 이전 변경은 계속 제외한다.

후속 원격 실행은 responsive 세 폭·CRP·공용 UI·단위를 통과했지만 오프라인 이미지 4건이 합성 thumbnail 누락으로 실패했다(나머지 58건 통과). 기존 공개 도식 경로만 합성 metadata에 추가하고 회귀 1개를 추가했다. 기존 이미지 E2E는 로컬 양 폭 4개 모두 통과, 저장소 전체 275개·lib 370개 통과. hydration 경고는 별도 잔여 관측으로 기록하며 기존 검사·timeout·retry는 유지한다.

CI 분리·정제 문서 커밋 뒤 [PR #97](https://github.com/IMHOJEONG/web-tech/pull/97)을 생성했다. 첫 원격 실행의 컨테이너 준비 실패는 검증된 cross-mount 백업 보완 커밋 `91ad94b9`와 원본 보존 회귀 2개로 점검했다. 보완 후 로컬 전체 274개·타입 검사가 통과했고 실제 컨테이너 8개 준비·공용 UI 두 suite·단위·lint·타입도 통과했다. 브라우저 전체는 진행 중으로 구분한다. ADR 상태 목차·격리 사본 재현 명령 리뷰도 보완하고 같은 문서 범위만 재검수한다. 최종 원격 결과는 PR checks와 KAN-80의 기존 3열 표에 기준 head와 함께 기록한다.

분리 전 통합 사본의 빌드·태블릿·실제 발행본 검증은 [보고서](../../verification/content/2026-11-18-content-ci-isolation.md)의 과거 관측으로 구분했다. 이번 CI 전용 브랜치는 경계 10개·기존 브라우저 CI 6개를 포함한 저장소 272개, 전용 타입 검사, 합성 콘텐츠 36개·라이브러리 370개를 통과했다. 최초 localhost EPERM 실패 뒤 권한을 갖춰 같은 검사를 재실행했으며 기준·timeout·retry는 변경하지 않았다.

검수·main 반영·보호 Environment 준비 뒤 수동 인증 workflow를 검증한다. NAS 전용 글은 사용자가 수동 이전하며 이번 작업에서 운영 전환하지 않는다.
