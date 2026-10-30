# 공개 Git·블로그 업로드 검수

## 목적과 준비 조건

공개 Git 저장소, 블로그 화면, NAS authoring 저장소를 서로 다른 공개 경계로 취급한다. `status: draft`, `package.json`의 `private: true`, `.gitignore`는 공개 Git에 들어간 자료를 숨기지 않는다. 이 절차와 검사는 로컬 구현 단계이며 main·NAS에서 이미 강제된 상태가 아니다.

Node.js 24.22.1·pnpm 12.14.0, Git 및 루트 의존성이 필요하다. 실제 비밀값을 채팅·PR·Jira·Confluence·로그에 붙이지 않는다. 로컬 훅은 설치 후 적용되며, 서버에서 우회 불가능한 pre-receive 훅이나 사람 인증 장치가 아니다.

| 분류                    | 기본 위치·공개 기준                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| 비밀정보                | password manager, 플랫폼 secret, NAS의 저장소 밖 제한 파일. 실제 값은 공개 검수로 허용하지 않음            |
| 비공개 초안·원시 데이터 | 저장소 밖 소유자 전용 authoring/실험 공간. 로그·실제 API 응답·DB dump·HAR·pcap·trace·원본 캡처·녹화본 포함 |
| 재현 코드·합성 fixture  | 재현 코드 공개 가능. 데이터 fixture는 실서비스/실사용자 값이 아닌지 직접 검수 후 허용                      |
| 정제된 증거             | 필요한 집계·조건·실패/한계만 새 파일로 작성. 원시 파일을 이름만 바꾸거나 확장자만 바꿔 허용하지 않음       |
| 공개 글·에셋            | 사용자 검토·명시적 공개 승인 후 공개 위치에 복사. 실제 bytes와 검수 SHA-256 일치 필요                      |

`.private/`, `private/`, `secrets/`, `raw-data/`, `recordings/` 등은 실수 방지용 ignore·검사 차단 대상이다. 이 경로를 비밀 저장소로 쓰라는 뜻은 아니다. OS 권한·암호화·별도 백업은 실제 보관소에서 관리한다.

## 실행 순서

1. **밖에서 작성:** 비공개 글과 실험은 공개 checkout 밖에서 진행한다. 승인 전 초안을 Git에 넣거나 preview 배포하지 않는다. 기존 추적 자료를 이 작업에서 자동 삭제·이동하지 않는다.
2. **공개본 분리:** 공개할 내용만 새 파일로 복사하고 식별정보·내부 주소·인증 헤더·개인 경로·signed URL·실제 사용자 데이터와 메타데이터를 제거한다. 결론을 바꾸는 익명화는 하지 않고 표본·실패·한계를 남긴다.
3. **사람 검수:** 아래 체크를 직접 확인하고 사용자에게 파일별 공개 범위를 확인받는다. 에이전트가 “안전해 보인다”는 이유만으로 실제 승인 항목을 작성하지 않는다.
4. **해시 기록:** 승인된 최종 파일을 stage하고 인덱스 bytes의 SHA-256을 계산한다. `.publication-review.json`에 대응 항목을 추가하고 함께 stage한다. 이후 내용 변경은 재검수한다. 명령·예시만으로 승인이 생기지는 않는다.
5. **로컬 검사:** 다음 명령을 실행한다. 검사 실패는 자동 마스킹·파일 삭제·승인 자동 생성으로 숨기지 않는다. 글의 기존 frontmatter/본문 검사와 코드 실행 검증도 유지한다.
6. **푸시·리뷰:** 실제 전송 커밋도 검사하고 PR의 공개 체크리스트를 완료한다. CI는 공개 업로드 후의 탐지 단계이므로 푸시 전 검사를 대체하지 않는다.

```sh
# 새 설정을 검토한 후 해당 checkout에 훅 설치/갱신
pnpm exec simple-git-hooks
pnpm publication:staged
pnpm format:staged:check
pnpm validate:docs --staged
pnpm --filter docs validate:content

# 실제 푸시 시 pre-push가 Git의 ref 입력을 받아 검사한다.
# 수동 커밋 범위 검사는 유효한 commit SHA/ref를 지정한다.
pnpm publication:check --base origin/main
```

commit-msg 훅도 메시지의 대표 비밀 패턴을 검사한 뒤 기존 commitlint를 실행한다. 푸시 범위 검사에서는 변경 blob뿐 아니라 커밋 메시지·ref 이름·annotated tag 객체의 설명문도 확인한다. 중첩 annotated tag는 각 태그 객체를 따라 검사하며, 새 커밋이 없는 태그도 예외가 아니다. 원격 검사는 커밋된 이력만 보며 아직 stage하지 않은 작업 파일까지 검수하지 않는다.

