# ADR-0028: NAS 불변 게시 스냅샷과 revision 검증

## 상태와 범위

- 상태: 제안
- 대상: docs-backend 게시 산출물·docs 원격 읽기·공용 콘텐츠 계약
- 결정일: 2026-11-06
- 최종 검토: 2026-11-06

전체 게시 흐름은 아직 채택·배포하지 않은 로컬 설계안이다. 첫 단계의 공용 스키마·순수 validator만
로컬 커밋 `cdf47ec`에 구현했다. 기존 NAS 볼륨·API·웹훅·자격 증명은 변경하지 않았다.
공용 계약과 관련 정제 문서만 사용자 승인으로 공개 검수·로컬 커밋하며 푸시·배포는 제외한다. ADR-0011의 로컬 검색 캐시 결정을 대체하지 않는다.
아래 URL과 NAS 전환은 제안이며 현재 지원하는 API가 아니다. 공용 계약의 로컬 검증은 아래 구현 현황과 구분한다.

## 배경

현재 [repository](../../apps/docs-backend/src/modules/content/content.repository.ts)는 목록과 본문을
각각 변경 가능한 Markdown에서 읽는다. [service](../../apps/docs-backend/src/modules/content/content.service.ts)는
목록의 검색 텍스트와 본문을 별도로 생성하고 HTML은 요청 시 렌더링한다.
[controller](../../apps/docs-backend/src/modules/content/content.controller.ts)의 인증·no-store·byte budget은
버전 스냅샷을 보장하지 않는다. 현재 공용 목록 계약에도 revision 필드가 없다.

파일을 읽은 뒤 해시 헤더만 붙이면 그 파일의 식별에는 도움이 되지만, 먼저 읽은 목록과 나중에 읽은 본문이
같은 게시본이라는 보장은 없다. 세대만 바꾸고 원본은 V1로 둔 실험에서도 새 세대 요청이 V1을 받았다.
통제한 늦은 쓰기 경로는 방어할 수 있었지만 과거 CI 실패의 최초 원인은 여전히 미확정이다.

## 결정

### 1. 검수된 출력만 불변 스냅샷으로 만든다

다음 단계를 구현 후보로 선택한다. 단순 해시 헤더 추가를 최종 해법으로 채택하지 않는다.

```text
비공개 authoring
  → 공개 검수한 입력을 고정
  → 목록 JSON·검색 텍스트·HTML을 함께 빌드·검증
  → 임시 출력의 전체 해시·용량·경로 검사
  → releases/<revision>으로 확정
  → 현재 게시 포인터 교체
  → 원격 API에서 해당 게시본 검증
  → 인증된 웹훅·실제 화면 발행 검증
```

스냅샷에는 `manifest.json`, `index.json`, 검증된 각 문서의 완성 HTML만 둔다.
실행 중 Markdown을 다시 렌더링하거나 asset base 설정으로 HTML을 재작성하지 않는다.
렌더러·정규화·asset URL 변경은 새 빌드에 포함한다. 공개 입력·출력은 수정 불가로 취급한다.
공개 후보 입력을 복사한 뒤 그 복사본을 검수·고정하며, 빌드 중 authoring 편집을 그대로 따라가지 않는다.
해시는 여러 파일을 동시에 캡처하는 장치가 아니므로 입력 고정 단계가 필요하다.

검수 누락·잘못된 published 문서·누락된 본문·크기 초과는 후보 전체 실패다. 현재 목록 API처럼 조용히
일부 글을 건너뛴 결과를 새 게시본으로 승격하지 않는다. draft·비밀 파일·원시 자료는 산출물에 복사하지 않는다.
Git의 공개 승인과 NAS 입력의 공개 승인은 다른 경계다. `published`만으로 공개 검수 완료를 추정하지 않는다.

### 2. Revision과 게시 세대의 형식을 분리한다

