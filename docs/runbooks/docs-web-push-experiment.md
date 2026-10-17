# Docs 웹 푸시 실험 실행 절차

## 목적과 준비 조건

Node.js 24, pnpm, docs 및 docs-backend가 필요하다. 실험 참여자만 구독하며 일반 방문자용 자동 알림은 아직 제공하지 않는다. Production 설정은 이번 작업에서 변경하지 않았다.

설정 파일·구독 JSON·토큰·VAPID private key는 Git과 검사 artifact에 올리지 않는다. 실제 구독 endpoint도 비밀정보처럼 취급한다. docs의 콘텐츠 API 토큰을 재사용하지 않는다.

| 설정                                  | 위치와 용도                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `PUSH_ENABLED=true`                   | Nest 푸시 활성화                                                               |
| `PUSH_API_TOKEN` 또는 `_FILE`         | 구독 BFF 전용, 무작위 32자 이상                                                |
| `PUSH_ADMIN_TOKEN` 또는 `_FILE`       | 관리자 테스트 발송 전용, 구독 토큰과 다른 값                                   |
| `PUSH_VAPID_PUBLIC_KEY`               | 공개 키; Nest config API를 통해 브라우저에 전달                                |
| `PUSH_VAPID_PRIVATE_KEY` 또는 `_FILE` | 발송 서버에만 저장                                                             |
| `PUSH_VAPID_SUBJECT`                  | 운영자 연락 URI (`mailto:` 또는 HTTPS)                                         |
| `PUSH_STORE_FILE`                     | 로컬 `./data/push-subscriptions.json`, NAS `/app/data/push-subscriptions.json` |
| `BLOG_PUSH_ENABLED=true`              | docs의 실험 UI와 BFF 활성화                                                    |
| `BLOG_PUSH_WAF_VERIFIED=true`         | 실제 Production IP WAF 검증 후에만 지정; 미설정이면 운영 BFF 503               |
| `BLOG_PUSH_INVITE_CODE`               | 비공개 참여 코드, 독립적인 무작위 256-bit 값                                   |
| `BLOG_PUSH_SESSION_SECRET`            | 초대 코드·API 토큰과 다른 무작위 256-bit 세션 서명 키                          |
| `BLOG_PUSH_API_BASE_URL`              | 로컬 `http://localhost:8000`, 배포 HTTPS 백엔드 origin                         |
| `BLOG_PUSH_API_TOKEN`                 | Nest의 `PUSH_API_TOKEN`과 같은 값; server-only                                 |

## 실행 순서

### 1. 로컬 설정

저장소 루트에서 키 쌍과 서로 다른 API/관리자 토큰·초대 코드·세션 서명 키를 생성한다. 출력은 개인 터미널에서만 확인하고 로그에 공유하지 않는다. 아래 무작위 값 생성 명령을 각각 네 번 실행해 네 용도의 독립 값을 사용한다.

```bash
pnpm --filter docs-backend exec web-push generate-vapid-keys
openssl rand -hex 32
```

각 앱의 `.env.example`을 기준으로 개인 `.env`에 위 설정을 넣는다. 기존 환경 파일을 통째로 덮어쓰지 않는다. 공개 키와 비밀 키는 같은 생성 결과를 사용한다.

서로 다른 터미널에서 실행한다.

```bash
pnpm --filter docs-backend dev
pnpm --filter docs dev
```

`http://localhost:3001/ko/about`에서 실험 패널을 찾는다. localhost는 secure context로 처리된다. LAN의 일반 HTTP 주소는 다르므로 기기 검증은 HTTPS를 사용한다. iPhone/iPad에서는 HTTPS 사이트를 홈 화면에 추가하고 그 웹앱에서 구독한다.

### 2. 구독과 테스트 발송

1. 방문만으로 권한 요청이 나오지 않는지 확인한다. 참여 코드 미확인 상태에서는 config·구독 API가 401이며 NAS에 전달되지 않는다.
2. 비공개로 전달한 참여 코드를 입력한다. 성공하면 1시간짜리 HttpOnly 쿠키가 생기지만 알림 권한을 요청하지 않는다. 이후 `테스트 알림 받기`를 누르고 브라우저에서 허용한다. Network의 `/api/push` 응답에는 공개 키만 있어야 한다. VAPID private key와 API 토큰은 없어야 한다. Network에서 본 코드·쿠키를 공유하지 않는다.
3. Nest의 저장 파일에 구독이 한 건 생겼는지 확인한다. 파일 내용을 전체 로그로 출력하지 않는다.
4. NAS에서 선택한 구독을 대상으로 아래 관리자 명령을 실행한다. 파일에 0개 또는 2개 이상 있으면 임의 발송하지 않고 중단한다. 다중 구독 실험에서는 대상 식별 절차를 별도로 준비한다.

