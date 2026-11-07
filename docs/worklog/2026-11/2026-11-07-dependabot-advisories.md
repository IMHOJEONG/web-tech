# 11-07 Dependabot 신규 경고 보완

## Summary

main `932ee082` 기반 별도 보안 브랜치에서 신규 경고 11건을 조사했다. 실제 수정 대상 10건은 패치 또는 미사용 인증 경로 제거로 보완했고, 공식 철회된 deepmerge #351만 사용자 승인 후 오탐 처리·재조회했다. 후속 사용자 승인 범위는 이번 패치·검사·정제 문서의 작업별 커밋·푸시이며 PR·병합·배포는 포함하지 않는다.

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

## Open Questions

`vuln-radar` 빌드의 경로 별칭 resolution 실패는 원래 main에서도 재현된다. 이번 보안 변경과 분리해 원인과 원격 CI 결과를 확인해야 한다.

## Next

작업별 커밋·푸시 결과는 연결된 KAN-64·Confluence 기록에 원격 SHA로 남긴다. PR 생성·원격 CI와 main 병합은 별도 후속 단계다. 병합 후 나머지 10건의 fixed 전환과 배포 이미지를 확인한다. 실제 NAS 설정은 이번 범위에서 변경하지 않는다.
