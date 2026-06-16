결론부터 말하면, **GitHub는 쓰는 게 낫습니다.** 다만 “팀 코드리뷰”처럼 사람 승인 중심으로 쓰기보다, **혼자 개발 + AI 리뷰를 위한 변경 관리 시스템**으로 쓰는 것을 추천합니다.

GitHub PR은 변경사항을 diff 단위로 모아 보고, 파일별 코멘트·질문·승인·변경 요청을 남기는 구조라서 코드 리뷰 기록을 쌓기에 좋습니다. GitHub 공식 문서에서도 PR 리뷰를 “변경 전 코멘트, 개선 제안, 승인 또는 변경 요청을 남기는 협업 방식”으로 설명합니다. ([GitHub Docs][1]) 하지만 혼자 쓰는 저장소에서는 작성자가 자기 PR을 승인할 수 없기 때문에, “필수 승인 1명” 같은 규칙을 켜면 오히려 막힐 수 있습니다. ([GitHub Docs][2])

## 추천 방식: GitHub + AI 리뷰 + 자동 검사

내 추천은 이 구조입니다.

> **Issue 또는 작업 메모 → feature branch → Draft PR → AI 리뷰 → 직접 셀프 리뷰 → CI 통과 → merge**

즉, GitHub는 “리뷰 공간”, AI는 “리뷰어”, 당신은 “최종 책임자” 역할을 맡는 방식입니다.

---

## 1. GitHub를 써야 하는 이유

혼자 개발하면 “그냥 로컬에서 AI에게 물어보면 되지 않나?”라는 생각이 들 수 있는데, 실제로는 GitHub가 꽤 큰 차이를 만듭니다.

### GitHub를 쓰면 좋은 점

| 항목             | GitHub 사용                           | 로컬 + AI만 사용               |
| ---------------- | ------------------------------------- | ------------------------------ |
| 변경 이력        | PR, commit, diff로 남음               | 대화창에 흩어짐                |
| 리뷰 단위        | 기능/버그 단위로 묶임                 | 그때그때 파일 단위로 보기 쉬움 |
| AI 피드백 추적   | PR 코멘트나 체크리스트로 남길 수 있음 | 반영했는지 추적 어려움         |
| 테스트 자동화    | push/PR마다 실행 가능                 | 직접 실행해야 함               |
| 배포 전 안전장치 | main branch 보호 가능                 | 실수로 바로 반영 가능          |
| 나중에 협업 전환 | 그대로 확장 가능                      | 프로세스 재정비 필요           |

특히 장기 프로젝트라면 GitHub를 쓰는 편이 훨씬 낫습니다. AI와의 대화는 일시적이고 맥락이 끊기기 쉬운데, GitHub PR은 “왜 바꿨는지, 무엇을 검토했는지, 어떤 테스트를 통과했는지”를 저장소 안에 남깁니다.

---

## 2. 혼자 개발할 때 GitHub 설정 추천

혼자 쓰는 저장소에서는 **사람 승인 규칙보다 자동 검사 규칙**이 더 중요합니다.

### 추천 설정

`main` 브랜치에 대해 다음 정도를 켜는 것을 추천합니다.

| 설정                                  |               추천 | 이유                          |
| ------------------------------------- | -----------------: | ----------------------------- |
| Require a pull request before merging |               켜기 | main에 바로 push하지 않기     |
| Required approvals                    | 보통 0명 또는 끄기 | 혼자면 자기 PR 승인 불가      |
| Require status checks                 |               켜기 | 테스트, lint, build 통과 강제 |
| Require conversation resolution       |      가능하면 켜기 | AI/셀프 리뷰 코멘트 방치 방지 |
| Block force pushes                    |               켜기 | main 이력 훼손 방지           |
| Require signed commits                |               선택 | 보안·감사 필요할 때만         |

GitHub rulesets에서는 “merge 전에 PR을 요구”할 수 있고, PR은 반드시 승인되어야 하는 것은 아니며 승인 요구는 별도 설정입니다. 또한 status check를 필수로 걸면 필요한 검사들이 통과해야 merge할 수 있습니다. ([GitHub Docs][3])

