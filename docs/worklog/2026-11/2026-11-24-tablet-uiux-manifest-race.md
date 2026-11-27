# 태블릿 UI/UX 첫 실패와 Next 개발 manifest 경로 보완

## Summary

- [KAN-90](https://web-tech-service.atlassian.net/browse/KAN-90)을 별도 버그로 생성하고 기존 KAN-58과 연결했다.
- 기준 main `136ef3c4`의 전용 작업 트리에서 조사했다. 기존 작업 트리·stash·비공개 자료는 변경하지 않았다.
- 11-24에는 설치된 Next 16.4.6의 공유 manifest 위험을 통제 재현하고 사용자 승인 후 공식 방식 backport를 로컬 적용했다. 당시 커밋·푸시·운영 변경은 하지 않았으며 11-27 후속 범위는 아래에서 구분한다.

## Changed

- `patches/next@16.4.6.patch`: [Next #100521](https://github.com/vercel/next.js/pull/100521)의 동기 manifest 갱신·초기화 방식을 CJS/ESM 배포본에 backport. Next 버전·bundler는 유지.
- `pnpm-workspace.yaml`·`pnpm-lock.yaml`: 정확한 16.4.6 패치와 hash 연결. 다른 패키지 버전 변경 없음.
- `apps/docs/lib/next-dev-manifest.test.ts`: 실제 Next 메서드의 truncate·병렬 갱신·오류 전파·동일 bytes와 배포본 parity 회귀 7개. 기존 `test:lib`와 타입 검사에 자동 포함.
- [검증 보고서](../../verification/resilience/2026-11-24-tablet-uiux-manifest-race.md)에 원래 CI, 별도 로컬 클릭 실패, 통제 재현과 한계를 분리했다. 테스트 작성 가이드에 재현·패치 재검토 절차를 보완했다.

## Notes

- 원래 CI의 `main` 0개 직전 JSON 오류와 설치된 경쟁 경로는 확인했지만, 과거 요청의 파일·상관 ID는 없어 정확한 최초 원인 확정으로 표현하지 않는다.
- 기존 5초/30초·worker 2개·카드/키보드/이미지·랜드마크 검사는 바꾸지 않았다. 반복은 retry 0회로 실행했다.
- 격리 실행본의 원시 자료는 Git 밖에서 보존한다. 11-24 로컬 검증 단계에서는 공개 검수 해시·새 커밋·원격 실행을 생성하지 않았다.
- 패치 출처는 Vercel Next.js, MIT License다. 설치 패키지의 `license.md`와 기존 저작권 고지는 유지했다. 수정 범위는 개발 서버의 동시 파일 접근이며 운영 런타임을 별도 변경하지 않는다.
- `pnpm patch-commit`은 Git 커밋이 아니라 패치 생성·등록 명령이다. 자동 prepare가 worktree의 `.git` 파일을 디렉터리로 가정해 hook 설정 오류를 출력했으나 Git 연결을 변경하지 않았고, 훅을 우회하거나 다시 설치하지 않았다. 후속 설치 검사는 lifecycle scripts 없이 실행한다.
- 재사용할 교훈은 “retry 통과와 서버 JSON 실패를 구분하고, 동일 프로세스의 공유 파일 갱신을 통제 검증한다”이다. [Confluence 주제](https://web-tech-service.atlassian.net/wiki/pages/21692418)를 생성하고 본문·근거·KAN-90 링크를 재조회했다. `docs/knowledge/README.md`의 탐색 링크는 로컬 변경이다. 단순 upstream 버그 backport로 구조·공개 계약이 바뀌지 않아 새 ADR은 만들지 않는다.
- 최종 frozen 설치·라이브러리 392개·타입·변경 테스트 lint 통과. 화면 검사는 격리 사본에서 태블릿 반복40개·전체175개, 모바일/데스크톱 UI/UX19개를 retry 0회로 통과했다. 기존 폭 조건 skip만 유지했다.
- 보존 대조: 기존 42개 작업 트리의 HEAD·인덱스와 stash 0개는 동일했다. 이 중 41곳은 미커밋 파일 바이트도 동일했고, 다른 임시 트리 한 곳에서는 미커밋 10개→21개의 별도 변경이 관측됐다. 이번 작업은 그 경로를 수정하거나 되돌리지 않았다. 새 전용 트리를 포함하면 총 43개다. 이 검사는 추적/미추적 파일 기준이며 ignored 비공개 자료를 전수 검사했다는 뜻은 아니다.

## Open Questions

### 2026-11-27 공개 검수·PR 준비

- 사용자가 이번 패치·회귀 테스트·정제 문서만 공개 검수 후 작업별 커밋·푸시·PR 생성과 원격 CI/CodeRabbit 확인을 승인했다. main 병합·배포는 이번 범위가 아니다.
- 대상은 패치·pnpm 연결 3개, 회귀 테스트 1개, 기존 가이드·지식/검증/월별 목차·보고서·이 기록의 정제 문서 6개와 해당 공개 검수 목록이다. 원시 자료·기존 다른 미커밋·stash·비공개 원문은 제외한다.
- 최초 조사 기준 `136ef3c4`는 보존하며 현재 main `5dc0e252`의 보안·IME 변경과 겹치는 lockfile/목차는 양쪽 항목을 보존해 통합한다. 최종 파일 bytes로 공개 검수 해시를 기록하고 새 head의 검사를 확인한다.
- 이번에 새로 변경한 공통 지침·CI 설정은 없다. 기존 Confluence 개념 문서를 재사용하며 새로 확인한 실행 기록은 Jira와 원본 보고서에 연결한다.

### 남은 검증 범위

- 원래 CI에서 읽다 실패한 JSON 파일과 요청의 정확한 대응은 미확정이다.
- 수정 전 별도 클릭 URL 실패 2건은 정확한 완료 지연 원인까지 확정하지 않았다.
- 원격 CI·실기기·배포와 upstream 안정 릴리스 반영 여부는 별도 검증이 필요하다.

## Next

- 11-24에는 원격 CI·배포·실기기를 실행하지 않았다. 후속 검증에서도 같은 예산과 판정을 유지한다.
- 11-27 승인 범위의 공개 검수·작업별 커밋·푸시 후 PR CI와 보조 리뷰를 확인한다. 과거 로컬 결과를 새 head의 원격 성공으로 표시하지 않는다.
- 동일 오류 재발 시 timeout을 늘리지 않고 요청과 실패 파일을 먼저 연결한다.
