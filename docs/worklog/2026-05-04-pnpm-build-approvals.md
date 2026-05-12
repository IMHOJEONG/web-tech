# 2026-05-04 pnpm 빌드 승인 정리

## 요약

- pnpm dependency build approval 모델이 왜 도입되었는지 조사
- pnpm `v10.1`, `v10.4`, `v11` 기준의 차이를 정리
- 이 저장소 기준 운영 문서 `docs/runbooks/pnpm-build-approvals.md` 추가
- `package.json`의 legacy `pnpm.overrides`를 `pnpm-workspace.yaml`의 `overrides`로 이동
- 로컬 `.pnpm-store`를 git 추적 대상에서 제외
- `rm:node_modules` script는 `pnpm run`의 dependency check와 상성이 좋지 않아 제거
- `scripts/rm-node-modules.sh`를 추가해 삭제 전용 명령을 독립 shell script로 분리

## 변경 내용

- `docs/runbooks/pnpm-build-approvals.md`
- `docs/worklog/2026-05-04-pnpm-build-approvals.md`
- `package.json`
- `pnpm-workspace.yaml`
- `.gitignore`
- `package.json`
- `scripts/rm-node-modules.sh`

## 메모

- 공식 근거가 분명한 구간만 문서화했다.
- 버전 차이는 `approve-builds` 도입 시점과 `allowBuilds` 전환 시점을 중심으로 정리했다.
- 현재 저장소는 `package.json` 기준 `pnpm@11.0.4`를 사용하므로, 문서도 `allowBuilds` 운영 기준을 중심으로 작성했다.
- pnpm 11에서는 script 실행 전에 dependency 상태 점검이 더 적극적으로 개입할 수 있어, 단순한 `pnpm format`도 build approval 문제를 드러낼 수 있음을 별도 기록했다.
- 같은 이유로 root `package.json`의 `pnpm.overrides`는 신뢰 가능한 설정 위치가 아니므로, 동일한 내용을 `pnpm-workspace.yaml` top-level `overrides`로 옮겼다.
- 현재 환경에서 `pnpm store path`는 repo 내부 `.pnpm-store/v11`을 가리키므로, SQLite index 파일과 store 캐시가 워크트리에 보이지 않도록 `.gitignore`에 추가했다.
- `verifyDepsBeforeRun` 때문에 `pnpm run`은 단순 shell wrapper가 아니며, 삭제 전용 script는 install 흐름을 먼저 유발할 수 있어 shell 직접 실행이 더 적합하다고 판단했다.
- 반복 입력 부담은 줄이기 위해, repo root로 이동한 뒤 동일한 `find ... rm -rf`를 수행하는 독립 shell script를 `scripts/`에 두었다.

## 열린 질문

- 로컬 `.pnpm-store`를 계속 허용할지, 전역 store로 되돌릴지
- `verifyDepsBeforeRun` 기본 동작을 유지할지, 스크립트 DX를 위해 별도 조정할지

## 다음 단계

- moved `overrides` 기준으로 clean install 후 lockfile이 어떻게 정리되는지 검증
- clean install 기준으로 `pnpm install`, `pnpm format`, 주요 build를 다시 검증
