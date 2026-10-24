# Vite+ 로컬 커밋 분리와 기존 보안 경고 후속 등록

## Summary

사용자 승인에 따라 [KAN-34](https://web-tech-service.atlassian.net/browse/KAN-34)의 Vite+ 실험과 호환성 보완을 작업별 로컬 커밋으로 분리했다. 원격 푸시·PR·main 병합·Railway 배포는 하지 않는다. 기존 audit 13건은 별도 [KAN-35](https://web-tech-service.atlassian.net/browse/KAN-35)에 등록했으며 수정 완료로 표시하지 않는다.

## Changed

- `a1a4e38`: 앱 Vite+ 설정·lockfile·호환성 보완과 기존 보안/통합 검사 어댑터. manifest와 lockfile은 서로 의존하므로 함께 커밋했다.
- `62a4e4f`: 의존성 정책 회귀, lockfile 분석기, CLI/소비자 검증 도구와 타입 검사 범위.
- `5b7dcf5`: 실험 설계·단계별 검증 보고서·합성 데이터 증거와 목차. 과거 실패 결과도 보존했다.
- 이 기록과 [기존 TODO](../../todo/todo.md)의 보안 후속 항목은 별도 문서 커밋으로 분리한다. 실제 경고 패치는 포함하지 않는다.

## Notes

커밋 직전 `mise exec -- pnpm peers check`는 0건, `mise exec -- pnpm exec tsc -p tsconfig.vuln-integration.json`은 종료 코드 0, `mise exec -- pnpm test:repo`는 120개 통과했다. 각 커밋의 staged format·documentation 검사와 commitlint 훅을 우회하지 않았다.

증거 JSON 3개의 포맷 차이를 해당 파일만 Prettier로 보정했다. 전후 `SHA-256(JSON.stringify(JSON.parse(raw)))`가 각각 같아 측정값 보존을 확인했다. 원본 검증 명령·환경·소비자 회귀 결과는 [호환성 검증](../../verification/integration/2026-10-24-viteplus-dependency-remediation.md)에 유지한다. 해당 보고서와 artifact의 미커밋 표기는 실행 당시 상태이며 이번 로컬 커밋 이후 원격 반영을 뜻하지 않는다.

기존 분석기의 기준선은 실행 시 `HEAD`다. 보관된 비교 증거의 원래 기준은 main `16c51e9911f041b125a445b3939966986426a0b4`이며, 이후 HEAD에서 재실행한 결과를 같은 기준선 비교로 간주하지 않는다.

## Open Questions

기존 audit 13건은 [스냅샷](../../verification/artifacts/2026-10-24-viteplus-override-audit.json)을 기준으로 별도 보안 작업에 남긴다. Linux·원격 CI·배포 검증은 미실행이며 Vite+의 장기 채택도 결정하지 않았다. [KAN-32](https://web-tech-service.atlassian.net/browse/KAN-32)의 Railway 보안 보류 조건은 유지한다.

## Next

사용자가 별도 승인할 때만 푸시·PR·원격 CI 범위를 결정한다. 보안 작업은 최신 main에서 경고·공식 패치·실제 의존 경로를 다시 확인한 뒤 독립 브랜치로 진행한다.
