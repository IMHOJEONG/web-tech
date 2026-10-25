# Next.js Critical 우선 패치와 회귀 보완

## Summary

[KAN-35](https://web-tech-service.atlassian.net/browse/KAN-35)의 기존 13건 중 Next Critical 2건을 먼저 조치했다. 최신 main `d0b25a5`에서 별도 `codex/security-next-critical-20261025` worktree를 만들고 next·@next/mdx를 16.4.3으로 해석하도록 안전 하한을 올렸다. 같은 릴리스의 High 1건도 제거되어 로컬 전체/production audit은 Critical 0·잔여 10건이다.

## Changed

- docs catalog의 next·@next/mdx 최소 버전 `^16.4.1`과 root lockfile만 패키지 변경했다. 다른 importer·패키지 metadata·보안 override는 유지한다.
- 신규 Next 보안 회귀 6개를 기존 `test:repo`에 연결하고, 함수 캐시 fixture에 여러 typed-array 반환과 root locale 값을 추가했다. 실험 fixture만 기존 prefetching 동작을 명시하며 운영 설정은 바꾸지 않는다.
- 업그레이드 후 특정 스트림 오류 문구가 필수라고 가정한 E2E 10건의 실패를 보존하고 실제 종료 증거를 검사하도록 보완했다. 기존 unknown/실제 장애 판정·원인 순서·정상 Link 완료 검사는 유지한다.
- [검증 보고서](../../verification/security/2026-10-25-next-critical.md), audit/초기 실패 artifact, 역할별 목차와 TODO에 현재 범위·잔여 경고·미배포를 연결한다.

## Notes

신규 6개·저장소 137개·docs 단위 285개, 타입·lint·peer·catalog 검사가 통과했다. Cache Components 함수 캐시 검증과 production 전체 E2E 154개도 통과했다. 초기 fixture/검사기 준비 실패와 E2E 144/154 결과는 지우지 않고 후속 성공과 구분한다. 공식 advisory·명령·네이티브 환경 한계는 검증 보고서에 둔다.

기존 Vite+ 작업 폴더의 미커밋 문서는 보존했고 이 보안 브랜치로 가져오지 않았다. 후속 사용자 승인으로 패키지 `54b6966`, 보안·캐시 회귀 `2a2886b`, 종료 관측 호환 `fd83380`과 검증 문서 커밋을 분리한다. 기존 정상 훅을 통해 검사했으며 우회하지 않았다. 자동 Preview만 별도 허용받았으며 main 병합·운영·수동 배포·운영 API 호출은 하지 않는다.

### 후속 PR #60 확인

4개 커밋의 마지막 head `c906573`를 기준으로 CI 13개 job·CodeQL 2종·문서·PR 이미지 build·Vercel Preview 성공을 확인했다. 원격 production E2E 154개·저장소 137개·docs lib 285개 성공이며 신규 보안 검사도 Linux CI에서 실행됐다. PR merge ref 열린 CodeQL 경고는 0건이다. 상세 run·명령·한계는 검증 보고서의 PR #60 항목에 남겼다.

CodeRabbit 완료 댓글에는 actionable 지적이 없고 inline thread도 0개다. Docstring Coverage 20%/권장 80% 경고 1건은 비차단 품질 제안으로 구분했다. 봇이 lockfile을 제외했다는 한계를 기록하고 기존 graph/audit 검사와 실제 설치·회귀 결과를 별도 근거로 유지한다. 신규 보안 검사 6개도 로컬 재통과했다.

이번 확인은 코드·설정 수정이나 리뷰 해결 처리 없이 기존 보고서와 이 worklog만 갱신한다. Jira KAN-35와 Confluence의 같은 작업 기록도 갱신·재조회한다. 이번 문서 변경은 미커밋이며 commit/push·병합·운영 배포를 실행하지 않는다. PR의 build-only를 이미지 게시로, Preview를 Production으로 간주하지 않는다.

### 검증 문서 커밋·푸시 승인

후속 사용자 승인으로 검증 보고서와 이 worklog 2개만 별도 커밋·푸시한다. 새 커밋의 CI 결과를 기존 `c906573`의 성공으로 대체하지 않는다. 코드·의존성·설정과 나머지 경고 10건은 변경하지 않으며, 자동 Preview 외 main 병합·운영·수동 배포는 하지 않는다. 저장소의 기존 포맷·문서·commitlint 훅을 유지하고 Jira·Confluence의 같은 기록에 실제 원격 커밋을 연결한다.

### 새 head 재검증

문서 커밋 `35a9fcd`가 PR #60에 반영된 뒤 새 CI 13개 job·CodeQL 2종·문서·PR 이미지 build·자동 Preview 성공을 확인했다. 새 production E2E 154개·repo 137개·docs lib 285개 성공과 열린 CodeQL 경고 0건을 원격 결과로 확인했다. 이전 head의 결과를 재사용하지 않았으며 run·명령은 검증 보고서에 연결했다.

CodeRabbit 새 status는 SUCCESS지만 description이 `Review rate limited`이고 완료 리뷰의 기준은 이전 `c906573`다. 따라서 새 head 봇 리뷰는 미실행이며 새 지적 0개와 구분한다. 새 문서 2개의 내용·문서/포맷 검사는 직접 대조했고 추가 결함은 발견하지 못했다. 재리뷰 요청이나 한도 우회는 하지 않았다. 이번 결과는 기존 Jira·Confluence 기록을 갱신·재조회하고 로컬 문서 2개에 미커밋으로 남긴다. 추가 commit/push·병합·운영 배포는 하지 않는다.

## Open Questions

나머지 10건은 KAN-35의 별도 미조치 범위다. 원격 Linux 회귀·CI/CodeQL은 확인했으나 악성 입력 차단과 운영 적용은 미검증이다. 새 head 봇 리뷰는 사용량 제한으로 미실행이며 이전 Docstring Coverage 경고의 채택 여부는 후속 선택 사항이다. 설치 시 worktree hook prepare 경고가 있었으나 실제 커밋의 기존 훅은 정상 실행됐다.

## Next

PR #60은 OPEN·미병합으로 유지한다. 승인된 문서 푸시 후 새 head의 검사는 기존 검증과 구분한다. main 병합의 자동 배포 영향은 별도 승인 전 실행하지 않는다. 잔여 보안 경고 10건은 기존 별도 과제로 유지한다.
