# 정상 Brotli 요청 처리 순서 진단

## 목적과 준비 조건

저장소의 Node 24 보안 패치와 lockfile 의존성을 사용한다. 악성 입력 없이 최소 Nest 앱의 body parser가 Guard보다 먼저 실행되는지 확인한다. 실제 AppModule, 환경 파일, 인증 토큰, DB는 로드하지 않는다.

## 실행 순서

저장소 루트에서 실행한다. 임의 포트의 `127.0.0.1`에만 바인딩하며 실행 종료 시 서버를 닫는다.

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm exec tsc -p docs/examples/node-runtime-security/tsconfig.json
mise exec -- node docs/examples/node-runtime-security/safe-brotli-probe.mts
```

## 기대 결과와 한계

HTTP 403, `guardCalls: 1`, `decodedBeforeDenial: true`가 출력되어야 한다. 이는 정상 payload의 처리 순서만 확인하며, 메모리 취약점 악용이나 실제 서비스의 안전성을 증명하지 않는다. 실행된 Node와 Nest 버전은 출력에 포함된다.

실패하면 HTTP 상태·assertion·실행 버전을 확인하고 중단한다. 운영 주소로 대상을 바꾸거나 악성 압축 데이터를 전송하지 않는다.

## 관련 문서

- [2026-10-27 선행 조사](../../verification/security/2026-10-27-node-runtime-security-review.md)
- [후속 Node 패치 검증](../../verification/security/2026-10-27-node24-security-patch.md)
