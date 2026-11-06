# 게시 세대 격리의 실제 Next 렌더링 실험

## 대상과 조건

2026-11-06 KST, 로컬 기준 `978eae792468790ea1fba75afb0f1f085b0f1954` 위의 미커밋 실험이다.
Node 24.22.1·pnpm 12.14.0·Next 16.4.3, loopback origin 3112와 production Next 3111을 사용했다.
실제 상세 HTML 렌더링을 APIRequestContext로 읽는다. mobile/desktop 두 Playwright project의
프로토콜 반복 검사이며 실제 휴대전화·두 브라우저 UI·Vercel 분산 환경 검증은 아니다.
이전 [지연 순서 진단](../resilience/2026-11-03-docs-sequential-followups.md)은 수정하지 않았다.

운영 코드·웹훅·콘텐츠 계약·Next 설정·의존성·NAS·자격 증명은 바꾸지 않았다.
별도 설정만 test-only preload를 사용하며 기본 설정은 실험 계층을 로드하지 않는다.
최초 실험 뒤 같은 날 사용자가 이번 코드·정제 문서의 공개 검수·로컬 커밋을 승인했다.
푸시·배포 승인은 없으며 뒤이어 작성할 NAS revision 설계는 이번 커밋 범위에 포함하지 않는다.

## 재현 방법

저장소 루트에서 의존성과 위 도구 버전을 준비한다. 기존 3111·3112 서버가 있으면 소유자를 확인하며 임의 종료하지 않는다.
증거 디렉터리는 저장소 밖에 만들고 원시 trace·로그는 Git에 추가하지 않는다.

```sh
EVIDENCE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/docs-generation.XXXXXX")"
chmod 700 "$EVIDENCE_DIR"
pnpm --filter docs exec playwright test \
  --config=playwright.cache-generation.config.ts --repeat-each=3 \
  --output="$EVIDENCE_DIR/experiment" --reporter=list
pnpm --filter docs test:article:prod \
  --output="$EVIDENCE_DIR/normal" --reporter=list
pnpm --filter docs lint
pnpm --filter docs exec tsc --noEmit
```

실험은 원본 V1 설정 → 캐시 무효화 → A의 V1 본문 보류 → 원본 V2 설정 → 실제 웹훅 완료 →
실험용 세대 전환 완료 → A 해제 순서다. B는 A 해제 뒤 시작하거나, 해제 전에 도착한 것을
서버 요청 카운터로 확인한다. 고정 sleep·시계 조작·timeout 확대·retry·skip은 사용하지 않았다.
새 요청 B 검사 전 두 번째 복구 웹훅은 호출하지 않는다. 검사가 끝난 뒤의 정리 웹훅과 구분한다.

세대는 요청 시작 시 불변 lease로 고정한다. 보호 모드에서는 실행 namespace·세대를 포함한
FETCH 캐시 키를 사용하고, 이전 lease의 쓰기를 거절한다. 기본 대조군은 원래 키와 쓰기를 유지한다.
세대 전환은 현재 세대와 예상 세대가 같아야 성공한다. 이 전환은 test-only API이며
실제 게시 웹훅과 하나의 원자적 트랜잭션으로 연결하지 않았다.

## 결과와 증거

원본 artifact 상대 링크: **해당 없음**. 원시 trace·오류 문맥·로그는 저장소 밖 제한된 임시 경로에 보관한다.
아래는 자체 작성 합성 fixture의 정제 결과다. 사용자 승인에 따라 최종 문서 bytes만 공개 검수 해시에 기록한다.

