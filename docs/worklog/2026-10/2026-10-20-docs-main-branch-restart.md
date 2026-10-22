# main 기준 docs 작업·초안 브랜치 이전

## Summary

배포 전환 기록을 독립 커밋으로 푸시하고 [PR #47](https://github.com/IMHOJEONG/web-tech/pull/47)을 생성했다.
기존 feature/docs와 비공개 초안은 원본을 유지하면서 최신 main 기반 새 로컬 브랜치로 후속 작업을 분리했다.

## Changed

- `codex/docs-main-production-transition`: 운영 전환 기록만 공개 PR로 관리. main 직접 push·자동 병합은 수행하지 않음.
- `codex/docs-next`: main `ebc61ad4f0700e71437315a255872c790093bb94` 기반의 새 로컬 작업 시작점. 실제 변경이 없어 빈 커밋·PR·원격 브랜치는 만들지 않음.
- `codex/docs-tcp-draft`: 같은 main에서 비공개 초안 작업을 재개하는 로컬 브랜치. upstream을 연결하지 않고 초안은 미커밋 상태로 복원.
- [브랜치 정책](../../process/branch-policy.md)에 초안 동일성·목차 보존·로컬 스냅샷·공개 승인 경계를 추가.

## Notes

기존 feature/docs의 블로그 런타임과 공용 UI·토큰·lockfile 내용은 이미 main에 반영돼 있다.
블로그 영역에서 남은 차이는 main 쪽 지침 보강이므로 과거 feature 커밋을 재이전하지 않았다.
다른 앱의 후속 main 변경을 오래된 브랜치 내용으로 덮어쓰지 않았다.

보관된 초안 23개 파일 중 본문·첨부 20개는 원본 SHA-256과 일치했고 목차 3개는 main의 기존 항목을 유지해 합쳤다.
복원 직후 변경 파일 검사에서 문서·포맷·고신뢰 비밀정보 패턴 문제는 없었으며 본문 status는 draft다.
이번 작업은 초안 이전 검증이며, 과거 보고서의 실험·브라우저 테스트를 새로 실행한 것은 아니다.

원래 feature/docs 로컬·원격 ref와 원본 stash는 보존했다. 기록 브랜치로 안전하게 이동하기 위해 main 기준 초안의 로컬 스냅샷을 하나 추가했다.
새 초안 브랜치나 스냅샷은 원격에 보내지 않으며 공개 PR에는 초안 내용·첨부·로컬 백업 메타데이터를 포함하지 않는다.

## Open Questions

초안의 후속 검수와 게시 승인 시점. 기존 feature/docs·원본 stash 정리 시점은 별도 승인 대상이다.

## Next

초안 작업은 `codex/docs-tcp-draft`에서 계속한다. 다른 작업으로 전환할 때는 미커밋 파일이 따라가지 않도록 먼저 로컬 보존 상태를 확인한다.
새 기능은 main 최신 상태를 확인한 뒤 별도 짧은 작업 브랜치에서 진행하고, 승인된 변경만 main 대상 PR로 올린다.
