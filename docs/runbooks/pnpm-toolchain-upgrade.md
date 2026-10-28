# pnpm 툴체인 업그레이드와 서명 검증

## 목적과 준비 조건

루트 `packageManager`에 고정한 pnpm을 로컬·CI·두 backend Docker builder에서 일치시킨다. Node24와 Docker, GitHub 읽기 권한을 준비한다. 애플리케이션 의존성 업그레이드나 운영 이미지 교체는 별도 작업이다.

pnpm12는 네이티브 실행 파일이다. 루트 `package.json`, `.mise.toml`, `scripts/pnpm-bootstrap/package.json`과 bootstrap lockfile의 버전을 함께 검토한다. CI의 action에는 pnpm 버전을 중복 지정하지 않고 root manifest를 읽게 한다. `.mise.toml`은 pnpm을 Node보다 먼저 선언해 기존 Node 설치의 Corepack shim보다 네이티브 실행 파일을 우선한다.

## 실행 순서

저장소 루트에서 실행한다. 전역 기본 Node·pnpm은 변경하지 않는다.

```sh
mise install
mise which pnpm
mise exec -- pnpm --version
mise exec -- node --version
mise exec -- pnpm check:node
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm typecheck:toolchain
mise exec -- pnpm test:repo
mise exec -- pnpm exec turbo lint --force
mise exec -- pnpm exec turbo typecheck --force
mise exec -- pnpm exec turbo test --force
docker build --platform linux/amd64 --pull -t web-tech-docs-backend:toolchain -f apps/docs-backend/Dockerfile .
docker build --platform linux/amd64 --pull -t web-tech-vuln-radar-backend:toolchain -f apps/vuln-radar-backend/Dockerfile .
```

업그레이드로 frozen 설치가 중단되면 먼저 diff를 확인한다. 필요한 경우에만 `pnpm install --lockfile-only --ignore-scripts`로 PM lock 문서를 생성하고, 기존 애플리케이션 lock 문서가 그대로인지 대조한 뒤 frozen 설치를 다시 한다. `--no-frozen-lockfile`, `--force`, checksum 갱신으로 무결성 오류를 덮지 않는다.

Docker는 `scripts/install-pnpm.mts`를 Node24의 type stripping으로 실행한다. 설치 도우미는 npm bootstrap 디렉터리에서 아래 순서를 강제한다.

1. 루트와 bootstrap의 정확한 pnpm 버전 일치 확인.
2. 커밋된 별도 npm lockfile로 `npm ci --ignore-scripts`. 다운로드한 lifecycle 코드는 아직 실행하지 않는다.
3. 공식 npm registry에 `npm audit signatures`. 실패하면 즉시 중단한다.
4. 해당 호스트의 서명 검증된 native package 존재·버전 확인. 누락 시 installer의 추가 다운로드로 진행하지 않는다.
5. 검증된 pnpm installer 실행, 실제 버전 확인 후 builder의 PATH에 연결.

별도 npm lockfile은 workspace 앱의 의존성 관리용이 아니라 pnpm 자체를 부트스트랩하는 격리된 입력이다. pnpm의 실행 파일과 플랫폼 패키지의 integrity를 고정한다. bootstrap 디렉터리는 최종 runtime 이미지에 포함하지 않는다. 현재 Docker 대상은 Debian bookworm의 linux/amd64이며 다른 libc·플랫폼은 별도 검증한다.

## Node 보안 patch 갱신

Node 24 계열의 지원 정책은 유지하되 `.node-version`의 정확한 patch를 CI 선택의 원본으로 사용한다. `.mise.toml`은 같은 값을 사용하며 회귀 검사가 두 값의 불일치를 거절한다. `engines.node=24.x`는 Vercel의 major 선택용으로 유지한다. Vercel의 함수 patch는 이 파일로 고정되지 않으므로 플랫폼 배포·보호 확인은 별도다.

