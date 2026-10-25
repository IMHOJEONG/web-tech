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

## Open Questions

나머지 10건은 KAN-35의 별도 미조치 범위다. Linux 네이티브 경로·원격 CI/CodeQL·운영 적용은 로컬 결과와 구분해 확인해야 한다. 설치 시 worktree hook prepare 경고가 있었으나 실제 커밋의 기존 훅은 정상 실행됐다.

## Next

승인된 푸시·main 대상 PR의 CI·리뷰를 확인한다. 허용된 자동 Preview와 운영 배포를 구분한다. main 병합의 자동 배포 영향은 별도 승인 전 실행하지 않는다.
