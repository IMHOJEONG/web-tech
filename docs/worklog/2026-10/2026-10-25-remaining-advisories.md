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

### 병합 전 검사 보완

후속 사용자 병합 요청 시 PR #61의 일반 CI는 성공했지만 CodeQL High #42와 미해결 스레드가 있었다. 테스트 fixture의 요청 반사를 고정 JSON으로 바꾸고 JSON·nosniff 헤더의 런타임 assertion을 추가했다. 기존 요청 파싱·종료 검증은 유지하며 신규 16개 통과, 저장소 회귀도 재검사한다. 실제 경고의 ref가 PR head였으므로 merge ref 0건만으로 통과를 판단하지 않도록 검증 보고서에 남겼다. 원격 재검사·리뷰 해결 확인 전 병합하지 않는다.

main 병합은 자동 Production·Railway 배포와 이미지 게시를 유발할 수 있어 이전 운영 배포 보류와의 범위를 사용자에게 확인 요청했다. 허용 답변 전에는 main 병합이나 운영 배포를 실행하지 않는다.

PR #60과 이번 패치를 결합한 lockfile·audit 및 Linux/운영 검증은 아직 수행하지 않았다. KAN-35 전체 완료나 운영 취약점 해소로 표시하지 않는다. 같은 메이저의 간접 소비자 영향은 그래프와 회귀로 기록했으며 전체 공격 입력 공간을 검증한 것은 아니다.

## Next

이번 별도 PR의 새 head 기준 CI·CodeQL·리뷰를 확인한다. PR #60 병합 뒤에는 기준선 갱신과 lock 재검증이 필요하며 병합·배포는 별도 승인 전 실행하지 않는다.

### 후속 승인과 두 패치 통합

사용자가 두 PR 병합과 자동 운영 배포·이미지 게시를 후속 승인했다. PR #60을 main `51cdb40`에 squash 병합한 뒤 PR #61에 main을 통합했고 TODO·목차 4곳의 충돌은 두 기록을 보존해 해결했다. 최초 분리 검증·미배포 기록은 과거 상태로 유지한다. 수동 배포·NAS 교체는 승인 범위에서 제외한다.

결합 lock은 변경 없이 frozen 공급망 검사를 통과했고 전체/production audit 0건, repo 153·docs lib 285·콘텐츠 계약 22·radar lib 32·radar backend 48·docs backend 13+34·production E2E 154개와 peer/catalog 검사를 통과했다. 오프라인 metadata 부족·sandbox loopback EPERM의 최초 실패와 후속 성공은 검증 보고서에 구분했다. 새 구조·공개 계약 변경이 아니므로 ADR을 추가하지 않는다.

PR #60의 자동 배포·Railway 공개 health·이미지 게시를 확인했다. PR #61은 통합 커밋을 푸시해 새 CI·CodeQL·리뷰를 확인한 후 같은 squash 사전검사로 병합한다. 실제 최종 main·배포와 NAS 미교체 경계는 기존 Jira·Confluence에 후속 기록·재조회하며 현재 로컬 결과만으로 전체 운영 해소를 선언하지 않는다.

### 실제 main CI 재발 보완

PR #60 main과 PR #61 통합 head의 오프라인 suite에서 지연 RSC 전송 완료 assertion이 다시 실패했다. main artifact의 실제 ERR_ABORTED를 확인했으며 단순 이벤트 누락·헤더 보정 완료로 취급하지 않는다. native dispatch 지연·서버 warmup·임시 브라우저 계측·production 전환과 prefetch 통제도 대조했지만 안정적 해결을 입증하지 못했다. 상세 성공·실패 수와 한계는 검증 보고서에 둔다.

미채택 실험 파일·계측·warmup을 제거하고 원래 테스트·assertion·관측 helper·timeout/retry·위치를 복구했다. 사용자에게 UI 완료와 전송 완료 검사를 별도로 분리할지, 엄격한 조건을 유지하고 원인을 계속 조사할지 재확인했다. PR #60 병합·자동 배포는 완료됐지만 main CI 실패와 PR #61 미병합을 명확히 구분한다. 검사 우회·실패 이력 수정·수동 배포·NAS 교체는 하지 않는다.