핵심은 이겁니다.

> **혼자 프로젝트에서는 “사람 승인” 대신 “PR 생성 + 테스트 통과 + 리뷰 체크리스트 완료”를 merge 조건으로 삼는다.**

---

## 3. 브랜치 전략

복잡하게 갈 필요 없습니다.

### 기본 브랜치

```text
main
```

항상 동작해야 하는 안정 버전입니다.

### 작업 브랜치

```text
feature/login-form
fix/payment-timeout
refactor/api-client
chore/update-deps
```

브랜치는 목적이 보이게 짧게 만듭니다.

### 작업 단위

PR 하나는 가능하면 하나의 목적만 가져가는 게 좋습니다.

좋은 PR 예시:

```text
fix: 로그인 실패 시 에러 메시지 표시
feature: 사용자 프로필 수정 API 추가
refactor: 결제 모듈에서 HTTP 클라이언트 분리
```

나쁜 PR 예시:

```text
대규모 수정
여러 가지 고침
리팩토링 + 신규 기능 + 버그 수정
```

혼자 개발할 때 가장 위험한 패턴은 “AI가 이것저것 다 바꾼 거대한 diff”입니다. AI 리뷰도, 본인 리뷰도 어려워집니다.

---

## 4. PR 작성 방식

PR은 코드 리뷰를 위한 “패키지”라고 보면 됩니다.

### PR 제목

```text
fix: refresh token 만료 시 재로그인 처리
```

### PR 본문 템플릿

`.github/pull_request_template.md`를 만들어두면 좋습니다.

```md
## 변경 목적

- 무엇을 해결하려는 PR인가?

## 주요 변경사항

-
-
-

## 리뷰 포인트

- 특히 봐야 할 파일:
- 걱정되는 부분:
- 의도적으로 바꾸지 않은 부분:

## 테스트

- [ ] 로컬 테스트 통과
- [ ] lint 통과
- [ ] typecheck 통과
- [ ] 주요 시나리오 수동 확인

## AI 리뷰 기록

- 사용한 AI 도구:
- 받은 주요 피드백:
- 반영한 피드백:
- 반영하지 않은 피드백과 이유:

## 셀프 리뷰 체크리스트

- [ ] 불필요한 변경이 섞이지 않았는가?
- [ ] 함수/컴포넌트 책임이 명확한가?
- [ ] 에러 처리가 충분한가?
- [ ] 테스트가 핵심 로직을 커버하는가?
- [ ] 보안상 민감정보가 포함되지 않았는가?
- [ ] 성능상 명백한 병목이 없는가?
```

이 템플릿의 핵심은 **AI 리뷰 결과를 PR 안에 남기는 것**입니다. 나중에 돌아봤을 때 “AI가 뭐라고 했고, 나는 왜 반영했거나 안 했는지”가 남습니다.

---

## 5. AI 리뷰를 한 번에 끝내지 말고 역할별로 나누기

AI에게 “이 코드 리뷰해줘”라고만 하면 피드백이 넓고 얕아지기 쉽습니다. 혼자 개발에서는 AI를 여러 명의 가상 리뷰어처럼 나눠 쓰는 게 좋습니다.

### 1차 리뷰: 변경 요약 검증

목적은 “내가 의도한 변경만 들어갔는지” 확인하는 것입니다.

프롬프트 예시:

```text
아래 PR diff를 리뷰해줘.

역할:
- 너는 시니어 코드 리뷰어다.
- 먼저 이 PR이 실제로 무엇을 바꾸는지 요약해라.
- PR 목적과 무관한 변경이 섞였는지 찾아라.
- 의도하지 않은 동작 변경 가능성을 지적해라.

출력 형식:
1. 변경 요약
2. 목적과 맞는 변경
3. 목적과 무관해 보이는 변경
4. merge 전에 반드시 확인할 점
```

### 2차 리뷰: 버그·엣지케이스 리뷰

