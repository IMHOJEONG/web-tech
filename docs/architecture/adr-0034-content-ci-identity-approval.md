# ADR-0034: 인증 콘텐츠 CI의 실행 Bot과 사람 승인 신원 고정

## 상태와 범위

- 상태: 적용 중
- 대상: docs의 수동 인증 콘텐츠 CI 실행·승인 계약
- 결정일: 2026-11-19
- 최종 검토: 2026-11-19
- 보완: [ADR-0033](adr-0033-content-ci-trust-boundary.md)의 합성 PR/인증 경로 분리를 유지하며 실행 신원 고정·신규 dispatch 요구를 추가한다. 기존 ADR을 대체하지 않는다.
- 적용 위치: [PR #101](https://github.com/IMHOJEONG/web-tech/pull/101)의 코드·합성 회귀. main 미반영이며 키·격리 실행 환경·실제 인증 CI는 미준비다. Environment와 네 신원 변수의 조회·정책 검사 성공은 운영 활성화와 다르다.

## 배경

ADR-0033은 비신뢰 PR과 인증 콘텐츠 검증을 분리하고 자기 승인·관리자 우회를 금지했다. 하지만 어떤 실행 신원과 승인자를 허용할지, 재실행에서 이전 승인을 재사용할지는 고정하지 않았다. 현재 사용자 관리자 인증을 AI가 공유하는 상태에서 App 이름만 바꾸는 것으로 권한 분리를 완료했다고 볼 수 없다.

일반 사람 계정과 Bot을 함께 허용하거나 재실행마다 다른 actor가 개입하면 검토한 코드·콘텐츠·실행·승인 연결을 다시 판단해야 한다. 설정·메타데이터 조회가 실패했을 때 키 접근을 계속 허용하는 대신 사전 차단하는 쪽을 선택한다.

## 결정

1. 실제 콘텐츠 검증의 실행자는 지정 GitHub App Bot 하나로 제한한다. 비밀이 아닌 Repository variables의 login·숫자 ID를 초기 actor·event sender·triggering actor와 실제 run API에 대조한다. 승인자는 별도의 사람 login·숫자 ID 하나이며 Bot·Team·추가 reviewer는 허용하지 않는다.
2. 코드/workflow는 정확한 main SHA·workflow ref로 고정한다. 승인 입력은 이 코드 SHA와 같은 코드의 release lock에 적힌 콘텐츠 revision 모두에 묶는다. 다른 코드·콘텐츠·가변 ref는 키 사용 전에 거절한다.
3. `run_attempt == 1`만 허용한다. 실패한 실행도 Re-run jobs로 재개하지 않고 새 dispatch와 새 사람 승인을 요구한다. 편의성보다 매 실행의 승인 경계가 명확한 쪽을 우선한다.
4. 키 없는 선행 검사가 현재 Environment의 지정 사람 한 명·자기 승인 금지·관리자 우회 금지·main branch 하나를 대조한다. 사람 승인 후에도 동일 run·Environment의 실제 단일 승인 이력과 현재 보호 정책을 다시 읽는다. 조회 오류·불일치·승인 부재에서는 다음 키 사용 step으로 진행하지 않는다.
5. App 키는 소유자 승인 세션과 분리된 실행 환경·런처에 보관한다. App은 공개 코드 저장소의 최소 dispatch 권한만 사용하고 승인·관리자 권한을 가지지 않는다. CI 전용 콘텐츠 read-only deploy key와 Vercel 키는 별개이며 설치 단계·일반 PR에는 전달하지 않는다.

정책 코드와 JSON 검수 기록은 사람의 인증이나 격리 실행 환경을 대신하지 않는다. 현재 세션의 소유자 권한이 남아 있으면 완전한 권한 분리가 아니며 App PEM·CI 키 생성/등록은 별도 준비·승인 후 수행한다. 이 PR은 자동으로 설정을 생성하거나 인증 workflow를 실행하지 않는다.

## 대안과 영향

- 사람 수동 실행과 Bot 실행을 함께 허용: 시작은 쉽지만 실행·승인 역할의 식별이 약해져 제외한다.
- 실행자 이름만 검사: 계정 유형·이름 변경·다른 신원과의 혼동을 줄이기 위해 실제 숫자 ID와 원격 run 대조도 유지한다.
- 기존 run 재실행 허용: 운영은 편하지만 승인 재사용·triggering actor를 다시 판단해야 한다. 신규 dispatch로 제한해 실행과 승인을 새로 묶는다.
- 지정 Bot + 단일 사람 + 신규 실행: 별도 환경·키·런처 준비가 필요하고 설정 조회 오류도 실행 실패가 되지만 키 접근 전 명시적으로 차단할 수 있다.

신원 변경·복수 승인·재실행 재개가 필요해지면 새 결정으로 검토한다. 테스트 timeout·retry나 보호 정책을 낮추는 것으로 해결하지 않는다. 역할 분리의 실제 효과는 Bot dispatch → 사람 승인 대기 → 승인 이력 재조회 → 실제 발행본 검증까지 성공한 뒤에만 운영 확인으로 기록한다.

## 관련 문서

- [기존 경로 분리 ADR-0033](adr-0033-content-ci-trust-boundary.md)
- [실행 절차와 최소 설정](../runbooks/docs-private-content-ci.md)
- [회귀·실제 설정 조회 결과](../verification/content/2026-11-18-content-ci-isolation.md)
- [작업 기록](../worklog/2026-11/2026-11-18-content-ci-isolation.md)
- [실행 Bot·사람 승인 지식](https://web-tech-service.atlassian.net/wiki/pages/19922945)
- [GitHub 실행자 문맥](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#github-context)
- [GitHub 실행 승인 이력 API](https://docs.github.com/en/rest/actions/workflow-runs#get-the-review-history-for-a-workflow-run)
