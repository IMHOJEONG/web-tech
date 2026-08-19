# Vuln Radar Learning And Product Improvements

## 목적

이 문서는 `apps/vuln-radar`가 현재 어떤 학습 가치를 주는지,
반대로 어떤 점 때문에 “개념은 배우는데 실전 작업 감각은 약하다”는 느낌이 생기는지,
그리고 다음 개선 우선순위를 어떻게 잡으면 좋은지 정리한다.

관련 맥락은 아래 문서를 함께 본다.

- [README.md](/Users/coder/Desktop/project/web-tech/apps/vuln-radar/README.md)
- [README-ADVICE.md](/Users/coder/Desktop/project/web-tech/apps/vuln-radar/README-ADVICE.md)
- [006_vulnerability_detail_and_security_notes.md](/Users/coder/Desktop/project/web-tech/apps/vuln-radar/docs/006_vulnerability_detail_and_security_notes.md)

## 지금 이 서비스에서 배울 수 있는 점

### 1. 취약점 정보를 운영 신호로 바꾸는 법

이 서비스의 가장 큰 장점은
단순히 CVE 목록을 읽는 것이 아니라
여러 신호를 합쳐 “무엇을 먼저 봐야 하는가”를 판단하는 흐름을 보여준다는 점이다.

핵심 신호:

- `severity`
- `EPSS`
- `KEV`
- `watchlist match`
- 내부 `priority`

즉:

- `심각도`만 보는 습관에서 벗어나고
- `실제 악용 가능성`, `우리와의 관련성`, `운영 우선순위`를 함께 보는 연습이 된다.

### 2. 보안 용어를 “판단 문맥” 안에서 익힐 수 있다

`SSRF`, `RCE`, `Auth Bypass`, `Prototype Pollution` 같은 용어를
그냥 사전식으로 외우는 것이 아니라,
어떤 유형이 `P0`로 올라가고
어떤 상황에서 `watchlist`와 만나 우선순위가 올라가는지와 함께 볼 수 있다.

즉 용어 암기가 아니라
“이 용어가 운영에서 왜 중요한가”를 배울 수 있다.

### 3. 프론트와 백엔드 책임 분리를 배우기 좋다

`vuln-radar`는 브라우저가 외부 보안 소스를 직접 호출하지 않고,
`apps/vuln-radar-backend`가 정규화한 결과만 소비한다.

이 구조는 아래 개념을 익히는 데 좋다.

- 왜 외부 source 수집은 backend 책임이 되는지
- 왜 frontend는 표시와 탐색, triage UX에 집중하는지
- 왜 점수 계산과 source 정합성은 backend에서 관리하는지

### 4. 운영 도구형 정보 구조를 배울 수 있다

문서형 사이트와 달리,
이 서비스는 `overview`, `detail`, `feed`, `kev`, `watchlist` 같은
운영 도구형 라우팅과 정보 계층을 가진다.

즉 다음 관점을 익히기 좋다.

- 어떤 카드가 overview에 먼저 와야 하는가
- 어떤 정보는 상세 페이지로 내려가야 하는가
- 어떤 값은 원문 link보다 먼저 보여야 하는가

## 지금 이 서비스가 부족한 점

### 1. 읽기와 판단은 되지만, 실제 작업으로 이어지지 않는다

현재 구조는 “무엇이 위험한가”를 보는 데는 좋지만,
그 뒤에 사용자가 실제로 할 수 있는 액션은 거의 없다.

예:

- `acknowledge`
- `mute`
- `assign`
- `patch task 생성`
- `incident note 작성`
- `watchlist에 바로 추가`

즉 대시보드는 있는데,
운영 액션이 약하다.

### 2. 테스트 가능한 보안 시나리오가 부족하다

지금은 데이터를 읽고 해석하는 흐름은 있지만,
“이 유형의 취약점이 왜 이렇게 분류되는가”를
테스트셋으로 반복 학습하기는 어렵다.

부족한 것:

- fixture 기반 취약점 시나리오
- 예상 priority 결과
- watchlist 변화에 따른 재분류 결과
- fallback/mock 상태에서의 해석 규칙

즉 개념은 아는데,
반복 훈련 루프는 약하다.

### 3. 판단 근거가 충분히 드러나지 않는다

현재는 `priority`, `riskScore`, `EPSS`, `KEV`를 보여주지만,
왜 그 결과가 나왔는지의 설명 가능성은 아직 제한적이다.

예:

- 이 항목이 왜 `P0`인가
- 어떤 watchlist가 점수 상승에 기여했나
- 어떤 키워드가 위험도를 올렸나

이 부분이 약하면
서비스를 써도 “결과를 보는 경험”만 남고
“판단을 배우는 경험”은 덜해진다.

### 4. 실전 대응 감각을 키우는 흐름이 약하다

지금은 취약점 탐색과 조회 중심이라
사용자가 “오늘 내가 뭘 처리했는가”를 남기기 어렵다.