| 항목                 | 제안 계약                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `schemaVersion`      | 최초 값 1. 지원하지 않는 값·알 수 없는 필드는 명시적으로 거절                              |
| `revision`           | 정확히 64자리 소문자 SHA-256 hex. 저장한 manifest bytes의 해시                             |
| `generation`         | 매 게시·rollback마다 새 소문자 UUIDv4. 크기·시간·사전순으로 비교하지 않고 일치 여부만 사용 |
| `previousGeneration` | 전환 시 기대하는 기존 세대. NAS의 게시 잠금 안에서 비교 후 교체. 최초 초기화에만 null 허용 |
| 문서 항목            | 기존 allowlist `markdownPath`, 완성 HTML bytes·SHA-256                                     |
| 목록 항목            | 저장한 index bytes·SHA-256. 목록·본문은 같은 manifest에 포함                               |

실험의 g1/g2/g3은 설명용 번호다. 운영 후보에서는 시계나 프로세스 카운터 대신 새 게시 작업의 불투명 ID를 쓴다.
r1으로 복원해도 generation은 새 값이다. 동일 산출물이면 revision은 재사용할 수 있다.
generation은 콘텐츠가 아니라 게시 작업을 구분하고, revision은 인증 토큰이 아니다.
최초 초기화는 기존 포인터가 없을 때만 명시적으로 허용하며, 포인터 유실을 자동 초기화로 숨기지 않는다.

manifest는 schemaVersion·출력 형식 버전·index 항목·문서 항목만 담는다. 문서 배열은 허용된 ASCII 경로순,
필드 순서는 스키마로 고정하고 compact JSON·UTF-8·BOM 없음으로 저장한다.
스스로의 revision·해시·생성 시각·generation·개인 경로는 manifest 안에 넣지 않는다.
실제 저장 bytes를 해시하므로 self-reference와 직렬화 차이를 피한다. 내용이 바뀌면 같은 revision으로 덮어쓰지 않는다.

공용 계약의 첫 구현은 문서 4,096개·경로 256자·index+HTML 선언 bytes 합계 64MiB를 추가로 제한한다.
포인터 4KiB·manifest 1MiB는 별도 envelope 제한이다. 실제 bytes의 상한도 각 검증 함수에서 검사하며
1MiB index·HTML 경계를 유지한다. 초기 계약 상한이며 NAS의 성능·메모리 안전 한계를 측정한 결과는 아니다.
pointer의 `previousGeneration: null`은 형식상 허용하지만 실제 최초 초기화 여부는 publisher가 확인해야 한다.

### 3. NAS를 현재 게시 상태의 단일 권위로 둔다

현재 포인터 파일은 `{ schemaVersion, generation, revision, previousGeneration }`만 담는다.
포인터와 임시 포인터는 같은 NAS 로컬 파일시스템에 두고, 완성된 release가 존재할 때만 교체한다.
publisher의 단일 쓰기 권한과 프로세스 간 잠금을 강제한 범위에서 예상 세대를 비교한다.
단순 `read → 비교 → write`나 컨테이너 수 1개만으로 다중 발행자의 CAS가 완성된다고 보지 않는다.
구체적 잠금 구현·중단 후 소유권 회복은 승격 기능 활성화 전 구현·검증한다.