CI의 새 `main`/`feature/docs` ref에서 `before`가 40자리 zero이면 publication 검사는 도입 기준 커밋부터 실행한다. 포맷·문서 delta 검사만 별도로 생성한 빈 tree 객체를 사용한다. publication 검사에 tree를 commit인 것처럼 전달하거나 모든 과거 이력을 자동 승인하지 않는다. 도입 기준의 Git 객체·조상 관계가 확인되지 않으면 실패하며 최대 1,000개 커밋 제한은 유지한다.

일반 `--base`와 기존 remote ref의 pre-push도 기준 커밋이 새 head의 조상이어야 한다. 같은 커밋은 허용하지만, 뒤로 이동하거나 갈라진 이력을 빈 범위 성공으로 처리하지 않는다. 검수 실패를 해결하려고 강제 push나 기준 생략을 하지 말고 이력·승인 범위를 다시 검토한다.

검수 항목의 모양은 아래와 같다. 해시와 설명은 예시이며 실제 공개 승인 자료가 아니다. 실제 항목은 사용자가 승인한 파일만 작성한다. 검수일은 실제 확인 날짜, 설명에는 무엇을 익명화/직접 확인했는지 적고 사람의 이름·비밀값은 적지 않는다.

```json
{
  "version": 1,
  "entries": [
    {
      "path": "apps/docs/category/web/my-post.mdx",
      "sha256": "0000000000000000000000000000000000000000000000000000000000000000",
      "kind": "article",
      "decision": "public-approved",
      "reviewedOn": "2026-10-30",
      "note": "예시만 제공. 실제 사용자 승인과 검수 내용을 적습니다.",
      "checks": {
        "secrets": true,
        "personalData": true,
        "rights": true,
        "publicIntent": true
      }
    }
  ]
}
```

`kind`는 `article`, `asset`, `document`, `sanitized-evidence`, `synthetic-fixture`다. 검사 대상은 docs의 `data/category` Markdown, `apps/docs/public/` 전체, `docs/`의 Markdown(목차·운영 문서·검증 보고서·작업 기록 포함), 정제 artifact, 데이터 fixture와 비텍스트 파일이다.

데이터 fixture의 자동 분류 위치는 다음과 같이 한정한다. JS/TS 실행 소스(`js/jsx/mjs/cjs/ts/tsx/mts/cts`)는 이 데이터 분류에서 제외하지만 대표 비밀 패턴 검사는 그대로 적용한다. 글·공개 에셋·운영 Markdown·정제 증거의 분류가 먼저 적용되는 경로는 해당 종류의 검수 기록을 사용한다.

- 경로의 디렉터리 중 `fixtures`, `test-data`, `experiment-data`가 있는 비소스 파일.
- `test`, `tests`, `e2e`, 소문자 영문/숫자/하이픈의 `*-e2e` 디렉터리 아래에 있는 `data/`의 비소스 파일. 중간 디렉터리가 있어도 포함한다.
- 예: `apps/docs/e2e/data/input.json`, `apps/docs/article-e2e/data/input.csv`, `apps/docs/e2e/scenarios/data/input.yaml`, `apps/docs-backend/test/data/input.json`, `packages/ui/tests/data/input.txt`.

모든 JSON·텍스트를 fixture라고 간주하지는 않는다. `apps/docs/tsconfig.activity-e2e.json`, `apps/vuln-radar-backend/test/jest-e2e.json` 같은 일반 설정은 위 위치에 없으면 fixture 해시를 요구하지 않는다. 다른 위치의 데이터가 자동으로 안전해지는 것은 아니다. 새 fixture 위치를 채택할 때 검사기·이 목록·회귀를 함께 갱신하고, 실제 응답/개인 데이터를 설정 파일이나 코드로 위장하지 않는다.

예를 들어 다음 명령은 Git에 stage된 공개본의 해시만 표시한다.

```sh
git show ':apps/docs/category/web/my-post.mdx' | shasum -a 256
```

수동 체크리스트:

- [ ] 초안/원시 자료가 아니라 사용자가 공개를 승인한 최종 내용인가?
- [ ] 실제 토큰·비밀번호·쿠키·연결 문자열·서명 URL·비공개 실험 경로가 없는가?
- [ ] 로그·캡처의 이름·이메일·내부 IP·식별자·브라우저 탭·화면 속 QR·EXIF도 확인했는가?
- [ ] fixture는 실제 응답을 복제한 것이 아닌 합성 데이터인가? 실제 관측과 구분했는가?
- [ ] 공개 그림·영상·첨부 파일을 직접 열어 확인하고 출처·권리·라이선스를 확인했는가?
- [ ] 외부 URL·NAS asset 경로의 응답 자체도 공개 가능한가? HTML만 가렸다고 안전한 것으로 보지 않았는가?
- [ ] 공개 내용의 bytes와 승인 해시가 같으며 이후 수정이 없었는가?

