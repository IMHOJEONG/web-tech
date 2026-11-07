# 11-07 Dependabot 신규 경고 보완

## Summary

main `932ee082` 기반 별도 보안 브랜치에서 신규 경고 11건을 조사했다. 실제 수정 대상 10건은 패치 또는 미사용 인증 경로 제거로 보완했고, 공식 철회된 deepmerge #351만 사용자 승인 후 오탐 처리·재조회했다. 이후 PR #88 생성·검토와 리뷰 보완을 진행했다. 현재 승인 범위는 이번 보완·검사·정제 문서 2개의 공개 검수·작업별 커밋·푸시, 새 head의 CI·재리뷰 확인 및 해결된 스레드 처리이며 main 병합·배포는 포함하지 않는다.

## Changed

- docs의 사용하지 않는 Better Auth 직접 의존성과 catalog·잠금 경로를 제거했다.
- qs·Seroval·Hono Node adapter·glob·minimatch의 안전 하한을 지정하고 루트 잠금 파일을 갱신했다. 새 메이저의 소비자 호환성은 실제 실행으로 검사했다.
- 실제 소비 경로와 잠금 파일 전체를 검사하는 [회귀 9개](../../../scripts/security-november-advisories.test.mts), 제한된 자식 프로세스 [parser fixture](../../../scripts/security-fixtures/november-parsers.mts)를 추가했다.
- [검증 보고서](../../verification/security/2026-11-07-dependabot-advisories.md)에 공식 근거·명령·패치 전후·기존 빌드 실패·운영 미검증 범위를 분리했다.

## Notes

- [KAN-64](https://web-tech-service.atlassian.net/browse/KAN-64)와 [Confluence 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=15990835)에 연결했다. 기존 Confluence 본문과 미게시 편집은 덮어쓰지 않았다.
- 저장소 236개·블로그 라이브러리 354개·production E2E 198개가 통과했다. 기존 opt-in 2개는 skip이며 판정·재시도 기준은 그대로다. 두 Nest 빌드와 테스트 및 두 웹 앱 lint·타입도 통과했다. 자세한 범위는 보고서를 따른다.
- production audit 0건. 전체 audit에는 공식 REJECTED deepmerge Low 1건이 여전히 남는다. audit 무시 규칙이나 가짜 패치 버전은 추가하지 않았다.
- 기존 사용자 미커밋 문서 2개·stash·원시 자료·NAS 설정·자격 증명을 보존했다. 사용자의 이번 커밋·푸시 승인에 따라 목차를 포함한 정제 문서 4개만 검수하고 최종 해시를 기록한다. 원시 로그·실제 응답은 포함하지 않는다.
- 공유 Git 훅 경로에는 `pre-commit`·`commit-msg`가 있으며 실제 커밋 시 실행을 확인했다. `pre-push` 파일은 없어 공개 검수를 별도로 실행하고, 포맷·문서·최종 메시지도 직접 재검사한다. 훅 설정·검사 기준은 바꾸지 않으며 커밋 범위 공개 검사도 푸시 전에 실행한다.
- 새 구조·데이터 흐름·공개 계약을 도입하지 않아 ADR은 추가하지 않았다. 미사용 의존 제거와 기존 보안 override 보완 범위다.
- 후속 사용자 승인으로 [PR #88](https://github.com/IMHOJEONG/web-tech/pull/88)을 생성했다. head `42f4740`의 원격 CI 13개 job·전체 check 23개가 성공했지만 태블릿 1건은 최초 클릭 실패 후 재시도로 통과했다. 원인·안정화는 미확정이다.
- CodeRabbit 리뷰 2건을 현재 코드와 대조했다. cold `test:cov --runInBand --no-cache`는 test-exclude/glob의 promisify TypeError로 13개 suite가 실행되지 못했다. 패키지명 정규식은 합성 unrelated 이름도 매칭했다. 두 스레드는 미해결로 유지했고 코드 수정·기준 완화·병합은 하지 않았다. 상세 근거는 검증 보고서를 따른다.
- PR 생성·원격 검사·리뷰 확인의 정제 결과는 처음에 로컬에만 갱신했고 원격 `42f4740` 문서와 구분했다. 후속 사용자 승인으로 이번 보완의 정제 문서 2개만 재검수하고 최종 해시를 갱신한다. 기존 다른 미커밋·stash·NAS는 그대로 보존한다.
- 후속 미해결 의견 조치 요청으로 공식 test-exclude 8.0.0을 확인한 Istanbul 소비자에만 적용하고 Better Auth 정규식의 이름 경계를 수정했다. glob/minimatch 보안 하한·coverage provider·검사 기준은 유지한다. lock 교체는 test-exclude 한 개다.
- 수정 전 새 회귀 3개 실패를 확인했고, 보완 후 보안 회귀12·저장소239·strict 타입·양쪽 backend lint·catalog가 통과했다. 실제 cache 없는 coverage는 docs-backend 73개와 vuln-radar-backend 48개 테스트가 통과했다. 합성 Jest fixture는 제외 경로와 실제 hit도 검사한다. macOS 임시 경로의 realpath 보정은 검사 실패를 숨기지 않고 같은 파일을 비교하기 위한 수정이다.
- 이번 보완의 로컬 검사와 원격 head42f4740의 기존 CI 성공을 구분한다. 사용자 승인에 따라 커밋·푸시 후 새 head의 원격 결과를 재확인하며 이전 원격 리뷰·태블릿 최초 실패 기록은 보존한다. 원시 로그·실제 응답·커버리지 산출물은 업로드하지 않는다.

## Open Questions

`vuln-radar` 빌드의 경로 별칭 resolution 실패는 원래 main에서도 재현된다. 이번 보안 변경과 분리해 원인과 원격 CI 결과를 확인해야 한다.

## Next

PR #88의 새 head에 대한 CI·CodeRabbit 재리뷰와 실제 반영을 확인하고 해결된 스레드만 처리한다. 최종 결과는 연결된 이슈·Confluence에 검증 SHA로 남긴다. 태블릿 flaky는 별도 원인 조사 대상이다. main 병합·배포는 별도 승인 후 진행하며, 병합 후 나머지 10건의 fixed 전환과 배포 이미지를 확인한다. 실제 NAS 설정은 이번 범위에서 변경하지 않는다.