```bash
# apps/docs-backend의 NAS 관리자 셸. 컨테이너의 Node와 secret을 사용한다.
docker compose --env-file .env.nas -f docker-compose.yml -f docker-compose.push.yml exec -T docs-backend \
  node --input-type=module - /app/data/push-subscriptions.json /run/secrets/push_admin_token <<'JS'
import { readFile } from 'node:fs/promises';
const [storeFile, tokenFile] = process.argv.slice(2);
const subscriptions = JSON.parse(await readFile(storeFile, 'utf8'));
if (subscriptions.length !== 1) throw new Error('Select exactly one test subscription first.');
const token = (await readFile(tokenFile, 'utf8')).trim();
const response = await fetch('http://127.0.0.1:8000/api/push/test', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ endpoint: subscriptions[0].endpoint }),
  signal: AbortSignal.timeout(8000),
});
if (!response.ok) throw new Error(`Test send failed: ${response.status}`);
console.log(await response.json());
JS
```

브라우저 알림 수신 후 클릭하면 `/about`으로 이동해야 한다. 탭을 닫았을 때도 확인하되 OS가 브라우저를 완전히 종료한 조건과 구분한다. `알림 구독 해지`로 NAS 기록과 브라우저 구독을 함께 제거한다.

### 3. NAS Compose 활성화

`apps/docs-backend/docker-compose.push.yml`은 기본 Compose와 합쳐 쓰는 선택형 overlay이다. `.env.nas.example`에는 비밀값을 넣지 않고, 별도 secret 파일을 준비한다. `DOCS_PUSH_DATA_PATH`의 디렉터리는 컨테이너 `node` 사용자(이미지 기본 UID 1000)가 쓰도록 소유권과 권한을 맞춘다. 토큰 파일은 해당 사용자만 읽을 수 있게 한다.

```bash
# apps/docs-backend에서 실행. 설정 출력에는 비밀값이 포함될 수 있어 config 전체를 공유하지 않는다.
docker compose --env-file .env.nas -f docker-compose.yml -f docker-compose.push.yml config --quiet
docker compose --env-file .env.nas -f docker-compose.yml -f docker-compose.push.yml up -d
```

`PUSH_VAPID_PUBLIC_KEY`, `PUSH_VAPID_SUBJECT`, `DOCS_PUSH_DATA_PATH`, secret 파일 위치를 `.env.nas`에 지정한다. Vercel에는 위 표의 `BLOG_PUSH_*` 설정만 등록한다. 관리자 토큰과 private key는 Vercel에 필요 없다. 기본 비활성화된 상태로 먼저 배포하고 다음 WAF 검증을 마친 뒤에만 플래그를 올려 재배포한다.

외부 공개 전에 Vercel WAF에서 초대 확인을 포함한 전체 푸시 경로에 IP별 rate limit을 적용한다. 서버의 전역 30회/분 제한은 소규모 실험 보호이며 분산 rate limit이나 공격자 인증의 대체가 아니다. 브라우저 구독 입력은 위조 가능하며 공유 초대 코드를 가진 참여자도 한도를 소진할 수 있다.

### 4. Production WAF 게시와 활성화

2026-10-03 현재 CLI 인증이 유효하지 않아 실제 규칙은 게시하지 않았다. 운영자가 Dashboard에서 직접 변경하기로 했으며, 아래 CLI 순서는 선택 사항이다. **docs 프로젝트와 실제 운영 도메인 연결을 확인**한다. 저장소 루트의 기존 `.vercel` 연결을 올바른 대상으로 가정하지 않는다. 다른 앱의 규칙은 수정하지 않는다.

Dashboard의 해당 프로젝트 → Firewall → Configure → New Rule에서 설정한다.

| 항목                 | 값                                                  |
| -------------------- | --------------------------------------------------- |
| 조건                 | Path = `/api/push` OR Path starts with `/api/push/` |
| 적용 요청            | GET·POST·DELETE를 포함한 모든 method                |
| Action               | Rate Limit                                          |
| 계산 기준            | IP                                                  |
| 알고리즘 / 창 / 한도 | Fixed Window / 60초 / 10회                          |
| 초과 동작            | Default 429; Log만 선택하면 차단되지 않음           |

