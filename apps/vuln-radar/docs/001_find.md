좋아요. 이건 그냥 “취약점 뉴스 모니터링”이 아니라 **Global Vulnerability Radar** 같은 시스템으로 만들면 됩니다. 핵심은 “전세계에서 새 취약점이 공개됐는가”와 “실제로 악용되고 있는가”와 “내가 신경 써야 하는가”를 분리해서 보는 거예요.

## 먼저 정의를 이렇게 잡으면 좋아요

**취약점 발생 모니터링 = 4개 신호를 합치는 것**입니다.

1. **공개 신호**: 새 CVE, 벤더 보안 권고, GitHub/OSV 오픈소스 취약점
2. **위험도 신호**: CVSS, EPSS, CISA KEV 포함 여부
3. **악용 관측 신호**: 인터넷 스캔, 공격 시도, 허니팟, 공개 PoC 존재
4. **영향도 신호**: 내가 쓰는 제품, 서버, SaaS, 오픈소스 패키지와 매칭되는지

이 네 가지를 합쳐야 “오늘 전세계에서 뭔가 터졌다”가 아니라 **“지금 당장 봐야 할 취약점”**을 뽑을 수 있습니다.

## 추천 데이터 소스

| 목적             | 우선 소스                             | 용도                                             |
| ---------------- | ------------------------------------- | ------------------------------------------------ |
| 신규 CVE 수집    | **NVD CVE API**                       | CVE, CVSS, CPE, CWE, 게시/수정 시각 수집         |
| 실제 악용 확인   | **CISA KEV**                          | 이미 악용 중으로 알려진 CVE 우선순위화           |
| 악용 가능성 예측 | **FIRST EPSS**                        | 향후 30일 내 악용될 확률 기반 스코어링           |
| 오픈소스 패키지  | **OSV, GitHub Advisory**              | npm, PyPI, Maven, Go, Rust 등 패키지 취약점 추적 |
| 인터넷 관측      | **Shadowserver, GreyNoise, SANS ISC** | 스캔/공격 트렌드, 허니팟 기반 악용 징후          |
| 노출 자산 확인   | **Censys, Shodan**                    | 인터넷에 노출된 제품/버전/CVE 후보 확인          |
| 한국 맥락        | **KISA/보호나라/KNVD**                | 국내 보안공지, 국내 제품 취약점, 침해 대응 참고  |

NVD는 CVE API를 제공하고, 대량 조회는 `startIndex`/`resultsPerPage` 방식의 페이지네이션을 쓰며, 변경분 추적은 `lastModStartDate`/`lastModEndDate`로 가져오는 것을 권장합니다. NVD는 API 키 없이는 30초당 5회, 키가 있으면 30초당 50회 제한이며, 자동 수집은 2시간에 한 번 이하와 요청 간 sleep을 권장합니다. ([NVD][1])

CISA KEV는 “실제로 악용된 것으로 알려진 취약점”을 우선순위화하는 데 가장 중요한 소스입니다. CISA의 공식 KEV 데이터는 CSV와 JSON으로도 제공되며, CISA GitHub 미러는 공식 KEV가 업데이트되면 보통 몇 분 내 동기화된다고 설명합니다. ([CISA][2])

EPSS는 공개된 CVE가 향후 30일 안에 실제 악용될 확률을 0~1 값과 percentile로 제공하는 모델입니다. FIRST는 EPSS API에서 특정 CVE, 여러 CVE, 상위 점수, 임계값 초과 CVE를 조회할 수 있게 제공합니다. ([first.org][3])

OSV는 오픈소스 취약점에 강합니다. 패키지명/버전 또는 커밋 해시로 취약점을 조회할 수 있고, GitHub Security Advisories, PyPA, RustSec 등 여러 오픈소스 보안 데이터베이스를 집계합니다. GitHub Advisory REST API도 생태계, 심각도, 게시일, EPSS 기준으로 보안 권고를 필터링할 수 있습니다. ([osv.dev][4])

