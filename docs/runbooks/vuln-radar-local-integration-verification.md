# vuln-radar 로컬 통합 검증 절차

## 목적과 준비 조건

최신 main의 프론트·백엔드 read API를 운영 DB와 분리해서 검사한다. 실제 PostgreSQL·Nest·프록시·Chromium을 연결하며 HTTP 응답을 mock으로 바꾸지 않는다. 외부 취약점 수집 자체의 검증은 아니다.

- Node 24·저장소 pnpm 버전과 전체 workspace 의존성이 필요하다.
- Docker daemon과 로컬 postgres:16-alpine 이미지가 필요하다. 도구는 pull=never이므로 이미지를 자동 다운로드하지 않는다.
- docs의 Playwright·Chromium을 검증 도구로 재사용한다. 앱 런타임이나 브라우저 번들 의존성을 추가하지 않는다.
- 127.0.0.1의 4310·4311 포트가 비어 있어야 한다. 기존 서버를 대신 종료하지 않는다.
- Prisma generated client와 공용 UI 빌드가 준비돼 있어야 한다.
- Docker 생성·삭제와 임시 파일 권한이 필요하다. 운영 Docker host나 배포 서버에서 실행하지 않는다.

새 로컬 환경의 준비 예시:

```sh
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm --filter vuln-radar-backend db:generate
mise exec -- pnpm --filter @web-tech/ui build
mise exec -- pnpm --filter docs exec playwright install chromium
docker image inspect postgres:16-alpine
```

이미지가 없으면 개인 로컬 Docker에 테스트 이미지를 별도로 준비한다. 실제 운영 DB 접속 정보나 토큰을 입력할 필요는 없다.

## 실행 순서

1. 저장소 루트에서 현재 브랜치·미커밋 변경과 main SHA를 확인한다. 최신 main 기반 새 작업 브랜치를 사용한다.
2. 아래 명령을 실행한다.

```sh
mise exec -- pnpm verify:vuln-radar:integration
```

3. PASS 항목과 마지막 Evidence 경로를 확인한다. JSON의 baseSha·runnerSha256·cleanupRunnerSha256·results·cleanup·cleanupErrors를 검토한다. 재실행은 새 시각의 증거 파일을 생성한다.
4. 결과와 캡처를 확인해 verification·worklog·목차에 연결한다. 실제 env·인증 헤더를 붙이지 않는다.

### 격리 방식

- [전용 타입 설정](../../tsconfig.vuln-integration.json)으로 [TypeScript 도구](../../scripts/verify-vuln-radar-integration.mts)를 검사한다. mts는 도구만 ESM으로 지정하며 Nest decorators·앱 tsconfig를 변경하지 않는다.
- UUID 이름·검증 label을 가진 PostgreSQL을 동적 loopback 포트·tmpfs로 생성한다. 기존 DB·호스트 볼륨을 재사용하지 않는다.
- 비밀번호·토큰은 매번 무작위 생성한다. 임시 DB 환경 파일 권한은 0600이다. DATABASE_URL·DIRECT_URL·수집 비활성화·CORS는 검증용 값으로 덮어쓴다.
- db push는 새 임시 DB에만 수행한다. 가상 CVE 3개를 넣고 database 출처를 단언해 mock으로 조용히 통과하지 않게 한다.
- Nest·Vite를 빌드하고 loopback에만 서버를 실행한다. 실제 프록시·브라우저와 별도 배포 핸들러 호출을 검사한다.
- 검증용 Nest만 중단·복구하며 DB 미설정 fallback도 확인한다. 수집 scheduler와 startup sync는 비활성화한다.
- 종료 시 이 실행의 프로세스와 label이 일치하는 DB만 정리한다. 기존 서버·컨테이너·볼륨·배포 브랜치는 바꾸지 않는다.
- [정리 실행기](../../scripts/verification-cleanup.mts)는 브라우저 종료·백엔드 종료·프론트 종료·DB 연결 해제·컨테이너 제거·임시 파일 제거를 각각 시도한다. 앞 단계가 실패해도 나머지를 계속하고, cleanup 플래그는 해당 단계 성공 시에만 true로 기록한다. 생성하지 않은 자원의 no-op도 성공으로 취급한다.
- 최초 검증 실패는 error, 정리 실패는 cleanupErrors의 단계·메시지로 분리하고 비밀값을 가린다. 정리 후 보고서 저장을 시도하며 어느 단계든 실패하면 exit code 1이다. 저장 자체가 실패하면 REPORT FAIL로 알리고 성공으로 처리하지 않는다.

