# ADR-0037: 검증된 CodeRabbit 파일 수 제한을 보조 리뷰 예외로 기록한다

## 상태와 범위

- 상태: 적용 중
- 대상: GitHub.com CodeRabbit의 squash 사전검사. PR 브랜치 구현이며 main 전파는 병합 후 확인한다.
- 결정일: 2026-11-23
- 최종 검토: 2026-11-23
- 대체: [ADR-0024](adr-0024-advisory-review-rate-limit.md)의 일반 SKIPPED 차단 중 검증된 파일 수 제한 항목만 부분 대체한다. 기존 quota NEUTRAL 조건은 유지한다.

## 배경

PR #111의 CI·보안·Preview와 수동 리뷰 보완은 완료됐지만 Draft 해제 후 CodeRabbit이 116개 파일이 100개 제한을 넘었다며 SKIPPED를 반환했다. 기존 quota 예외와 다른 사유여서 사전검사는 정상적으로 차단했다. 사용자는 공식 CodeRabbit의 파일 수 제한만 검증된 예외로 추가하고 병합을 이어가도록 승인했다.

## 결정

실패·미완료 항목이 CodeRabbit 하나일 때만 공식 App·현재 head·양의 check-run ID·완료 상태를 REST의 모든 페이지에서 검증한다. 파일 수 제한은 SKIPPED와 정확한 제목·summary 첫 줄을 요구한다. 보고된 파일 수는 안전한 정수로 100보다 커야 하고, 같은 PR 조회의 전체 changedFiles 이하이어야 한다. 서비스 보고 수와 전체 변경 수를 같다고 가정하지 않고 두 값을 감사 출력에 구분한다. 지원한 제한은 현재 관측한 100개뿐이다.

다른 CI·보안·리뷰 상태는 모두 성공해야 한다. 일반 skip·실패·다른 neutral·진행 중·다른 공급자·중복 이름·조회 실패는 계속 차단한다. 사람의 변경 요청과 미해결 스레드는 예외가 아니다. GitHub required checks나 보호 규칙을 변경하지 않는다.

감사 출력에 원본 check-run ID·head·사유·보고 파일 수·전체 파일 수·제한·reviewPerformed=false를 기록한다. 자동 리뷰 미수행을 성공으로 표시하지 않는다. 사용자가 승인한 병합과 사전 코드 검토는 별도이며, 같은 검증 head와 전체 메시지를 기존 도구로 다시 확인한다.

## 대안과 영향

PR 분할은 독립된 범위를 나눌 수 있을 때 적절하지만 단지 봇 한도를 맞추려고 검증 기록을 제외하지 않는다. 모든 CodeRabbit skip을 허용하는 방식은 실제 실패나 불명확한 미수행도 허용하므로 제외한다. 선택한 방식은 공급자의 정확한 문구와 파일 수 의미가 바뀌면 다시 확인해야 하는 비용이 있다. 일치하지 않는 새 형식은 기본 차단한다.

## 관련 문서

- [squash 운영 절차](../process/squash-merge-preflight.md#coderabbit-파일-수-제한-예외)
- [검증 보고서](../verification/resilience/2026-11-23-coderabbit-file-limit.md)
- [PR #111](https://github.com/IMHOJEONG/web-tech/pull/111) · [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)
