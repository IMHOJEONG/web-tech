# vuln-radar Vite+ 개발·빌드 로컬 실험

## Summary

[KAN-34](https://web-tech-service.atlassian.net/browse/KAN-34)의 사용자 승인 범위만 `codex/vuln-radar-viteplus-experiment-20261024`에 반영했다. main `16c51e9` 기준이며 다른 세션의 기존 checkout·미커밋 변경은 건드리지 않았다. 로컬 검증까지이며 커밋·푸시·배포는 하지 않았다.

## Changed

- 앱의 개발·빌드 명령과 Vite core 별칭을 Vite+ 1.4.0에 맞췄다. preview/start는 사라지는 기존 실행 파일 대신 동일 동작의 `vp preview`를 사용한다.
- 기존 pnpm lifecycle UI 빌드와 테스트·mise·Turborepo·lint·format 명령은 유지했다. 카탈로그·공통 override·CI·Dockerfile은 바꾸지 않았다.
- 기존 통합검사는 Vite core의 실행 파일 위치만 구분한다. 보안 버전 회귀는 alias에서도 실제 내장 Vite·패치된 editor를 검사하도록 보완했다. 별도 TypeScript CLI 검사기를 추가하고 기존 검사기 타입 검사 범위에 포함했다.
- [설계와 대안](../../architecture/vuln-radar-viteplus-experiment.md), [재현 명령과 결과](../../verification/integration/2026-10-24-vuln-radar-viteplus.md)에 범위·증거를 연결했다.

## Notes

CLI 7개·기존 통합 25개·frontend 32개·backend 48개·저장소 108개, 타입·lint·pnpm 고정 설치·Turbo 개발/빌드를 확인했다. 초기 검사기 실패와 최종 통과를 구분해 기록했다.

공용 lockfile의 다른 workspace peer 연결 재계산과 alias semver 경고는 남아 있다. audit의 13건은 기존 main에 있던 해당 패키지 버전의 경고이며 Vite+ 경유 권고는 없었다. 전체 보안 정상·운영 도입 완료로 보고하지 않는다.

## Open Questions

- Linux/CI와 다른 앱의 소비자 회귀 후에도 이 앱 한정 별칭 구성을 유지할 것인가?
- 전체 도입 검토 전에 peer 경고와 별도 보안 패치를 어떤 독립 작업으로 처리할 것인가?

## Next

사용자 실험 결과 검토 후 채택·보류를 결정한다. 전체 도입 시 ADR과 CI 검증 범위를 정하고 보안 게이트를 별도로 통과해야 한다. Railway 배포와 KAN-32 보안 재개 조건 변경은 승인하지도 실행하지도 않았다.
