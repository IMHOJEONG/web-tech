# 개발 이력과 ADR 관리 대조

## Summary

사용자 요청으로 최신 main의 ADR 20개를 코드·커밋·검증 증거와 대조했다. 작성·목차·기본 대체 관계는 유지되지만 의미 계약 1건, 부분 대체 연결, 채택 상태와 증거 갱신, ADR 전용 검사에 보완점을 확인했다. 정책·앱 코드를 자동 수정하거나 커밋·푸시하지 않았다.

## Changed

- [점검 보고서](../../verification/governance/2026-10-27-adr-governance-audit.md)에 F1~F5의 근거·우선순위·후속 순서를 기록하고 [관측 집계](../../verification/artifacts/2026-10-27-adr-governance-audit.json)를 연결했다.
- 번호 중복·목차 누락·깨진 상대 파일 링크·잘못된 날짜는 0건이었다. 단위 계산과 합성 검사 입력으로 두 관리 경계를 별도 확인했다.
- 기존 ADR의 당시 배경·결정·대안, 미검증 결과는 수정하지 않았다. 새 아키텍처 선택을 한 작업이 아니므로 신규 ADR을 만들지 않았다.

## Notes

- 감사 기준은 fetch 후 `origin/main e8ab3bd6`이며 현재 checkout `61a778c5`와 구분했다. checkout의 오래된 15개만으로 현재 상태를 판단하지 않았다.
- [KAN-39](https://web-tech-service.atlassian.net/browse/KAN-39)를 기존 이슈 검색 후 생성했다. [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817)는 감사 요약과 이미 존재하는 원격 근거를 연결하는 입구다.
- Jira 댓글 `10028`의 3열 표와 Confluence `v:154`의 감사 요약·main 근거 링크를 저장 후 재조회했다. Jira는 `검토 중`이며 다섯 개선 항목을 해결 완료로 표시하지 않았다. 로컬 보고서의 원격 링크는 만들지 않았다.
- GitHub에서 동일 main의 Vercel status success를 읽었으나 기능 운영 검증이나 NAS 배포 완료로 확대하지 않았다. 실제 토큰·쿠키·DB·비공개 원문은 조회·전송하지 않았다.
- 추가 감사 검토도 읽기 전용으로 수행했으며 제보된 입력 byte 단위 차이는 부모 작업에서 독립 재현했다.
- 2026-10-29 [KAN-51](https://web-tech-service.atlassian.net/browse/KAN-51) 정리에서 보존 커밋 `d7d10ca`의 감사 기록만 main `42e48b42` 위에 분리했다. 당시 기준·실패·미검증 범위를 유지했으며 현재 ADR 전체를 다시 감사하거나 지적을 해결한 작업은 아니다.

## Open Questions

- Vite+의 main 내 채택이 한시 실험인지 장기 채택인지, 부분 대체를 현재 ADR 상태에 표현할 형식은 후속 검토가 필요하다.
- NAS 컨테이너·실기기·미공개 미디어 제안은 이번 감사 대상이 아니다. main에 없는 0018 번호를 결함으로 확정하거나 재사용하지 않는다.

## Next

- 우선순위에 따라 계약 회귀와 부분 대체 관계부터 보완한다. 구현·main 병합·배포·운영 검증은 구분해서 상태와 목차에 연결한다.
- 이 보고서는 로컬 미커밋 상태이며 원격 permalink가 없다. 게시 승인 후에만 원격 링크를 Jira·Confluence에 추가한다. 감사 항목의 해결과 감사 완료를 혼동하지 않는다.
