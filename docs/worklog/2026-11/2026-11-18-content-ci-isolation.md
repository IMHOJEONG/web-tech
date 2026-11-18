# 일반 PR과 승인된 콘텐츠 CI 분리

## Summary

KAN-80의 비공개 콘텐츠 이전을 이어서 일반 PR은 공개 합성 문서를 사용하고, 실제 발행본은 승인된 main과 보호 Environment에서만 읽도록 로컬 구현했다. 운영 전환·원격 설정·새 키 발급은 하지 않았다.

## Changed

- 일반 CI 모든 코드 job에 비밀값 없는 합성 corpus 준비를 연결했다. 로컬 교체는 거절하고 임시 hosted checkout의 이전 입력을 runner 임시 공간에 보존한다.
- 수동 main workflow의 승인 SHA·Environment 보호 사전 검사, key의 검증 step 한정 전달, 캐시·artifact·배포 없는 인증 경로를 추가했다.
- 새 경계 회귀·정확한 검색 URL 집합 검사와 전용 타입 검사를 추가했다. 기존 suite·timeout·retry는 유지한다.
- [ADR-0033](../../architecture/adr-0033-content-ci-trust-boundary.md), [실행 절차](../../runbooks/docs-private-content-ci.md), [검증 보고서](../../verification/content/2026-11-18-content-ci-isolation.md)를 연결했다.

## Notes

기존 미커밋과 stash는 유지한다. 일반 CI의 fixture를 실제 앱 작업 트리에 덮어쓰지 않았으며 별도 임시 사본에서 원문 없는 검사를 수행했다. 원시 결과·화면·인증 값은 공개하지 않는다.

11-19 사용자 승인 범위에 따라 최신 main `a7e095c5` 기반 CI 전용 브랜치로 분리했다. 미커밋 콘텐츠 로더·빌드·lock·원문·자산·이전 설계 문서는 포함하지 않는다. 인증 검증기가 이전 작업의 로더를 가져오던 의존성을 없애고, 독립 lock 검증과 통합 사전 검사로 바꿨다. 별도 이전 구현이 main에 없으면 키 사용 전 차단한다. 코드·설정 7개와 정제 문서·목차 8개만 공개 검수하고 작업별 커밋·푸시·PR 및 일반 원격 CI를 확인한다. main 병합·운영 전환·수동 인증 CI 실행은 하지 않는다.

추적: [KAN-80](https://web-tech-service.atlassian.net/browse/KAN-80), [Confluence 기존 구현 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=18415624). CI의 Environment 미설정과 로컬 성공을 구분해 기록한다.

## Open Questions

- 자기 승인을 금지한 Environment의 실행자·승인자 분리를 언제 준비할 것인가?
- 원격 CI 활성화와 전용 읽기 키 설정은 언제 승인할 것인가?

## Next

후속 원격 실행은 responsive 세 폭·CRP·공용 UI·단위를 통과했지만 오프라인 이미지 4건이 합성 thumbnail 누락으로 실패했다(나머지 58건 통과). 기존 공개 도식 경로만 합성 metadata에 추가하고 회귀 1개를 추가했다. 기존 이미지 E2E는 로컬 양 폭 4개 모두 통과, 저장소 전체 275개·lib 370개 통과. hydration 경고는 별도 잔여 관측으로 기록하며 기존 검사·timeout·retry는 유지한다.

CI 분리·정제 문서 커밋 뒤 [PR #97](https://github.com/IMHOJEONG/web-tech/pull/97)을 생성했다. 첫 원격 실행의 컨테이너 준비 실패는 검증된 cross-mount 백업 보완 커밋 `91ad94b9`와 원본 보존 회귀 2개로 점검했다. 보완 후 로컬 전체 274개·타입 검사가 통과했고 실제 컨테이너 8개 준비·공용 UI 두 suite·단위·lint·타입도 통과했다. 브라우저 전체는 진행 중으로 구분한다. ADR 상태 목차·격리 사본 재현 명령 리뷰도 보완하고 같은 문서 범위만 재검수한다. 최종 원격 결과는 PR checks와 KAN-80의 기존 3열 표에 기준 head와 함께 기록한다.

분리 전 통합 사본의 빌드·태블릿·실제 발행본 검증은 [보고서](../../verification/content/2026-11-18-content-ci-isolation.md)의 과거 관측으로 구분했다. 이번 CI 전용 브랜치는 경계 10개·기존 브라우저 CI 6개를 포함한 저장소 272개, 전용 타입 검사, 합성 콘텐츠 36개·라이브러리 370개를 통과했다. 최초 localhost EPERM 실패 뒤 권한을 갖춰 같은 검사를 재실행했으며 기준·timeout·retry는 변경하지 않았다.

검수·main 반영·보호 Environment 준비 뒤 수동 인증 workflow를 검증한다. NAS 전용 글은 사용자가 수동 이전하며 이번 작업에서 운영 전환하지 않는다.
