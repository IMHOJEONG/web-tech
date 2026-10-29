# ADR-0024: 검증된 보조 리뷰 한도 초과의 병합 예외

## 상태와 범위

- 상태: 적용 중
- 대상: 저장소 squash 사전검사 도구의 GitHub.com CodeRabbit 체크
- 결정일: 2026-10-29
- 최종 검토: 2026-10-29
- 적용 위치: 사용자 승인 후 로컬 구현. main 병합·원격 정책 전파와 운영 배포는 별도 확인한다.

## 배경

PR #76은 CI와 보안 검사·Preview가 성공했지만 문서 보완 후 CodeRabbit 무료 리뷰 한도가 NEUTRAL을 반환해 all-SUCCESS 조건에 막혔다. 이용 한도를 실제 리뷰 실패와 같은 코드 품질 차단 사유로 취급하면 작은 후속 수정도 반복 대기한다. 사용자는 대기 대신 앞으로도 검증된 한도 초과만 예외 처리하도록 승인했다.

## 결정

다른 검사와 최종 메시지·head·리뷰 결정 검증은 유지한다. 공식 App의 동일 커밋 체크를 별도 REST 조회해 정확한 한도 결과인지 확인한 경우에만 advisory 예외로 기록한다. 사람의 변경 요청·실제 리뷰 실패·다른 neutral/skip에는 적용하지 않는다. 새 flag로 arbitrary check를 무시하거나 GitHub required checks를 바꾸지 않는다.

정확한 허용 조건과 변경 절차의 원본은 [squash 운영 절차](../process/squash-merge-preflight.md#coderabbit-리뷰-한도-예외)에 둔다. 출력은 `reviewPerformed: false`와 원본 check-run ID를 포함해 리뷰 미수행을 성공으로 위장하지 않는다. 메시지 검사와 실제 병합은 같은 도구를 계속 사용한다.

## 대안과 영향

- 모든 status의 SUCCESS만 기다리기: 단순하지만 코드 품질과 관계없는 한도에 게시가 지연된다.
- CodeRabbit 전체 무시: 실제 실패·변경 요청까지 놓칠 수 있어 거절한다.
- 모든 NEUTRAL/SKIPPED 허용: 출처와 사유가 불명확한 결과까지 허용하므로 거절한다.
- 검증된 App·head·정확한 한도 코드만 예외: 별도 API 조회와 공급자 형식 유지 비용이 들지만 허용 범위를 좁힐 수 있어 채택한다.

새 공급자나 형식에는 기본 차단한다. 추가 조회 실패 시에도 차단하므로 가용성보다 검증 신뢰도를 우선한다. 무료 대체 도구 도입은 권한·데이터·비용을 따로 검토하며 이번 결정으로 자동 설치하지 않는다.

## 관련 문서

- [검증 보고서](../verification/resilience/2026-10-29-coderabbit-rate-limit.md)
- [작업 기록](../worklog/2026-10/2026-10-29-coderabbit-rate-limit.md)
- [KAN-48](https://web-tech-service.atlassian.net/browse/KAN-48)