1. 공식 Node 보안 공지를 확인하고 main 기반 보안 브랜치에서 `.node-version`과 `.mise.toml`을 갱신한다. `scripts/check-node-runtime.mts`의 보안 floor와 테스트 벡터도 새 공지에 맞춰 검토한다. 단순 `node-version:24`와 CI cache만으로 최신 patch를 보장하지 않는다.
2. 두 backend Dockerfile의 builder/base와 runtime 모두 같은 patch tag·공식 multi-arch index digest로 갱신한다. digest를 registry에서 확인하며 ARM 개발기에서도 `linux/amd64` manifest가 포함돼야 한다. 각 Node stage는 의존성 설치/복사 전에 실제 실행 버전을 검사한다.
3. 이미지 workflow는 `pull:true`와 정책 파일 path filter를 유지한다. pin은 자동 업데이트를 뜻하지 않으므로 Node/OS 보안 공지 때 patch·digest를 다시 검토한다. pnpm 서명·SRI·frozen lockfile 검사는 그대로 유지한다.
4. 새 Node에서 저장소·앱·HTTP/브라우저 회귀를 실행하고, 로컬 이미지 안의 `node --version` 및 `/opt/check-node-runtime.mts`를 확인한다. 버전 gate와 정상 Brotli/TLS API 검사는 악성 exploit 검증을 대신한다고 주장하지 않는다.
5. 승인 후 GHCR 이미지 게시와 NAS/Railway 교체를 진행한다. Node가 포함된 **새 이미지**가 필요하며 기존 이미지 restart나 옛 SHA tag pull로는 갱신되지 않는다. 새 digest와 실제 실행 버전을 기록하고, 취약한 이미지로의 rollback을 자동 허용하지 않는다.

로컬 Git hook의 `scripts/pnpmw.sh`도 mise 선택을 먼저 적용하고 gate 통과 후 pnpm을 실행한다. mise가 없으면 PATH의 Node를 검사한 뒤 기존 pnpm/Corepack fallback을 사용한다. 검사가 실패하면 구버전으로 재시도하지 않는다. 과거 실험 문서의 Node 관측 버전은 이력이라서 일괄 치환하지 않는다.

## 기대 결과

현재 승인한 버전이 출력되고 frozen 설치가 성공해야 한다. CI는 pnpm12를 지원하는 공식 action의 고정 SHA를 사용한다. Docker의 npm 출력에는 검증한 registry signature가 표시되어야 하며, 실패 시 pnpm의 installer·실행 파일을 호출하지 않아야 한다. 기존 `allowBuilds` 거부와 미승인 agent skill은 승인 없이 완화하지 않는다.

## 실패 대응과 복구

`IDENTITY_UNVERIFIABLE`은 서명 정보를 얻지 못한 경우, `IDENTITY_MISMATCH`는 서명 불일치 등 신뢰 위반 경우로 구분한다. 경로·버전·원본 코드와 실제 로그를 함께 대조한다. 단어 하나만으로 변조 또는 단순 장애를 단정하지 않는다.

`pmOnFail: ignore`, `COREPACK_INTEGRITY_KEYS=0`, `dangerouslyAllowAllBuilds`는 해결책으로 추가하지 않는다. 서명 검증 키·SRI·인증 검사를 끄지 않는다. 통신 중단이 확인된 경우 실패 이력을 보존하고 제한된 재실행으로 대조할 수 있지만, 반복 성공이 최초 네트워크 중단 주체를 증명하지는 않는다.

실행 경로가 Corepack이면 먼저 `mise which pnpm`과 `.mise.toml`의 선언 순서를 확인한다. 캐시 접근의 EPERM은 서명 오류와 구분한다. 컨테이너의 Git hook 설치·OpenSSL·legacy deploy 경고도 따로 기록하며 서명 성공과 혼동하지 않는다.

업그레이드를 되돌릴 때는 manifest·mise·두 lockfile·CI action·Docker 설치 경로를 같은 검토된 커밋 집합으로 되돌린다. PR 병합·NAS/Railway 이미지 교체·Production 변경은 사용자 승인 후 별도로 수행한다.

## 관련 검증

- [Node 24 보안 patch와 이미지 검증](../verification/security/2026-10-27-node24-security-patch.md)

- [pnpm12 전환 검증](../verification/integration/2026-10-22-pnpm12-toolchain.md)
- [작업 기록](../worklog/2026-10/2026-10-22-pnpm12-toolchain.md)
- [공식 설치 안내](https://pnpm.io/installation)
- [pnpm12 지원 action 릴리스](https://github.com/pnpm/action-setup/releases/tag/v6.1.0)
