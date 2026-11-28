# 태블릿 UI/UX 첫 실패와 Next 개발 manifest 경로 보완

## Summary

- [KAN-90](https://web-tech-service.atlassian.net/browse/KAN-90)을 별도 버그로 생성하고 기존 KAN-58과 연결했다.
- 기준 main `136ef3c4`의 전용 작업 트리에서 조사했다. 기존 작업 트리·stash·비공개 자료는 변경하지 않았다.
- 11-24에는 설치된 Next 16.4.6의 공유 manifest 위험을 통제 재현하고 사용자 승인 후 공식 방식 backport를 로컬 적용했다. 당시 커밋·푸시·운영 변경은 하지 않았으며 11-27 후속 범위는 아래에서 구분한다.

## Changed

- `patches/next@16.4.6.patch`: [Next #100521](https://github.com/vercel/next.js/pull/100521)의 동기 manifest 갱신·초기화 방식을 CJS/ESM 배포본에 backport. Next 버전·bundler는 유지.
- `pnpm-workspace.yaml`·`pnpm-lock.yaml`: 정확한 16.4.6 패치와 hash 연결. 다른 패키지 버전 변경 없음.
- `apps/docs/lib/next-dev-manifest.test.ts`: 실제 Next 메서드의 truncate·병렬 갱신·오류 전파·동일 bytes와 배포본 parity 회귀 7개. 기존 `test:lib`와 타입 검사에 자동 포함.
- [검증 보고서](../../verification/resilience/2026-11-24-tablet-uiux-manifest-race.md)에 원래 CI, 별도 로컬 클릭 실패, 통제 재현과 한계를 분리했다. 테스트 작성 가이드에 재현·패치 재검토 절차를 보완했다.

## Notes

- 원래 CI의 `main` 0개 직전 JSON 오류와 설치된 경쟁 경로는 확인했지만, 과거 요청의 파일·상관 ID는 없어 정확한 최초 원인 확정으로 표현하지 않는다.
- 기존 5초/30초·worker 2개·카드/키보드/이미지·랜드마크 검사는 바꾸지 않았다. 반복은 retry 0회로 실행했다.
- 격리 실행본의 원시 자료는 Git 밖에서 보존한다. 11-24 로컬 검증 단계에서는 공개 검수 해시·새 커밋·원격 실행을 생성하지 않았다.
- 패치 출처는 Vercel Next.js, MIT License다. 설치 패키지의 `license.md`와 기존 저작권 고지는 유지했다. 수정 범위는 개발 서버의 동시 파일 접근이며 운영 런타임을 별도 변경하지 않는다.
- `pnpm patch-commit`은 Git 커밋이 아니라 패치 생성·등록 명령이다. 자동 prepare가 worktree의 `.git` 파일을 디렉터리로 가정해 hook 설정 오류를 출력했으나 Git 연결을 변경하지 않았고, 훅을 우회하거나 다시 설치하지 않았다. 후속 설치 검사는 lifecycle scripts 없이 실행한다.
- 재사용할 교훈은 “retry 통과와 서버 JSON 실패를 구분하고, 동일 프로세스의 공유 파일 갱신을 통제 검증한다”이다. [Confluence 주제](https://web-tech-service.atlassian.net/wiki/pages/21692418)를 생성하고 본문·근거·KAN-90 링크를 재조회했다. `docs/knowledge/README.md`의 탐색 링크는 로컬 변경이다. 단순 upstream 버그 backport로 구조·공개 계약이 바뀌지 않아 새 ADR은 만들지 않는다.
- 최종 frozen 설치·라이브러리 392개·타입·변경 테스트 lint 통과. 화면 검사는 격리 사본에서 태블릿 반복40개·전체175개, 모바일/데스크톱 UI/UX19개를 retry 0회로 통과했다. 기존 폭 조건 skip만 유지했다.
- 보존 대조: 기존 42개 작업 트리의 HEAD·인덱스와 stash 0개는 동일했다. 이 중 41곳은 미커밋 파일 바이트도 동일했고, 다른 임시 트리 한 곳에서는 미커밋 10개→21개의 별도 변경이 관측됐다. 이번 작업은 그 경로를 수정하거나 되돌리지 않았다. 새 전용 트리를 포함하면 총 43개다. 이 검사는 추적/미추적 파일 기준이며 ignored 비공개 자료를 전수 검사했다는 뜻은 아니다.

## Open Questions

### 2026-11-27 공개 검수·PR 준비

- 사용자가 이번 패치·회귀 테스트·정제 문서만 공개 검수 후 작업별 커밋·푸시·PR 생성과 원격 CI/CodeRabbit 확인을 승인했다. main 병합·배포는 이번 범위가 아니다.
- 대상은 패치·pnpm 연결 3개, 회귀 테스트 1개, 기존 가이드·지식/검증/월별 목차·보고서·이 기록의 정제 문서 6개와 해당 공개 검수 목록이다. 원시 자료·기존 다른 미커밋·stash·비공개 원문은 제외한다.
- 최초 조사 기준 `136ef3c4`는 보존하며 현재 main `5dc0e252`의 보안·IME 변경과 겹치는 lockfile/목차는 양쪽 항목을 보존해 통합한다. 최종 파일 bytes로 공개 검수 해시를 기록하고 새 head의 검사를 확인한다.
- 이번에 새로 변경한 공통 지침·CI 설정은 없다. 기존 Confluence 개념 문서를 재사용하며 새로 확인한 실행 기록은 Jira와 원본 보고서에 연결한다.

### 2026-11-28 기본 deploy 보완

- `6326fa67`의 핵심 CI는 통과했다. 이미지 설치·빌드는 성공했지만 legacy deploy가 백엔드에서 쓰지 않는 Next 패치로 `ERR_PNPM_UNUSED_PATCH`를 냈다.
- 사용자 추가 승인으로 두 Dockerfile의 `--legacy`만 제거하고 기본 전용 lockfile 경로를 사용한다. 전역 패치 검사·공급망 검사·기존 E2E 기준은 완화하지 않는다.
- 새 guard는 변경 전 실패했고 변경 후 설치·보안 회귀 24개·툴체인 타입 검사가 통과했다. 격리 docs-backend131개·vuln-radar-backend127개 묶음이 완료됐고 registry integrity의 루트 pin 일치와 필요한 모듈 해석·Next/개발 CLI 부재를 확인했다. 실제 서버·DB·운영 배포는 미실행이다.
- 새 원격 CI와 이미지 결과를 확인하며 CodeRabbit 공식 App의 재리뷰 한도는 검증 성공으로 처리하지 않는다. 최초 Major 1건과 후속 완료 여부를 구분한다.

### 2026-11-28 원격 검증 마감

- 코드 head `119ad88e`의 [핵심 CI](https://github.com/IMHOJEONG/web-tech/actions/runs/46112494169)·문서·실제 docs-backend 이미지·CodeQL·보안 및 두 Preview 체크가 통과했다. 태블릿175·데스크톱182·모바일189·상세214개가 기존 skip 범위를 유지하며 통과했고 해당 로그의 retry 표식은 0개였다.
- 동일 head CodeRabbit 공식 체크는 SUCCESS다. 최초 Major 1건은 수정·실제 이미지 검증 근거를 답글로 연결하고 해결 상태를 재조회했다. 6326fa67의 한도 NEUTRAL과 최종 코드 head의 실제 완료를 구분한다.
- 기존 Jira 요약 표와 Confluence 개념 문서를 재사용한다. 이 결과의 상세·한계는 위 검증 보고서에 두며 원시 로그·응답·캡처·비밀값은 공개하지 않는다. 공통 지침·CI 설정은 변경하지 않았다.
- 다른 조회 가능한40개 작업 트리와 stash0개 보존 일치를 확인했다. 초기부터 Git 조회가 불가능했던3개는 미검증으로 남겼고 복구·정리·삭제하지 않았다. 이번 전용 트리만 커밋했다.
- 마감 기록 후속 커밋은 문서 2개·검수 해시만 바꾼다. 해당 새 head의 CI는 PR에서 별도 확인하며 코드 head의 결과로 대신하지 않는다. main 병합·운영·실제 NAS/DB는 미실행이다.

### 최초 PR 관측 이력

- PR [#114](https://github.com/IMHOJEONG/web-tech/pull/114)를 생성했다. 작업별 커밋은 patch `2f33c422`, 회귀 `027da7b1`, 정제 문서 `65b1d1a9`이며 보존 병합 `904611ab`에서 392개·타입·lint·공개/문서 검사를 다시 통과했다.
- 최초 이미지 검사는 `ERR_PNPM_PATCH_NOT_FOUND`로 실패했다. 사용자 추가 승인으로 두 백엔드 Dockerfile과 기존 `scripts/install-pnpm.test.mts`만 보강한다. 운영 컨테이너·태그·runtime·키·워크플로는 바꾸지 않는다. 같은 문서 2개를 정제 갱신·재검수해 후속 커밋하며 새 head의 CI/리뷰와 구분한다.
- 추가 설치·보안 회귀 23개와 툴체인 타입 검사 통과. CodeRabbit 최초 리뷰의 Major 1건도 같은 Docker 복사 누락으로 확인했다. 새 head에서 실제 docs-backend 이미지 빌드를 재검증하며, vuln-radar-backend의 실제 이미지 빌드는 이번에 실행하지 않는다.

- 원래 CI에서 읽다 실패한 JSON 파일과 요청의 정확한 대응은 미확정이다.
- 수정 전 별도 클릭 URL 실패 2건은 정확한 완료 지연 원인까지 확정하지 않았다.
- 원격 CI·실기기·배포와 upstream 안정 릴리스 반영 여부는 별도 검증이 필요하다.

## Next

- 11-24에는 원격 CI·배포·실기기를 실행하지 않았다. 후속 검증에서도 같은 예산과 판정을 유지한다.
- 11-27 승인 범위의 공개 검수·작업별 커밋·푸시·PR과 119ad88e 코드 검증을 완료했다. 마감 기록만 바뀐 후속 head의 CI를 확인하고 main 병합·운영 검증은 별도 승인 후 진행한다.
- 동일 오류 재발 시 timeout을 늘리지 않고 요청과 실패 파일을 먼저 연결한다.
