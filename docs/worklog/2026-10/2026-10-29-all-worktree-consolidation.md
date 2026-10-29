# 전체 작업 트리 미커밋 정리와 작업별 커밋

## Summary

사용자 범위 확인과 편집 중지 승인 후 다른 작업 트리까지 조사했다. 중복·고유 기록·비공개 자료를 구분하고, 원본을 검증된 사본으로 보존하면서 원래 등록된 18곳을 clean 상태로 정리했다. 상세 수치와 검사는 [검증 보고서](../../verification/integration/2026-10-29-all-worktree-consolidation.md)에 모았다.

## Changed

- 출처·저작권, ADR 감사, 주간 점검, 옛 초안 정리, NAS 관측, Vite 배포 기록을 각각 독립 커밋으로 분리했다.
- 보존용 혼합 브랜치를 통째로 가져오지 않고 최신 main에 맞는 공개 가능 부분만 옮겼다. 개인 경로·원시 캡처·초안·녹화본은 제외했다.
- 각 원래 checkout의 기존 HEAD·인덱스를 유지한 채 확정 경로만 정리했다. 최신 게시된 Brotli 원문을 예전 draft로 되돌리지 않았다.
- 불완전한 메인·미디어 구현은 사본에 남기고 기능 완료로 표시하지 않았다. Figma 원본 기록도 별도 비공개 보관했다.

## Notes

[KAN-51](https://web-tech-service.atlassian.net/browse/KAN-51)과 [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817)에 로컬 커밋·검증·남은 작업을 연결한다. 원격 permalink가 없는 새 커밋은 로컬 SHA로만 기록한다. 앱 구조·공개 계약을 새로 바꾸지 않았으므로 ADR을 추가하지 않았다.

전체 회귀는 최초 권한 제한 2개 실패 후 동일 기준으로 198개 통과했다. 각 커밋은 staged 포맷·문서·commitlint와 활성 훅을 통과했으며 자동 수정으로 검사를 우회하지 않았다. 기존 stash 10개와 원래 커밋·열린 PR 이력은 보존했다.

## Open Questions

누락된 메인·미디어 컴포넌트와 비교 도구의 원본은 제한된 복구 탐색에서 확인하지 못했다. 사본과 남은 변경을 바탕으로 재구성하려면 별도 기능 작업·검증이 필요하다. `drain` 조기 종료 보완도 별도 과제다.

## Next

정제된 로컬 커밋을 검토한 뒤 승인된 범위에서만 푸시·PR을 진행한다. 원시 보관 자료와 미승인 글·미디어는 업로드하지 않는다. 편집 중지는 최종 보존 확인 후 해제했으며 새 수정이 생기면 이번 사본에 덮어쓰지 않는다.

## PR #78 재현 절차 리뷰 보완 · 2026-10-29

사용자 후속 승인에 따라 [PR #78](https://github.com/IMHOJEONG/web-tech/pull/78)의 문서 리뷰 3건을 같은 KAN-51에서 보완했다. 기준은 PR head `0080f21b`이며 비공개 자료와 별도 CI 기록 브랜치를 가져오지 않았다.

- [주간 점검](../../verification/content/2026-10-28-weekly-article-maintenance.md)은 비공개 실험의 필수 소스·manifest·fixture·권한과 공개 checkout의 재현 불가 범위를 명시했다. 공개 렌더링 검사 명령은 별도 범위로 안내한다. 저장소 manifest 13개에서 비공개 명령 3개의 부재와 docs 렌더링 스크립트의 존재를 확인했으며 브라우저 검사는 이번에 재실행하지 않았다.
- [ADR 감사](../../verification/governance/2026-10-27-adr-governance-audit.md)는 고정 커밋의 검사기를 사용하는 집계와 중복 9999·보류 상태의 정확한 합성 입력을 추가했다. 문서의 명령을 Node.js 24.22.1에서 실행하여 ADR 20개·상태 17/1/2·구조 오류 0개·합성 입력의 `validate` 결과 `[]`를 기존 artifact와 대조했다. 이 빈 배열은 검사 공백 재현이며 규칙 준수 판정이 아니다. 과거 artifact는 변경하지 않았다.
- [작업 트리 점검](../../verification/integration/2026-10-29-all-worktree-consolidation.md)은 NUL 구분 등록 경로마다 `git -C`로 상태·인덱스를 읽도록 보완했다. 원래 18곳의 clean 상태와 실행 전후 HEAD·인덱스·stash 일치를 재확인했다. 별도 임시 저장소의 공백/줄바꿈 경로 2곳, 미추적 파일 표시, 누락 경로의 비정상 종료도 확인했다. 최초 대조에서 뒤의 stash 명령이 앞선 실패를 가릴 수 있음을 찾아 외부 Bash에도 즉시 중단을 적용하고 같은 조건을 재실행했다.

문서 검사 회귀는 `node --test scripts/documentation-checks.test.mjs`로 17/17 통과했다. 재현 명령의 실행 로그와 임시 대조용 도구는 비공개 보관하며 공개 커밋에는 원시 경로·stash OID·개인 자료를 추가하지 않는다. 변경은 문서 3개와 이 작업 기록뿐이며 새 ADR·제품 계약 변경은 없다.

다음: staged 포맷·문서·commitlint 검사 후 이 보완만 커밋·푸시한다. 리뷰 3건은 수정된 원격 커밋을 확인한 뒤 해결 처리하고 새 CI·리뷰 결과를 재조회한다. main 병합·Production 배포·NAS 변경은 이번 승인 범위가 아니다.
