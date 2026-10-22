# vuln-radar Railway 자격 증명 교체

## 목적과 준비 조건

- 상태: 교체 계획 작성. 실제 발급·폐기·DB 변경·재배포는 미실행.
- 최종 검토: 2026-10-22 KST, 코드 기준 main `4e61767e2aa7a53537ef388a5c9759d80faaf8ab`.
- 대상: Railway `vuln-radar-service`의 backend·Postgres와 Vercel `vuln-radar`의 서버 프록시.
  Railway 환경 이름은 `development`지만 기존 공개 서비스가 사용하는 환경이다.
- 추적: [KAN-28](https://web-tech-service.atlassian.net/browse/KAN-28),
  배포 전환은 [KAN-27](https://web-tech-service.atlassian.net/browse/KAN-27).
- 실행 준비: 운영자 승인, 안전한 비밀번호 관리자, 관리자 접근, DB 백업·복구 가능 여부,
  모든 소비처 목록, 배포 가능 여부와 허용 중단 시간을 확인한다. 백업에도 비밀정보가 있을 수 있어 비공개로 보관한다.

[Railway 보안 공지](https://blog.railway.com/p/security-disclosure-wednesday-october-21st)는
환경변수 저장 시스템 접근 가능성을 이유로 비밀값 교체와 비정상 활동 검토를 권고한다.
이 프로젝트의 유출을 확인했다는 뜻은 아니다. 정기 교체보다 사고 대응 우선순위를 적용한다.
문서는 값·일부 문자열·지문·인증 헤더·완전한 DB URL을 기록하지 않는다.

### 확인 범위와 교체 목록

코드의 사용처와 앞선 읽기 전용 배포 메타데이터를 대조했다. 실제 환경변수 값·DB role·권한·참조식은
조회하지 않았다. `railway variable list --json`이나 `--kv`는 원시 값을 출력하므로 목록 작성에 사용하지 않는다.
아래의 "사용 시"는 설정 여부·재사용 여부를 운영자가 비공개로 확인해야 한다는 뜻이다.

| 우선순위·대상                | 이름·저장 위치                                                                                                  | 함께 확인할 소비처                                                   | 확인 수준                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 최우선: DB 비밀번호          | Railway Postgres의 `POSTGRES_PASSWORD`, 연결된 `PGPASSWORD`                                                     | backend, DB 관리 도구, 백업·cron·CI·로컬 운영 DB 접속 도구           | Postgres 서비스 존재 확인. 실제 role·변수 구성은 미조회                         |
| 최우선: DB 접속 문자열       | backend의 `DATABASE_URL`, `DIRECT_URL`; Postgres의 `DATABASE_URL`, `DATABASE_PUBLIC_URL` 및 실제 사용 중인 별칭 | 내부/외부 연결·참조 변수·복사한 URL 모두                             | 코드의 두 변수 사용 확인. URL은 비밀번호를 포함하는 비밀값으로 취급             |
| 최우선: 공유 API 토큰        | Railway `VULN_RADAR_API_TOKEN` ↔ Vercel `VULN_RADAR_BACKEND_API_TOKEN`                                          | Production, Preview, 과거 활성 배포, Vite 로컬 프록시, 운영 스크립트 | 양쪽 코드 사용 확인. Vercel key/target 존재 확인, 값의 일치는 미조회            |
| 사용 시: NVD 키              | Railway backend `NVD_API_KEY`                                                                                   | 수집기, 같은 키를 사용하는 별도 수집 작업                            | optional 코드 확인, 운영 설정 여부 미조회                                       |
| 사용 시: 별도 DB·Prisma 키   | `SHADOW_DATABASE_URL`, `prisma+postgres` URL의 `api_key`                                                        | migration 도구, 외부 Prisma 프로젝트·shadow DB                       | 지원 코드만 확인. 주 DB와 다른 계정이면 별도 교체                               |
| 관리 접근 복구               | Railway account/project API token과 CLI OAuth 세션                                                              | 자동화·CI·로컬 CLI                                                   | CLI 재로그인은 성공. 별도 API token 사용 여부 미확인                            |
| GitHub 연결 복구             | Railway가 보관하는 GitHub 계정 연결·GitHub App 권한                                                             | 저장소 조회, main 자동 배포                                          | GitHub 소스 확인. 재로그인만으로 연결 복구가 입증되지는 않음                    |
| 조건부: 외부 서비스·registry | Railway에 보관한 GitHub PAT, private registry credential, cloud·관측·알림 API 키                                | 해당 계정·다른 서비스의 같은 키 소비처                               | 해당 프로젝트의 배포 manifest에는 registry credential 없음. 계정 전체 미조사    |
| 조건부: bucket               | bucket `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY` 및 소비 서비스 별칭                                                 | 업로드 앱, 외부 S3 도구                                              | 해당 프로젝트 bucket은 0개로 관측. 다른 프로젝트·workspace까지 없다는 뜻은 아님 |

`DATABASE_URL`이 있어야 현재 Prisma 런타임의 DB 기능이 켜지며, 실제 연결 문자열은
`DIRECT_URL`이 있으면 그것을 우선한다. `DATABASE_URL`만 새 값으로 바꾸거나
`DIRECT_URL`만 설정하고 끝내지 않는다. `SHADOW_DATABASE_URL`의 실제 DB·role이 다르면
주 DB 교체가 그 자격 증명을 무효화하지 않는다.

`PORT`, `APP_ENV`, `FRONTEND_ORIGIN`, `CORS_ORIGIN`, `VULN_RADAR_BACKEND_ORIGIN`,
`VITE_API_BASE_PATH`, 수집 주기·timeout은 비밀값이 아니므로 무작위로 바꾸지 않는다.
URL도 DB URL처럼 자격 증명을 포함하는 경우에는 예외다.

NAS·docs·Cloudflare에만 저장한 토큰은 이 사고만으로 일괄 교체 대상이라고 단정하지 않는다.
다만 Railway에 복사했거나 같은 값을 재사용했다면 그 외부 소비처까지 교체 범위에 포함한다.
API 키와 DB 비밀번호는 앞으로도 용도·환경별로 분리한다.

## 실행 순서

### 1. 사고 대응 방식과 소비처 확정

1. 공급자 상태와 계정 보안 알림, 가능한 범위의 접근·배포·인증 실패 기록을 확인한다.
   감사 로그의 제공 범위·보존 기간은 플랜에 따라 다르며, 로그가 없다고 침해가 없었다고 판단하지 않는다.
2. 비밀값이 아닌 이름·용도·저장 위치·소비 서비스·배포 ID·상태만 비공개 inventory에 기록한다.
   Railway 참조 변수와 복사한 문자열, Vercel Production/Preview, 외부 DB 도구를 구분한다.
3. GitHub·Railway 관리 접근을 복구한다. 새 키는 비밀번호 관리자나 승인된 secret store로만 전달한다.
4. 배포 중단 상황에서 "서비스 유지하며 기다림"은 안전한 완료가 아니다. 노출 의심 자격 증명이 계속
   유효할 수 있다. 침해·악용 징후가 있거나 운영자가 차단을 선택하면, 허용 중단을 명시하고
   자격 증명 폐기·접근 제한을 우선한다. 신규 배포가 없어도 현재 프로세스의 키는 유효할 수 있다.
5. 실제 값 변경·접근 제한·DB 재시작은 별도 실행 승인을 받는다. 이번 계획 작성은 그 승인이 아니다.

일반 기능 배포와 회전을 가능한 한 분리한다. 먼저 검증된 코드에 새 자격 증명을 적용해 연결을
복구하고, 이후 새 API 계약·화면을 배포하면 실패 원인을 좁히기 쉽다. 구 비밀값에 의존하는 이전
deployment로 단순 rollback하는 것은 복구가 아니다.

### 2. 관리 계정·독립 외부 키

- Railway는 사고 공지에서 API token 무효화를 알렸다. 실제 사용하는 자동화가 있다면 필요한 범위의
  새 token을 발급해 해당 소비자만 교체한다. CLI 재로그인은 DB·앱 토큰·NVD 키를 교체하지 않는다.
- Railway 계정 설정에서 GitHub 연결 재승인 필요 여부를 확인하고, GitHub App의 저장소 접근과
  main 자동 배포 설정을 확인한다. 임의 PAT를 새로 추가하거나 조직 전체 권한을 확대하지 않는다.
- Railway에 저장했던 registry PAT가 제거됐더라도 GitHub에서 폐기된 것은 아닐 수 있다.
  사용했다면 GitHub에서 이전 PAT를 폐기하고 필요한 최소 권한으로 재발급한다.
  실행마다 발급되는 Actions `GITHUB_TOKEN`을 장기 PAT처럼 수동 교체하지 않는다.
- `NVD_API_KEY`가 설정돼 있다면 NVD의 공식 재발급·폐기 절차를 확인한다. 여러 키 동시 유효를
  가정하지 않는다. 사고 대응으로 구 키를 폐기하면 배포 복구 전까지 기존 수집이 실패할 수 있다.
  공개 NVD를 무키로 계속 호출하는 대신 실제 설정·요청 간격·수집 중단 방안을 함께 확인한다.
- 독립 키의 폐기를 DB 복구가 끝날 때까지 기계적으로 미루지 않는다. 영향·배포 가능성별로 병행한다.

### 3. PostgreSQL: 원본 비밀번호와 모든 연결 갱신

이번 사고 대응은 [Railway PostgreSQL 교체 권고](https://blog.railway.com/p/security-disclosure-recommendation-rotate-postgresql-database-credentials)를 우선한다.

1. 기존 Postgres의 **Database → Config → Connection → Regenerate** 사용 가능 여부를 확인한다.
   공식 템플릿 절차는 DB 내부 비밀번호와 `POSTGRES_PASSWORD` 및 이를 참조하는 연결 변수들을 함께 갱신한다.
2. 이 절차는 DB를 재시작해 기존 세션을 끊는다. 기존 앱의 DB 연결도 끊기며, backend 재배포가
   차단된 상태에서는 복구 전까지 중단이 길어질 수 있음을 승인 단계에서 알린다.
3. 참조 변수는 소비 서비스의 **다음 배포**에 반영된다. 복사해 둔 `DATABASE_URL`·`DIRECT_URL`,
   외부용 `DATABASE_PUBLIC_URL` 소비처는 비공개로 새 값을 반영한다. 기존 hostname·DB·TLS 설정을 임의로 바꾸지 않는다.
4. 같은 비밀번호를 쓰는 모든 소비 서비스를 갱신·배포하고 새 연결로 인증·조회가 성공하는지 검사한다.
   DB Regenerate만으로 backend까지 새 값이 적용되지는 않는다.
5. 구 자격 증명으로 **새 연결**이 실패하는지 확인하고, 허용된 관리 세션에서 낯선 DB 접속·role·권한·데이터 변경을 조사한다.
   세션 종료는 확인된 대상과 영향에 대해 별도 승인 후 수행한다.

**하지 않을 작업:** `POSTGRES_PASSWORD`/`PGPASSWORD`만 수동 변경하거나 독자적인 `ALTER USER`로
DB 내부만 변경하지 않는다. 값과 DB 상태가 어긋날 수 있다. 기존 볼륨 재생성·DB 삭제·seed·migration은
비밀번호 교체가 아니다. 비밀값을 넣은 SQL·접속 명령·스크린샷을 대화·로그에 남기지 않는다.

Regenerate가 없거나 사용자 정의 DB라면 여기서 멈추고 실제 이미지·관리 방식을 확인해 절차를 조정한다.
일반 password 변경만으로는 기존 세션이 자동 종료된다고 가정할 수 없다.
노출 의심이 없는 정기 회전에서만 별도 검토한 dual-role 전환을 대안으로 삼는다.
권한·sequence·소유권 검증 없이 role을 추가하거나 기존 관리자 role을 삭제하지 않는다.

### 4. backend와 Vercel 공유 API 토큰

현재 `BackendAuthGuard`는 `VULN_RADAR_API_TOKEN` **한 개만** 허용한다. old/new 동시 허용은 미구현이다.
이 토큰은 조회뿐 아니라 수집·watchlist 변경 controller에도 쓰이므로 read-only 키로 취급하지 않는다.

1. 독립적인 새 256-bit 이상 무작위 토큰을 비공개로 생성한다. 기존 값·일부를 재사용하지 않는다.
2. Railway `VULN_RADAR_API_TOKEN`과 Vercel `VULN_RADAR_BACKEND_API_TOKEN`을
   **같은 새 토큰**으로 준비한다. 같은 backend에 연결된 Preview·로컬 운영 도구도 포함한다.
3. 승인된 작업 창에서 backend에 새 토큰을 반영·배포한 뒤 Vercel을 즉시 새 환경변수로 재배포한다.
   전환 도중 기존 프런트는 401을 받을 수 있다. backend가 여러 버전으로 겹치면 old/new 불일치가
   간헐적으로 나타날 수 있으므로 모든 replica의 버전과 전환 완료를 확인한다.
4. 새 토큰을 비공개로 주입한 **직접 backend 읽기 요청**은 200,
   토큰 없음·잘못된 토큰·구 토큰은 401인지 확인한다. 운영 데이터를 바꾸는 POST로 검증하지 않는다.
5. 공개 Vercel GET이 정상인지 확인한다. 프록시는 Authorization이 없으면 서버 토큰을 넣으므로
   공개 `/api/backend/*`의 무토큰 성공은 backend 인증 우회도, 구 토큰 폐기 검증도 아니다.
   쓰기 경로의 공개 접근 통제는 별도 보안 점검 대상으로 남긴다.
6. 환경변수 수정은 기존 Vercel deployment에 소급되지 않는다. 과거 활성 Preview·Production과
   운영 스크립트에 남은 구 값의 사용을 종료한다. 이미 폐기한 값을 다시 허용해 호환시키지 않는다.

무중단이 필수면 배포 전에 제한된 current/next 토큰 허용 기능과 폐기 시간·회귀 검사를 별도 설계한다.
현재 한 변수에 두 토큰을 쉼표로 넣거나 인증 guard를 끄는 방식으로 우회하지 않는다.

## 기대 결과

| 검사            | 완료 조건                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------ |
| DB 연결         | 새 프로세스·새 연결에서 실제 SELECT 성공, health의 `storage=database` 확인                       |
| 실제 데이터     | Feed/Overview의 `dataSource.kind=database` 확인. `200`·`status=ok`·화면 표시만으로 대체하지 않음 |
| DB 구 자격 증명 | 구 값으로 신규 접속 실패, 잔여 의심 세션 및 외부 소비처 확인                                     |
| backend 인증    | 직접 읽기 API: 새 토큰 200, 없음·오류·구 토큰 401                                                |
| 프런트 연동     | Production 및 같은 backend를 쓰는 Preview의 GET·목록·상세 정상, 새 deployment ID 확인            |
| 외부 키         | 사용 중인 provider key의 새 인증 성공과 구 키 폐기 확인. 실제 대량 수집 실행은 별도 승인         |
| 감사 기록       | UTC 시각·소비처·배포 ID·성공/거부 결과·미검증 범위만 기록. 값·인증 헤더·DB URL 제외              |

Prisma 초기화 실패 시 현재 코드는 경고와 mock fallback을 허용한다.
health `200`은 DB 연결 성공을 보장하지 않으며, 실제 DB 인증·조회와 함께 검증해야 한다.
회전 완료와 사고 영향 조사 완료도 구분한다. 노출 전 활동이나 데이터 유출 여부는 회전만으로 입증할 수 없다.

## 실패 대응과 복구

- 배포 불가: 우회 업로드·DB 재생성·플랜 변경을 하지 않는다. 폐기 우선이면 중단을 수용하고,
  그 외에는 잔여 위험과 다음 확인 조건을 운영자가 명시한다. 단순 장기 대기를 안전한 대응이라고 표시하지 않는다.
- DB 인증 실패: `DIRECT_URL` 우선순위, 참조/복사본, 새 배포 적용과 role·TLS를 먼저 확인한다.
  구 값이나 DB URL을 진단 로그에 찍지 않는다. 유출 의심 구 비밀번호로 되돌리지 않는다.
- API 401: Railway와 Vercel의 새 배포 적용 대상·복수 replica·Preview 연결을 확인한다.
  토큰을 공개 env로 옮기거나 인증을 끄지 않는다.
- 코드 rollback이 필요하면 검증된 이전 코드에 **새 자격 증명**을 적용해 재배포한다.
  구 secret을 포함한 이전 배포를 그대로 승격하지 않는다.
- 실제 악용 발견: 추가 침해 대응·접근 제한·증거 보존 범위를 따로 승인받고 진행한다.
  이 문서 작성만으로 토큰 폐기나 DB 세션 종료 권한이 부여되지 않는다.

## 관련 검증

- [전환 착수와 Railway 배포 차단 기록](../worklog/2026-10/2026-10-22-vuln-radar-main-production-transition.md)
- [교체 계획 작성 기록](../worklog/2026-10/2026-10-22-railway-credential-rotation-plan.md)
- [기존 토큰 수명주기 원칙](../architecture/docs-secret-token-lifecycle-policy.md): docs 범위 정책이며 본 문서는 vuln-radar 사고 대응 절차다.
- [공식 사고 공지](https://blog.railway.com/p/security-disclosure-wednesday-october-21st)
- [공식 PostgreSQL 교체 권고](https://blog.railway.com/p/security-disclosure-recommendation-rotate-postgresql-database-credentials)
- [공식 GitHub·bucket 재연결 권고](https://blog.railway.com/p/security-disclosure-recommendation-redeploy-buckets-and-reconnect-github-after-the-credential-reset)
- [일반 무중단 회전 대안](https://docs.railway.com/guides/rotate-credentials-zero-downtime): 사고 대응 시 노출 의심 구 키의 겹침 유지와 혼동하지 않는다.
- [Vercel 환경변수 회전](https://vercel.com/docs/environment-variables/rotating-secrets)

코드 근거: [설정](../../apps/vuln-radar-backend/src/config/app-config.ts),
[DB 연결 선택](../../apps/vuln-radar-backend/src/infra/prisma/direct-connection.ts),
[Prisma 초기화](../../apps/vuln-radar-backend/src/infra/prisma/prisma.service.ts),
[단일 토큰 guard](../../apps/vuln-radar-backend/src/shared/guards/backend-auth.guard.ts),
[Vercel 프록시](../../apps/vuln-radar/api/proxy.ts).