```text
아래 diff에서 버그 가능성, 예외 상황, race condition, null/undefined 처리, 데이터 불일치 가능성을 찾아줘.

각 코멘트는 다음 형식으로 작성해:
- 심각도: blocking / non-blocking / question
- 위치: 파일명과 함수명
- 문제 설명
- 재현 가능한 시나리오
- 제안 수정안
```

### 3차 리뷰: 테스트 리뷰

```text
이 PR에 필요한 테스트가 충분한지 리뷰해줘.

확인할 것:
- 현재 테스트가 변경사항의 핵심 동작을 검증하는가
- 빠진 테스트 케이스는 무엇인가
- 단위 테스트와 통합 테스트 중 무엇이 필요한가
- 테스트 이름과 구조가 명확한가

마지막에 추가해야 할 테스트 목록을 체크리스트로 줘.
```

### 4차 리뷰: 설계·유지보수 리뷰

```text
이 변경이 장기적으로 유지보수하기 좋은 구조인지 리뷰해줘.

확인할 것:
- 책임 분리가 적절한가
- 중복이 늘었는가
- 함수/클래스/모듈 경계가 자연스러운가
- 나중에 기능이 확장될 때 문제가 될 지점은 없는가
- 과한 추상화가 있는가

수정이 필요한 부분만 우선순위순으로 알려줘.
```

### 5차 리뷰: 보안 리뷰

```text
보안 관점에서 이 PR을 리뷰해줘.

확인할 것:
- 인증/인가 누락
- 입력값 검증 부족
- 민감정보 노출
- 로그에 개인정보나 토큰이 남는 문제
- SQL/NoSQL injection 가능성
- SSRF, XSS, CSRF 가능성
- 의존성 또는 환경변수 사용 문제

추측은 추측이라고 표시하고, 실제로 확인할 방법을 함께 제안해줘.
```

---

## 6. AI 리뷰 결과를 다 믿지 말고 분류하기

AI 피드백은 바로 반영하지 말고 이렇게 나눕니다.

```text
A. 반드시 수정
B. 확인 후 수정
C. 나중에 개선
D. 반영하지 않음
```

PR 본문이나 코멘트에 이렇게 남기면 좋습니다.

```md
## AI 리뷰 반영 결과

### 반드시 수정

- [x] refresh token 만료 시 무한 재시도 가능성 수정
- [x] userId가 없을 때 500이 발생하던 문제 수정

### 확인 후 수정

- [x] API timeout 기본값을 5초로 조정

### 나중에 개선

- [ ] 인증 모듈과 API client 의존성 분리

### 반영하지 않음

- AI 제안: 모든 API 응답을 Result 타입으로 감싸기
- 반영하지 않은 이유: 이번 PR 범위를 넘어가며, 기존 호출부 전체 수정 필요
```

이렇게 하면 AI 리뷰가 “그럴듯한 조언”에서 “관리 가능한 작업”으로 바뀝니다.

---

## 7. GitHub Actions로 자동 검사 걸기

GitHub Actions는 저장소 안의 YAML 파일로 workflow를 정의하고, 이벤트가 발생하면 자동으로 실행되는 구조입니다. 공식 문서 기준으로 workflow 파일은 보통 `.github/workflows` 디렉터리에 둡니다. ([GitHub Docs][4])

언어나 프레임워크에 따라 다르지만 기본적으로는 PR마다 다음을 돌리면 좋습니다.

```text
1. install
2. lint
3. typecheck
4. test
5. build
```

예시:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup
        run: |
          echo "Install runtime here"

      - name: Install dependencies
        run: |
          echo "Install dependencies here"

      - name: Lint
        run: |
          echo "Run lint here"

      - name: Typecheck
        run: |
          echo "Run typecheck here"

      - name: Test
        run: |
          echo "Run tests here"

      - name: Build
        run: |
          echo "Run build here"
