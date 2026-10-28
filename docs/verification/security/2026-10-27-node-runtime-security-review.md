# Node.js 10월 보안 릴리스의 프로젝트 영향 검토

## 대상과 조건

이 문서는 **10월 27일 패치 이전의 선행 조사 기록**이다. 아래 구버전 관측과 ‘아직 실행하지 않음’은 당시 시점에 한정한다. 이후 PR #68의 패치·병합 결과는 [후속 검증](2026-10-27-node24-security-patch.md)을 따른다. 10월 28일 정리에서는 진단기를 결과 전용 artifacts에서 [재사용 예제](../../examples/node-runtime-security/README.md)로 옮겼다. 원본 JSON의 `entryPoint`와 source blob은 당시 경로·소스의 기록으로 유지한다.

- 검토: 2026-10-27 Asia/Seoul, [KAN-43](https://web-tech-service.atlassian.net/browse/KAN-43).
- 소스 기준: `9923d815fb48220b3c95f01784c6a452567e4470`. 앞선 필터 미커밋 작업은 보존했다. 이번 변경은 조사 문서와 안전한 진단기뿐이다.
- 운영·공통 설정은 읽기 전용으로 조사했다. Node 설치/업데이트, 이미지 pull/build/push, 재배포, 토큰 조회·교체, 악성 PoC는 수행하지 않았다.
- NAS·Railway·Vercel 실행 컨테이너/함수의 정확한 Node patch는 이번에 직접 확인하지 않았다. 설정의 `24`와 실제 실행 바이너리는 구분한다.

## 재현 방법

설치된 잠금 의존성이 있는 저장소 루트에서 실행한다. 정상 Brotli JSON의 처리 순서만 확인하는 진단기는 loopback 임의 포트에 최소 Nest 앱을 띄우고 종료한다. 실제 AppModule·환경 파일·콘텐츠·DB·토큰은 로드하지 않는다.

```bash
mise exec -- node -p 'JSON.stringify({node:process.version,openssl:process.versions.openssl,brotli:process.versions.brotli,undici:process.versions.undici})'
mise exec -- node docs/examples/node-runtime-security/safe-brotli-probe.mts
gh run view 40352593284 --repo IMHOJEONG/web-tech --log > /private/tmp/node-security-main-ci.log
rg 'Found in cache|node: v24\.' /private/tmp/node-security-main-ci.log
```

NAS 실행 버전은 사용자가 기존 배포 checkout에서 다음 읽기 전용 명령으로 확인할 수 있다. `.env.nas` 내용이나 인증 헤더를 출력하지 않는다. 이 명령은 이번 조사에서 NAS에 실행하지 않았다.

```bash
docker compose --env-file apps/docs-backend/.env.nas -f apps/docs-backend/docker-compose.yml exec -T docs-backend node -p 'JSON.stringify({node:process.version,openssl:process.versions.openssl,brotli:process.versions.brotli,undici:process.versions.undici})'
```

## 결과와 증거

### 공식 공지

[Node.js 10월 21일 보안 공지](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)는 Brotli decoder의 메모리 쓰기 오류 `CVE-2026-111497`을 High로 분류한다. 공격자가 통제하는 Brotli 데이터를 해독하는 프로세스에 메모리 손상·정보 노출·코드 실행 위험이 있다. Node 24 계열의 해당 보안 수정 버전은 [24.22.1](https://nodejs.org/en/blog/release/v24.22.1)이며, 22/26 계열은 각각 22.23.4/26.12.1이다. 이번 판단은 24 계열을 유지하면서 보안 패치를 반영하는 방향이다.

같은 릴리스의 DNS NUL 처리, 비정규 IP TLS 검증, HTTP Agent, snapshot 난수 캐시, permission 검증 문제는 각 API와 도입 시점·실행 조건이 다르다. 구버전이라는 이유만으로 모든 CVE의 공격 경로를 재현했다고 표현하지 않는다.

### 환경별 확인 결과

| 대상                       | 확인한 사실                                                                                                                                                 | 판단·남은 확인                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 프로젝트 로컬              | `mise exec`가 Node **24.12.0**, OpenSSL 3.5.4, Brotli 1.1.0, 내장 Undici 7.16.0을 실행                                                                      | 보안 패치 전 런타임. `.mise.toml`은 정확한 patch가 아닌 `node = "24"`다.                   |
| main CI                    | [실행 40352593284](https://github.com/IMHOJEONG/web-tech/actions/runs/40352593284), main `e8ab3bd6`, setup-node 로그 12개 job이 **24.21.0**을 캐시에서 선택 | 보안 패치 전 버전. CI 성공과 런타임 보안 패치 여부는 다르다.                               |
| NAS docs-backend           | builder/runtime 모두 `node:24-bookworm-slim`, 기본 Nest Express body parser 활성                                                                            | 실행 Node 버전 미확인. 이전 이미지가 구버전이면 교체 필요. 태그 이름만으로 안전 판정 불가. |
| Railway vuln-radar-backend | builder/runtime 모두 Node 24 계열 이미지, 기본 Nest body parser 및 외부 feed fetch                                                                          | 실행 Node 버전 미확인. 빌드·런타임 모두 패치 확인 필요.                                    |
| Vercel docs                | `engines.node=24.x`, 원격 콘텐츠 fetch와 Next Image 외부 응답 처리                                                                                          | 실제 함수 patch와 배포 보호 적용은 미확인. Vercel 공지에 따른 새 배포와 운영 확인 필요.    |
| vuln-radar 프론트          | Vite 정적 프론트                                                                                                                                            | 브라우저 자체를 Node 취약점으로 보지 않는다. 빌드 Node와 별도 API 서버는 대상이다.         |

`actions/setup-node`는 `check-latest` 기본값이 false여서 semver에 맞는 로컬 캐시를 먼저 사용할 수 있다. 현재 workflow에는 이 옵션이 없다. 실제 CI의 `Found in cache .../24.21.0/...`가 그 동작과 일치한다. [공식 동작 설명](https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md#check-latest-version).

### 우리 코드의 도달 경로

1. **두 Nest 백엔드의 입력:** `NestFactory.create()`에 `bodyParser:false`나 `inflate:false`를 지정하지 않았다. 설치된 Nest 11.1.19는 JSON/urlencoded parser를 라우터보다 먼저 등록한다. 설치된 body-parser 2.4.0은 `Content-Encoding: br`에서 `zlib.createBrotliDecompress()`를 사용한다. controller Guard나 GET 중심 API라는 사실만으로 parser 이전의 공격면을 제거하지 않는다.
2. **안전한 순서 확인:** 같은 Nest 의존성으로 만든 최소 앱에 정상 Brotli JSON을 보내자 Guard는 해독된 body를 읽은 뒤 403을 반환했다. `guardCalls=1`, `decodedBeforeDenial=true`. 이는 압축 해제의 선행을 확인한 실험이며, 실제 AppModule 전체나 악성 payload의 성공을 검증한 것이 아니다. [진단기](../../examples/node-runtime-security/safe-brotli-probe.mts).
3. **docs의 외부 응답:** `content-api-request.ts`는 ky/전달된 fetch를 사용한다. Node fetch의 응답 압축 해제는 라이브러리 아래에서 일어날 수 있다. 설치된 Next 16.4.3의 Image optimizer도 HTTPS에서 br을 요청하고, 응답 encoding이 br이면 Node Brotli decoder를 생성한다. 이미지 allowlist가 있으므로 임의 외부 URL에 모두 열려 있다고 판단하지 않지만, 허용 upstream의 악성 응답 가능성을 런타임 패치로 차단해야 한다.
4. **vuln-radar 수집:** KEV/NVD/EPSS collector의 서버 fetch도 외부 응답 처리 대상이다. fetch가 있다는 사실만으로 악용 가능성이 확정되지는 않으며 응답 통제와 실제 압축 encoding 조건이 추가로 필요하다.
5. **기타 CVE:** 자체 소스/config 검색에서 `dns.resolve/reverse`, Node `--permission`/`--allow-fs`, startup snapshot/SEA, ZipFile 사용은 찾지 못했다. 특히 현재 Image optimizer는 `dns.lookup`을 사용한다. 전이 의존성 전체 또는 실제 운영 실행 인자까지 부재를 증명한 것은 아니다. Codex 도구의 filesystem sandbox와 Node Permission Model도 별개다.

본문 크기 상한은 해독된 bytes를 읽는 단계의 제한이다. 이미 decoder 안에서 발생하는 native 메모리 오류의 해결책으로 간주하지 않는다. `pnpm audit`·npm overrides도 Node 바이너리 내부 Brotli/OpenSSL/Undici를 교체하지 않는다. 이번에는 npm 의존성 audit을 런타임 패치 검증의 대체물로 실행하지 않았다.

### Vercel과 자체 호스팅의 차이

[Vercel 10월 26일 공지](https://vercel.com/kb/bulletin/node-js-security-advisory)에 따르면 인입 WAF 규칙은 자동 적용되지만, 함수가 외부 서버에서 가져온 응답은 그 보호 범위가 아니다. 새 배포에는 managed runtime의 임시 Brotli 응답 보호도 적용된다. 24.x 프로젝트의 patch 선택은 Vercel이 관리하므로 `.mise.toml` 수정이 운영 함수를 패치하지 않는다. 공지는 patch rollout 진행 중이라고 하므로 전체 rollout 완료를 추정하지 않는다.

NAS API와 Railway API가 Cloudflare/직접 도메인으로 들어오는 경로는 Vercel 보호가 자동으로 전파되지 않는다. 자체 호스팅의 Node 교체가 필요하다. Vercel 임시 보호로 br 응답이 거절될 수 있으므로 이후 원격 목록·상세·이미지의 실제 동작도 재확인한다.

### 조치 권고: 아직 실행하지 않음

1. **공통 보안 브랜치:** 기존 필터 변경과 분리해 main 기반으로 준비한다. Node 24 계열을 유지하되 최소 24.22.1을 포함하는 패치를 선택하고, 로컬 mise와 CI가 같은 검증 버전을 사용하게 한다. `engines:24.x`만으로 patch 최소값이 강제되지 않으므로 별도 버전 검사를 둔다. 과거 블로그 실험의 ‘24.12.0에서 관측’ 기록은 사실이므로 일괄 치환하지 않는다.
2. **CI와 이미지:** 정확한 patch 또는 최신 확인과 최소 버전 gate로 캐시의 구버전 선택을 막는다. 두 Dockerfile의 실제 base를 패치된 버전/digest로 확인하고 재빌드한다. 이미지 workflow의 `build-push-action`에는 현재 `pull:true`가 없으며, Node base만 갱신돼도 path filter가 자동 실행되는 구조는 아니다. 새 base 사용을 보장하는 빌드 정책이 필요하다.
3. **NAS·Railway 교체:** patched 이미지의 Node·linux/amd64·digest를 확인하고 기존 [NAS 배포 절차](../../runbooks/docs-backend-nas-deployment.md)로 교체한다. 현재 컨테이너의 단순 restart 또는 옛 immutable tag의 pull은 Node를 새 버전으로 만들지 않는다. 같은 SHA 태그를 다시 게시하면 내용이 달라질 수 있으므로 새 보안 커밋의 이미지와 실제 digest를 추적한다. rollback 후보도 취약한 구버전만 남기지 않는다.
4. **Vercel 및 검증:** 승인된 재배포로 managed 보호를 받고, 비공개 진단/로그에서 실제 런타임을 확인한다. 공개 버전 조회 endpoint를 새로 만들 필요는 없다. backend health·인증·content HTML/검색·수집기와 docs 이미지·검색·상세 회귀를 patched Node에서 실행한다.

정제한 메타데이터는 [조사 artifact](../artifacts/2026-10-27-node-runtime-security-review.json)에 보관한다.

진단기는 Node 24.12.0에서 재실행했으며 동일하게 통과했다. 명시적 `.mts`를 사용해 루트 package의 모듈 설정을 바꾸지 않았다. 별도 `tsc --noEmit` 타입 검사, 변경 문서 delta·포맷·diff 검사도 통과했다. 기존 필터 소스 4개의 blob을 대조했고 실제 Git 인덱스는 비워뒀다. [Jira 검토 표](https://web-tech-service.atlassian.net/browse/KAN-43?focusedCommentId=10033)의 5행 모두 3열인 것을 재조회했으며, Confluence v170의 이전 본문 보존과 새 항목 1개를 확인했다.

## 한계와 후속 작업

10월 28일 최신 main 기반 Node **24.22.1**에서 전용 `tsc`와 정상 Brotli 진단을 다시 실행해 통과했다. [별도 재검증 artifact](../artifacts/2026-10-28-node-brotli-safe-probe.json)는 당시 원본 관측을 대체하지 않는다. 패치된 런타임에서도 정상 payload의 parser 선행은 유지되며, 이것은 취약점 잔존의 증거가 아니다.

- **버전 범위 영향과 경로는 확인했지만 침해·유출은 확인하지 않았다.** 이 공지만으로 모든 토큰이 유출됐다고 판단하거나 자동 교체하지 않는다. 악용 흔적이 있으면 격리·증거 보존·패치·자격 증명 회전의 사고 대응을 별도로 수행한다.
- 운영의 실제 Node 버전·이미지 digest·Vercel 배포 보호·Cloudflare 차단 설정은 미확인이다. 운영 악성 payload 전송이나 exploit 실행을 하지 않았다.
- 패치 호환성·보안 조치 완료·새 CI/배포 성공을 선언하지 않는다. 이번 진단은 정상 payload의 처리 순서 검사일 뿐 메모리 취약점 회귀 PoC가 아니다.
- 기존 런타임/배포 정책 변경은 아직 없으므로 새 ADR을 추가하지 않는다. 실제 패치 작업은 별도 보안 브랜치에서 수행한다.

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-27-node-runtime-security-review.md)
- [서비스 복구 정책](../../architecture/platform-recovery-policy.md)