즉 다음이 부족하다.

- triage 완료 여부
- 처리 메모
- 보류 이유
- false positive 판단
- 후속 일정 연결

결국 보안 개념 학습에는 도움이 되지만,
운영 실습 도구로는 아직 덜 완성된 상태다.

## 개선 방향

## 1. 학습형 개선

### A. 설명 가능한 priority 화면 추가

목표:
결과만 보여주지 말고 “왜 그렇게 분류되었는지”를 함께 보여준다.

예:

- `KEV 포함`
- `EPSS percentile 상위`
- `watchlist match: nginx`
- `title keyword: auth bypass`

효과:

- 보안 용어와 운영 우선순위의 연결이 더 잘 이해된다.
- 규칙 기반 판단을 학습하기 쉬워진다.

### B. 취약점 유형별 학습 세트 추가

예:

- `SSRF` 세트
- `RCE` 세트
- `Authentication/Authorization` 세트
- `Supply chain` 세트

각 세트에 아래를 붙인다.

- 대표 CVE
- 왜 중요한가
- 일반적인 영향 범위
- 우리가 우선 보게 되는 이유

효과:

- 단어 암기 대신 패턴 학습이 가능해진다.

### C. “오늘의 triage 연습” 모드 추가

예:

- 오늘 feed에서 3개만 골라보세요
- 어떤 항목을 P0/P1로 볼지 선택해보세요
- 결과와 시스템 priority를 비교해보세요

효과:

- 보는 도구에서 학습 도구로 한 단계 확장된다.

## 2. 제품형 개선

### A. 읽기 도구에서 작업 도구로 확장

우선순위 높은 액션:

- `acknowledge`
- `mute for 24h`
- `mark as false positive`
- `create follow-up task`
- `add to watchlist`

효과:

- 사용자가 “봤다”에서 끝나지 않고
  “처리했다”로 넘어갈 수 있다.

### B. watchlist 편집 흐름 강화

현재 watchlist는 중요한 개념이지만,
사용자가 직접 우선순위를 바꾸는 경험은 아직 약하다.

추가하면 좋은 것:

- detail에서 바로 watchlist 추가
- vendor/product/keyword 제안
- watchlist 변경 전후 priority 비교

효과:

- 내 기술 스택 기준 레이더라는 제품 정체성이 더 강해진다.

### C. 판단 결과 회고 기능

예:

- 오늘 P0로 본 항목 4건
- 실제로 확인한 항목 2건
- false positive 1건
- watchlist 누락으로 놓친 항목 1건

효과:

- 도구 사용이 개선 루프로 이어진다.

## 3. 테스트형 개선

### A. risk score 단위 테스트 강화

테스트 대상:

- `KEV=true`일 때 priority 상승
- `EPSS percentile` 상위일 때 가중치 반영
- watchlist match 시 우선순위 변화
- 특정 키워드가 있을 때 승격

효과:

- 내부 휴리스틱이 의도대로 동작하는지 안정적으로 검증 가능하다.

### B. fixture 기반 시나리오 테스트 추가

예:

- `nginx ingress + KEV + high EPSS`
- `React 관련 medium severity지만 watchlist hit`
- `critical severity지만 watchlist 미매치`

검증:

- 기대 priority
- 기대 detail badge
- 기대 overview 카드 반영

효과:

- “개념은 이해하는데, 실제로 맞는지 모르겠다”는 문제를 줄인다.

### C. E2E 테스트 추가

최소 범위:

- overview 로딩
- 상세 페이지 진입
- fallback/mock badge 노출
- watchlist match 표시
- refresh 이후 레이아웃 유지

효과:

- 운영형 대시보드에서 중요한 UX 회귀를 빨리 잡을 수 있다.

## 추천 우선순위

### Phase 1

- overview/detail의 판단 근거 노출
- fixture 기반 risk score 테스트
- detail에서 watchlist 추가 액션

### Phase 2

- acknowledge/mute/follow-up task 액션
- triage 결과 회고 화면
- 시나리오 기반 학습 세트

### Phase 3

- 오늘의 triage 연습 모드
- route-level prefetch 또는 SSR 검토
- 작업 히스토리와 우선순위 정확도 회고

## 결론

현재 `vuln-radar`는
보안 용어 자체를 배우는 도구라기보다,
보안 신호를 운영 우선순위로 번역하는 법을 배우기 좋은 서비스다.

반면 지금 상태만으로는
“내가 실제로 대응 작업을 해봤다”는 감각은 약하다.

따라서 다음 개선은 아래 세 방향이 핵심이다.

- `설명 가능한 판단`
- `작업 가능한 액션`
- `반복 가능한 테스트/학습 시나리오`

이 세 가지가 붙으면
`vuln-radar`는 단순 조회 대시보드에서
학습형 운영 도구로 한 단계 올라갈 수 있다.
