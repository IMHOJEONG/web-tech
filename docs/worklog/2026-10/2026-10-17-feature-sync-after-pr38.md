# PR #38 병합 후 feature 브랜치 동기화

> 보존 기록: 아래 Summary부터 Next까지는 2026-10-17 당시 실행 결과와 후속 계획이다. 2026-10-21 사용자 승인으로 보존 문서를 커밋하며, 이 문서 추가가 브랜치 재동기화나 현재 취약점 재검증을 의미하지 않는다.

## Summary

2026-10-17 [PR #38](https://github.com/IMHOJEONG/web-tech/pull/38)의 main 병합 커밋 `93fbf6da6126ddfa8b150a1ed4cd4d94a1f4002c`를 로컬 main과 활성 feature 브랜치 8개에 반영했다. 원격 feature 8개도 force 없이 atomic push하고 서버의 실제 ref를 대조했다. 새 PR 코멘트는 작성하지 않았다.

## Changed

| 브랜치                                      | 반영 후 SHA | 방식         |
| ------------------------------------------- | ----------- | ------------ |
| `feature/docs`                              | `6dfba95`   | merge        |
| `feature/docs-backend-nas-deployment`       | `9a2e31f`   | merge        |
| `feature/issue-resolution-content-policies` | `93fbf6d`   | fast-forward |
| `feature/repo-agent-guides`                 | `e0b432e`   | merge        |
| `feature/root-landing`                      | `93fbf6d`   | fast-forward |
| `feature/ui`                                | `93fbf6d`   | fast-forward |
| `feature/vuln-radar`                        | `c429896`   | merge        |
| `feature/vuln-radar-backend`                | `f7f0973`   | merge        |

기존 동기화 스크립트는 가이드 브랜치의 `apps/docs/AGENTS.md` 충돌을 abort하고 나머지 7개를 완료했다. 해당 브랜치를 다시 병합해 기존 `Monorepo Rules`의 공통 지침 참조와 main의 블로그 기고 검증 규칙을 모두 보존했다. root AGENTS는 이전 가이드 브랜치 원문과 같은지도 확인했다. 다른 앱의 기능을 임의로 덮어쓰거나 rebase·force push·브랜치 삭제·main 직접 push는 하지 않았다.

## Notes

`bash scripts/sync-feature-branches.sh --no-fetch`로 사전 점검 후 `--apply --no-fetch`로 로컬 반영했다. push 직전 실제 원격 main·feature ref가 사전 확인값과 같은지 검사하고 8개 refspec을 `git push --atomic origin`에 함께 전달했다.

- 로컬 feature 8개가 각각 main과 기존 feature tip을 모두 조상으로 포함한다. 원격 ref는 `git ls-remote --heads` 결과가 로컬 반영 SHA와 모두 같았다. 로컬 main도 origin/main과 같다.
- docs의 커밋된 tree는 main과 같다. 가이드 충돌 해결은 staged 포맷·문서 검사와 커밋 훅을 통과했다. 신규 고유 커밋 6개(main squash 1개·동기화 merge 5개)의 commitlint도 통과했다.
- TCP 미커밋 파일 22개를 untracked까지 임시 stash에 보관한 뒤 `feature/docs`로 돌아와 복원했다. 복원 직후 모든 파일의 SHA-256과 변경 파일 목록이 원래 상태와 일치했다. 복구용 stash `bbc8bdde4938980f9aaa58e7c8a83d54ef36aa5a`는 삭제하지 않았다.
- 이 기록과 목차 링크는 복원 검증 후 추가한 로컬 미커밋 문서다. 기존 TCP 작업과 함께 자동 커밋·푸시하지 않는다.
- 기존 post-merge 훅이 pnpm 설치 확인과 Git 훅 갱신을 실행했으며 lockfile 변경은 없었다. 전체 앱 빌드·원격 CI·배포·NAS 검사는 이번 동기화에서 새로 수행하지 않았다.
- push 응답에 기본 브랜치 Dependabot 경고 4건(critical 2·high 1·moderate 1)이 표시됐다. 경고의 패키지·발생 원인·악용 여부는 조사하지 않았다. 이 알림은 앞서 수정한 CodeQL #37과 구분해 별도 점검한다.

[브랜치 정책](../../process/branch-policy.md)을 따랐다. 기존 결정을 전파하는 작업이며 새로운 구조·공개 계약의 결정은 없어 ADR 추가는 해당 없다.

## Open Questions

새 동기화 SHA의 CI·배포 성공과 브랜치별 전체 기능 회귀는 미검증이다. Dependabot 알림의 실제 대상과 조치도 별도 보안 작업으로 남는다.

## Next

필요한 브랜치의 CI·배포를 각각 확인한다. 기존 TCP 초안은 자체 검수와 사용자 승인 범위에 따라 별도 작업으로 이어간다.

## 2026-10-21 보존 후속 기록

원문은 로컬 복구 스냅샷에 바이트 단위로 보존했다. 이번 추가는 표 공백 포맷과 시점 안내만 보완했으며, 위의 과거 실행 결과·제약·보류 사항은 현재 상태로 덮어쓰지 않았다.
TCP 글은 이후 [게시 기록](2026-10-21-tcp-publication.md)에서 별도 승인·검증을 거쳐 공개됐다. 이번 기록 분리와 복구 기준은 [중복 정리 후속 기록](2026-10-20-docs-legacy-branch-cleanup.md#2026-10-21-중복-정리와-기록-분리), 작업 상태는 [KAN-19](https://web-tech-service.atlassian.net/browse/KAN-19)를 따른다.
