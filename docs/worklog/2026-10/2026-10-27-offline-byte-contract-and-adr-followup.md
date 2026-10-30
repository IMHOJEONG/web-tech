# 오프라인 byte 계약 수정과 ADR 부분 대체 연결

## Summary

사용자 승인으로 ADR 감사 F1의 1MiB 입력 계약 오류를 먼저 수정·검증한 뒤 F2의 부분 대체 관계를 정리했다. 매 작업의 ADR 검토를 작업 지침·PR 템플릿·회귀에 연결했다. [KAN-39](https://web-tech-service.atlassian.net/browse/KAN-39)와 [Confluence 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817)에서 이전 감사와 후속을 구분한다.

## Changed

- 순수 UTF-8 입력 검사를 분리해 실제 스냅샷 생성 경로에 연결했다. 정확히1MiB는 허용하고 초과는 기존 size 오류로 종료하며 이전 저장본을 보존한다.
- 수정 전 실제 한글 저장 실패 기대를 재현하고, 12개 단위·개발 경계6개·전체 브라우저50개와 Production 경계6개를 검증했다. 상세 명령·실패/성공·소스 증거는 [보고서](../../verification/governance/2026-10-27-offline-byte-contract-and-adr-followup.md)에 연결한다.
- ADR-0009·0015의 상태/범위·양방향 링크와 목차를 보완했다. 당시 배경·결정·대안 본문은 HEAD와 동일하다.
- `AGENTS.md`·ADR 관리 절차·PR 템플릿에 매 작업의 검토 판단을 남기도록 했다. `CLAUDE.md`의 동일 지침 참조는 유지했다. 기존 repository test/CI에 포함되는 ADR 회귀3개를 추가했다.

## Notes

- 적용 ADR: 0009·0015. 판단은 `기존 결정 유지`이며 byte 계약의 구현 오류와 이미 존재하는 부분 대체 연결을 바로잡았다. 신규 선택을 소급 창작하거나 같은 결정의 ADR을 추가하지 않았다.
- 최신 main e8ab3bd 기반 별도 `codex/docs-adr-contract-20261027` 작업 공간을 사용했다. 기존 저장소의 미커밋 감사 파일·다른 작업 트리·브랜치는 그대로 보존했다.
- 첫 작업 단위는 `1ebfd34` (`fix(docs-app): enforce UTF-8 offline input limit`)로 커밋했다. 코드·입력 단위/브라우저 경계 테스트와 해당 작업 기록만 포함하며 ADR 관계·지침·통합 보고서는 후속 단위로 분리했다.
- docs319개·repository156개·앱 타입·변경 lint·로컬 Production 빌드 통과. 저장소 테스트의 최초154/2 실패는 localhost listen EPERM이며 승인 후 동일 명령156개 통과로 구분한다. 기존 TCP 글 placeholder 경고1개는 수정하지 않았다.
- 개인 `.env`·토큰·NAS·WAF·DB·실제 배포를 사용하거나 바꾸지 않았다. 아래 검증 보고서·artifact는 커밋 전 실행 시점을 보존한다. 이후 사용자 승인으로 [UTF-8 입력 수정](2026-10-27-offline-utf8-input-guard.md)과 ADR 관계·작업 절차를 두 커밋으로 분리해 작업 브랜치에 푸시한다. PR·main 병합·배포는 범위 밖이다.
- 구현 검증 시점에 Jira의 후속 댓글 `10029` 3열 표와 Confluence `v:155`의 F1·F2 요약을 저장 후 재조회했다. 이전 감사 댓글·문단을 보존하고 미푸시 변경의 원격 permalink는 만들지 않았다. 푸시 후 실제 커밋으로 같은 기록을 갱신하며 이슈는 검토 중을 유지한다.

## Open Questions

- F3 채택 상태, F4 다른 ADR의 후속 근거, F5 범용 ADR 검사는 별도다. 이번 세 개 회귀 검사를 전체 의미 검증이나 PR 본문 강제화로 설명하지 않는다.
- Safari/Firefox·실기기, 원격 CI와 운영 배포는 미검증이다.

## Next

- 승인된 두 커밋의 푸시 후 실제 SHA를 Jira·Confluence에 연결한다. PR·main 반영은 별도 승인 범위이며 공통 ADR 지침은 main 반영 후 다음 작업의 기본 규칙이 된다.
- 병합·배포 후 실제 확인한 SHA와 범위만 상태/목차에 연결한다. 당시 감사·실패 결과는 보존한다.