## 기대 결과

- 인덱스 또는 각 검사 커밋의 **전체 변경 blob**을 검사하며 작업 트리의 다른 bytes로 바꿔 통과시키지 않는다. 중간 커밋에서 추가 후 삭제한 자료도 범위 검사에서 차단한다.
- env 실값 파일·키/캡처/압축 파일·비공개 경로, 대표 토큰/credential 패턴·private 표시·변경된 미게시 글·비정상 Git 모드를 차단한다. 승인 항목으로 면제하지 않는다.
- 글·에셋·운영 문서·정제 증거·데이터 fixture의 검수 누락·해시/종류 불일치·불완전 manifest는 실패한다. 새 원격 ref는 도입 기준 이후의 커밋을 검사한다. 과거 이력과 기존 미변경 파일의 안전성을 보장하지 않는다.
- 출력의 `fileId`는 경로 문자열의 SHA-256이며 검출된 값·원문·파일명을 출력하지 않는다. 대상 확인은 로컬의 stage 파일 목록과 경로 해시를 대조한다. 이 출력은 원시 파일을 외부에 올릴 근거가 아니다.
- 글의 사이트 게시 상태는 기존 `published` 계약을 그대로 사용한다. 공개 검수는 기술 정확성·접근성·저작권·실제 사용자 승인까지 기계적으로 입증하는 장치가 아니다.

### CI 증거와 NAS 경계

공개 저장소의 GitHub Actions artifact는 소유자만 보는 저장소가 아니다. offline 테스트·trace 생성 및 로컬 검사는 유지하되 업로드는 기본 비활성화한다. 별도 검수한 **합성 fixture 결과만** 공개할 때 `DOCS_ALLOW_PUBLIC_SYNTHETIC_EVIDENCE=true`를 관리자가 명시적으로 설정한다. 이 변수는 비공개 업로드 모드가 아니다. 이번 작업에서 원격 변수를 만들거나 활성화하지 않았다.

공개 CI에는 운영 토큰·실제 사용자 데이터·개인 실험 원본을 주입하지 않는다. Actions 로그도 공개 범위로 보고 테스트 오류에 fixture 원문을 무분별하게 출력하지 않는다. 업로드 비활성화만으로 콘솔 로그가 비공개가 되는 것은 아니다.

비공개 증거는 접근 제어된 별도 보관소를 사용하고 공개 PR에는 정제 요약만 남긴다. 다른 CI artifact, Git LFS·release 첨부·컨테이너 layer·NAS 이미지/asset 서버도 별도 공개 경계다. 이 검사만으로 이 모든 채널을 통제하지 않는다.

NAS는 비공개 authoring → 검수된 공개본만 content/assets mount로 승격 → API 확인 → 웹훅 순서를 따른다. **현재 NestJS API에는 이 Git manifest 검수가 연결되지 않았다.** `published`만으로 검수 완료를 추정하지 않으며, NAS 자동 승격 검사는 후속 작업으로 남긴다. 기존 NAS 볼륨·글·자격 증명은 수정하지 않는다.

## 실패 대응과 복구

원본 bytes는 먼저 비공개 보관하고 공개본을 고친다. stage된 수정·승인 기록도 재확인한다. `--no-verify`나 CI 비활성화로 해결하지 않는다. 검토할 수 없는 binary·미지의 형식·8MiB 초과 파일은 실패하며, 별도 매체 정책을 결정하기 전 임의 예외를 만들지 않는다. 암호화·Base64·압축·이미지 속 비밀과 일반 개인정보는 자동 탐지가 보장되지 않는다.

이미 공개한 비밀은 파일 삭제나 draft 전환으로 회수되지 않는다. [토큰 관리 정책](../architecture/docs-secret-token-lifecycle-policy.md)에 따라 폐기·회전하고 캐시·mirror·artifact·Git 이력을 별도 점검한다. 이력 재작성·백업 삭제·실제 토큰 회전은 별도 승인으로 수행한다.

로컬 훅과 JSON은 동일 관리자 권한으로 우회·수정할 수 있다. 사람의 인증된 승인, 보호 브랜치, AI 권한 분리는 별도 KAN-33 과제이며 이번 구현만으로 완료되지 않는다. 기존 전체 이력은 전수 감사하지 않았다. 도입 전 자료를 일괄 공개 승인하거나 자동 삭제하지 않는다.

## 관련 검증

- [작업·로컬 검사 결과](../worklog/2026-10/2026-10-30-publication-boundary.md)
- [ADR-0025](../architecture/adr-0025-publication-boundary.md)
- [GitHub artifact 접근 조건](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts)
- [GitHub secret scanning 탐지 범위와 한계](https://docs.github.com/en/code-security/reference/secret-security/secret-scanning-scope)
