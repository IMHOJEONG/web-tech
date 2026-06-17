# trunk-based 브랜치 정책 정리

## 배경

- 기존에는 `develop -> main` 흐름이 섞여 있었다.
- 기본 브랜치를 `main`으로 바꾼 뒤에도 예전 통합 브랜치 흔적 때문에 git graph와 ruleset 해석이 혼란스러웠다.
- feature 브랜치 일부는 `develop` 기반 이력을 그대로 끌고 있어 trunk-based 전환 효과가 약했다.

## 이번 정리

- `develop` 브랜치를 제거했다.
- 기본 브랜치는 `main`으로 맞췄다.
- `feature/vuln-radar`, `feature/vuln-radar-backend`는 `main` 기준으로 다시 시작하도록 ref를 재정렬했다.
- 장기 브랜치는 `main` 하나만 유지하는 방향으로 정책을 명문화했다.
- GitHub ruleset 점검 항목과 required status checks 기준을 문서화했다.
- 공통 변경도 별도 통합 브랜치 없이 `main`으로 가는 짧은 `chore/*` 브랜치로 처리하는 원칙을 추가했다.

## 결정

- 이 저장소는 앞으로 `trunk-based development`를 기본 운영 방식으로 사용한다.
- 새 작업 브랜치는 항상 `main`에서 만든다.
- PR base branch는 항상 `main`이다.
- `develop` 같은 장기 통합 브랜치는 다시 만들지 않는다.
- 가능하면 `squash merge`를 사용한다.

## 다음 액션

- GitHub에서 `main` ruleset의 merge method와 required status checks를 문서 기준으로 다시 확인한다.
- 오래된 feature 브랜치는 필요 여부를 판단해 삭제하거나 `main` 기준 새 브랜치로 교체한다.
- 협업 시 새 브랜치 시작 명령을 `main` 기준으로 통일한다.
