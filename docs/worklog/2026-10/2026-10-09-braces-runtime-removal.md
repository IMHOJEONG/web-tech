# 로컬 파일 탐색의 운영 의존성 축소

## Summary

게시 검증 도구를 `c000e41`로 분리 커밋한 뒤 잔여 `braces` 과제를 진행했다. 출시되지 않은 패치를 강제하지 않고 docs 직접 `fast-glob` 경로를 제거했다. 저장소 전체 취약점 해결과 NAS 운영 검증은 별개다.

## Changed

- Node.js 기본 API의 반복형 순회를 카테고리·검색·빌드 revision이 공유한다. 공개 상태·URL·본문 파서는 그대로 유지한다.
- 숨김 경로와 심볼릭 링크를 제외하고 권한 오류를 전파한다. 기존 taxonomy 입력 경계를 유지한다.
- 로컬 문서의 Next 파일 추적을 명시하고 production 산출물 회귀 검사를 추가했다.
- docs manifest·catalog·lockfile에서 직접 fast-glob만 제거했다. 다른 작업의 글 초안·본문 회귀 runbook 변경은 포함하지 않는다.
- 결정 범위는 [ADR-0014](../../architecture/adr-0014-local-content-file-discovery.md), 실행 증거는 [검증 보고서](../../verification/security/2026-10-09-braces-runtime-removal.md)에 기록했다.

## Notes

라이브러리 216개, production 빌드와 E2E 4개, 변경 파일 lint를 통과했다. 현재 corpus 18개의 파일 집합·revision digest를 유지했다. 세 trace에 문서가 모두 포함되고 제거한 외부 glob 패키지 경로는 없었다.

production audit에서 braces는 사라졌지만 별도 경고 5건이 있고 전체는 7건이다. 특히 proxy-addr critical은 실제 패치 확인 후 main 기반 보안 후속 과제로 기록했다. 스트림 종료 오류 4건도 테스트 통과와 별도로 남겼다.

## Open Questions

- NAS 시험용 SSH 대상과 문서 경로, V1/V2 표식은 무엇인가?
- NAS 외부 백업의 저장소·도구·보존 기준은 무엇인가? 목적지를 임의 선택하거나 운영 파일을 변경하지 않았다.
- corpus 증가 시 비동기 순회 또는 빌드 manifest로 전환할 기준은 실측 후 확정한다.

## Next

현재 요청 순서인 3번의 제한된 구현을 완료한 후 2번 NAS 실제 게시·원복, 4번 외부 백업·격리 복원을 진행한다. 접속 정보와 대상 승인 전에는 운영 파일·백업을 변경하지 않는다. 별도로 critical 패치를 최우선 보안 과제로 검토한다.