```

실제 프로젝트가 Node.js면 `npm ci`, `npm run lint`, `npm test`, `npm run build`처럼 바꾸면 되고, Python이면 `pip install`, `ruff`, `pytest`, `mypy` 같은 식으로 바꾸면 됩니다.

---

## 8. 리뷰 기준: 무엇을 봐야 하는가

코드 리뷰는 “예쁜 코드 찾기”가 아니라 **merge했을 때 문제가 생길 가능성을 줄이는 절차**입니다.

### 1순위: 동작 정확성

가장 먼저 봐야 합니다.

확인 질문:

```text
- 이 코드가 요구사항을 정확히 만족하는가?
- 정상 케이스뿐 아니라 실패 케이스도 처리하는가?
- 기존 기능이 깨질 가능성은 없는가?
- 데이터가 없거나 잘못된 경우 어떻게 되는가?
```

### 2순위: 테스트

```text
- 변경된 핵심 로직에 테스트가 있는가?
- 버그 수정이면 재발 방지 테스트가 있는가?
- mock이 너무 많아서 실제 동작을 가리고 있지 않은가?
- 테스트 이름만 봐도 의도가 보이는가?
```

### 3순위: 읽기 쉬움

```text
- 함수 이름이 역할을 설명하는가?
- 조건문이 과하게 중첩되어 있지 않은가?
- 불필요한 추상화가 생기지 않았는가?
- 같은 로직이 여러 곳에 복붙되지 않았는가?
```

### 4순위: 설계

```text
- 이 변경이 적절한 레이어에 들어갔는가?
- UI, 비즈니스 로직, 데이터 접근이 섞이지 않았는가?
- 나중에 요구사항이 바뀌면 어디를 고치게 되는가?
```

### 5순위: 보안·운영

```text
- 토큰, API key, 개인정보가 코드나 로그에 남지 않는가?
- 인증과 권한 체크가 빠지지 않았는가?
- 에러 메시지가 내부 정보를 노출하지 않는가?
- 장애 시 재시도, timeout, fallback이 적절한가?
```

---

## 9. PR 크기 기준

혼자 + AI 협업에서는 PR 크기를 작게 유지하는 게 정말 중요합니다.

추천 기준:

```text
좋음: 50~300줄 변경
주의: 300~700줄 변경
위험: 700줄 이상 변경
```

700줄이 넘으면 가능하면 쪼개는 게 좋습니다.

예를 들어 “결제 기능 추가”라면 한 번에 하지 말고 이렇게 나눕니다.

```text
PR 1: 결제 API client 추가
PR 2: 결제 요청/응답 타입 추가
PR 3: 결제 버튼 UI 추가
PR 4: 결제 성공/실패 처리 추가
PR 5: 결제 관련 테스트 보강
```

AI는 큰 diff에서 놓치는 게 많습니다. 사람도 마찬가지입니다.

---

## 10. GitHub Copilot을 쓴다면

GitHub Copilot을 사용한다면 PR에서 Copilot code review를 요청할 수 있고, GitHub 문서 기준으로 GitHub.com의 PR 화면에서 Reviewers 메뉴에서 Copilot을 선택하는 방식이 제공됩니다. ([GitHub Docs][5]) 또한 Copilot Pro 또는 Pro+에서는 본인 PR에 대해 자동 code review를 설정할 수 있다고 문서에 나와 있습니다. ([GitHub Docs][6])

다만 중요한 점이 있습니다.

**AI 리뷰는 필수 승인 대체재로 보지 않는 게 좋습니다.** GitHub 문서에서도 Copilot의 approval은 required review 요건을 충족하는 승인으로 계산되지 않는다고 설명합니다. ([GitHub Docs][2]) Copilot PR summary도 사람의 맥락 제공을 보조하는 도구이며, 작성자가 정확성을 검토해야 한다고 안내합니다. ([GitHub Docs][7])

즉, Copilot이든 ChatGPT든 Claude든 Cursor든 역할은 같습니다.

> **AI는 리뷰 보조자, 최종 reviewer는 본인.**

---

## 11. 실제 운영 루틴

혼자 개발 기준으로 하루 루틴은 이렇게 가져가면 좋습니다.

### 작업 시작 전

```text
1. Issue 또는 TODO 작성
2. 목표 한 줄로 정의
3. 브랜치 생성
4. AI에게 구현 방향 먼저 검토 받기
```

예시:

```text
목표: 로그인 실패 시 사용자에게 명확한 에러 메시지를 보여준다.
범위: 로그인 폼, auth API error handling, 관련 테스트
범위 밖: 회원가입, 비밀번호 재설정, refresh token 처리
```

### 구현 중

```text
1. 작은 commit 단위로 작업
2. AI에게 파일 전체보다 변경 의도 중심으로 질문
3. 테스트 먼저 또는 동시에 작성
4. 로컬에서 lint/test 실행
```

### PR 생성

```text
1. Draft PR 생성
2. PR 본문 작성
3. AI에게 PR diff 리뷰 요청
4. 나온 피드백을 blocking / non-blocking으로 분류
```

### merge 전

```text
1. GitHub Files changed에서 직접 전체 diff 확인
2. AI 리뷰 코멘트 반영 여부 확인
3. CI 통과 확인
4. 불필요한 console.log, TODO, debug code 제거
5. squash merge 또는 rebase merge
```

### merge 후

```text
1. main 최신화
2. 필요하면 배포
3. 발견된 후속 개선사항은 새 issue로 분리
```

---

## 12. “GitHub 없이 AI만” 해도 되는 경우

GitHub 없이 해도 되는 경우는 있습니다.

```text
- 하루 이틀짜리 실험 코드
- 버릴 가능성이 높은 프로토타입
- 단일 파일 스크립트
- 아직 프로젝트 구조가 정해지지 않은 탐색 단계
```

이럴 때는 로컬 git만 써도 됩니다.

```bash
git checkout -b experiment/something
git diff > diff.patch
```

그리고 AI에게 `diff.patch`를 리뷰시킬 수 있습니다.

하지만 다음 중 하나라도 해당하면 GitHub를 쓰는 게 낫습니다.

```text
- 배포되는 서비스다
- 코드가 계속 커질 예정이다
- 버그가 나면 원인 추적이 필요하다
- AI가 여러 파일을 수정한다
- 나중에 다른 사람이 합류할 수 있다
- 포트폴리오나 제품으로 남길 코드다
```

---

## 13. 추천 최종 프로세스

당장 적용한다면 이 정도가 가장 현실적입니다.

```text
1. main 직접 push 금지
2. 모든 작업은 branch에서
3. PR은 작게
4. PR 본문에 목적, 변경사항, 테스트, AI 리뷰 기록 작성
5. AI 리뷰는 최소 3번:
   - 버그/엣지케이스
   - 테스트
   - 설계/유지보수
