# 최신 main의 ADR 관리 점검

## 대상과 조건

- 점검일: 2026-10-27 KST.
- 기준: `origin/main`의 `e8ab3bd6bc6c0f6ee890b05fa244cf9d040dc16e`. 원격 참조만 fetch하고 브랜치·작업 트리의 코드는 전환하지 않았다.
- 당시 checkout은 `codex/squash-merge-preflight`, `61a778c5d7b083aec8bfd671c65523494921d5c9`였다. 이 브랜치의 ADR 15개를 최신 전체로 오인하지 않고 Git blob으로 main의 20개를 읽었다.
- 대상은 ADR 상태·대체 관계·목차·개발 결정의 추적과 관련 코드다. 앱 전체 실행·보안 감사나 운영 환경 재검증이 아니다.
- 추적: [KAN-39](https://web-tech-service.atlassian.net/browse/KAN-39), [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817).
- 결론: 작성 체계는 작동하지만, 결정의 후속 관계와 병합 이후 현재 상태를 유지하는 과정은 보완이 필요하다. 점검 결과만 기록했으며 기존 결정이나 제품 코드를 수정하지 않았다.

## 재현 방법

기존 저장소에서 실행한다. `git show`는 현재 브랜치를 바꾸지 않고 지정한 커밋의 내용을 읽는다.

```sh
git fetch origin main
git rev-parse HEAD origin/main
git ls-tree -r --name-only e8ab3bd6 -- docs/architecture
git show e8ab3bd6:docs/process/adr-management.md
git show e8ab3bd6:docs/architecture/README.md
git show e8ab3bd6:docs/architecture/adr-0009-docs-web-push-experiment.md
git show e8ab3bd6:docs/architecture/adr-0015-explicit-offline-article-snapshots.md
git show e8ab3bd6:apps/docs/public/push-sw.js
git show e8ab3bd6:apps/docs/public/offline-worker.js
git show e8ab3bd6:apps/docs/feature/offline/model/offline-snapshot.ts
git show e8ab3bd6:docs/architecture/vuln-radar-viteplus-experiment.md
git show e8ab3bd6:apps/vuln-radar/package.json
git show --stat d0b25a5 -- docs/architecture apps/vuln-radar/package.json
```

한글 입력 한도 차이는 다음 메모리 연산으로 재현했다. 실제 DOM 변환·저장 성공을 검사한 것이 아니라 현재 초기 조건의 측정 단위를 분리해서 확인한 것이다.

```sh
node -e 'const s="<p>"+"가".repeat(400000)+"</p>"; console.log({codeUnits:s.length,utf8Bytes:Buffer.byteLength(s,"utf8"),limitBytes:1024*1024,passesCurrentGuard:s.length<=1024*1024})'
```

전체 ADR 파일명을 집계하고 번호 중복, 목차 포함, 상대 파일 링크의 존재, 결정일·검토일의 유효성을 Node 메모리 검사로 확인했다. `scripts/check-documentation.mjs`의 `linkTargets`를 재사용했으며 링크 anchor나 외부 HTTP 응답은 검사하지 않았다. 동일 검사기의 `validate`에는 ADR 번호가 같은 두 개의 합성 문서와 ADR 규칙에 없는 `보류` 상태를 전달했다. 원본 파일·인덱스는 변경하지 않았다.

### 집계와 합성 입력 재실행

당시 일회성 검사 스크립트 원문은 보고서에 이관되지 않았다. 아래는 같은 기준 커밋과 입력 조건으로 재구성한 공개 재현 명령이다. 2026-10-29에 다시 실행해 아래 구조 집계와 오류 배열 `[]`를 대조했다. 과거 artifact를 이번 출력으로 덮어쓰지 않는다.

준비 조건은 Git, Node.js 24.22.1, 기준 커밋 `e8ab3bd6bc6c0f6ee890b05fa244cf9d040dc16e`의 Git 객체다. 저장소 루트에서 실행하며 객체가 없으면 먼저 `git fetch origin main`을 실행한다. 작업 트리를 전환하거나 파일·인덱스를 쓰지 않는다. 현재 checkout의 검사기가 아니라 **기준 커밋의 `linkTargets`와 `validate`**를 읽어 사용한다.

```bash
node --input-type=module <<'NODE'
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const ref = "e8ab3bd6bc6c0f6ee890b05fa244cf9d040dc16e";
const git = (...args) => execFileSync("git", args, {
  encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
});
const read = (file) => git("show", `${ref}:${file}`);
const dataUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const snapshotUrl = dataUrl(read("scripts/git-check-snapshot.mjs"));
const validator = read("scripts/check-documentation.mjs").replace(
  '"./git-check-snapshot.mjs"', JSON.stringify(snapshotUrl),
);
const { linkTargets, validate } = await import(dataUrl(validator));
const files = new Set(git("ls-tree", "-r", "--name-only", "-z", ref).split("\0").filter(Boolean));
const adrs = [...files].filter((file) => /^docs\/architecture\/adr-\d{4}-.+\.md$/.test(file));
const index = new Set(linkTargets("docs/architecture/README.md", read("docs/architecture/README.md")).map((link) => link.target));
const statuses = {}, ids = new Map();
const structuralChecks = {
  duplicateIds: [], missingIndexLinks: [], brokenRelativeFileLinks: [],
  invalidDecisionOrReviewDates: [], externalUrlsAndAnchors: "not-tested",
};
for (const file of adrs) {
  const body = read(file);
  const id = file.match(/adr-(\d{4})-/)[1];
  ids.set(id, (ids.get(id) ?? 0) + 1);
  const status = body.match(/^- 상태: (.+)$/m)?.[1].trim() ?? "missing";
  statuses[status] = (statuses[status] ?? 0) + 1;
  if (!index.has(file)) structuralChecks.missingIndexLinks.push(file);
  for (const link of linkTargets(file, body)) {
    const exists = link.target && (files.has(link.target) || [...files].some((f) => f.startsWith(`${link.target}/`)));
    if (link.error || !exists) structuralChecks.brokenRelativeFileLinks.push({ file, ...link });
  }
  for (const field of ["결정일", "최종 검토"]) {
    const date = body.match(new RegExp(`^- ${field}: (\\d{4}-\\d{2}-\\d{2})\\s*$`, "m"))?.[1];
    if (!date || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
      structuralChecks.invalidDecisionOrReviewDates.push({ file, field });
    }
  }
}
structuralChecks.duplicateIds = [...ids].filter(([, count]) => count > 1).map(([id]) => id);

const syntheticPaths = ["docs/architecture/adr-9999-one.md", "docs/architecture/adr-9999-two.md"];
const syntheticBody = `# ADR-9999: 합성 입력

## 상태와 범위
- 상태: 보류
- 대상: 문서 검사 재현
- 결정일: 2026-10-27
- 최종 검토: 2026-10-27

## 배경
합성 입력.
## 결정
합성 입력.
## 대안과 영향
합성 입력.
## 관련 문서
없음.
`;
const documents = new Map(syntheticPaths.map((file) => [file, syntheticBody]));
documents.set("docs/architecture/README.md", "# 합성 목차\n" + syntheticPaths.map((file) => `- [합성](${file.split("/").at(-1)})`).join("\n"));
const errors = validate({
  files: new Set(documents.keys()), oldFiles: new Set(),
  changes: [...documents.keys()].map((file) => ({ status: "A", file })),
  read: (file, before = false) => !before && documents.has(file) ? Buffer.from(documents.get(file)) : null,
});
const recorded = JSON.parse(readFileSync("docs/verification/artifacts/2026-10-27-adr-governance-audit.json", "utf8"));
assert.equal(adrs.length, recorded.adrCount);
assert.deepEqual(statuses, recorded.statuses);
assert.deepEqual(structuralChecks, recorded.structuralChecks);
assert.deepEqual(errors, []);
console.log(JSON.stringify({ ref, adrCount: adrs.length, statuses, structuralChecks, syntheticPaths, syntheticBody, errors }, null, 2));
NODE
```

기준 커밋에는 이 감사의 후속 artifact가 없으므로 마지막 대조용 집계 파일만 현재 checkout에서 읽는다. ADR 원문·목차·검사기는 모두 고정된 Git 객체에서 읽는다.

기대 결과는 ADR 20개·상태 17/1/2, 네 구조 오류 목록이 모두 빈 배열, 합성 `보류`·중복 `9999` 두 문서의 `validate` 결과 `[]`다. 마지막 결과는 현재 규칙의 **검출 공백을 재현하는 음성 대조군**이지 ADR 규칙 준수를 뜻하지 않는다. anchor·외부 HTTP와 대체 관계의 의미 대조는 이 명령의 검사 범위가 아니다.

## 결과와 증거

### 잘 유지되는 부분

| 항목                     | 결과                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------- |
| ADR 원본과 역할          | `docs/architecture/adr-NNNN-*.md`; 정책·절차·검증·작업 기록의 역할 구분 유지           |
| main의 문서 수·상태      | 20개: 적용 중 17, 제안 1, 대체됨 2                                                     |
| 중복 번호·목차 누락      | 각각 0건                                                                               |
| 내부 상대 파일 링크·날짜 | 깨진 파일 링크 0건, 유효하지 않은 결정일/검토일 0건                                    |
| 명시적 대체 관계         | 0001→0003, 0002→0004의 양방향 참조와 당시 본문 보존 확인                               |
| 부분 구현의 구분         | ADR-0008은 10-25 부분 검사 보강 후에도 전체 운영 판정 미완료를 이유로 제안 유지        |
| 공개 활성화 경계         | ADR-0010은 구현과 실제 WAF 검증을 구분하고 플래그 기본 비활성화를 명시                 |
| 최신 결정 분리           | 0019 본문 검색, 0020 목록 한도, 0021 HTML 한도를 별개 결정으로 기록하고 후속 링크 연결 |

ADR-0018이 main에 없는 사실만으로 번호 재사용이나 누락 결정을 확정하지 않는다. [KAN-31](https://web-tech-service.atlassian.net/browse/KAN-31)에 미병합 미디어 정책 제안이 따로 추적되고 있으며, 이 감사에서 미공개 초안 본문을 복제하지 않았다. 예약 번호를 main에서도 찾을 수 있게 하는 것은 후속 운영 개선 후보다.

### F1 · P2: 입력 크기 계약과 구현의 단위가 다름

[ADR-0015 25행](https://github.com/IMHOJEONG/web-tech/blob/e8ab3bd6bc6c0f6ee890b05fa244cf9d040dc16e/docs/architecture/adr-0015-explicit-offline-article-snapshots.md#L25)은 변환 전 본문을 1MiB로 제한한다. 그러나 [구현 92행](https://github.com/IMHOJEONG/web-tech/blob/e8ab3bd6bc6c0f6ee890b05fa244cf9d040dc16e/apps/docs/feature/offline/model/offline-snapshot.ts#L92)은 `root.innerHTML.length`를 비교한다. JavaScript 문자열의 UTF-16 코드 단위는 UTF-8 바이트와 다르다.

한글 400,000자를 포함한 HTML은 길이 400,007, UTF-8 1,200,007바이트로 선언한 1,048,576바이트를 초과하지만 초기 길이 조건은 통과한다. 최종 스냅샷의 별도 2MiB 제한이 사라진 것은 아니며 OOM·악용·최종 저장 성공을 입증한 결과도 아니다.

후속: 1MiB의 바이트 계약을 코드에 맞추고 ASCII·한글·이모지의 정확한 경계/초과 회귀를 추가한다. 기존 결정을 문자열 단위로 소급 완화해서 테스트를 통과시키지 않는다. 단위 선택 자체를 바꾸려면 새 결정을 검토한다.

### F2 · P2: 서비스 워커 책임 변경의 부분 대체 관계가 없음

[ADR-0009 22행](https://github.com/IMHOJEONG/web-tech/blob/e8ab3bd6bc6c0f6ee890b05fa244cf9d040dc16e/docs/architecture/adr-0009-docs-web-push-experiment.md#L22)은 적용 중인 결정에 `fetch listener와 오프라인 캐시가 없다`고 명시한다. [ADR-0015 20행](https://github.com/IMHOJEONG/web-tech/blob/e8ab3bd6bc6c0f6ee890b05fa244cf9d040dc16e/docs/architecture/adr-0015-explicit-offline-article-snapshots.md#L20)은 같은 Worker에 오프라인 코드를 import하기로 했다.

현재 `push-sw.js:2`는 `offline-worker.js`를 import하고, 그 파일은 CacheStorage 및 `fetch` listener를 실제 사용한다. ADR-0009의 후속 링크에는 0010만 있고 0015와의 부분 대체 관계가 없다. 각 문서만 읽으면 서로 다른 현재 책임을 안내한다.

후속: 0009의 당시 본문은 보존하되 상태/범위에 “Worker 캐시·탐색 책임은 0015로 대체”를 명시하고 0015에도 대체 범위를 역참조한다. 푸시 저장·발송까지 전부 폐기됐다고 표시하지 않는다.

### F3 · P2: Vite+의 제안 상태가 main 채택을 따라가지 못함

[실험 정책 5·9행](https://github.com/IMHOJEONG/web-tech/blob/e8ab3bd6bc6c0f6ee890b05fa244cf9d040dc16e/docs/architecture/vuln-radar-viteplus-experiment.md#L5)은 `제안`, `main 미병합`을 표시하고, 43행은 장기 도입 때 ADR을 작성한다고 약속한다. 그러나 main의 `d0b25a5`는 Vite+ 개발·빌드 채택 커밋이며 [manifest 8·11행](https://github.com/IMHOJEONG/web-tech/blob/e8ab3bd6bc6c0f6ee890b05fa244cf9d040dc16e/apps/vuln-radar/package.json#L8)은 이미 `vp dev`, `vp build`다.

후속: 현재 채택한 도구와 한시 실험/장기 채택의 범위를 먼저 정리한다. 장기 도입이라면 대안·영향·재검토 조건을 갖춘 ADR로 연결하고, main 내 실험을 계속하는 것이라면 허용 범위·종료 조건·되돌릴 기준을 명확히 한다. Railway 보안 보류를 자동 해제하거나 운영 사용을 검증 완료로 표시하지 않는다.

### F4 · P2: 병합·배포 증거가 현재 ADR 상태에 연결되지 않음

- ADR-0007과 목차는 검색 이동 개선을 아직 미푸시로 설명한다. 해당 구현은 main에 포함됐고 [10-20 Production 전환 검증](../deployment/2026-10-20-docs-main-production-transition.md)은 같은 main 코드의 검색 제출·공개 도메인 검사를 기록한다.
- ADR-0012·0013은 적용 위치를 아직 `feature/docs 작업 트리`로 적지만 구현은 `93fbf6da`에서 main에 반영됐다. registry 게시·실제 외부 소비 앱 검증은 여전히 별도다.
- ADR-0014·0015 및 목차는 로컬/미배포 설명에 머무른다. 10-20 Production 전환과 [10-21 KAN-22 검증](../resilience/2026-10-21-kan22-offline-navigation.md)에는 후속 CI·배포 근거가 있다. 배포 성공과 실제 기기에서 오프라인 저장을 검증한 것은 구분해야 한다.
- main의 0019~0021 목차와 상태에는 로컬 구현·원격 CI/배포 미확인 설명이 남는다. 같은 SHA의 GitHub combined status를 재조회해 `Vercel – web-tech: success`를 확인했다. Confluence에는 PR65 main 병합과 CI·Production 후속 기록이 있으나 실제 NAS 컨테이너 교체·원문 V1/V2 게시·기능 의미 검증은 별도로 남아 있다.

후속: 과거 verification의 실패·미검증 결과를 고치지 않고 ADR의 현재 상태/범위와 목차에 후속 커밋·보고서만 연결한다. “구현 / main 병합 / 배포 성공 / 기능 운영 검증 / 남은 검증”을 별도 필드로 관리한다. `적용 중` 자체가 배포 완료를 의미하도록 바꾸지 않는다.

### F5 · P2: 자동 검사는 ADR 고유 규칙을 보장하지 않음

[현재 검사기](https://github.com/IMHOJEONG/web-tech/blob/e8ab3bd6bc6c0f6ee890b05fa244cf9d040dc16e/scripts/check-documentation.mjs#L103)는 architecture 공통 상태로 `보류`도 허용한다. 같은 ADR 번호의 두 파일과 `보류` 상태를 가진 합성 입력을 `validate`에 전달해 오류 배열 `[]`을 확인했다. 번호 충돌이나 잘못된 ADR 상태가 현재 main에 실제 존재한다는 뜻은 아니다.

후속: ADR만의 상태 집합, 제목/파일 번호 일치·중복, 대체 참조의 양방향·순환, 목차 상태 불일치를 검증하는 별도 회귀를 추가한다. 현재 delta 검사의 통과를 결정과 코드의 의미 일치 보증으로 설명하지 않는다. 코드·배포와의 의미 대조는 사람이 계속 수행한다.

## 한계와 후속 작업

- 점검 중 실행한 것은 Git/문서 정적 검사, 크기 단위 계산, 검사기 합성 입력, 연결 도구의 읽기다. 전체 앱 빌드·브라우저·NAS 쓰기·운영 웹훅·자격 증명 회전은 실행하지 않았다.
- GitHub combined status의 success는 check-run 전체·Production alias·기능 검증을 독립적으로 입증하지 않는다. 기존 배포 보고서와 Confluence 기록의 범위를 함께 표시했다.
- ADR-0018의 실제 미공개 제안 내용과 타 작업 트리의 미커밋 변경은 검사·게시하지 않았다. 공백 번호만으로 새 번호를 재사용하지 않는다.
- 수정 권장 순서는 F1 계약 회귀, F2 부분 대체 연결, F3 채택 범위 정리, F4 현재 상태 갱신, F5 검사 보강이다. 이번 요청은 감사이므로 어느 결정도 자동 승인·대체하지 않았다.
- 10-27 관측 당시에는 로컬 미커밋 문서였으며 main의 파일을 당시 checkout으로 병합·복사하지 않았다. 이후 정제된 보고서를 [PR #78](https://github.com/IMHOJEONG/web-tech/pull/78)로 올렸지만 당시 관측을 현재 상태의 재감사 결과로 바꾸지는 않는다.

## 관련 문서

- [ADR 관리 규칙](../../process/adr-management.md)
- [증거 집계](../artifacts/2026-10-27-adr-governance-audit.json)
- [감사 작업 기록](../../worklog/2026-10/2026-10-27-adr-governance-audit.md)
- [감사 기준 main](https://github.com/IMHOJEONG/web-tech/commit/e8ab3bd6bc6c0f6ee890b05fa244cf9d040dc16e)
