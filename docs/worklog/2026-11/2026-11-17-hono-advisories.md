# Hono Dependabot 5건 보완

## Summary

11-15에 시작한 Hono #357~361 조사를 11-17 KST에 재개해 로컬 패치와 소비자 검증을 마쳤다. 기준 main은 `3b5444edabe021dc18b62baa7e7060c9353c9c3a`, 격리 브랜치는 `codex/security-dependabot-20261115`다. 이후 사용자가 작업 단위 커밋·푸시·main 반영용 PR과 CI·CodeRabbit 확인을 요청했다. 이 기록은 최초 로컬 검증을 보존하고 후속 원격 진행은 Jira·Confluence와 PR에 연결한다. main 병합·운영 배포는 이번 요청에 포함하지 않는다.

## Changed

- Hono override를 `^4.13.16`으로 올리고 lockfile·설치 버전을 4.13.13에서 4.13.18로 갱신했다.
- Prisma의 실제 의존성에서 resolve하는 합성 보안 회귀 11개를 추가했다. 기존 `test:repo`와 CI 호출이 자동으로 포함하므로 별도 테스트 명령이나 CI 우회는 추가하지 않았다.
- [검증 보고서](../../verification/security/2026-11-17-hono-advisories.md)에 공식 권고·전후 대조·실패 이력·남은 경고를 정리하고 역할별 목차를 연결했다.
- 사용자 승인으로 생성한 [KAN-79](https://web-tech-service.atlassian.net/browse/KAN-79)를 진행 중으로 전환했다. Jira 3열 요약 댓글과 [Confluence 진행 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=18120705)을 작성·재조회했다. 로컬 문서를 존재하는 원격 파일처럼 링크하지 않았다.

## Notes

수정본 회귀 11/11과 저장소 262/262, 실제 소비자인 백엔드 build·typecheck·lint·unit 67개·HTTP 12개를 통과했다. 동일 보안 회귀는 기존 버전에서 11개 모두 assertion 실패했다. 전체 감사는 Hono 5건이 제거돼 기존 deepmerge Low 1건만 남고, 수정 후 production 감사는 0건이다. 상세 실행 명령과 한계는 검증 보고서를 원본으로 삼는다.

초기 fixture 3건 오류 및 sandbox listener 차단 2건을 정상 패치 결과와 구분해 기록했다. 경고 dismiss·audit 무시·가짜 패치·vendor 소스 수정은 하지 않았다. 설치는 `--ignore-scripts`로 제한했고 실제 DB·NAS·자격 증명을 사용하지 않았다.

[ADR 목록](../../architecture/README.md)을 확인했다. 전이 의존성의 보안 patch와 회귀 추가이며 구조·데이터 흐름·공개 계약·공용 UI 책임이 달라지지 않아 새 ADR은 만들지 않았다. 기존 초안·stash·다른 브랜치·개발 서버·NAS 작업은 유지했다. 문서 공개는 최종 파일별 승인과 일치하는 해시만 manifest에 반영한다.

## Open Questions

- 별도 기존 deepmerge Low 경고는 남아 있다. 이번 Hono 패치의 실패나 전체 감사 성공으로 표현하지 않는다.
- 취약 기능의 실제 운영 노출·악용 여부는 이번 로컬 합성 테스트로 확정할 수 없다.

## Next

최종 파일 공개 검수 후 설정·테스트·문서를 작업 단위로 커밋·푸시하고 main 반영용 PR의 CI·CodeRabbit을 확인한다. 원격 SHA·검사 실행·리뷰 결과를 Jira·Confluence의 같은 요약 댓글에 갱신한다. GitHub 알림은 로컬 검사 시점에 open이며 main 병합 후 재평가가 필요하다. 병합·운영 배포·실제 DB·NAS 검증은 별도 승인과 조건을 갖춰 진행한다.