6. GitHub Actions로 lint/test/build 자동 실행
7. merge 전 본인이 Files changed 전체 확인
8. CI 통과 후 squash merge
```

GitHub 설정은 이렇게 시작하면 됩니다.

```text
main ruleset:
- Require a pull request before merging: ON
- Required approvals: OFF 또는 0
- Require status checks: ON
  - lint
  - test
  - build
- Require conversation resolution: ON
- Block force pushes: ON
```

이 방식이면 “혼자라서 코드 리뷰가 안 된다”가 아니라, **AI를 리뷰어처럼 쓰되 GitHub로 기록과 품질 게이트를 남기는 구조**가 됩니다.

[1]: https://docs.github.com/articles/about-pull-request-reviews?utm_source=chatgpt.com "About pull request reviews"
[2]: https://docs.github.com/articles/approving-a-pull-request-with-required-reviews?utm_source=chatgpt.com "Approving a pull request with required reviews"
[3]: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets?utm_source=chatgpt.com "Available rules for rulesets"
[4]: https://docs.github.com/articles/getting-started-with-github-actions?utm_source=chatgpt.com "Understanding GitHub Actions"
[5]: https://docs.github.com/copilot/using-github-copilot/code-review/using-copilot-code-review?utm_source=chatgpt.com "Using GitHub Copilot code review"
[6]: https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/configure-automatic-review?utm_source=chatgpt.com "Configuring automatic code review by GitHub Copilot"
[7]: https://docs.github.com/en/copilot/responsible-use/pull-request-summaries?utm_source=chatgpt.com "Responsible use of GitHub Copilot pull request summaries"