실제 인터넷 공격 징후는 별도 계층으로 봐야 합니다. GreyNoise는 취약점 점검·악용, 도구, 행위자, 웜, 검색엔진 같은 태그로 인터넷 스캔/공격 트래픽을 분류하고, CVE 조회 API도 제공합니다. Shadowserver는 국가 단위의 사이버 위협 통계를 제공하고, “exploited vulnerabilities” 모니터링 화면도 있지만, 허니팟에 보인 웹 기반 서버 측 익스플로잇으로 제한되며 태그가 소급 적용되지는 않는다고 명시합니다. ([GreyNoise][5])

Censys와 Shodan은 “전세계에 어떤 취약 제품이 노출돼 있는가”를 보는 데 유용합니다. Censys는 호스트 데이터에 CVE ID, CISA KEV 여부, CVSS 같은 필드를 붙일 수 있고, Shodan은 배너에 붙은 취약점이 verified/unverified인지 구분하므로 오탐 가능성을 감안해야 합니다. ([Censys Documentation][6])

## 내가 추천하는 구조

```text
[수집기]
  NVD / CISA KEV / EPSS / OSV / GitHub Advisory / KISA / GreyNoise / Shadowserver
        ↓
[정규화]
  CVE ID 기준 병합, 출처별 timestamp 저장, 중복 제거
        ↓
[보강]
  CVSS, EPSS, KEV, public PoC, vendor, product, CPE, package ecosystem
        ↓
[내 관심사 매칭]
  watched vendors, products, domains, SBOM, package-lock, requirements.txt, CMDB
        ↓
[위험 점수 계산]
  KEV + EPSS + CVSS + 노출 여부 + 내 자산 매칭 + 악용 관측
        ↓
[알림 / 대시보드]
  Slack, Discord, Telegram, Email, Grafana, Metabase, OpenSearch Dashboards
```

## 위험도 스코어링 예시

```text
P0: 내 자산과 매칭됨 + CISA KEV 또는 실제 악용 관측
P1: EPSS 상위권 + CVSS Critical + 공개 PoC 존재
P2: CVSS Critical이지만 아직 악용 신호 없음
P3: High 이하 또는 내 관심 제품과 무관
```

조금 더 수식처럼 만들면:

```text
risk_score =
  40 * asset_match
+ 30 * cisa_kev
+ 20 * epss_weight
+ 15 * active_exploitation_signal
+ 10 * cvss_critical
+ 10 * public_poc_signal
+  5 * internet_exposure_signal
```

이렇게 하면 “CVSS 10점이라서 무조건 긴급” 같은 단순 판단을 피할 수 있어요. 실제 운영에서는 **KEV + EPSS + 내 자산 매칭**이 가장 강한 조합입니다.

## 1차 MVP 범위

처음부터 인터넷 전체를 직접 스캔하지 않는 게 좋습니다. 법적·윤리적 리스크도 있고, 이미 좋은 관측 데이터가 많습니다. Shadowserver도 대시보드 데이터는 연구·정책·언론 목적 사용은 가능하지만 스크래핑/재판매는 허용하지 않는다고 명시합니다. ([Shadowserver][7])

**MVP는 이렇게 가면 됩니다.**

1. NVD에서 최근 수정/신규 CVE 수집
2. CISA KEV JSON/CSV 변경 감지
3. EPSS로 CVE별 악용 가능성 보강
4. OSV/GitHub Advisory로 오픈소스 패키지 영향도 확인
5. 관심 벤더/제품 watchlist와 매칭
6. P0/P1만 Slack 또는 Telegram으로 알림
7. Grafana/Metabase로 “오늘의 위험 취약점” 대시보드 표시

## 대시보드 화면 구성

추천 화면은 5개입니다.

**1. Today’s Critical Radar**
오늘 신규/수정된 CVE 중 P0/P1만 표시합니다.

**2. KEV Changes**
CISA KEV에 새로 추가된 CVE, due date, vendor, required action을 보여줍니다.

**3. EPSS Jumpers**
EPSS가 갑자기 오른 CVE를 표시합니다. “아직 KEV는 아니지만 곧 문제가 될 수 있는 것”을 잡는 용도입니다.

