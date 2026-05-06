좋아. 그러면 목표는 **개인용 Global Vuln Radar**로 잡자.

핵심 컨셉은 이거야:

> “전세계 취약점 정보를 다 긁어오는 시스템”이 아니라,
> **내 관심 기술·제품 기준으로 오늘 위험한 것만 골라주는 개인 보안 레이더**

## v0.1 목표

처음 버전은 딱 5가지만 하면 충분해.

```text
1. 최근 신규/수정 CVE 수집
2. CISA KEV에 들어간 실제 악용 취약점 감지
3. EPSS로 악용 가능성 점수 보강
4. 내 관심 제품 watchlist와 매칭
5. 위험도가 높으면 Telegram/Discord/Slack 알림
```

NVD CVE API는 CVE 단건 또는 컬렉션 조회가 가능하고, `startIndex`/`resultsPerPage` 페이지네이션을 제공하며, 최신 상태 유지는 날짜 범위로 변경된 CVE만 가져오는 방식이 권장됩니다. `lastModStartDate`/`lastModEndDate`는 최근 수정 CVE를 가져오고, `pubStartDate`/`pubEndDate`는 특정 기간에 NVD에 게시된 CVE를 가져옵니다. ([NVD][1])

중요한 최신 변경점도 있어. NIST는 2026년 4월 15일부터 NVD 운영을 위험 기반 모델로 바꾸면서, 모든 CVE를 동일하게 즉시 enrichment하지 않고 KEV 포함 CVE, 연방정부 사용 소프트웨어, critical software 등을 우선 enrichment한다고 발표했습니다. 그래서 개인용 레이더는 **NVD 하나만 믿지 말고 KEV + EPSS + OSV를 같이 보는 구조**가 좋아요. ([NIST][2])

## 추천 이름

개인 프로젝트 이름은 이런 느낌이 좋아.

```text
vuln-radar
global-vuln-radar
personal-vuln-radar
vuln-watchtower
cve-sentinel
```

내 추천은 **`vuln-radar`**. 짧고 기능이 분명해.

## 데이터 소스 우선순위

v0.1에서는 이것만 넣자.

| 우선순위 | 소스          | 역할                           |
| -------: | ------------- | ------------------------------ |
|        1 | NVD CVE API   | 신규/수정 CVE 기본 수집        |
|        2 | CISA KEV      | 실제 악용된 취약점 감지        |
|        3 | FIRST EPSS    | 향후 악용 가능성 점수          |
|        4 | OSV           | 오픈소스 패키지 취약점         |
|        5 | KISA/보호나라 | 한국 사용자 관점 보안공지 보강 |

CISA KEV는 실제 악용된 것으로 알려진 취약점의 권위 있는 카탈로그이고, CISA의 GitHub 미러는 KEV 데이터를 CSV와 JSON으로 제공하며 공식 CISA 소스와 보통 몇 분 내 동기화된다고 설명합니다. ([CISA][3])

EPSS API는 `https://api.first.org/data/v1/epss`를 기본 엔드포인트로 사용하고, 단일 CVE, 여러 CVE 배치 조회, 특정 날짜 조회, 상위 EPSS CVE, 임계값 초과 CVE 조회를 지원합니다. EPSS는 CVE가 실제 악용될 가능성을 보강하는 데 쓰면 좋아요. ([first.org][4])

OSV는 오픈소스 취약점 데이터베이스이며, 오픈소스 사용자가 패키지 버전이나 커밋 해시 기준으로 알려진 취약점을 조회할 수 있게 해줍니다. OSV는 여러 OSV 형식 취약점 DB를 집계하고, first-party 도구인 OSV-Scanner도 제공합니다. ([osv.dev][5])

KISA 보호나라/KrCERT는 국내 사용자에게 필요한 보안공지와 취약점 정보를 제공하는 포털이라, 한국어 요약이나 국내에서 많이 쓰는 소프트웨어 이슈를 챙길 때 보조 소스로 붙이면 좋습니다. ([boho.or.kr][6])

## 개인용 레이더 구조

```text
vuln-radar/
  collectors/
    nvd.py          # 신규/수정 CVE 수집
    kev.py          # CISA KEV 수집
    epss.py         # EPSS 점수 보강
    osv.py          # 오픈소스 패키지 취약점
    kisa.py         # 선택: 보호나라 보안공지
  core/
    normalize.py    # CVE 중심 정규화
    scoring.py      # 위험도 점수 계산
    matcher.py      # watchlist 매칭
    dedupe.py       # 중복 제거
  notifiers/
    telegram.py
    discord.py
    slack.py
  storage/
    db.py
    schema.sql
  config/
    watchlist.yaml
    settings.yaml
  app.py
  docker-compose.yml
```

처음에는 PostgreSQL까지 안 가도 돼. 개인용이면 **SQLite + cron**으로 시작해도 충분하고, 대시보드가 필요해지면 PostgreSQL + Metabase/Grafana로 올리면 됩니다.