조건과 변경 내용을 Review Changes에서 확인한 뒤 Publish한다. Publish는 다른 미게시 변경도 포함할 수 있으므로 관계없는 draft가 있으면 중단하고 소유자와 확인한다. 지역별 카운터이며 NAT 공유 사용자는 같은 IP 한도를 나눈다. Hobby는 프로젝트당 rate limit 규칙 1개이므로 기존 revalidation 규칙이 차지했다면 삭제하거나 넓혀 덮어쓰지 않는다. 플랜 변경·별도 보호 계층을 결정하기 전에는 푸시를 비활성화한다. [공식 WAF 설명](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).

CLI를 이용할 경우 로그인과 올바른 프로젝트 연결을 먼저 마친 디렉터리에서 아래 순서로 진행한다. 이미 같은 규칙이 있으면 새로 중복 생성하지 않고 inspect로 확인한다. [공식 CLI 문서](https://vercel.com/docs/cli/firewall).

```bash
vercel login
vercel whoami
vercel firewall rules ls
vercel firewall diff
vercel firewall rules add "HEAP-FORGE push experiment per IP" \
  --condition '{"type":"path","op":"eq","value":"/api/push"}' \
  --or \
  --condition '{"type":"path","op":"pre","value":"/api/push/"}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 10 \
  --rate-limit-keys ip \
  --rate-limit-algo fixed_window \
  --rate-limit-action rate_limit --yes
vercel firewall diff
vercel firewall publish
```

처음에는 `BLOG_PUSH_ENABLED=false`, `BLOG_PUSH_WAF_VERIFIED=false`를 유지한다. 운영자의 테스트 IP에서 아래 읽기 요청을 최대 11회만 호출해 WAF 429가 나오는지 확인한다. NAS나 구독 저장소를 건드리지 않는다. 같은 IP에서의 다른 테스트가 없는 60초 창을 선택한다. 시간 창 경계를 넘으면 결과를 확정하지 말고 다음 창에 다시 검사한다. curl의 성공 여부만 보지 않고 Firewall 이벤트에 이 규칙의 차단이 기록됐는지 대조한다.

```bash
# 실제 docs 운영 origin으로 바꾼다. 토큰·초대 코드 없이 검사한다.
PUSH_TEST_ORIGIN=https://blog.example
for attempt in 1 2 3 4 5 6 7 8 9 10 11; do
  status=$(curl --max-time 5 -sS -o /dev/null -w '%{http_code}' "$PUSH_TEST_ORIGIN/api/push/access") || break
  printf '%s %s\n' "$attempt" "$status"
  if [ "$status" = 429 ]; then break; fi
done
```

초과 요청의 WAF 429와 평상시 `/docs` 이용, 기존 revalidation 보호 유지까지 확인한 뒤에만 `BLOG_PUSH_WAF_VERIFIED=true`와 `BLOG_PUSH_ENABLED=true`로 재배포한다. 이는 수동 확인 플래그다. 코드가 Vercel 설정을 자동 검사하지 않으며 운영자가 값을 먼저 올리면 보호가 우회된다. 비밀값은 Sensitive 환경변수에 넣고 trusted 채널로만 초대 코드를 전달한다. Preview는 Deployment Protection으로 보호하고 Production WAF 검증 결과를 Preview 검증으로 대체하지 않는다.

코드의 운영 판정은 `NODE_ENV=production`이므로 Next Production 빌드로 실행되는 Preview도 같은 게이트를 적용한다. Preview는 별도 보호 상태를 확인하기 전까지 푸시 플래그를 false로 유지하고 Production의 확인 값을 무조건 복사하지 않는다.

### 5. 자동 검사

실제 로컬 Chrome 연동을 일회성 설정으로 확인하려면 다음 명령을 실행한다. Chrome이 설치되어 있어야 하며, 같은 checkout의 Next dev와 3017·8007 포트는 비워 둔다. 스크립트가 임시 서버와 별도 Chrome 프로필을 만들고 구독·발송·수신·해지를 검사한 뒤 정리한다. 기존 `.env`는 변경하지 않으며 개인 토큰을 입력할 필요도 없다. 이는 상시 실행용 설정이나 NAS/Vercel 배포 검증이 아니다.

```bash
pnpm --filter docs-backend build
pnpm --filter docs test:push:local
```

수신 관측은 60초까지 기다린다. 제공자 수락만으로 통과하지 않고 서비스 워커 이벤트와 알림 생성을 별도로 확인한다. OS 배너·사용자 클릭은 직접 검증해야 한다. 출력에는 상태·건수만 남기며 토큰·구독 endpoint는 출력하지 않는다.

저장소 루트에서 실행한다.

```bash
pnpm --filter docs-backend test:e2e --runInBand
pnpm --filter docs-backend typecheck
pnpm --filter docs-backend lint
pnpm --filter docs test:lib
pnpm --filter docs typecheck
pnpm --filter docs test:push:browser
```

브라우저 테스트는 별도 포트 3017과 가짜 구독 API로 UI를 검사한다. 실제 FCM/APNs 발송이나 OS 알림 수신 검증이 아니다. 이미 다른 Next dev가 같은 checkout의 `.next`를 쓰면 먼저 정리하거나 별도 checkout에서 실행한다. 서비스 워커는 정적 JS이고 테스트·앱 로직은 TypeScript이다.

## 기대 결과

- 초기 진입 시 권한 요청 없음; 클릭 후 구독 성공; 중복 구독은 같은 한 건.
- 코드 확인 전 config·구독 요청 401, 다른 출처 변경 요청 403. 운영 미검증 WAF 또는 비활성 플래그는 503.
- 정상 초대 코드로 1시간 참여 쿠키 발급. 코드·서명 위조, 만료·교체된 세션은 401.
- NAS 재시작 후 구독 유지. 콘텐츠의 읽기와 revalidation 경로에는 변화 없음.
- 관리자 토큰만 테스트 발송 가능; 브라우저 BFF에는 발송 route 없음.
- 임의 HTTP/내부망/허용 도메인 위장 주소는 400. 미설정/비활성화는 503.
- provider 수락 `{ "sent": true }`는 실제 기기 표시 보장이 아니다. 수신과 클릭은 따로 확인한다.
- 만료된 구독의 404/410은 `{ "sent": false, "expired": true }`와 저장 파일 삭제.

## 실패 대응과 복구

- 알림이 안 보이면 브라우저 권한, OS 알림, 집중 모드, HTTPS/홈 화면 조건을 확인한다. 실패 때 자동 재시도하지 않는다.
- 권한이 차단되면 브라우저 설정에서 변경한다. 구독 해지와 권한 차단은 다른 동작이다.
- 저장 실패는 NAS bind mount의 쓰기 권한부터 확인한다. 손상된 저장 파일은 자동 초기화하지 않으므로 원인을 확인하고 안전하게 복구한다.
- VAPID key 교체 시 기존 구독이 새 키와 호환된다고 가정하지 않는다. 기존 구독 해지 후 새 키로 재구독하는 절차가 필요하다.
- 중단하려면 실험 UI를 끄기 전에 참여자의 해지를 완료한다. 이후 양쪽 플래그를 끄고 저장 파일·임시 복사본을 정리한다. 플래그만 꺼도 기존 서비스 워커/구독이 제거되지는 않는다.
- 초대 세션이 만료되면 코드를 다시 확인해 해지한다. 세션 만료와 구독 만료는 다르다. 코드 유출 시 코드·서명 키 교체와 필요시 발송 중단·구독 정리를 별도로 수행한다.
- WAF 규칙을 제거하거나 한도 충돌을 발견하면 `BLOG_PUSH_WAF_VERIFIED=false`, `BLOG_PUSH_ENABLED=false`로 재배포하고 Nest 발송도 중단한다. WAF 플래그는 실제 보호 상태와 함께 관리한다.
- 일반 사용자 운영 전 보관 기간, CSRF/WAF 검증, 자동 정리, DB·발송 큐·중복 방지, 실제 기기 수신, key 회전 정책을 확정한다. 현재 JSON 저장에는 시간 기반 자동 만료가 없다.

## 관련 검증

- [2026-10-03 로컬 실제 연동 결과](../verification/push/2026-10-03-local-web-push.md)
- [2026-10-03 초대 접근 제어 검증](../verification/push/2026-10-03-push-access-gate.md)
- [ADR-0010: 초대 세션과 WAF 게이트](../architecture/adr-0010-web-push-invitation-and-waf-gate.md)

- [결정 기록](../architecture/adr-0009-docs-web-push-experiment.md)
- [구현 및 검사 기록](../worklog/2026-10/2026-10-03-docs-web-push-mvp.md)