**4. Open Source Impact**
내 프로젝트의 `package-lock.json`, `requirements.txt`, `pom.xml`, `go.mod`, SBOM과 매칭된 취약점을 보여줍니다.

**5. Internet Exposure Watch**
Censys/Shodan/Shadowserver 기준으로 특정 제품군이 인터넷에 얼마나 노출되어 있는지 추세를 봅니다.

## 기술 스택 추천

개인/소규모로 시작한다면:

```text
Python + FastAPI
PostgreSQL
Redis Queue 또는 Celery
APScheduler 또는 cron
Grafana / Metabase
Slack 또는 Telegram bot
```

조금 더 보안팀 느낌으로 가면:

```text
Collectors: Python, Go
Storage: PostgreSQL + OpenSearch
Queue: Kafka 또는 Redis Streams
Enrichment: EPSS, KEV, OSV, GHSA, GreyNoise
Dashboard: Grafana, OpenSearch Dashboards
TI Platform: MISP 또는 OpenCTI
Alerting: Slack, Jira, PagerDuty
```

MISP는 위협 인텔리전스 지표와 사이버보안 사고 정보를 수집·저장·공유하기 위한 오픈소스 플랫폼으로 설명되어 있어, 나중에 IOC/취약점/캠페인 정보를 같이 관리하고 싶을 때 붙이기 좋습니다. ([misp-project.org][8])

## 주의할 점

가장 중요한 건 **“새 CVE = 위험”이 아니라는 것**입니다. 새로 공개된 CVE는 많지만, 실제로 긴급한 건 훨씬 적습니다. 반대로 CVSS가 낮아도 EPSS가 높거나 KEV에 들어가거나 내 외부 노출 자산과 매칭되면 우선순위가 올라갑니다.

또 하나는 **오탐 관리**입니다. Shodan도 unverified 취약점은 수집된 메타데이터에서 추정된 것이므로 추가 검증의 출발점으로 봐야 한다고 설명합니다. ([Shodan 도움 센터][9])

## 제일 좋은 시작점

처음 버전은 이렇게 이름 붙이면 딱 좋아요.

**“Global Vuln Radar v0.1”**

기능은 세 개만:

```text
1. 오늘 새로 나온 CVE 수집
2. KEV/EPSS로 위험도 보강
3. 내 관심 제품과 매칭되면 알림
```

관심 제품 watchlist 예시는 이런 식입니다.

```text
Microsoft Exchange
Windows Server
Fortinet FortiOS
Palo Alto PAN-OS
Ivanti Connect Secure
Cisco IOS / ASA
VMware vCenter / ESXi
Atlassian Confluence / Jira
Apache HTTPD / Tomcat
Nginx
OpenSSL
Kubernetes
Docker
WordPress
GitLab
Jenkins
```

첫 결정만 하면 됩니다: **개인용 글로벌 레이더**로 만들지, **회사/서비스 자산 영향도 모니터링**으로 만들지. 둘 중 하나를 정하면 설계가 훨씬 선명해집니다.

[1]: https://nvd.nist.gov/developers/vulnerabilities "Vulnerability APIs"
[2]: https://www.cisa.gov/known-exploited-vulnerabilities-catalog?utm_source=chatgpt.com "Known Exploited Vulnerabilities Catalog"
[3]: https://www.first.org/epss/ "Exploit Prediction Scoring System (EPSS) Special Interest Group (SIG)"
[4]: https://osv.dev/ "OSV - Open Source Vulnerabilities"
[5]: https://docs.greynoise.io/docs/greynoise-tags "Tags"
[6]: https://docs.censys.com/docs/ls-cve-context "CVE Context"
[7]: https://www.shadowserver.org/statistics/ "Dashboard | The Shadowserver Foundation"
[8]: https://www.misp-project.org/?utm_source=chatgpt.com "MISP Open Source Threat Intelligence Platform & Open ..."
[9]: https://help.shodan.io/mastery/vulnerability-assessment "Understanding Shodan Vulnerability Assessment - Shodan Help Center"