## watchlist는 이렇게 시작

개인용 레이더는 “내가 관심 있는 제품군”이 핵심이야. 예를 들면:

```yaml
vendors:
  - Microsoft
  - Google
  - Apple
  - Fortinet
  - Palo Alto
  - Cisco
  - Ivanti
  - Atlassian
  - VMware
  - GitLab
  - Jenkins
  - WordPress
  - Apache
  - OpenSSL
  - Linux
  - Kubernetes
  - Docker

products:
  - Windows
  - Windows Server
  - Exchange Server
  - Chrome
  - Android
  - iOS
  - macOS
  - FortiOS
  - PAN-OS
  - Cisco IOS
  - Cisco ASA
  - Ivanti Connect Secure
  - Confluence
  - Jira
  - vCenter
  - ESXi
  - GitLab
  - Jenkins
  - WordPress
  - Apache HTTP Server
  - Tomcat
  - nginx
  - OpenSSL
  - Linux kernel
  - Kubernetes
  - Docker Engine

ecosystems:
  - PyPI
  - npm
  - Maven
  - Go
  - crates.io
  - GitHub Actions
  - Docker images

keywords:
  - remote code execution
  - unauthenticated
  - authentication bypass
  - privilege escalation
  - path traversal
  - command injection
  - SQL injection
  - deserialization
  - zero-day
  - exploited in the wild
```

처음엔 너무 넓게 잡지 말고, 네가 실제로 쓰거나 자주 보는 기술 위주로 시작하는 게 좋아.

## 위험도 계산 방식

v0.1 점수는 단순하게 가자.

```text
risk_score =
  50점: CISA KEV 포함
  25점: EPSS percentile >= 0.95
  20점: CVSS Critical
  15점: watchlist 제품/벤더 매칭
  15점: 원격 코드 실행/RCE
  10점: 인증 없이 악용 가능
  10점: 공개 PoC 언급
   5점: 한국어 보안공지/KISA 언급
```

등급은 이렇게:

```text
P0: 80점 이상
    → 즉시 알림. 실제 악용 가능성이 높거나 이미 악용 중.

P1: 60~79점
    → 하루 안에 확인. Critical + EPSS 높음 + 관심 제품 매칭.

P2: 40~59점
    → 주간 리뷰. 중요하지만 즉시성은 낮음.

P3: 39점 이하
    → 저장만 하고 알림 없음.
```

개인용이면 알림 피로도가 진짜 중요해. **P0/P1만 알림** 보내고, P2/P3는 대시보드나 일일 요약에만 넣는 걸 추천해.

## 알림 포맷

Telegram/Discord로 이런 식이면 충분해.

```text
🚨 P0 Vulnerability Alert

CVE: CVE-2026-xxxxx
Vendor/Product: Fortinet FortiOS
Severity: Critical
EPSS: 0.94 / percentile 0.99
KEV: Yes
Why it matters:
- CISA KEV 포함
- EPSS 상위권
- watchlist 제품 매칭
- 원격 코드 실행 가능성

Action:
- 벤더 권고 확인
- 사용 여부 확인
- 패치/임시 완화 적용
```

## 수집 주기

개인용 기준으로 이 정도면 좋아.

| 작업                   |              주기 |
| ---------------------- | ----------------: |
| CISA KEV 확인          |         1시간마다 |
| NVD 신규/수정 CVE      |         3시간마다 |
| EPSS 보강              |         6시간마다 |
| OSV 패키지 취약점      |        하루 1~2회 |
| KISA/보호나라 보안공지 |        하루 1~2회 |
| 일일 요약 리포트       | 매일 아침 9시 KST |

NVD는 API 키 없이 30초당 5회, API 키가 있으면 30초당 50회 제한이고, 요청 사이에 몇 초 sleep을 두는 것을 권장합니다. 개인용이라도 NVD API 키는 받아두는 게 좋아요. ([NVD][7])

## DB 스키마 초안

SQLite로 시작한다면 이렇게 충분해.

```sql
CREATE TABLE IF NOT EXISTS vulnerabilities (
  cve_id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  published_at TEXT,
  modified_at TEXT,
  cvss_score REAL,
  cvss_severity TEXT,
  epss_score REAL,
  epss_percentile REAL,
  is_kev INTEGER DEFAULT 0,
  kev_added_at TEXT,
  vendor TEXT,
  product TEXT,
  source TEXT,
  risk_score INTEGER DEFAULT 0,
  priority TEXT,
  raw_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cve_id TEXT,
  priority TEXT,
  channel TEXT,
  sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
  alert_hash TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS watch_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cve_id TEXT,
  match_type TEXT,
  match_value TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## v0.1 실행 흐름

```text
1. 마지막 실행 시각 읽기
2. NVD에서 lastModStartDate~lastModEndDate로 변경 CVE 수집
3. CVE ID 기준으로 SQLite upsert
4. CISA KEV JSON 가져와서 is_kev 업데이트
5. CVE 목록을 EPSS API에 배치 조회
6. watchlist.yaml과 vendor/product/description 매칭
7. risk_score 계산
8. P0/P1이고 아직 알림 안 보낸 CVE만 알림
9. 오늘 요약 생성
```

## 아주 작은 Python 뼈대

```python
from dataclasses import dataclass
from typing import Optional


