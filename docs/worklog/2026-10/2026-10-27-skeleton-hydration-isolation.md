# 반응형 스켈레톤 검사와 React DOM 소유권 분리

## Summary

PR #66의 반응형 재시도 7건을 조사했다. 테스트가 React 소유 DOM을 교체한 뒤 hydration이 제거하는 경쟁을 직접 재현하고 검사 문서를 분리했다.

## Changed

- 서버 골격을 같은 URL·CSS·폰트·화면 조건의 별도 JavaScript 비활성 문서에서 측정한다. 런타임 UI는 변경하지 않았다.
- 분리된 노드의 빈 computed style을 애니메이션으로 오판하지 않도록 측정 전에 연결 여부를 검사한다.
- 격리·모션/좌표 음성 대조·분리된 노드 회귀와 재실행 가능한 hydration 진단을 추가했다.
- 실패 로그·진단·조건은 [보고서](../../verification/accessibility/2026-10-27-skeleton-hydration-isolation.md)와 [artifact](../../verification/artifacts/2026-10-27-skeleton-hydration-isolation.json)에 연결한다.
- 후속 Minor 리뷰의 원본 증거 누락을 보완했다. 당시 Playwright JSON 보고서3개의 전체 개별 결과339개·인라인 측정 첨부309개를 보존하고 개인 절대경로만 치환했다. 보고서·artifact 목차에 정제본과 출처/무결성 기록을 연결했다. 원본이나 이전 집계는 덮어쓰지 않았다.

## Notes

- 신규 회귀 포함 75개를 3회씩 재시도 없이 실행해 225개 모두 통과했다. 앱·별도 진단 MTS 타입, 변경 파일 lint, 저장소 회귀156개도 통과했다. 기존 허용 오차·타임아웃·재시도 설정은 유지했다.
- ADR 검토: ADR-0003·0005 및 로딩 UX 정책의 기존 결정 유지. 앱 책임·데이터 흐름·공개 계약을 바꾸지 않았으므로 새 ADR은 만들지 않는다.
- [KAN-39](https://web-tech-service.atlassian.net/browse/KAN-39)와 [Confluence 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817)에 PR의 이전 CI와 로컬 후속을 구분해 기록한다.
- 기존 저장소의 미커밋 감사·다른 브랜치·비밀정보·배포 환경은 건드리지 않았다. 보고서와 artifact의 미커밋 표시는 로컬 검증 당시의 상태다. 이후 사용자 승인으로 이번 후속을 독립 커밋·푸시하고 PR #66에서 같은 head의 CI와 재시도 기록을 확인한다.
- 증거 링크 보완은 문서와 기존 결과의 정제·보관 작업이다. 브라우저를 재실행하거나 새로운 브라우저 통과 결과를 생성하지 않았다. 개별 결과·첨부 동일성, 해시·파일별1MiB 제한, 디코딩 첨부의 민감정보를 확인했다. 포맷 검사와 저장소 검증기 회귀156개도 통과했다. 공개 계약·앱·테스트 동작은 변경하지 않아 ADR의 기존 결정을 유지한다.

## Open Questions

- 원격 Linux CI 재검증과 운영 CLS·실기기 검증은 별도다. 정적 골격을 실제 전환 시간 검사로 일반화하지 않는다.

## Next

- PR #66의 후속 CI에서 체크 성공과 flaky·재시도0을 별도로 확인하고 실제 SHA·실행 링크를 PR·Jira·Confluence에 연결한다. main 병합과 배포는 별도 승인 범위다.
