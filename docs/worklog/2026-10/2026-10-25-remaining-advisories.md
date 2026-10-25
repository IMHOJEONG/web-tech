# 나머지 보안 경고 10건의 분리 조치

## Summary

사용자 승인으로 PR #60 재검증 문서 2개를 `e14bfe7`에 커밋·푸시했다. 이어 최신 main `d0b25a5` 기반 별도 `codex/security-remaining-advisories-20261025`에서 KAN-35의 나머지 경고 10건을 로컬 조치했다. main 감사 13건 중 Next 3건은 PR #60에 그대로 분리했다.

## Changed

- toml·body-parser·multer·fast-uri override의 같은 메이저 패치 하한을 올리고, Zod 4.x 범위에만 적용하는 override와 소비자 직접 범위·catalog를 보완했다. 실제 설치는 toml 5.0.1·zod 4.6.7·body-parser 2.4.0·multer 2.5.0·fast-uri 4.2.3이다.
- 실제 의존 경로를 통한 회귀 16개와 제한된 TS 자식 프로세스 fixture를 추가했다. 루트 `test:repo`의 기존 glob이 자동 포함하며 검사·서명·감사 정책을 우회하지 않는다.
- [검증 보고서](../../verification/security/2026-10-25-remaining-advisories.md), 감사·그래프 JSON, 목차·기존 TODO에 이전 실패·후속 성공·미검증 범위를 연결한다. 같은 Jira KAN-35와 Confluence 기록을 갱신·재조회한다.

## Notes

전체/production audit은 대상 10건 제거 후 Next 3건만 잔여다. 신규 16개·저장소 147개·docs lib 285개·공용 계약 22개·vuln-radar lib 32개, docs-backend 13+34개·vuln-radar-backend 48+6개와 production 문서 154개를 통과했다. 관련 앱 lint·타입·build, peer·catalog·frozen/offline 설치도 성공했다. 정확한 명령·범위·초기 setup/기대값 실패는 보고서에 둔다.

PR #60 브랜치는 clean으로 보존했고 기존 TCP 초안과 다른 작업자의 미커밋은 건드리지 않았다. 최초 검증 당시 새 패치는 로컬 미커밋·미푸시였으며 새 PR·main 병합·운영 배포·DB/수집·자격증명 변경은 없었다. 운영 `.env`를 복사하지 않았고 API 검사는 mock/loopback으로만 수행했다.

### 후속 작업별 커밋·PR 승인

사용자 승인으로 패키지 패치 `3c4549b`(5개 파일), 회귀 `bcfe95d`(2개 파일), 검증 문서(7개 파일)를 별도 커밋으로 분리하고 main 대상 독립 PR을 생성한다. PR #60의 커밋을 가져오거나 브랜치를 변경하지 않는다. 신규 16개·저장소 147개를 다시 통과했고 기존 포맷·문서·commitlint 훅을 우회하지 않았다. 실제 원격 SHA·PR은 Jira·Confluence의 같은 항목에 연결하고 재조회한다. 푸시로 시작되는 CI·CodeQL·자동 Preview의 진행 상태와 선행 로컬 검증을 구분하며, 병합·운영/수동 배포는 하지 않는다.

## Open Questions

PR #60과 이번 패치를 결합한 lockfile·audit 및 Linux/운영 검증은 아직 수행하지 않았다. KAN-35 전체 완료나 운영 취약점 해소로 표시하지 않는다. 같은 메이저의 간접 소비자 영향은 그래프와 회귀로 기록했으며 전체 공격 입력 공간을 검증한 것은 아니다.

## Next

이번 별도 PR의 새 head 기준 CI·CodeQL·리뷰를 확인한다. PR #60 병합 뒤에는 기준선 갱신과 lock 재검증이 필요하며 병합·배포는 별도 승인 전 실행하지 않는다.
