# 기존 docs 배포 브랜치와 원본 stash 정리

> 보존 기록: 아래 Summary부터 Next까지는 2026-10-20 당시 정리·검증과 후속 계획이다. PR #47의 현재 병합 상태나 현재 TCP 글 공개 상태를 나타내지 않는다. 2026-10-21 후속 정리는 문서 마지막에 별도로 기록한다.

## Summary

사용자 승인에 따라 기존 feature/docs 로컬·원격 브랜치와 이전 원본 stash를 정리했다.
현재 초안과 새 main 기준 로컬 스냅샷은 유지했으며, PR #47의 최신 커밋 CI를 별도로 확인했다.

## Changed

- `feature/docs` 로컬·원격 ref 삭제. 삭제 전 SHA를 확인하고 원격 삭제에 lease를 사용해 동시 변경을 보호했다.
- 지정된 원본 stash 한 건과 이를 중복 보관하던 이전 고정 ref 삭제. 새 main 기준 스냅샷과 나머지 stash는 변경하지 않았다.
- 로컬 복구 메타데이터의 현재 초안 기준을 새 스냅샷으로 명시했다. 비밀정보나 비공개 초안 내용은 공개 문서에 복사하지 않았다.
- 현재 브랜치는 `codex/docs-tcp-draft`다. 초안은 계속 미커밋·미스테이징 상태이며 원격 업로드하지 않았다.

## Notes

정리 직전에 운영 Production Branch가 main이며 공개 도메인이 READY main 배포를 가리키는지 확인했다.
새 main 기준 스냅샷의 기반 커밋과 현재 초안 파일 23개의 SHA-256 일치를 검증했다.
삭제 직후에도 23개 파일 해시·현재 브랜치·비어 있는 인덱스가 그대로였고, 새 스냅샷과 다른 feature 브랜치·stash는 유지됐다.
현재 초안의 본문 status는 draft이며 이번 작업에서 게시·재배포·정상 토큰 웹훅 호출은 수행하지 않았다.

[PR #47](https://github.com/IMHOJEONG/web-tech/pull/47)의 대상은 main이고 head는 `c99cf2c2aec4e0a7bea982e465710cec3f85f262`다.
[CI 실행](https://github.com/IMHOJEONG/web-tech/actions/runs/39347431680)의 린트·타입·단위/계약·공용 UI·오프라인·CRP·상세 페이지 및 세 화면 브라우저 검사가 모두 성공했다.
Documentation·CodeQL·GitGuardian·CodeRabbit status와 두 Vercel Preview를 포함한 최종 check rollup 22개가 모두 SUCCESS였다.
PR은 MERGEABLE이며 충돌은 없었다. check 성공을 모든 리뷰 지적의 해소나 병합 승인으로 간주하지는 않는다.

이 작업 기록과 월별 목차는 로컬에만 남긴다. 초안과 섞어 커밋하지 않고 CI 확인만을 위해 PR head를 바꾸거나 재실행하지 않는다.

## Open Questions

PR #47 리뷰 스레드의 최종 확인과 병합 승인. workflow에 남아 있는 feature/docs push 예외 제거는 별도 변경 범위다.

## Next

PR 병합 전 미해결 리뷰가 없는지 확인한다. PR 병합과 초안 게시 승인·커밋은 별도 요청에 따라 진행한다.
로컬 복구가 필요하면 현재 초안용 새 스냅샷을 사용하며, 이미 정리한 이전 원본 stash ref를 전제로 한 복구 명령은 사용하지 않는다.

## 2026-10-21 중복 정리와 기록 분리

사용자는 PR #49 게시 후 남은 38개의 중복 정리와 로컬 전용 기록 2개·월별 목차만의 커밋·PR 준비를 승인했다. 기준은 main `df2eb12416c8802e02fe305750c5fea9d2a5c011`이며, 이 작업의 이슈는 [KAN-19](https://web-tech-service.atlassian.net/browse/KAN-19)다. 맥락은 [Confluence 개발·운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)에 연결한다.

- 정리 전 수정 파일 8개·미추적 파일 30개를 로컬 전용 stash `b42e7895bc7d9e34620b41f5da5c33ac81065b66`에 보존했다. 번호가 바뀌는 `stash@{n}` 대신 고정 SHA와 로컬 ref `refs/codex/backups/kan19-pre-cleanup-20261021`로 식별한다. 기존 stash·원래 초안 브랜치는 삭제하지 않았다.
- 38개 모두 원문 SHA-256이 스냅샷과 일치하고 기반 커밋이 `ebc61ad4f0700e71437315a255872c790093bb94`인지 검사했다. 원래 상태는 인덱스가 비어 있었고, 최신 main에서 이미 반영된 36개를 다시 커밋하지 않았다.
- 새 브랜치 `codex/archive-preserved-worklogs-20261021`는 최신 main에서 시작한다. TCP 글의 published 상태·EOF 보완·도식·과거 증거와 공통 지침은 main 버전을 유지한다.
- 이 문서와 [10-17 동기화 기록](2026-10-17-feature-sync-after-pr38.md), 월별 README 링크만 분리한다. 두 문서의 과거 Summary~Next는 보존하고 시점 안내와 후속 기록을 구분한다. 앱 코드·정책·배포 설정 변경과 새 ADR은 없다.
- 파일 비교는 28개 완전 일치·JSON 포맷 차이 2개·main의 더 최신 내용 6개·로컬 전용 기록 2개로 구분했다. 36개에 고유 미반영 내용이 없다는 판단이지, 차이 있는 원본을 보관 없이 버린 것이 아니다.

별도 임시 작업 트리에서 고정 SHA를 `stash apply --index`로 실제 복원해 38개 파일 해시와 수정 8개·미추적 30개 상태가 정리 전과 같은지 확인했다. 두 작업 기록의 과거 Summary~Next는 공백을 제외하고 원문과 일치한다. 새 인덱스는 정확히 운영 문서 3개이며, 목차를 제외한 기존 main 파일 35개는 바이트가 동일하다. 목차는 기존 내용을 유지하고 링크 2개만 추가했다.

Node 24에서 `mise exec -- pnpm format:staged:check`, `mise exec -- pnpm validate:docs --staged`, `mise exec -- pnpm test:repo`를 실행해 포맷·문서 검사와 저장소 회귀 58개를 통과했다. `git diff --cached --check`와 변경 문서의 고신뢰 민감정보 패턴 검사도 통과했다. 이 문서 정리에서 앱 전체 lint·typecheck·build·브라우저·NAS 검사는 새로 실행하지 않았다. 로컬 복원 검증은 원격 백업 검증이 아니며, 기존 스냅샷을 다른 디스크로 복제한 것도 아니다.

원본 복구가 필요하면 현재 작업 트리에 전체 stash를 적용하지 않는다. 별도 복구 작업 트리를 만든 뒤 다음 명령으로 당시 tracked/untracked 상태를 확인한다. 이 복구 스냅샷·ref는 로컬 전용이며 PR이나 원격 push 대상이 아니다.

```bash
git worktree add --detach /tmp/web-tech-kan19-recovery ebc61ad4f0700e71437315a255872c790093bb94
git -C /tmp/web-tech-kan19-recovery stash apply --index b42e7895bc7d9e34620b41f5da5c33ac81065b66
git -C /tmp/web-tech-kan19-recovery status --short
```

복구 경로는 존재하지 않는 새 디렉터리를 사용한다. 스냅샷은 복원 검사가 끝나도 삭제하지 않는다. PR 병합·운영 배포는 이번 승인 범위에 없으며, 원격 CI·리뷰 결과는 새 PR의 해당 커밋에서 별도로 확인한다.
