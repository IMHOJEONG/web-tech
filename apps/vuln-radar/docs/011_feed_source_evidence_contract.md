# Feed Source And Evidence Contract

## 업데이트 요약

이번 문서는 `/feed`의 `source` 필터를 바로 구현하지 않고, 먼저 데이터 계약을 분리해서 정의하기 위해 추가했다.
기존 feed 화면은 `priority`, `severity`, `KEV`, keyword 필터는 동작하지만, item 단위 source 정보가 없어 `source` 필터는 보류 상태였다.

이번 업데이트의 핵심은 아래와 같다.

- `source`라는 단어를 하나의 의미로 쓰지 않고 세 가지 책임으로 나눈다.
- 사용자 필터용 출처는 `origin source`로 정의한다.
- 우선순위 판단 근거는 `evidence signal`로 정의한다.
- API 응답 신뢰 상태는 기존 `runtime dataSource`로 유지한다.
- `P0/P1` 같은 우선순위와 판단 신뢰도는 분리한다.
- backend와 frontend가 같은 `FeedItem` contract를 보고 순차적으로 구현할 수 있게 한다.

이 설계가 들어가면 `/feed`는 단순 목록이 아니라 “어떤 원천에서 확인됐고, 왜 먼저 봐야 하는지”를 설명하는 운영 화면으로 확장될 수 있다.
신뢰성 판단 기준은 `012_vulnerability_reliability_policy.md`를 따른다.

## 배경

`/feed`는 취약점 목록을 시간순으로 보여주는 화면이지만, 운영자가 실제로 알고 싶은 것은 단순한 출처 하나가 아니다.
중요한 질문은 아래 세 가지로 나뉜다.

- 이 취약점은 어떤 원천 데이터에서 확인됐는가?
- 왜 이 항목의 우선순위가 높게 계산됐는가?
- 현재 화면의 응답은 실제 DB에서 온 것인가, mock fallback인가?

이 세 질문을 모두 `source`라는 한 단어로 묶으면 UI와 데이터 모델이 쉽게 흔들린다.
따라서 feed source 설계는 `origin source`, `evidence signal`, `runtime dataSource`를 분리한다.

## 용어 구분

### origin source

취약점 또는 보조 신호가 처음 확인된 원천 데이터다.
사용자 필터에서 말하는 `source`는 이 값을 기준으로 한다.

예시:

- `nvd`
- `cisa-kev`
- `first-epss`
- `osv`
- `github-advisory`
- `vendor-advisory`
- `kisa`

### evidence signal

우선순위 판단에 영향을 준 근거다.
카드나 상세 화면에서 `왜 P0/P1인가?`를 설명할 때 사용한다.

예시:

- `kev`: CISA KEV catalog에 포함됨
- `epss`: exploit 가능성이 높음
- `cvss`: CVSS severity 또는 score가 높음
- `watchlist`: 관심 vendor/product/keyword와 매칭됨
- `ssvc`: SSVC 판단 기준상 우선 조치 필요
- `affected`: 영향받는 제품 또는 버전 범위가 확인됨

### runtime dataSource

현재 API 응답이 어디서 생성됐는지 나타내는 런타임 상태다.
이미 `dataSource.kind`로 존재하며, item filter와 섞지 않는다.

예시:

- `database`
- `mock`

## 추천 FeedItem 응답 형태

1차 확장은 기존 응답을 깨지 않는 additive contract로 진행한다.

```ts
interface FeedItem {
  cveId: string;
  title: string;
  priority: "P0" | "P1" | "P2" | "P3";
  severity: "critical" | "high" | "medium" | "low";
  epssScore: number;
  isKev: boolean;
  publishedAt: string;
  updatedAt: string;
  matchedWatchlist: string[];

  sourceIds: FeedOriginSourceId[];
  evidence: FeedEvidenceSignal[];
}

type FeedOriginSourceId =
  | "nvd"
  | "cisa-kev"
  | "first-epss"
  | "osv"
  | "github-advisory"
  | "vendor-advisory"
  | "kisa";

type FeedEvidenceSignal =
  | {
      type: "kev";
      label: string;
      value: true;
    }
  | {
      type: "epss";
      label: string;
      value: number;
    }
  | {
      type: "cvss";
      label: string;
      value: number | string;
    }
  | {
      type: "watchlist";
      label: string;
      value: string[];
    }
  | {
      type: "ssvc" | "affected";
      label: string;
      value: string | number | boolean;
    };
```

