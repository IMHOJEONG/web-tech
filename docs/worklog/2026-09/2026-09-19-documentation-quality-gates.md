# 스테이징 검사와 문서 품질 기준

## Summary

커밋 훅의 전체 포맷을 읽기 전용 스테이징 검사로 바꾸고 문서 추가·수정에 대한 점진적 검사를 도입했다.

## Changed

- Git 인덱스 및 커밋 비교 검사, 문서 목차 누락·링크·필수 섹션 검사와 단위 테스트 추가.
- 별도 Documentation workflow 추가. 기존 CI 파일의 다른 작업은 유지.
- [상태·검토일 및 증거 보관 기준](../../process/documentation-quality-gates.md) 문서화.

## Notes

부분 스테이징을 보존하기 위해 훅이 파일을 수정하거나 자동 add하지 않는다. 기존 위반은 비교 기준에 그대로 있으면 차단하지 않는다. 공개 블로그 글과 예제는 제외한다. 자동 보관 만료 및 GitHub 필수 상태 설정은 수행하지 않았다.

검증:

- `mise exec -- pnpm test:repo`: 18개 통과. 스테이징/작업 파일 불일치, 최초 커밋, 기존 위반 유지, 새 링크 오류, 대상 삭제, 목차 누락, 날짜 및 artifact 검사 포함.
- `mise exec -- pnpm exec simple-git-hooks`: 실제 pre-commit/commit-msg 갱신, 기존 pre-push 전체 포맷 제거.
- 임시 `GIT_INDEX_FILE`에 이번 변경만 넣어 실제 pre-commit 실행: 포맷 및 문서 검사 통과. 다른 미커밋 문서는 테스트 대상에서 제외했고 실제 인덱스 바이트가 동일함을 확인.
- `git diff --check` 통과. 원격 GitHub Actions 실행은 아직 미검증.

목차 개수는 수동 집계하지 않도록 기존 월별 목록의 숫자를 제거했다. 목차 본문을 자동 생성하지 않고 새 문서의 연결 누락을 검사하는 방식을 선택했다.

## Open Questions

GitHub에서 문서 검사를 필수 상태로 설정할지는 저장소 관리 정책에 따라 결정한다.

## Next

첫 PR에서 새 Documentation job 실행을 확인하고 기존 정책은 관련 작업 때 점진적으로 템플릿에 맞춘다.
