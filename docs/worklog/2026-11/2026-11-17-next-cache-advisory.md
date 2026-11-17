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

## Open Questions

- 미채택 Cache Components 전면 실험은 현재 앱 설정과의 호환성 정리가 별도로 필요하다. 이번 보안 패치의 완료 조건으로 운영 캐시 모델을 전환하지 않는다.
- 실제 악용·누출은 확인하지 않았다. 버전 영향 범위와 운영 사용 조건의 정적 점검을 구분한다.

## Next

최종 파일 공개 검수 후 패치·테스트·문서를 작업 단위로 커밋·푸시하고 main 반영용 PR의 CI·CodeRabbit을 확인한다. 실제 원격 SHA·검사 실행·리뷰 결과를 Jira·Confluence의 같은 요약 댓글에 갱신한다. 별도 병합·배포 승인 후 Dependabot #362 재평가와 같은 SHA의 운영 검증을 진행한다. 그 전까지 기존 운영 및 다른 미커밋 작업을 유지한다.
