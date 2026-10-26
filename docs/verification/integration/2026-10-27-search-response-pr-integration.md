# 검색·응답 제한과 Content-Type 결합 검증

## 대상과 조건

- 확인일: 2026-10-27 KST. 검색 head `f153027`에 #64 병합 main `f840941`을 결합한 로컬 변경이며 새 검색 PR 전이다.
- Node24·pnpm12.14.0, 기존 lockfile을 사용하는 임시 Git worktree다. 원래 작업 트리의 NAS/H1·primary 미커밋은 수정·stash하지 않았다.
- backend HTTP·Next production 검사는 loopback fixture와 synthetic 토큰만 사용한다. 실제 NAS/운영 토큰·DB·웹훅은 사용하지 않는다.

## 재현 방법

깨끗한 작업 트리에서 루트 기준으로 실행한다. 리스너/브라우저 실행 권한이 필요하다. 환경 파일을 다른 작업 트리에서 복사하지 않는다.

```sh
mise exec -- pnpm install --offline --frozen-lockfile --ignore-scripts
mise exec -- pnpm --filter @web-tech/ui build
mise exec -- pnpm --filter docs-backend check
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter @web-tech/docs-content-contract test
mise exec -- pnpm --filter docs exec playwright test --config=playwright.article.config.ts --reporter=json
mise exec -- pnpm format:staged:check
mise exec -- pnpm validate:docs --staged
```

## 결과와 증거

PR #64는 head `363e90a72f20c44e665893419ae8b219610ffe35`에서 전체 체크 성공·미해결 리뷰0을 확인했다. 동일 최종 메시지의 check-only/merge 시 SHA-256은 `6d52c3d8acdddea8e6c5964552690767588c47ba042f82c7f6d0d2110908d53e`였고 main `f8409413ef19520db08a01ae6cac417f3bbcadab`에 병합됐다. 조회 시 문서·이미지 게시·Push on main 작업은 성공, main CI는 진행 중이었다. 이후 결과를 PR 검증과 혼동하지 않는다.

결합에서는 충돌 난 controller에서 Res/passthrough·수치 경고/상한을 모두 유지하고 `response.type('html')`을 budget 검사 뒤에 둔다. 정상 HTML·오류 JSON 계약에 응답 초과503을 포함하고 일반404의 본문 거부 규칙도 유지한다. 네 개의 문서 충돌은 양쪽 항목/내용을 합쳐 복구했다. unit mock은 Response 인수를 전달하고 over-budget에서는 type 호출0, HTTP는503 JSON·adapter 불일치 경고0을 검사한다. warning spy가 실제 수치 로그도 호출하므로 로그 억제로 성공시키지 않는다.

backend 결합 단위31개·HTTP55개, lint·타입·Nest build가 통과했다. 최초 docs lib 검사는 공용 UI dist가 없는 깨끗한 환경에서 TS2307로 중단됐다. 소스·exports·규칙을 바꾸지 않고 선행 UI build 뒤 재검증해 docs307개·공유28개·앱/테스트 타입을 통과했다.

셀프 리뷰의 원격 검색 보조 어댑터 `fetchRemoteSearchData(keyword)`도 직접 검사했다. 기존 주 화면은 searchText로 검색하지만 이 보조 함수는 빈 render content로 먼저 필터해 본문 전용 결과를 버렸다. 기존 통합 fixture에서 검색어 인수를 직접 전달해0건/기대1건 실패를 재현한 뒤 사전 필터를 searchText로 수정했다. 이후 같은 focused10개와 전체307개·변경 lint가 통과했고 raw HTML alias의 과거 키워드는 계속0건이다. 새 검색 endpoint·순위/캐시 규칙을 바꾸지 않았다.

최종 source에서 Next build·production162개도99.8초·skip/flaky/retry0·runner errors0으로 통과했다. [결합 증거](../artifacts/2026-10-27-search-response-pr-integration.json)에 실제 JSON reporter 집계·소스9blob·부모 두 SHA·초기 실패/후속 성공·#64의 실제 병합/배포 조회를 보존했다. 원시 로그·JSON은 머신 내부 `/private/tmp/`에만 두고 인증 헤더·환경 파일·비공개 원문은 복사하지 않았다. #64의 블로그 Production deployment7335363298은 동일 main SHA에서 success를 확인했으며 NAS 적용 완료와 다르다. 최종 검색 PR의 원격 CI·병합 SHA·배포는 후속 기록 대상이다.

## 한계와 후속 작업

저장소 회귀153개도 통과했다. 명령은 루트 `mise exec -- pnpm test:repo`이며 원시 결과는 `/private/tmp/pr65-integrated-repo-20261027.log`에 보존한다.

이 문서는 PR 검토/병합 전 로컬 결합 검증이며 최종 main CI·Vercel 배포 성공을 추정하지 않는다. 실제 원격 head/리뷰·전체 체크를 확인하고 공식 squash 사전검사 후 병합해야 한다. 새로운 메시지·head는 새로 검사한다. NAS 컨테이너 교체는 하지 않으며 새 GHCR 이미지가 게시돼도 NAS 적용이 완료된 것은 아니다. 기존 upstream/중단 음성 대조 로그 전체를 무해하다고 판정하지 않는다.

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-27-search-response-pr-integration.md)
- [HTML 제한 검증](../content/2026-10-26-html-response-budget.md)
- [Content-Type 검증](../content/2026-10-26-content-response-type.md)
- [공식 squash 절차](../../process/squash-merge-preflight.md)
