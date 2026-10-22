# PR #40 CI 누적 시간 초과 보완

## Summary

PR Test job이 준비·단위·반응형·production 본문 검사를 모두 순차 실행하여 15분 예산을 소진한 원인을 확인했다. 작업별 예산과 runner를 분리하고 스켈레톤 검사에서 테마 적용 전 읽기 race를 보완했다.

## Changed

- `.github/workflows/ci.yml`: 단위·계약 job, 반응형 기기별·본문·CRP browser matrix, 기존 이름을 유지한 최종 `Test` 성공 게이트.
- `page-skeletons.spec.ts`: 비동기 테마 적용을 재시도형 locator assertion으로 확인한다.
- `tooling-config.test.mjs`: 테스트 범위·기기별 명령 유지와 최종 게이트 상태 16조합 검사.
- [원인·시각·재현 명령과 검증 보고서](../../verification/cache/2026-10-19-pr40-ci-timeout.md). 앱의 데이터 흐름·공개 계약은 바꾸지 않았으므로 별도 ADR을 추가하지 않았다.

## Notes

워크플로 문법, 저장소 검사, 실패 조건 반복 검사, 독립 production·전체 반응형·CRP 브라우저 검사와 docs lint/typecheck가 통과했다. 정확한 개수·실행 명령·조건부 제외는 보고서에서 관리한다. 검증 준비 중 공유 의존성 연결에 영향이 있었으며 동일 lockfile로 복구하고 기존 개발 서버의 본문 표시를 확인했다. 실패·복구 이력은 보고서에 보존한다. 비밀 환경 파일과 보존 중인 TCP 초안은 변경하지 않았다.

10-19 후속 승인에 따라 테마 검사는 `8e210a0`, CI 분리·회귀 검사는 `3a54288`로 커밋했다. 문서를 세 번째 커밋으로 묶어 `origin/feature/docs`에 함께 푸시하고 PR #40 자동 CI의 새 HEAD 결과를 확인한다. 이전 실패 실행을 다시 시작하는 방식은 사용하지 않는다. 각 커밋에서 포맷·문서·commitlint 훅을 유지하며, 목차의 보존 초안 항목은 부분 스테이징으로 제외한다.

## Open Questions

runner CPU·I/O 관측이 없어 PR 실행의 전반적 처리 속도 차이는 특정 원인으로 확정하지 않는다. 두 재시도만으로 모든 시간 차이를 설명하지 않는다.

## Next

푸시한 새 SHA의 PR CI matrix와 최종 `Test` 상태를 확인한다. 이 기록 작성 시점의 미검증 상태와 이후 원격 결과를 구분한다.
