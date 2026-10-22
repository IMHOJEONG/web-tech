# 원격·로컬 문서의 canonical 분류 통일

## Summary

[KAN-29](https://web-tech-service.atlassian.net/browse/KAN-29)의 첫 과제인 원격 글 분류 불일치를 수정했다.
기준 HEAD는 `40fdf3893275fc3c3d4e747e199d0b63f9557616`, 작업 브랜치는 `codex/vuln-production-main`이다.
최초 구현은 로컬 검증까지 수행했다. 이후 사용자 승인으로 구현·브라우저 회귀·문서를 별도 커밋하며
푸시와 원격 CI 검증을 진행한다. 운영 배포·실제 토큰 및 DB 자격 증명 교체는 범위에 포함하지 않는다.

## Changed

- [공용 분류기](../../../apps/docs/lib/document-taxonomy.ts)로 section과 channel의 중복 규칙을 정리했다.
  canonical `markdownPath`와 `href`를 저장용 `fileName`보다 우선하고 기존 로컬 경로도 처리한다.
- 두 원격 검색 진입점, 로컬 검색 인덱스, 채널 허브, Feed·랜딩 판별을 연결했다.
  `web/…`·`ui-ux/…`·`mobile/…`가 각각 Web·UI/UX·Mobile로 분류된다.
- `/docs`에 Mobile 필터·요약과 ko/en 문구를 추가했다. Web 허브의 중복 카테고리 조회는 제거하고
  이미 병합된 인덱스를 사용해 원격 우선·route별 한 항목 정책을 유지했다.
- 관련 글은 이미 canonical URL로 세부 카테고리 점수를 계산하므로 알고리즘을 변경하지 않았다.
  로컬 alias·원격 경로 일치, 저장용 이름과 canonical 경로가 다른 경우를 회귀 검사했다.
- [라우팅 정책](../../architecture/docs-content-routing-policy.md#classification-contract)과
  [TODO](../../todo/todo.md#2026-10-22-블로그-재점검)를 갱신했다. URL·콘텐츠 게시 상태·backend 계약은 그대로다.

## Notes

환경은 2026-10-22 KST, macOS, Node 24.12.0, pnpm 12.14.0이다. 저장소 루트에서 실행한다.

```bash
mise exec -- pnpm --filter @web-tech/ui build
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter docs exec playwright test \
  --config=playwright.article.config.ts \
  article-e2e/document-taxonomy.spec.ts article-e2e/content-publication.spec.ts
```

- 수정 전 집중 검사에서 **22개 중 15개 실패**를 확인했다. canonical 분류·필터·허브 누락을 재현했다.
  테스트 작성 중 route 계약에 맞지 않는 fixture와 Node alias import 문제를 먼저 고쳤으며 이를 제품 결함 수에 포함하지 않았다.
- 수정 후 전체 라이브러리·모델 검사 **285/285 통과**, Node 테스트 타입 검사와 앱 타입 검사 통과.
  변경 TS/TSX 파일만 대상으로 한 ESLint `--max-warnings 0` 검사도 통과했다.
- Production 빌드를 포함한 Chromium **8/8 통과**: ko/en × 모바일 390×844·데스크톱 1280×800의
  신규 분류 검사 4개와 기존 게시·캐시 갱신 검사 4개다.
  세 canonical 채널을 검색 목록에서 찾고 section 필터·각 허브에서 노출을 확인했으며 로컬 Web 문서도 남아 있음을 검사했다.
- 혼합 목록 통합 검사는 실제 검색·원격 정규화·허브 모듈을 esbuild로 묶고 transport와 로컬 인덱스만 fixture로 바꾼다.
  같은 route의 로컬·원격 사본은 원격 한 개만 남고 draft는 제외되며 Feed의 명시적 topicLabel도 보존된다.
- 브라우저 검사는 loopback fixture 서버와 합성 토큰만 사용한다. 실제 NAS·Vercel·운영 비밀값을 읽거나 교체하지 않았다.
  이 spec은 기존 `test:article:prod`의 파일 패턴에 포함되지만 원격 CI는 아직 실행하지 않았다.

검사 과정에서 공용 UI 산출물이 없거나 다시 빌드 중인 시점에 타입 검사가 중단됐다. UI 빌드가 끝난 뒤 다시 통과했다.
첫 전체 검사에서 새 관련 글 fixture의 카테고리 깊이 기대값을 바로잡았고, 기존 80ms deadline 테스트도 한 번 실패했다.
최종 전체 검사는 시간 제한이나 기존 테스트를 완화하지 않고 285개 모두 통과했다.

브라우저 fixture의 새 본문 endpoint를 빠뜨려 prefetch가 404를 받은 초기 실행을 보완했다.
최종 실행에서는 이 404가 없고 브라우저 오류 수집은 비어 있었다. 마지막 8개 실행에서 기존
`destination stream closed early` 서버 로그가 26회 남았고 TCP 공개 글의 placeholder 스타일 경고도 남아 있다.
테스트 성공만으로 로그를 정상 취소라고 단정하거나 장애 원인이
해결됐다고 표시하지 않는다. 이번 범위는 문서 분류이며 스트림 원인 추가 조사는 별도다.

문서 delta 검사·상대 링크 검사와 변경 파일 포맷 검사를 수행했다. 문서 검사는 작업 트리 뷰를 기존 `validate` 함수에
전달해 실제 Git 인덱스를 바꾸지 않았다. 다른 작업 트리 9개의 HEAD·변경 해시와 stash·백업 참조는 전후 동일했다.

Jira의 기존 KAN-29 댓글 `10018`과 Confluence 운영 안내 `65817` v61을 읽고 원문을 보존한 후속 기록을 준비했다.
댓글 수정·Confluence 갱신 요청에서 `Connection failed`·MCP 내부 오류가 발생했고 재조회도 실패했다.
저장 여부는 미확정이므로 외부 기록 갱신을 완료로 표시하지 않는다. 연결 복구 후 먼저 재조회해 중복 없이 반영해야 한다.

### 커밋 분리와 후속 확인

- 분류 구현·유닛 및 통합 회귀: `6f6974e0f52d1e5e38922ef58eadafc4cc89d651`.
- 합성 서버·브라우저 회귀: `3f8bf5efba8708f9f4a65594dc0f9cc238c9a551`.
- 커밋 전 전체 라이브러리 검사 285개를 다시 통과했고 format·문서·commitlint 훅도 통과했다.
- Jira 댓글 `10018`과 Confluence v61 재조회가 복구됐으며 앞선 갱신이 저장되지 않았음을 확인했다.
  원문 보존 상태로 커밋·원격 검사 링크를 추가한 뒤 다시 읽어 저장을 확인한다.
- 현재 브랜치는 push만으로 CI가 실행되지 않는다. CI는 main·feature/docs push 또는 PR 이벤트에서 실행하므로
  원격 SHA 확인과 별도로 PR 기반 실행을 확인해야 한다.

### CI용 블로그 브랜치 분리

기존 `codex/vuln-production-main`에 위 세 커밋을 일반 push했고 원격 head `fbfb377` 일치를 확인했다.
이 브랜치에는 이번 블로그 수정과 별개인 KAN-27 운영 전환·KAN-28 자격 증명 계획이 있어
main `4e61767`에서 `codex/docs-canonical-taxonomy-kan29`를 새로 만들어 블로그 관련 커밋만 옮겼다.
기존 브랜치를 재작성하거나 운영 문서를 버리지 않았다.

| 대상                     | 기존 원격 커밋 | 블로그 전용 커밋                           |
| ------------------------ | -------------- | ------------------------------------------ |
| 선행 점검·TODO           | `40fdf38`      | `eb787134dd56e6cc67c5bed218ba29e26a4f96c2` |
| 분류 수정·유닛/통합 회귀 | `6f6974e`      | `a4fe3625862ea8d1a623a1a551fa2275cc98d86c` |
| 브라우저 회귀            | `3f8bf5e`      | `1afde17130c3b9a088ebfccfdf08b63de445f362` |
| 정책·작업 기록           | `fbfb377`      | `ea4d45b9e73cc55f9a66a6419e6917800aae5bf4` |

선행 점검의 월별 README에서만 충돌이 발생했다. main 목차와 블로그 링크를 유지하고, 이번 PR에 없는
두 운영 문서의 링크는 넣지 않았다. 앱 전체 및 두 worklog·정책·TODO의 파일 내용이 기존 원격 브랜치와
동일함을 `git diff --quiet`로 확인한 뒤 main 대비 문서·포맷 검사를 다시 통과했다.

Jira 댓글 `10018`은 기존 표를 보존한 실제 3열 후속 표로 갱신·재조회했고, Confluence 운영 안내 v62도
기존 본문 보존과 새 커밋 링크를 확인했다. 앞선 연결 오류 기록은 당시 이력이다.
원격 CI는 새 PR의 실행 ID·head SHA·각 job 결과를 확인한 뒤 같은 Jira 표와 Confluence에 기록한다.
이 문서는 시점별 증거이며 이후 PR 상태를 자동으로 실시간 복제하지 않는다.

### PR #57 초기 원격 검사와 CodeQL 보완

[Draft PR #57](https://github.com/IMHOJEONG/web-tech/pull/57)을 생성해 head `327963e`에서
[CI](https://github.com/IMHOJEONG/web-tech/actions/runs/39746166816)와
[Documentation](https://github.com/IMHOJEONG/web-tech/actions/runs/39746166680)이 성공했다.
하지만 CodeQL 분석 job의 성공과 별개로 종합 security check는 신규 High 1개·Medium 2개 때문에 실패했다.

- [경고 39](https://github.com/IMHOJEONG/web-tech/security/code-scanning/39), `js/reflected-xss`:
  합성 서버가 요청 URL의 정규식 capture를 HTML에 넣었다. 실제 허용값은 세 문자열뿐이지만
  요청에서 응답으로 이어지는 흐름이 경고 대상이었다. 요청 값을 보간하지 않고 고정 경로→고정 HTML의 Map에서 선택하도록 바꿨다.
- [경고 40](https://github.com/IMHOJEONG/web-tech/security/code-scanning/40)·
  [41](https://github.com/IMHOJEONG/web-tech/security/code-scanning/41), `js/bad-code-sanitization`:
  fixture를 `JSON.stringify`로 소스 코드에 넣었다. esbuild 외부 모듈과 `require` 바인딩에 실제 객체·함수를
  주입하도록 바꿔 데이터의 코드 문자열 생성을 제거했다. 로컬 앱 모듈을 묶어 실행한다는 테스트 의도는 유지한다.
- 정적 허용 경로 세 개의 본문·Content-Type, 미인증 401, 미등록 경로와 script payload 경로의 404·입력 비반사를 회귀 검사한다.
  CodeQL 경고를 dismiss하거나 검사 규칙을 완화하지 않았다. NAS나 운영 서비스에서 XSS 악용이 재현됐다는 뜻은 아니다.

보완 후 집중 분류 검사 30개와 Production 빌드·브라우저 검사 10개가 통과했다.
브라우저 10개는 기존 8개와 화면 프로젝트별 합성 서버 경계 검사 2개다. 전체 라이브러리와 타입 검사도 다시 실행한다.
같은 PR에 별도 보완 커밋을 push한 뒤 새 head의 CodeQL 경고 해소와 CI 결과를 확인한다.

## Open Questions

- 원격 본문 검색 계약과 응답 byte budget은 기존 [개선 후보](2026-10-22-docs-improvement-recheck.md)로 남긴다.
- 운영 환경의 실제 영향 문서 수, NAS 콘텐츠, Safari·Firefox·실기기는 검사하지 않았다.

## Next

- 블로그 전용 브랜치를 푸시하고 같은 head의 PR CI 결과를 기존 Jira 검증 표·Confluence에 연결한다.
  main 병합·운영 배포는 이번 요청의 대상이 아니다.
- 배포 후 실제 원격 글이 세 허브와 `/docs` 필터에서 같은 분류로 보이는지 점검한다.