| 검사                    | 결과                         | 의미                                                                        |
| ----------------------- | ---------------------------- | --------------------------------------------------------------------------- |
| guard 적용 전 실패 대조 | 2/2 예상 실패                | 키 분리·이전 쓰기 거절 전 구현에서 B의 V2 필수 조건이 두 project 모두 false |
| 최초 보호 구현 비교     | 10/10 통과                   | 당시 5개 시나리오 × 두 project. 이후 제어 평면 검사와 정리 경로를 보강      |
| 최종 실험 3회 반복      | 36/36 통과, retry 0          | 6개 시나리오 × 두 project × 3회                                             |
| 기존 방식 대조          | 반복 중 6회 B=V1             | 이전 세대의 실제 쓰기를 관측했고 거절 카운터는 0                            |
| 보호 모드 두 순서       | 반복 중 12회 B=V2, V1 미포함 | A 완료 뒤/진행 중 시작한 B 모두 엄격 검사. 이전 쓰기 발생·거절 카운터 일치  |
| rollback·오래된 게시자  | 순수 모델 및 HTTP 검사 통과  | r1→r2→r1이어도 세대는 1→2→3. 과거 예상 세대의 HTTP 전환은 409               |
| 원본 미게시 음성 대조   | 반복 중 6회 V1 반환          | 원본은 V1인데 r2/g2만 선언하면 새 세대도 새 본문을 증명하지 못함            |
| 제어 평면 인증          | 무인증 POST 401 확인         | 합성 control 인증만 사용하며 새 운영 API를 추가한 것은 아님                 |
| 기본 production 전체    | 198/198 통과, retry 0        | 기존 196개와 제어 경로 미노출 2개. 실험 preload 미사용                      |
| 코드 검사               | lint·TypeScript 통과         | 캐시 운영 코드·기존 지연 진단·기본 설정 변경 없음                           |

실패 대조의 초기 구현은 `keyFor`가 원래 키를 돌려주고 `canWrite`가 항상 true인 상태였다.
최종 코드에서는 baseline 모드가 그 대조 동작을 보존한다. 따라서 위 최종 명령은 baseline의 V1을
예상 결과로 검증하며, 보호 모드 B의 V2 조건은 약화하지 않는다.

정리는 응답 보류 해제와 원본 reset을 독립 시도하고 가능한 pending 요청을 drain한 뒤 무효화·세션 reset을 수행한다.
본문 실패와 정리 실패가 겹치면 둘 다 오류로 보존한다. 원시 HTML 대신 버전 포함 여부만 assertion에 사용한다.

같은 날 공개 검수 단계에서 동일한 최종 소스로 실험 36개·기본 production 198개를 다시 실행해
retry 없이 통과했다. lint·TypeScript도 재확인했다. 코드 5개는 로컬
`8e7963d0cb5a80ab2188c9aaa7618320ecc56b4e`로 분리했으며 정제 문서·검수 기록은 후속 커밋이다.
원시 증거는 계속 비공개이고 원격 CI·푸시·배포는 이번 결과에 포함하지 않는다.

## 한계와 후속 작업

- Next의 내부 `FileSystemCache` 메서드를 test-only로 감쌌다. 공식 운영 어댑터나 `use cache`용 `cacheHandlers` 도입이 아니다.
- 상태·CAS는 Next 서버 한 프로세스의 실험이다. Vercel 여러 인스턴스·재시작·공유 저장소의 원자성·장애는 미검증이다.
- r1/r2는 합성 게시 정보다. NAS의 불변 스냅샷·revision 응답 검증·잘못된 원본 응답 거절은 아직 구현하지 않았다.
- 같은 revision에 새 세대를 부여하는 원리는 확인했지만 실제 운영 rollback·구세대 데이터 정리는 하지 않았다.
- 이미 진행 중인 A의 V1 응답을 취소하지 않는다. 새 세대 B의 FETCH 캐시 경계를 검사하며 브라우저·CDN·Full Route Cache 전체를 보증하지 않는다.
- 제어한 지연 경로 방어에 성공했어도 과거 CI 간헐 실패의 최초 원인이 확정되는 것은 아니다. KAN-58은 진행 중을 유지한다.
- 운영 채택 전 원본 revision 계약·게시/전환 순서·공유 권위 저장소·정리 정책을 제안 ADR로 검토해야 한다.

## 관련 문서

- [revision·캐시 세대 개념](../../knowledge/content-platform/docs-cache-structure.md#revision과-캐시-세대는-무엇이-다른가)
- [기존 캐시 정책](../../architecture/docs-content-cache-revalidation-policy.md)
- [작업 기록](../../worklog/2026-11/2026-11-06-publication-generation-experiment.md)
- [KAN-58](https://web-tech-service.atlassian.net/browse/KAN-58)