포인터 교체에는 임시 파일·원자적 rename·동기화 절차를 검토한다. rename의 원자적 이름 교체와
전원 장애 내구성은 다르며 파일뿐 아니라 부모 디렉터리 동기화도 고려한다.
이는 [Linux rename](https://man7.org/linux/man-pages/man2/rename.2.html)·
[fsync](https://man7.org/linux/man-pages/man2/fsync.2.html) 및
[Node 24 FileHandle.sync](https://nodejs.org/download/release/v24.22.1/docs/api/fs.html#filehandlesync)에서 도출한 설계다.
실제 Synology 파일시스템·볼륨·전원 장애에서의 내구성은 미검증이다. 다른 파일시스템 간 rename 실패를 복사 덮어쓰기로 우회하지 않는다.

app 컨테이너는 release 루트 디렉터리를 읽기 전용으로 마운트하고 publisher만 별도 쓰기 권한을 가진다.
authoring은 mount하지 않는다. 교체되는 포인터 한 파일만 bind mount하지 않고 부모 디렉터리 단위로 설계한다.
현재 Compose의 `CONTENT_DIR` mount는 그대로 유지하며 실제 변경은 별도 배포 단계다.
symlink·외부 경로·사용자 지정 URL을 허용하지 않고 경로 검증과 파일 접근을 같은 경계에서 처리한다.

### 4. 버전이 고정된 읽기 API를 추가한다

기존 `/api/posts`, `/posts/:channel/:slug`는 이행 중 그대로 유지한다. 새 경로는 모두 기존 server-to-server 인증을 요구한다.

| 제안 경로                                              | 역할                                                                  |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| `GET /api/publication`                                 | 현재 포인터. backend와 docs fetch 모두 no-store. 본문 최대 4 KiB 제안 |
| `GET /api/publications/:revision/manifest`             | 저장한 manifest bytes. 최대 1 MiB 제안                                |
| `GET /api/publications/:revision/posts`                | 저장한 index bytes. 기존 목록 1 MiB 상한 유지                         |
| `GET /api/publications/:revision/posts/:channel/:slug` | 해당 스냅샷의 HTML bytes. 기존 HTML 1 MiB 상한 유지                   |

프론트 읽기 모드는 legacy/revision 중 명시적으로 선택한다. backend 새 경로를 먼저 검증하고 Preview에서
revision 모드를 시험한 뒤 운영 전환을 별도 승인한다. revision 모드에서 404·503·검증 오류를 받았다고
legacy 모드로 자동 재시도하지 않는다. 이 문서에서 실제 환경 변수나 원격 설정은 생성하지 않는다.

revision·channel·slug는 공용 스키마로 검증한다. 본문 경로는 manifest에 있는 공개 문서로만 제한하며
입력으로 임의 URL·파일 경로를 받지 않는다. 특정 revision이 없을 때 mutable 최신 경로로 fallback하지 않는다.
불변 경로 안에서 현재 포인터를 다시 읽어 다른 스냅샷으로 바꾸지 않는다.
backend도 제공 bytes가 manifest의 크기·해시와 맞는지 검사하고 오류 시 정상 HTML로 내보내지 않는다.

`ETag`·헤더의 revision 표시는 보조 정보다. body와 함께 바뀐 헤더만 믿는 검증으로 대체하지 않는다.
첫 도입은 모든 새 경로를 private/no-store로 제공한다. CDN 공개 캐시·조건부 304 계약은 이번 설계에서 추가하지 않는다.

### 5. 프론트는 한 요청에서 하나의 lease만 사용한다

서버 요청 시작 시 현재 포인터를 한 번 읽고 `{generation, revision}`을 고정한다.
metadata·목록·검색·본문은 그 lease를 공유하며 목록과 본문 사이에서 최신 포인터로 갈아타지 않는다.
같은 요청 안의 재사용과 요청 간 캐시는 구분한다. 요청 ID·토큰·검색어를 publication 식별자로 넣지 않는다.

manifest bytes의 SHA-256을 포인터의 revision과 비교한다. 이어 index·HTML의 크기·SHA-256을 manifest와 비교한다.
상한 내 bytes를 먼저 수집하고, 전송 계층 디코딩 뒤의 bytes를 UTF-8 변환·HTML 정규화 전에 검사한다.
잘린 응답·인코딩 오류·스키마 오류·해시 불일치는 검증 실패다. 헤더에만 r2가 있는 V1 본문도 거절한다.
목록은 새로운 명시적 공용 계약으로 파싱하며, 현재 정규화 과정에서 알 수 없는 revision 필드가 보존될 것이라 가정하지 않는다.

MVP는 snapshot fetch도 no-store로 검증 경로부터 도입한다. 뒤이어 **검증에 성공한 결과만**
`계약버전 + generation + revision + 응답종류 + 문서경로` 키로 캐시하는 단계를 분리한다.
검증 전 원시 응답을 Next fetch 캐시에 먼저 넣어 불일치 본문이 반복 적중하지 않도록 한다.
검증 실패가 저장되지 않는지는 통합 회귀의 필수 조건이다.

느린 A는 처음 받은 lease의 불변 URL과 키만 사용한다. B가 새 포인터를 읽으면 다른 세대의 URL/키로 접근한다.
프레임워크 내부 set을 운영에서 패치하지 않는다. A의 쓰기를 물리적으로 모두 취소하는 대신 현재 캐시 공간과 격리한다.
현재 포인터를 캐시하지 않는 한 Vercel 인스턴스별 전역 Map을 게시 상태로 쓸 필요가 없다.
추가 NAS 왕복 비용·장애 의존성은 측정하고, 공유 저장소 도입은 그 결과 후 별도 결정한다.

### 6. 웹훅은 게시 완료 증명 대신 갱신 신호로 사용한다

새 계약은 별도 `POST /api/revalidate/publication` 후보로 분리한다. 기존 웹훅 의미를 즉시 바꾸지 않는다.
payload는 schemaVersion·generation·revision·previousGeneration만 허용하고 최대 4 KiB로 제한하는 안이다.
기존 재검증용 인증 경계를 재사용하며 origin 읽기 토큰과 혼동하지 않는다. 새 토큰·WAF 규칙은 자동 생성하지 않는다.

인증·스키마 검사 뒤 NAS 현재 포인터를 직접 읽어 payload와 일치하는 게시가 실제 존재하는지 확인한다.
URL은 기존 고정 base에서 구성하며 payload가 원본 주소를 선택할 수 없다. 아직 준비되지 않은 스냅샷은 거절한다.
현재 포인터와 다른 generation은 순서를 추정하지 않고 `409 publication-not-current`로 거절한다.
UUID만으로 이전/미래 게시를 판정하지 않는다. 발행자는 현재 포인터를 대조해 대체된 이벤트의 재시도를 중단한다.
동일 이벤트 재전달은 포인터를 다시 바꾸지 않는다. 공유 dedup 저장소 없이 재무효화를 완전히 한 번으로 제한했다고 표시하지 않는다.
발행자는 웹훅을 제한된 횟수만 재시도하며, 성공 뒤 목록·본문의 기대 revision을 별도로 검증한다.

현재 포인터 전환 이후에만 이 신호를 보낸다. 새 서버 요청의 올바른 lease 선택을 웹훅의 도착 순서에 의존시키지 않는다.
이미 열린 DOM·이전 prefetch·브라우저 Router Cache를 즉시 바꾸는 계약은 별도다.
해시는 인가·공개 승인·서명을 대체하지 않는다. 이 설계는 NAS 포인터를 신뢰하는 모델이며,
원본 서버와 포인터가 함께 장악되는 위협까지 검증하지 않는다. 서명 도입은 별도 위협 모델 검토 대상이다.

### 실패·철회·복구 경계

- 검수·빌드·용량·승격 전 실패: 현재 포인터 유지, 실패 후보는 비공개 보관하며 자동 공개하지 않음.
- 포인터 누락·파손·manifest 불일치: revision 모드의 원격 읽기를 실패 처리. 로컬 글은 계속 제공하고 mutable 경로로 조용히 전환하지 않음.
- NAS 단절: 기존 deadline 안에서 원격 unavailable로 처리. 오래된 포인터로 강한 최신성 계약을 만족했다고 표시하지 않음.
- rollback: 이미 검수된 이전 revision에 새 generation을 발급하고 동일 승격 절차 사용. 백업 복원을 정상 rollback으로 간주하지 않음.
- 공개 철회: 새 목록 제외만으로 과거 revision 접근·기존 캐시가 철회되지 않음. revision/문서 denylist·캐시 만료·직접 URL 거절을 운영 활성화 전 설계해야 함.
- 이미 공개한 응답·이미지의 외부 복사본이나 이미 전송한 bytes를 회수할 수 있다고 보증하지 않음.
- 구세대 정리: active·직전 복구본·진행 중 lease를 고려한 보관 기간을 결정하기 전 자동 삭제 금지. 단일 NAS 장애에 대한 HA 보장은 아님.
- 미디어: 1차 검증 보장은 목록·HTML bytes다. 동일 URL 이미지 변경까지 보장하지 않으며 해시 파일명·별도 asset 승격 정책을 연결해야 함.

## 대안과 영향

| 대안                               | 장점                                               | 제한·선택 이유                                                      |
| ---------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| 수정 시각·헤더만 추가              | 변경이 작음                                        | 목록/본문 스냅샷과 늦은 쓰기 격리에는 부족                          |
| 요청마다 live 파일 재해시          | 실제 bytes 검사 가능                               | 여러 파일 편집 중 혼합 버전·중복 비용. 입력 고정 없이 채택하지 않음 |
| 불변 스냅샷 + NAS 포인터           | 파일 기반 운영 유지·명시적 rollback·원본 검증 가능 | publisher·디스크 용량·포인터 장애 검증 필요. 우선 제안              |
| DB/KV의 게시 트랜잭션              | 다중 writer·공유 CAS 확장에 유리                   | 백업·운영 대상이 늘어남. 단일 publisher 단계에서는 추가하지 않음    |
| 실험용 Next 내부 patch를 운영 사용 | 로컬 방어 경로와 유사                              | 플랫폼 캐시·버전 변화에 종속. 채택하지 않음                         |

### 구현 순서와 완료 조건

1. 공용 revision/manifest/포인터 스키마와 순수 hash validator. 변조·누락·상한·미지원 버전이 실패해야 한다.
2. 격리된 임시 NAS 디렉터리의 snapshot builder·승격 잠금·포인터 교체. 동시 발행·중단·재시작·rollback을 검증한다.
3. backend 새 읽기 API. V1 목록 조회 뒤 V2 승격해도 V1 본문은 V1, 새 포인터 요청은 V2여야 한다.
4. docs의 no-store revision 검증 경로. metadata·검색·본문 lease 공유, 원격 실패 중 로컬 유지, 불일치 응답 저장 금지를 검사한다.
5. 검증 후 캐시·웹훅 신호·철회·보관 정책. A 보류·V2 승격·B 시작·A 늦은 완료에서도 B=V2를 유지한다.
6. NAS 이미지·mount·Cloudflare 경로와 Vercel Preview에서 단계적 검증. 그 전까지 기존 계약·운영 설정은 유지한다.

첫 단계는 [공용 publication subpath](../../packages/docs-content-contract/README.md#publication-integrity)에
로컬 구현했다. [검증 결과](../verification/content/2026-11-06-publication-integrity-contract.md)는 변조·누락·
상한과 기존 ESM/CJS 소비자 호환 범위다. 이 사실만으로 NAS 게시·최신 포인터·캐시 격리 검증을 완료 처리하지 않는다.
단계 2~6과 전체 정책 채택은 아직 진행하지 않았다.

## 관련 문서

- [실험 결과와 한계](../verification/cache/2026-11-06-publication-generation-experiment.md)
- [revision·세대 개념](../knowledge/content-platform/docs-cache-structure.md#revision과-캐시-세대는-무엇이-다른가)
- [기존 API 계약](blog-content-api-contract.md)
- [기존 캐시 정책](docs-content-cache-revalidation-policy.md)
- [공개 검수 경계](adr-0025-publication-boundary.md)
- [로컬 검색 캐시](adr-0011-local-search-index-cache.md)
- [설계 작업 기록](../worklog/2026-11/2026-11-06-nas-revision-design.md)
