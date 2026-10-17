# 기존 포맷터·린터 기본 구성 개선

## Summary

2026-10-14에 feature/docs의 기존 Prettier·ESLint를 유지하면서 포맷 범위·기본값·CI 검사·중복 구성·로컬 캐시를 정리했다. 앱별 스타일과 부분 스테이징의 읽기 전용 검사를 보존했다. Oxfmt·Oxlint·Biome은 설치하지 않았고 전체 저장소 포맷도 실행하지 않았다.

## Changed

- 루트 `.prettierrc.json`에 기존 Prettier 기본 출력 옵션을 명시했다. docs·백엔드 설정은 변경하지 않았다.
- 전체 write와 check는 같은 `.` 범위를 사용하며 변경 커밋용 `format:changed:check`를 추가했다.
- snapshot checker의 경로·ignore를 전달된 저장소 cwd 기준으로 해석하고 `.gitignore`와 `.prettierignore`를 함께 적용한다. staged/HEAD blob을 읽으며 작업 파일·인덱스를 수정하지 않는다.
- Documentation CI에 비교 기준 커밋의 포맷 검사를 연결했다. 과거 전체 파일을 재포맷하지 않고 변경분만 검사한다.
- 공용 Next/React ESLint에서 base에 이미 있는 JS/TS recommended의 재추가를 제거했다.
- 7개 lint 스크립트에 content 기반 패키지별 캐시를 추가했다. warning gate와 기존 파일 범위는 유지했다. 캐시는 Git/포맷 대상에서 제외한다.
- 회귀 테스트와 [품질 검사 정책](../../process/documentation-quality-gates.md)을 갱신했다.

## Notes

- 수정 전후 대표 ESLint 경로 7곳의 effective rules·globals·settings·plugin 목록 및 샘플 진단 hash가 일치했다. docs 로직·헤더, docs-backend, vuln-radar-backend, vuln-radar, 공용 UI·API를 확인했다. 모든 파일의 동작 등가성을 증명하는 것은 아니다.
- 최종 `mise exec -- pnpm test:repo`: 37개 통과, 실패·skip 없음. 새 tooling 회귀 테스트 10개와 기존 부분 스테이징 검사를 포함한다.
- 중간 cache 테스트는 기존 `only-warn` 때문에 오류 개수 기대값이 맞지 않아 한 번 실패했다. 기존 severity 정책을 바꾸지 않고 진단 존재·규칙명·규칙 off 후 진단 소멸을 확인하도록 보완해 최종 통과했다.
- `mise exec -- pnpm format:changed:check --base HEAD~1`: 통과. 기존 마지막 커밋을 대상으로 CLI와 committed blob 검사 연결을 확인했다. 아직 이번 미커밋 변경의 원격 CI 결과는 아니다.
- `mise exec -- pnpm format:changed:check --base origin/main`도 통과했다. 기존 로컬 origin/main ref를 사용했고 이번 작업에서 fetch하지 않았다.
- `mise exec -- pnpm lint`: 실제 task 7개 모두 통과, Turbo 7.182초, task cache hit 0. 속도 비교 benchmark가 아니며 해당 장비·작업 트리의 한 번 실행이다.
- `mise exec -- pnpm --filter docs-backend lint` 재실행도 통과했다. CLI와 회귀 테스트로 캐시 동작을 확인했으며 속도 개선 배율을 주장하지 않는다.
- 수정한 지원 형식 파일 16개에 대한 명시적 Prettier check 및 `checkFormat` 검사, 대상 문서 구조·링크 검사, `git diff --check`가 통과했다.
- 읽기 전용 `pnpm format:check`는 기존·별도 작업 파일 42개 경고로 실패했다. `.vscode/settings.json`, docs YAML 설정, data-wip MDX와 미커밋 TCP 초안 등이 포함된다. 전체 write는 하지 않았고 기존 경고를 숨기기 위한 ignore도 추가하지 않았다. 새 검사 명령의 전역 통과와 이번 수정 파일의 통과를 구분한다.
- 기존 미커밋 글·렌더링·문서 작업을 보존했다. 이번 도구 파일만 포맷하며 커밋·푸시는 하지 않았다.
- 기존 도구·앱별 출력과 린트 의미를 유지하는 보완이므로 별도 엔진 교체 ADR은 작성하지 않았다. 참고 조사: [후보 비교](2026-10-14-formatter-linter-review.md).

## Open Questions

원격 CI 실행과 필수 상태 검사 지정은 커밋·푸시 후 확인해야 한다. ESLint 캐시는 로컬 파일 캐시만 도입했고 Actions cache 저장은 추가하지 않았다. 전체 파일의 legacy 포맷 정리는 별도 작업이다.

## Next

커밋 요청 시 이번 도구 변경만 분리하고 푸시 후 원격 CI를 확인한다. Oxfmt 출력·속도 비교와 Oxlint 진단 비교는 이후 별도 실험으로 진행한다.
