# Next.js 활용 체크리스트 1차 검증

## 대상과 조건

- 날짜: 2026-09-19, Asia/Seoul.
- 브랜치: feature/docs. 실행 전후 HEAD: `964ff3aa5f45669a16bfb02d1fe6fa5b037ca78a`.
- Node.js 24.12.0, Next.js 16.3.4, macOS 로컬 환경.
- 앱 소스 변경 없이 순차 실행했다. 미커밋 변경은 체크리스트 문서뿐이었다.
- 상세 검사는 Chromium 390x844/1280x800, ko/en, worker 1, retry 0. 실제 NAS와 운영 webhook은 호출하지 않았다.
- 캐시 시험은 환경 파일을 제외한 임시 앱에서 webpack production build/start를 사용한다. 상세 시험은 현재 checkout의 production build/start를 사용한다.

## 재현 방법

저장소 루트에서 의존성과 Chromium이 준비된 상태로 실행한다. 같은 checkout에서 dev/build를 동시에 실행하지 않는다.

```sh
mise exec -- pnpm --filter docs test:article:prod > /tmp/docs-nextjs-checklist-article.log 2>&1
mise exec -- pnpm --filter docs test:cache:prod > /tmp/docs-nextjs-checklist-cache.log 2>&1
mise exec -- pnpm --filter docs test:lib > /tmp/docs-nextjs-checklist-lib.log 2>&1
mise exec -- pnpm --filter docs typecheck > /tmp/docs-nextjs-checklist-types.log 2>&1
mise exec -- pnpm --filter docs test:content > /tmp/docs-nextjs-checklist-content.log 2>&1
```

각 명령의 종료 코드가 0인지 확인한 뒤 다음 명령을 실행한다. `/tmp` 로그는 임시 파일이며 영구 증거는 아래 요약 artifact에 보관했다. 전체 로그를 그대로 복제한 artifact는 아니다.

## 결과와 증거

| 검사                  | 결과                              | 확인 범위                                                                    |
| --------------------- | --------------------------------- | ---------------------------------------------------------------------------- |
| 상세 production suite | 40 통과, 실패 0, 보고 시간 53.6초 | 상세/없는 문서 16, 게시 갱신 4, 스트림 경계 2, 로컬 읽기 14, 목록 일관성 4   |
| 캐시 production       | 모든 assertion 통과               | 원본 요청 수, 인증, lazy invalidation, expire:0/max, V3 상세, locale routing |
| lib                   | 127 통과                          | 인증, 파싱, sanitize, 출처 정책 등 단위 테스트                               |
| typecheck             | 통과                              | 앱 TypeScript 검사                                                           |
| content               | 17 통과, 문서 15개 검사 통과      | frontmatter와 콘텐츠 스타일                                                  |

[실행 결과 요약 artifact](../artifacts/2026-09-19-nextjs-checklist-phase-one.json).

게시 갱신 시험은 원본 V2 변경만으로는 목록·검색·상세가 V1을 유지하고, 잘못된 webhook 인증도 캐시를 갱신하지 않는 것을 확인했다. 정상 webhook 이후 새 요청/새로고침에서는 제목·요약·본문이 V2로 표시된다. 이미 열린 DOM은 webhook만으로 바뀌지 않는다.

캐시 시험의 `expire: 0` 조회는 원본 보류 해제 후 V2를 반환했다(관측 118ms). `max`는 원본 보류 중 기존 V2를 반환했다(3ms). 이후 V3 갱신과 warm 재사용도 통과했다. 인위적인 보류가 포함된 단일 실행이므로 두 시간을 운영 성능 비교로 사용하지 않는다. 53.6초 역시 suite 보고 시간이지 상세 페이지 LCP가 아니다.

### 별도 관측: 스트림 오류

게시 갱신 시나리오 실행 중 서버 로그에 `The destination stream closed early.`가 8회 기록됐다. 테스트 assertion은 모두 통과했지만 서버 로그가 깨끗한 것은 아니다. 이번 실행에서 prefetch 추적 대조군은 실행하지 않았으므로 취소된 prefetch가 원인이라고 확정하지 않는다. 오류를 숨기는 수정도 하지 않았다.

### 체크리스트 판정

| 항목               | 판정           | 근거와 한계                                                                                                   |
| ------------------ | -------------- | ------------------------------------------------------------------------------------------------------------- |
| C3 화면 갱신       | 부분 검증      | 목록·검색·상세, 열린 DOM 유지, reload 확인. 뒤로가기와 client navigation의 모든 Router Cache 조합은 미검증    |
| C4 갱신 정책       | 로컬 검증 통과 | 원본 요청 카운터와 보류 실험으로 expire:0/max 차이 확인                                                       |
| E1 원격 장애 격리  | 미검증         | 출처 선택 단위 테스트는 통과하지만 실제 timeout/401/403/5xx에서 로컬 DOM 유지 시험은 없음                     |
| E2 전체 응답 예산  | 미검증         | 요청별 timeout 설정과 실제 배포 전체 제한의 충족은 별개                                                       |
| E4 webhook 보안    | 부분 검증      | 인증 누락/오류/읽기 토큰 거부. WAF·회전·운영 배포 권한은 미검증                                               |
| R4 스트리밍        | 부분 검증      | 실제 경계 컴포넌트의 React stream 시험 통과. 전체 Next route에서 원격 부가 조회만 장시간 보류하는 시험은 아님 |
| O1 production 검사 | 로컬 검증 통과 | build/start 직접 접근과 reload 검사, 동일 HEAD 유지                                                           |
| O2 cold/warm·성능  | 부분 검증      | 캐시 원본 횟수 확인. 실제 배포 TTFB/LCP/CLS 및 단계별 성능은 이번에 측정하지 않음                             |

## 한계와 후속 작업

1. 원격 fixture의 timeout·401·403·5xx 모드를 추가하고 캐시를 비운 상태에서 목록·검색·로컬 상세가 유지되는지, 응답 예산과 요청 횟수까지 검사한다.
2. 스트림 오류는 runbook의 trace 대조군으로 요청 취소 여부를 확인한다. 화면 성공만으로 로그 오류를 정상 처리하지 않는다.
3. 실제 route에서 부가 영역 지연/실패를 주입해 본문 도착 순서와 사용자 화면을 확인한다. 현재 component-level 검사를 전체 route 보장으로 확대 해석하지 않는다.
4. Vercel/NAS 환경, TTL 자연 만료, 브라우저별 동작과 운영 성능은 별도 검사한다.

상세 시험이 남긴 `apps/docs/.next`는 fixture 환경 빌드다. 일반 production 실행이나 배포 전 실제 환경으로 다시 빌드한다. 테스트 서버는 종료됐으며 앱 코드와 운영 환경은 변경하지 않았다.

## 관련 문서

- [Next.js 체크리스트](../../runbooks/docs-nextjs-usage-checklist.md)
- [상세 회귀 및 스트림 추적](../../runbooks/docs-article-rendering-regression.md)
- [캐시 통합 절차](../../runbooks/docs-content-cache-production-test.md)
- [작업 기록](../../worklog/2026-09/2026-09-19-nextjs-checklist-validation.md)