@dataclass
class Vuln:
    cve_id: str
    description: str
    cvss_score: Optional[float] = None
    cvss_severity: Optional[str] = None
    epss_score: Optional[float] = None
    epss_percentile: Optional[float] = None
    is_kev: bool = False
    watch_match: bool = False
    has_rce_keyword: bool = False
    has_auth_bypass_keyword: bool = False
    has_poc_keyword: bool = False


def score_vuln(v: Vuln) -> tuple[int, str]:
    score = 0

    if v.is_kev:
        score += 50

    if v.epss_percentile is not None and v.epss_percentile >= 0.95:
        score += 25

    if v.cvss_severity == "CRITICAL":
        score += 20
    elif v.cvss_severity == "HIGH":
        score += 10

    if v.watch_match:
        score += 15

    if v.has_rce_keyword:
        score += 15

    if v.has_auth_bypass_keyword:
        score += 10

    if v.has_poc_keyword:
        score += 10

    if score >= 80:
        priority = "P0"
    elif score >= 60:
        priority = "P1"
    elif score >= 40:
        priority = "P2"
    else:
        priority = "P3"

    return score, priority
```

## 안전/윤리 기준

개인용 글로벌 레이더는 **공개 데이터 수집과 분석**까지만 하는 게 좋아. 전세계 IP를 직접 스캔하거나, 제3자 시스템에 취약점 검증 요청을 보내는 방식은 법적·윤리적 문제가 생길 수 있어. Shodan/Censys/GreyNoise 같은 외부 관측 데이터는 나중에 붙이더라도 “내 자산 확인” 또는 “일반 트렌드 확인” 용도로만 쓰는 게 안전해.

## 7일짜리 개발 순서

**Day 1 — 프로젝트 뼈대**

```text
SQLite
settings.yaml
watchlist.yaml
기본 테이블
```

**Day 2 — NVD collector**

```text
최근 24시간 CVE 수집
중복 제거
SQLite 저장
```

**Day 3 — KEV collector**

```text
CISA KEV JSON 수집
기존 CVE에 is_kev 표시
KEV 신규 추가 감지
```

**Day 4 — EPSS enrichment**

```text
CVE 목록 배치 조회
epss_score / percentile 저장
```

**Day 5 — scoring + matching**

```text
watchlist 매칭
RCE/auth bypass/PoC 키워드 감지
P0~P3 분류
```

**Day 6 — alerting**

```text
Telegram 또는 Discord 알림
alert 중복 방지
P0/P1만 전송
```

**Day 7 — daily digest**

```text
오늘의 P0/P1
KEV 신규 추가
EPSS 급상승
watchlist 매칭
Markdown 리포트 생성
```

## 최종 v0.1 모습

완성되면 매일 아침 이런 요약을 받는 구조가 돼.

```text
🛡️ Global Vuln Radar — Daily Brief

Date: 2026-05-06 KST

P0: 2
P1: 7
New KEV: 1
Watchlist Matches: 5
Top EPSS: 10

오늘 가장 중요한 취약점:
1. CVE-xxxx — KEV + EPSS 99th percentile + Fortinet
2. CVE-yyyy — Critical RCE + public PoC + Atlassian
3. CVE-zzzz — Linux kernel + high EPSS
```

내 판단으로는, 너한테 맞는 첫 버전은 이거야:

```text
Python + SQLite + YAML watchlist + Telegram alert
수집원: NVD + CISA KEV + EPSS
나중에: OSV + KISA + dashboard
```

처음부터 웹 대시보드 만들지 말고, **알림이 정확한 CLI/봇**부터 만드는 게 훨씬 빠르고 재밌어. 다음 단계는 `vuln-radar`의 실제 파일 구조랑 실행 가능한 Python 코드 뼈대로 바로 이어가면 된다.

[1]: https://nvd.nist.gov/developers/vulnerabilities "Vulnerability APIs"
[2]: https://www.nist.gov/news-events/news/2026/04/nist-updates-nvd-operations-address-record-cve-growth "NIST Updates NVD Operations to Address Record CVE Growth | NIST"
[3]: https://www.cisa.gov/known-exploited-vulnerabilities-catalog?utm_source=chatgpt.com "Known Exploited Vulnerabilities Catalog"
[4]: https://www.first.org/epss/api "Exploit Prediction Scoring System (EPSS)"
[5]: https://osv.dev/ "OSV - Open Source Vulnerabilities"
[6]: https://www.boho.or.kr/?utm_source=chatgpt.com "KISA 보호나라&KrCERT/CC"
[7]: https://nvd.nist.gov/developers/start-here "Developers - Start Here"
