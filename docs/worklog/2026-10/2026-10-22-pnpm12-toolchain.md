# pnpm12 툴체인 분리와 서명 유지형 설치

## Summary

사용자 승인으로 최신 안정 pnpm12.14.0 전환을 PR #54에서 분리했다. main9a208e0 기반 전용 브랜치에서 기존 설치 서명 오류를 조사하고 CI·로컬·두 Docker builder의 설치 경로를 정리했다. [KAN-25](https://web-tech-service.atlassian.net/browse/KAN-25)로 별도 추적한다.

## Changed

- pnpm과 mise를12.14.0으로 고정하고 공식 pnpm12 지원 action v6.1.0을 SHA로 고정했다. Node24와 앱 의존성 버전은 유지했다.
- Docker는 별도 npm bootstrap lockfile·`npm ci --ignore-scripts`·`npm audit signatures` 이후에만 네이티브 installer를 실행한다. 실패 시 중단하며 runtime에는 bootstrap을 넣지 않는다.
- strict/erasable TypeScript 도우미·회귀·CI 타입 검사와 image workflow 변경 경로를 연결했다. [반복 절차](../../runbooks/pnpm-toolchain-upgrade.md)와 [검증 결과](../../verification/integration/2026-10-22-pnpm12-toolchain.md)를 추가했다.

## Notes

기존 오류는11.7.0 bootstrap이 서명 메타데이터를 읽던 중 terminated/unreachable로 실패한 것이며, 서명 불일치의 증명은 아니다. 기존 PR #54는 원본 설정 그대로 실패 job을1회 재실행해 성공했다. 이 결과와 새 pnpm12의 검증을 구분한다.

새 버전으로 frozen 설치·도구73개·설치 도우미 타입·전체 lint/typecheck/unit의 강제 재실행과 두 linux/amd64 Docker 빌드·runtime 모듈 검사를 통과했다. 초기 PM lock 생성과 Prisma 캐시 EPERM, Docker 경고는 보고서에 남겼다. `pmOnFail` 완화·서명 키 비활성화·agent skill 승인·전역 기본 변경을 하지 않았다. 실제 앱 구조·공개 데이터 계약은 바뀌지 않아 별도 ADR을 만들지 않는다.

## Open Questions

최초 네트워크 중단의 주체는 미확정이다. Docker의 기존 Git/OpenSSL/legacy 경고, 실제 NAS/Railway 교체와 타 플랫폼은 별도 점검 대상이다. 기존 CodeRabbit 사용량 제한을 우회하거나 유료 리뷰를 실행하지 않는다.

## Next

작업별 커밋·푸시 후 별도 main 대상 PR을 만들고 새 head의 CI·CodeQL·Preview·Docker image workflow 결과를 확인한다. 실제 원격 식별자와 결과는 Jira·Confluence 마감 기록에 연결한다. 병합·운영 배포·PR #54의 툴체인 변경은 실행하지 않는다.
