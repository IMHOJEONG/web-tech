# 로컬 파일 탐색의 운영 의존성 축소

## Summary

게시 검증 도구를 `c000e41`로 분리 커밋한 뒤 잔여 `braces` 과제를 진행했다. 출시되지 않은 패치를 강제하지 않고 docs 직접 `fast-glob` 경로를 제거했다. 저장소 전체 취약점 해결과 NAS 운영 검증은 별개다.

## Changed

- Node.js 기본 API의 반복형 순회를 카테고리·검색·빌드 revision이 공유한다. 공개 상태·URL·본문 파서는 그대로 유지한다.
- 숨김 경로와 심볼릭 링크를 제외하고 권한 오류를 전파한다. 기존 taxonomy 입력 경계를 유지한다.
- 로컬 문서의 Next 파일 추적을 명시하고 production 산출물 회귀 검사를 추가했다.
- docs manifest·catalog·lockfile에서 직접 fast-glob만 제거했다. 다른 작업의 글 초안·본문 회귀 runbook 변경은 포함하지 않는다.
- 결정 범위는 [ADR-0014](../../architecture/adr-0014-local-content-file-discovery.md), 실행 증거는 [검증 보고서](../../verification/security/2026-10-09-braces-runtime-removal.md)에 기록했다.
- 10-09 사용자 요청으로 후속 NAS 게시 검증과 외부 백업·복원을 추후 점검 과제로 보류했다. 사유·재개 조건·완료 기준은 [TODO](../../todo/todo.md#추후-점검으로-보류한-nas-과제)에 유지한다.

## Notes

라이브러리 216개, production 빌드와 E2E 4개, 변경 파일 lint를 통과했다. 현재 corpus 18개의 파일 집합·revision digest를 유지했다. 세 trace에 문서가 모두 포함되고 제거한 외부 glob 패키지 경로는 없었다.

production audit에서 braces는 사라졌지만 별도 경고 5건이 있고 전체는 7건이다. 특히 proxy-addr critical은 실제 패치 확인 후 main 기반 보안 후속 과제로 기록했다. 스트림 종료 오류 4건도 테스트 통과와 별도로 남겼다.

## Open Questions

- NAS 게시 검증은 보안 조치로 SSH가 차단되어 보류했다. 사용자가 재개를 요청할 때 승인된 작업 경로와 시험 문서를 정한다. SSH 재개방을 선행 요구하지 않는다.
- NAS 외부 백업 저장소가 아직 없어 백업·격리 복원을 보류했다. 저장소와 운영 기준을 준비한 뒤 사용자의 재개 요청에 따라 점검한다.
- corpus 증가 시 비동기 순회 또는 빌드 manifest로 전환할 기준은 실측 후 확정한다.

## Next

3번의 제한된 구현은 완료했다. 대화의 2번 NAS 실제 게시·원복과 4번 외부 백업·격리 복원은 문서에만 남기고 자동으로 이어서 실행하지 않는다. 운영 파일·SSH 설정·백업을 변경하지 않았다. 별도로 critical 패치는 보안 후속 과제로 유지한다.
