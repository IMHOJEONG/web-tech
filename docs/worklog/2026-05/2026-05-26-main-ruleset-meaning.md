# 2026-05-26 main ruleset 의미 정리

## 요약

- 현재 GitHub `main` ruleset 설정값 자체뿐 아니라, 이 저장소에서 그 설정을 어떤 운영 의미로 해석하는지도 문서에 반영했다.

## 반영 문서

- `docs/process/code-review-process.md`
- `docs/knowledge/infra-tooling/README.md`

## 정리한 핵심 의미

- `Require a pull request before merging`
  - 모든 변경을 PR 단위로 남긴다.
- `Required approvals: 0`
  - 사람 승인 수를 품질 게이트로 강제하지 않는다.
- `Require status checks`
  - 자동 검증이 통과한 변경만 main에 반영한다.
- `Require conversation resolution`
  - 열린 쟁점을 정리하지 않은 채 merge하지 않는다.
- `Block force pushes`
  - main 이력을 덮어쓰지 않고 보존한다.

## 메모

- 이 저장소는 현재 “사람 승인 중심 팀 리뷰”보다 “PR 기반 변경 관리 + 자동 검증 + 문서화” 구조에 더 가깝다.
- 따라서 ruleset 의미도 승인 수보다 기록, 검증, 추적 가능성 중심으로 해석하는 편이 맞다.
