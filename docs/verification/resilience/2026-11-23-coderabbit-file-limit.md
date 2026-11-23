# CodeRabbit 파일 수 제한 예외 검증

## 대상과 조건

2026-11-23 KST. PR #111 head a490e7f1에서 공식 App347564의 check137279377986은 `Review skipped: 116 files exceed the limit of 100`으로 완료 SKIPPED를 반환했다. 기존 사전검사는 이를 차단했고, 사용자가 파일 수 제한만 명시적 예외로 추가하도록 승인했다. Node24.22.1·pnpm12.14.0을 사용한다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## 재현 방법

```sh
pnpm test:squash
pnpm typecheck:squash
pnpm test:repo
```

실제 읽기 전용 사전검사는 expected-head·최종 메시지 파일을 지정해 실행한다. 새 커밋은 head·파일 수·CI를 재검증한다. 승인된 병합은 같은 도구의 --merge로만 요청하며 이력·보호 규칙은 변경하지 않는다.

## 결과와 증거

공식 App·동일 head·모든 페이지의 단일 체크·양의 ID·정확한 SKIPPED 제목과 summary 첫 줄을 검증한다. N>100의 안전한 정수와 PR 전체 changedFiles가 N 이상이어야 한다. 실제 보고116개·전체118개를 구분하고 서비스의 내부 제외 규칙은 추정하지 않는다. 감사 출력은 reviewPerformed=false와 파일 수/제한을 포함한다. 기존 quota NEUTRAL 예외는 그대로다.

기존 체크·메시지·head·임시 파일 회귀에 파일 수 양성/음성과 신원·중복·다른 실패 차단 검사를 추가했다. 전용 회귀96개·저장소 회귀339개가 모두 통과했고 실패·생략은0개다. 전용 TypeScript 검사도 통과했다. 실제 a490e7f1 대상 check-only는 공식 check137279377986의 보고116개·전체118개를 구분해 성공했다. 새 커밋의 CI와 실제 병합은 후속 단계다. [정제 증거](../artifacts/2026-11-23-coderabbit-file-limit.json)에 소스 해시·집계·감사 결과를 기록한다. 원시 로그·인증 값은 포함하지 않는다.

## 한계와 후속 작업

이 예외는 자동 코드 리뷰가 실제로 수행됐다는 뜻이 아니다. 파일 수의 의미·공식 App·정확한 문구·현재 제한100이 바뀌면 차단하고 재검토한다. 다른 검사 실패·일반 skip·사람 변경 요청은 면제하지 않는다. PR의 앱 운영 검증과 정책 main 전파·병합은 구분한다.

## 관련 문서

- [ADR-0037](../../architecture/adr-0037-coderabbit-file-limit-exception.md)
- [squash 절차](../../process/squash-merge-preflight.md)
- [이번 작업 기록](../../worklog/2026-11/2026-11-23-frontend-modernization-main-pr.md)
