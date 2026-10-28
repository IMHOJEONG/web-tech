# 검색·응답 제한 PR과 Content-Type 수정 결합

## Summary

사용자가 검색 PR 생성과 현재 저장소의 열린 PR 병합을 승인했다. 최초 열린 PR은 [#64](https://github.com/IMHOJEONG/web-tech/pull/64) 하나였으며 [KAN-38](https://web-tech-service.atlassian.net/browse/KAN-38)·[KAN-29](https://web-tech-service.atlassian.net/browse/KAN-29)를 구분해 기록한다. 검색 후속 PR은 최신 main을 결합·검증한 뒤 생성한다. [Confluence 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817)는 같은 원본을 연결한다.

## Changed

- #64의 실제 diff·전체 성공 체크·미해결 리뷰0을 확인하고 공식 `pnpm pr:squash` check-only와 `--merge`를 같은40자리 head·최종 메시지로 실행했다. main 병합 `f8409413ef19520db08a01ae6cac417f3bbcadab`·MERGED를 확인했다.
- 원래 작업 트리의 NAS/H1·primary 미커밋을 건드리지 않고 writable `/private/tmp/`의 별도 Git worktree에서 최신 main을 결합했다. 기존 브랜치를 force push하거나 stash·main 이력을 재작성하지 않는다.
- controller·API 계약·공유 목차5파일의 충돌에서 양쪽 변경을 보존했다. HTML 헤더는 조회·렌더·byte budget 검사 성공 뒤에만 설정한다. 단위 mock에 Response 인수를 맞추고 HTTP503 JSON·adapter 경고0·수치 경고는 유지하는 결합 회귀를 보강했다.
- [결합 검증 보고서](../../verification/integration/2026-10-27-search-response-pr-integration.md)에 실행·source 증거·로컬/원격 상태를 구분한다. 기존 목록/HTML/Content-Type의 최초 검증 artifact는 당시 소스의 기록으로 보존한다.

## Notes

최초 깨끗한 작업 트리의 docs 라이브러리 타입 검사는 공용 UI dist가 없어 중단됐다. lockfile·CI·검사 문턱은 바꾸지 않고 공용 UI를 빌드해 재검사했다. 설치는 기존 lockfile·오프라인 캐시·ignore-scripts로 수행했으며 dotenv 등의 도구 출력 안내를 별도 승인/설치 지시로 취급하지 않았다. 비밀 환경 파일은 복사하지 않았다.

셀프 리뷰에서 `fetchRemoteSearchData(keyword)`의 사전 필터가 검색용 searchText 대신 빈 렌더 content를 보던 누락을 확인했다. 원격 본문 전용 키워드의 직접 어댑터 호출을 추가해 수정 전0건/기대1건 실패를 재현하고 searchText로 고쳤다. 주 화면 getSearchData와 별도 보조 경로이며 원문 HTML/body alias를 검색에 섞지 않는 기존 정책을 유지한다. 수정 후 집중10개·전체 docs307개와 변경 lint·앱/테스트 타입이 통과했다.

결합 backend31+55·공유28·Next build·production162개(99.8초, retry/skip/flaky0)도 통과했다. source9blob과 두 부모 SHA·실제 reporter·초기 실패는 보고서 artifact에 연결한다. #64의 동일 main SHA 블로그 Production 배포 success를 조회했으나 새 검색 PR의 원격 결과나 NAS 적용을 대신하지 않는다.

## Open Questions

실제 NAS 컨테이너 교체·문서 corpus·동시 부하·운영 웹훅은 별도다. main의 이미지 게시·Vercel 배포 성공과 NAS가 최신 이미지를 실행하는 것은 다르다. 원격 CI·리뷰가 실패하거나 head가 바뀌면 재검증 전 병합하지 않는다.

## Next

검색 PR 생성·attach 후 현재 head의 전체 CI·리뷰를 확인하고 최종 squash 메시지를 재검사해 병합한다. 실제 MERGED/main SHA·병합 후 CI·배포 결과는 같은 Jira/Confluence 기록에 연결한다. 사용자의 기존 미커밋 작업·다른 브랜치·stash는 보존한다.