## 데이터별 역할

### NVD

기본 CVE read model의 기준 데이터로 사용한다.

- `cveId`
- `title` 또는 요약 설명
- `description`
- `severity`
- `cvssScore`
- `publishedAt`
- `lastModifiedAt`
- affected product/version 정보
- 가능하면 SSVC 관련 판단 데이터

### CISA KEV

실제 악용 여부를 나타내는 강한 운영 신호로 사용한다.

- `isKev`
- `dateAdded`
- `vendorProject`
- `product`
- `requiredAction`
- `dueDate`
- advisory source record

### FIRST EPSS

취약점이 실제 exploit될 가능성 신호로 사용한다.

- `epssScore`
- `epssPercentile`
- `observedAt`

### watchlist

우리 서비스 또는 조직의 관심 영역과 연결되는지 판단하는 내부 운영 신호로 사용한다.

- matched vendor
- matched product
- matched ecosystem
- matched keyword

### advisory

상세 근거 링크와 원문 출처를 제공한다.
현재 DB에는 `Advisory.source`가 있으므로 feed 응답의 `sourceIds`는 이 값을 정규화해서 만들 수 있다.

- `source`
- `title`
- `summary`
- `sourceUrl`
- `publishedAt`
- `lastModifiedAt`

## Backend 구현 방향

1. `FeedItem` shared type에 `sourceIds`와 `evidence`를 optional이 아닌 정식 필드로 추가한다.
2. `FeedsRepository.getFeed()`에서 `advisories.source`를 함께 조회한다.
3. `advisories.source`, `isKev`, `epssScore`, `matchedWatchlist`를 조합해 `sourceIds`를 만든다.
4. `priority`, `severity`, `isKev`, `epssScore`, `matchedWatchlist`를 조합해 `evidence`를 만든다.
5. mock feed item에도 같은 필드를 추가해 프론트가 database/mock에 따라 다른 분기 코드를 갖지 않게 한다.

## Frontend 구현 방향

1. `shared/api/radar.ts`의 Zod schema에 `sourceIds`와 `evidence`를 추가한다.
2. `pages/feed/model/feed-filters.ts`에 source 필터 타입을 추가한다.
3. `/feed` filter bar에 `NVD`, `CISA KEV`, `EPSS`, `Vendor` 같은 source pill을 추가한다.
4. feed card에는 `sourceIds`는 작은 badge로, `evidence`는 우선순위 설명 영역으로 보여준다.
5. 검색 대상에는 `sourceIds`, `evidence.label`, `evidence.value`도 포함한다.

## 정책

- `priority`는 대응 우선순위이지 신뢰도 자체가 아니다.
- `dataSource.kind`는 화면의 데이터 신뢰 상태를 설명한다.
- `sourceIds`는 취약점 item의 원천 출처를 설명한다.
- `evidence`는 우선순위 계산 근거를 설명한다.
- UI 필터는 `sourceIds`를 기준으로 한다.
- `왜 이 취약점이 중요하지?`라는 질문은 `evidence`로 답한다.
- `이 판단을 얼마나 믿을 수 있지?`라는 질문은 `reliability`로 답한다.
- 기존 API 소비자를 깨지 않기 위해 처음에는 additive field로 확장한다.

## 다음 작업

- backend `FeedItem` type에 `sourceIds`, `evidence`를 추가한다.
- backend `FeedItem`과 `VulnerabilityDetailItem`에 `reliability`를 추가한다. 완료
- database feed query에서 advisory source를 함께 조회한다.
- mock feed data를 새 contract에 맞춘다.
- frontend Zod schema와 feed filter model을 확장한다.
- source filter UI를 활성화한다.