### Docker 없는 정리 회귀 테스트

```sh
mise exec -- pnpm test:repo
# 정리 실패 테스트만 실행
mise exec -- node --experimental-strip-types --test scripts/verification-cleanup.test.mts
```

정리 단계별 동기 예외·비동기 거부·최초 오류 보존·실패 플래그·비밀값 제거·보고서 파일 저장을 검사한다. 실패는 주입한 콜백으로 재현하며 실제 Docker 오류를 유발하지 않는다. 이 테스트는 기존 CI의 test:repo에도 포함된다. Docker 통합 명령 자체는 CI에 연결하지 않았다.

## 기대 결과

- exit code 0, 모든 통합 항목 passed.
- JSON에 기준 SHA·도구 및 정리 실행기 해시·브라우저·fixture 결과·정리 6단계 결과가 존재하고 cleanupErrors가 비어 있다.
- 화면에는 합성 데이터와 DATABASE 출처가 보인다.
- bundle·API body·브라우저 요청과 증거에 테스트 서버 토큰·비밀번호가 남지 않는다.
- 검증 이름의 컨테이너와 4310·4311 서버가 남지 않는다.

ECONNREFUSED·502는 의도한 중단 단계의 assertion과 함께 판단한다. 다른 시점의 동일 로그를 정상으로 간주하지 않는다.

## 실패 대응과 복구

- 포트 충돌: 기존 프로세스 주체를 확인하며 사용자 서버를 임의로 종료하지 않는다.
- Docker·이미지·브라우저 준비 실패: 준비 조건을 보완하고 재실행한다. 일부 성공만으로 전체 통과를 선언하지 않는다.
- database 검사에서 mock 응답: Prisma 초기화·generated client·격리 DB를 확인한다. mock을 실제 DB 성공으로 바꾸어 기록하지 않는다.
- pnpm 설치 설정 차이: 개발 서버 영향을 고려해 설치 상태를 정리한다. 이번에는 명령에만 pnpm_config_verify_deps_before_run=warn을 사용했으며 이를 전역 강제하지 않는다.
- 강제 종료 후 자원: docker ps의 heap-forge-vuln-integration- 이름·label을 확인하고 정확한 컨테이너·PID만 정리한다. 전체 Docker prune이나 기존 DB 삭제를 하지 않는다.
- 실패·cleanup=false는 보존하고 조치 후 새 결과를 만든다. 과거 artifact를 수정하지 않는다.
- CLEANUP FAIL이면 cleanupErrors의 정확한 단계부터 조사한다. 컨테이너 label 불일치는 제거를 막는 안전장치이므로 우회하지 않는다. 이후 임시 파일 정리와 보고서 기록은 계속 시도한다. REPORT FAIL이면 저장 경로·디스크·권한을 확인하며 증거가 없다는 사실을 기록한다. 정리 오류로 최초 error를 덮어쓰지 않는다.

도구는 커밋·push·배포·branch 삭제·stash 복원을 수행하지 않는다. 운영 검증은 별도 승인·계획으로 진행한다.

## 관련 검증

- [2026-10-19 통합 결과](../verification/integration/2026-10-19-vuln-radar-local-integration.md)
- [작업 기록](../worklog/2026-10/2026-10-19-vuln-radar-integration.md)
