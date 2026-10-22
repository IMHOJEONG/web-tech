# 블로그 개선 후보 재점검

## Summary

문서별 커밋·푸시 후 블로그 개선 후보를 다시 점검해
[KAN-29](https://web-tech-service.atlassian.net/browse/KAN-29)와 [TODO](../../todo/todo.md#2026-10-22-블로그-재점검)에 연결했다.
앱 코드 기준은 main `4e61767`이며 문서 브랜치의 선행 두 커밋은 앱 코드를 변경하지 않는다.
이번 점검은 구현·배포·실제 자격 증명 교체가 아니다.

## Changed

- P1: 원격 canonical 경로와 로컬 디렉터리를 공통 분류기로 정리할 필요를 확인했다.
- P1 제품 계약: 원격 metadata-only 인덱스와 원격 우선 중복 제거가 본문 검색 범위를 줄이는 동작을 확인했다.
- P2: 원격 응답의 시간 제한과 별개로 byte budget이 필요하다.
- 새 UI 기능보다 현재 탐색 계약의 일치를 먼저 검증하도록 TODO에 순서와 완료 조건을 추가했다.
  앱 코드·공개 글·draft·기존 보류 과제 상태는 변경하지 않았다.

## Notes

### 실행과 관측

```bash
mise exec -- pnpm --filter @web-tech/docs-content-contract build
mise exec -- pnpm --filter docs exec node --experimental-strip-types --test \
  lib/content-api-request.test.ts lib/local-search-index.test.ts \
  widgets/docs-index/model/docs-index-controls.test.ts
mise exec -- node --experimental-strip-types /private/tmp/docs-improvement-review-20261022.mts
```

기존 집중 테스트는 **16/16 통과**했다. 이 성공은 아래 경계까지 정상이라는 뜻이 아니다.
마지막 명령은 이번에 만든 임시 진단 하네스이며 저장소의 지속 테스트 명령은 아니다.
기존 `content-api-resilience.test.ts`와 같은 esbuild 방식으로 실제 앱 모듈을 묶고,
local index·원격 transport만 fixture로 대체했다. 실제 NAS·Vercel·외부 HTTP와 비밀값을 사용하지 않았다.

| 관측                | 결과                                                                            | 의미                                                                         |
| ------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| canonical 경로 분류 | `web/probe`, `ui-ux/probe`, `mobile/probe` 모두 section=`Docs`, channel=`other` | 경로 override 없는 정상 원격 문서는 해당 허브·필터에서 누락될 수 있음        |
| Web 필터            | `web/probe`를 Web 조건에 넣으면 0개                                             | 필터는 정확한 section 값으로 비교하므로 상위 분류 오류가 전파됨              |
| 본문 전용 검색어    | 같은 route의 local-only 1개, remote-preferred 0개                               | remote inline content가 있어도 목록 metadata 정규화에서 content가 빈 값이 됨 |
| 원격 인덱스         | mock 요청 2회, 선택된 원격 문서 content 길이 0                                  | 본문 조회를 몰래 추가하지 않고 현재 인덱스 경로를 검사                       |
| 응답 크기           | mock 8,388,608 byte 수락                                                        | deadline만으로 빠른 대형 응답의 메모리 사용을 제한하지 못함                  |

초기 임시 하네스는 모든 fetch를 metadata fixture로 덮어써 크기 검사 기대값이 실패했다.
호출별 fetch override를 보존하도록 하네스만 수정한 뒤 위 결과를 다시 확인했다. 앱 결함으로 오인하지 않는다.

### 코드 근거와 개선 범위

- [분류](../../../apps/docs/lib/local-search-index.ts)의 `inferSearchSection`은 로컬 경로만 처리한다.
  [channel](../../../apps/docs/lib/get-doc-channel.ts)은 `/mobile/` 등의 중간 경로를 검사해
  선행 slash 없는 canonical 경로를 놓친다.
- [검색](../../../apps/docs/lib/get-search-data.ts)의 `normalizeRemoteSearchDoc`은 같은 section 분류를 쓰고,
  `mergeSearchDocs`는 원격 문서를 먼저 선택한다. [정규화](../../../apps/docs/lib/content-api-normalize.ts)의
  `normalizeRemotePostMeta`는 `content: ''`를 반환한다. metadata-only는 현재 설계이며, 원격 본문 검색을
  지원할지는 [검색 정책](../../architecture/docs-search-experience-policy.md)과 함께 결정해야 한다.
- [응답 읽기](../../../apps/docs/lib/content-api-request.ts)는 chunk를 누적하지만 byte 상한이 없다.
  크기 상한·오류 종류·로컬 대체를 함께 추가할 후보이며 무제한 재시도 도입과는 별개다.

운영 문서별 영향 수·실제 장애·메모리 소진을 재현하지 않았다. 전체 빌드·전체 E2E·브라우저 화면·실기기는
이번에 실행하지 않았다. NAS SSH와 외부 백업 보류는 재개하지 않았으며 오프라인·캐시·검색 기능을
미구현으로 되돌려 표시하지 않았다. 구조 변경은 미실행이므로 새로운 ADR은 만들지 않았다.

### 문서 커밋 보존

- 운영 전환 기록: `c8ca1cc766fda8d457edc52c16769ed27b48a26f`.
- Railway 교체 계획: `36657f582259b206ad0b65c00eb041d2383748a6`.
- 두 커밋을 `origin/codex/vuln-production-main`에 푸시하고 원격 SHA 일치를 확인했다.
- 첫 커밋은 공유 node_modules 링크 때문에 pnpm 자동 설치 경고가 있었지만 format·문서·commitlint 훅은 통과했다.
  이후 이 작업 트리에만 frozen/offline/ignore-scripts 설치를 수행했고 두 번째 커밋의 훅은 경고 없이 통과했다.
  의존성 정책·lockfile·검사 훅을 완화하지 않았다.

## Open Questions

- 원격 검색용 텍스트를 backend 계약으로 제공할지 metadata-only를 명시할지 결정이 필요하다.
- 목록·본문 byte budget은 실제 콘텐츠 크기 분포를 확인해 정해야 한다.
- 분류 수정은 검색·허브·관련 글에서 현재 분산된 규칙을 어디까지 공유할지 정한 뒤 수행한다.

## Next

1. 분류 공통화부터 별도 코드 변경과 회귀 테스트로 진행한다. 이번 요청은 점검이므로 구현하지 않았다.
2. 원격 인덱스 계약은 원격 우선 정책을 유지하면서 검색 정확성과 갱신 비용을 비교한다.
3. byte 상한과 취소·로컬 대체 검증을 추가한다.
4. 결과를 [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)에
   연결하고 계획·로컬 재현·실제 운영 검증을 구분한다.
