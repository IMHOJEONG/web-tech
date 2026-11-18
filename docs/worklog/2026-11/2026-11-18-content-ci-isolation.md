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

분리 전 통합 사본의 빌드·태블릿·실제 발행본 검증은 [보고서](../../verification/content/2026-11-18-content-ci-isolation.md)의 과거 관측으로 구분했다. 이번 CI 전용 브랜치는 경계 10개·기존 브라우저 CI 6개를 포함한 저장소 272개, 전용 타입 검사, 합성 콘텐츠 36개·라이브러리 370개를 통과했다. 최초 localhost EPERM 실패 뒤 권한을 갖춰 같은 검사를 재실행했으며 기준·timeout·retry는 변경하지 않았다.

검수·main 반영·보호 Environment 준비 뒤 수동 인증 workflow를 검증한다. NAS 전용 글은 사용자가 수동 이전하며 이번 작업에서 운영 전환하지 않는다.
