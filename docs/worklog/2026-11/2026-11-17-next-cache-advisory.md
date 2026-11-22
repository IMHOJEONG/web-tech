# Next.js root-param 캐시 보안 업데이트

## Summary

Dependabot #362의 Next.js Medium 권고를 기존 Hono 작업과 분리해 로컬 패치했다. 기준 main `6b807f26fd878af38bdc144fdfe8f4af02585281`에서 새 작업 트리·브랜치 `codex/security-next-cache-20261117`을 만들었고, 기존 Hono 사후 문서 4개·초안·stash·NAS는 유지했다. 최초 로컬 검증 이후 사용자가 작업 단위 커밋·푸시·PR 생성과 CI·CodeRabbit 확인을 요청했다. 이 문서는 최초 검증을 보존하고 후속 원격 결과는 Jira·Confluence와 PR에 연결한다. main 병합·운영 배포는 이번 요청에 포함하지 않는다.

## Changed

- docs catalog의 Next·MDX 하한을 `^16.4.6`으로 올리고 실제 Next·MDX·env·SWC 잠금을 16.4.3에서 16.4.6으로 갱신했다. 미사용 web catalog의 취약한 Next 고정값도 16.4.6으로 정리했다.
- 기존 보안 테스트의 하한을 `>=16.4.5 <17`로 강화해 모든 Next catalog·관련 잠금 사본·설치 버전·Node 호환을 검사한다. 기존 이미지·Flight 검사는 유지하며 별도 기준 트리 대조 옵션을 추가했다.
- [검증 보고서](../../verification/security/2026-11-17-next-cache-advisory.md)에 공식 권고·공개 시점·실제 사용 조건·패치 전후 감사·회귀·실험 실패를 정리하고 역할별 목차를 연결했다.
- 중복 검색 후 사용자 승인으로 [KAN-82](https://web-tech-service.atlassian.net/browse/KAN-82)를 생성했다. [Confluence 진행 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=18513921)과 Jira 3열 요약 댓글을 연결한다. 미푸시 문서를 원격 파일처럼 링크하지 않는다.

## Notes

로컬 보안 게이트 6개·저장소 262개·docs lib 370개가 통과했다. 구버전 대조는 버전·catalog 검사 2개 실패와 정상 입력 대조 4개 통과로 보안 하한 거절을 확인했다. 기본 production 빌드·본문 E2E 198개 통과·기존 opt-in 2개 skip, 검색 인덱스 production 캐시·웹훅, lint·타입 검사가 통과했다. 전체 감사 Next Medium 1건이 패치 후 0건이며 production 감사도 0건이다.

Cache Components locale 실험은 패치 전후 모두 기존 route `runtime`·sitemap `revalidate` 설정 충돌로 실패했다. 초기 기준 트리의 공용 패키지 산출물 누락과 준비 후 재검사를 구분했다. 이를 패치의 운영 회귀나 실험 성공으로 표시하지 않고, 운영 캐시 정책을 바꿔 우회하지 않았다. 상세 결과·명령·한계는 검증 보고서가 원본이다.

[ADR 목록](../../architecture/README.md)을 확인했다. 기존 구조·캐시 정책·공개 계약을 유지하는 보안 patch이므로 새 ADR은 만들지 않았다. 프레임워크의 공식 수정 분기는 대조했지만 실제 cold-fill 공격 동시성은 재현하지 않았다. 원시 로그·인증 정보·운영 자료는 공개 파일에 복사하지 않았고 승인 manifest도 바꾸지 않았다.

### SecurityFatalError 조사 후속

사용자가 콘텐츠 전환 작업 보존과 별도 보안 조사를 요청했다. 동일 공지를 패치한 PR #96이 이미 있어 중복 의존성 변경을 만들지 않고, 그 head에서 별도 로컬 검증 브랜치를 만들었다. 설치 Next 16.4.3의 npm 공지와 실제 판정 함수를 대조해 GHSA-mfr8-8qww-v76h를 확인했고, 16.4.6의 unaffected와 표준 빌드 exit 0을 확인했다.

새 합성 회귀 4개는 보안 판정의 affected·unaffected·unknown을 구분한다. 기존 하한 6개와 함께 통과했으며 root test glob에 자동 포함된다. 공격 동시성이나 운영 유출을 재현했다는 뜻은 아니다. 블로그는 locale root params를 쓰지만 파일 기반 검색 캐시에 이를 중첩시키는 조합은 확인하지 못했다. [후속 검증 원본](../../verification/security/2026-11-17-next-cache-advisory.md#securityfatalerror-발생-경로-후속-확인)에 실제 명령·한계·결과를 추가했다.

이번 추가 회귀·문서는 미커밋이며 기존 PR #96의 파일·커밋·원격 검증 결과와 구분한다. 콘텐츠 전환 트리·원본 보안 브랜치·기존 작업·stash·NAS·인증정보는 변경하지 않는다. 기존 원시 자료와 승인 목록도 그대로 둔다.

후속 저장소 266개·docs lib 370개·실제 합성 production 검색 캐시·표준 빌드 exit 0·앱 lint·새 테스트 strict 타입 검사가 통과했다. production 감사는 모든 severity 0건이다. 기존 PR #96의 원격 체크 23개 성공은 재조회했지만 미커밋 추가 코드의 CI로 계산하지 않는다. 이번 후속에서는 브라우저 전체 E2E를 다시 실행하지 않았으며 새 커밋·푸시·병합·배포도 하지 않았다.

기록은 KAN-82의 후속 3열 댓글과 [Confluence 조사 후속](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=18644994)에 연결한다. 이전 PR #96의 요약 댓글은 덮어쓰지 않고 보존한다. 공개 검수 해시를 임의로 갱신하지 않으며 수정한 보고서·worklog는 재공개 승인 전 로컬에만 둔다.

## Open Questions

- 미채택 Cache Components 전면 실험은 현재 앱 설정과의 호환성 정리가 별도로 필요하다. 이번 보안 패치의 완료 조건으로 운영 캐시 모델을 전환하지 않는다.
- 실제 악용·누출은 확인하지 않았다. 버전 영향 범위와 운영 사용 조건의 정적 점검을 구분한다.

## Next

최종 파일 공개 검수 후 패치·테스트·문서를 작업 단위로 커밋·푸시하고 main 반영용 PR의 CI·CodeRabbit을 확인한다. 실제 원격 SHA·검사 실행·리뷰 결과를 Jira·Confluence의 같은 요약 댓글에 갱신한다. 별도 병합·배포 승인 후 Dependabot #362 재평가와 같은 SHA의 운영 검증을 진행한다. 그 전까지 기존 운영 및 다른 미커밋 작업을 유지한다.

## 사용자 승인 병합 후 결과

2026-11-17 KST, 사용자 요청으로 PR #96을 최종 메시지 사전검사 후 main `a7e095c5adf3eee214e741ed259a048a78ffe712`에 병합했다. 사전검사의 최초 gh PATH 오류는 경로만 보완해 재검사했으며 메시지 전체·같은 head·모든 검사·미해결 리뷰 없음과 예외 미사용을 확인했다.

동일 SHA의 main CI 13개 job·문서·이미지 게시·CodeQL 및 블로그/vuln-radar Production 배포 성공을 확인했다. 공개 블로그 GET 3개는 200이며 Dependabot #362가 자동 fixed 처리됐다. [병합 후 검증 원본](../../verification/security/2026-11-17-next-cache-advisory.md#pr-96-main-병합과-운영-확인)에 식별자를 기록했다.

콘텐츠 전환 브랜치에 새 main을 fast-forward하고 목차 두 기록을 합쳤다. 기존 소스 등 27개 변경은 그대로이고 기존 stash 10개를 유지했으며 이번 임시 stash만 ID를 검증해 제거했다. 전환 코드의 표준·private-git 출력 빌드가 모두 통과했다. 이 조사 브랜치의 추가 테스트와 문서는 여전히 미커밋이며 후속 푸시·원격 콘텐츠 변경·NAS/토큰 변경은 하지 않았다.
