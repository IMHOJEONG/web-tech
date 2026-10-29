# ADR-0022: 공통 설정의 사람 승인과 AI 신원 분리

## 상태와 범위

- 상태: 적용 중
- 대상: 모노레포 공통 설정·main 병합·AI 인증 환경
- 결정일: 2026-10-24
- 최종 검토: 2026-10-29
- 추적: [KAN-33](https://web-tech-service.atlassian.net/browse/KAN-33)

사용자 선택을 로컬 구현 중이며 main 반영·원격 강제화·신원 분리 완료 상태는 아니다.
ADR-0018은 다른 로컬 미디어 제안의 번호로 보존하며 이 결정에 재사용하지 않는다.
복원 당시 임시 번호 ADR-0019는 main의 원격 본문 검색 결정과 중복되어, 최초 커밋 전에 ADR-0022로 정리했다. 결정 내용은 바꾸지 않는다.

## 배경

일반 기능 작업 중 공통 설정의 무단 변경을 막아야 한다. 공개 GitHub.com에 임의 pre-receive를 설치할 수 없고 로컬 훅은 우회 가능하다.
동일 관리자 credential을 사용하는 AI는 규칙 자체를 바꿀 수 있어 파일 검사만으로 부족하다.

## 결정

CODEOWNERS와 별도 main branch ruleset을 사용한다. 공통 설정은 지정 사람, 모든 main PR은 적격 승인1명이 필요하다.
push 뒤 승인 무효화·마지막 push 외 승인·bypass 없음으로 최신 변경 검토를 요구한다.
AI는 해당 저장소의 최소 권한 App installation 신원을 사용하며 관리자 credential·App 개인키·관리자 브라우저/커넥터 접근을 분리한다.
검사 CI는 권한 수단이 아니며 서버 규칙과 인증 격리가 보안 경계다.
템플릿은 disabled이며 신원 준비→main 소유권 반영→규칙 활성화→실제 거절 실험 순서로 적용한다. 기존 CI 규칙은 덮어쓰지 않는다.

## 대안과 영향

- 자체 Git pre-receive는 push 자체를 차단하지만 호스팅 변경이 필요해 선택하지 않았다.
- 로컬 훅·AGENTS만으로는 원격 강제가 되지 않는다.
- 같은 관리자 계정의 환경 승인이나 상시 bypass는 신원 분리를 대체하지 않는다.
- 개인 저장소의 최소 승인1명은 일반 PR에도 적용되며 사람 작성 PR의 자기 승인은 불가능하다.

미준비 상태에서 먼저 잠그는 것보다 전용 App·승인자·복구 경로를 준비하고 단계적으로 적용한다.

## 관련 문서

- [현재 정책](../process/shared-configuration-approval.md)
- [전환·활성화·복구](../runbooks/ai-github-identity-isolation.md)
- [검증](../verification/security/2026-10-24-shared-config-approval.md)
- [작업 기록](../worklog/2026-10/2026-10-24-shared-config-approval.md)
