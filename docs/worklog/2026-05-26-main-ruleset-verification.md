# 2026-05-26 main ruleset 검증

## 요약

- GitHub 원격 저장소의 `main-ruleset`을 직접 조회해 현재 `main` 보호 규칙을 검증했다.
- 초기 확인에서는 `Require conversation resolution`이 꺼져 있었지만, 재확인 시 현재는 의도한 값으로 맞춰진 상태를 확인했다.

## 확인 결과

- ruleset 이름: `main-ruleset`
- 대상 브랜치: `~DEFAULT_BRANCH`
- enforcement: `active`

의도와 일치한 항목:

- `Require a pull request before merging`
- `Required approvals: 0`
- `Require status checks: Build and Test`
- `Block force pushes`

재확인 후 일치한 항목:

- `Require conversation resolution`
  - 현재 ruleset 값: `required_review_thread_resolution: true`

## 메모

- GitHub의 예전 branch protection API는 `Branch not protected`를 반환했지만, 이는 branch protection이 비어 있고 ruleset으로 관리 중이라는 뜻으로 해석했다.
- 현재 required status check는 `Build and Test` 하나만 걸려 있다.
- 이후 CI를 `Lint / Typecheck / Build / Test`로 분리한 구성을 실제로 적용하면, ruleset의 required status check도 함께 바꿔야 한다.
