# PR #39 병합 후 feature 브랜치 동기화

## Summary

2026-10-19 KST에 PR #39의 main 병합 커밋 `d6d17165d70c12a96d9c0c36ea25e3dd5cd5e409`을 원격 `feature/*` 8개에 반영하고 atomic push를 완료했다. 로컬 main과 feature 브랜치도 갱신했다. 기존 TCP 초안은 커밋·게시하지 않았다.

## Changed

| feature 브랜치                    | 반영 방식    | 동기화 커밋 |
| --------------------------------- | ------------ | ----------- |
| docs                              | merge        | `45a7ef3`   |
| docs-backend-nas-deployment       | merge        | `9980299`   |
| issue-resolution-content-policies | fast-forward | `d6d1716`   |
| repo-agent-guides                 | merge        | `d8590b7`   |
| root-landing                      | fast-forward | `d6d1716`   |
| ui                                | fast-forward | `d6d1716`   |
| vuln-radar                        | merge        | `b59f6d2`   |
| vuln-radar-backend                | merge        | `301d4c5`   |

- 기존 tip과 병합 main이 각 결과의 조상인지 검사했다. force push·rebase·브랜치 삭제·main 직접 push는 하지 않았다.
- docs의 문서 목차 3개 충돌은 기존 스트림·오프라인 기록과 main의 보안 기록을 모두 유지해 해결했다. 보안 override·lockfile·회귀 테스트 파일은 8개 모두 main의 Git blob과 일치한다.
- 원래 작업 트리에서는 목차만 경로 지정 stash 후 복원했다. TCP 원문·도식·증거 등 나머지 20개 파일은 SHA-256이 같고, 목차 3개의 기존 미커밋 patch도 역방향 적용 검사로 보존을 확인했다. 복구용 stash는 유지했다.
- 이 작업 기록과 월별 목차만 docs 전용 후속 커밋에 포함한다. 기존 TCP 관련 미커밋 파일은 스테이징하지 않는다.

## Notes

docs 병합본에서 frozen install, 공용 UI build, 저장소 테스트 43개, docs 라이브러리 테스트 253개와 staged 포맷·문서 검사를 통과했다. 최초 라이브러리 검사는 새 작업 트리의 공용 UI 타입 산출물이 없어 중단됐고, 비대화형 pnpm 준비 과정도 재시도했다. 최종 checkout에서 CI 환경 설치와 UI build를 선행한 뒤 다시 통과했다. 앱 소스 수정으로 해결한 것은 아니다.

원격 8개 SHA는 `git ls-remote --heads origin 'feature/*'`로 재조회했다. [브랜치 정책](../../process/branch-policy.md)과 [PR #39 보안 검증](../../verification/security/2026-10-18-handlebars-advisories.md)을 따른다. PR 병합 후 GitHub push 안내의 기본 브랜치 경고는 high 1건(braces #336)으로 줄었지만, 이를 잔여 경고 해결로 설명하지 않는다. 새 아키텍처 결정은 없어 ADR을 추가하지 않았다.

## Open Questions

동기화 후 새 docs 커밋의 CI·배포 결과는 아직 확인하지 않았다. PR #39의 CI 성공을 배포 브랜치 동기화 이후 결과로 대체하지 않는다. 기존 TCP 초안은 draft와 미커밋 상태를 유지한다.

## Next

동기화 이후 feature/docs의 CI·배포를 확인한다. braces 공식 패치와 TCP 초안 검토·게시 여부는 별도 작업으로 유지한다.
