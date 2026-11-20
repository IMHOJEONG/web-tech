# Effect TemplateLiteral ReDoS 패치 검증

## 대상과 조건

- 검증일: 2026-11-20 KST. 기준 main `4dedd86e6ddddd12d36cd40cde1cd30d2edec5af`, 별도 `codex/security-effect-redos-20261120` 작업 트리의 미커밋 수정본.
- 환경: macOS arm64, Node 24.22.1, pnpm 12.14.0, TypeScript 6.0.3. frozen lockfile과 `--ignore-scripts`로 설치했으며 운영 `.env`·DB·NAS는 사용하지 않았다. dotenv skill 설치도 승인하지 않았다.
- 추적: [KAN-85](https://web-tech-service.atlassian.net/browse/KAN-85), [Confluence 작업 요약](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=20578306), [Dependabot #363](https://github.com/IMHOJEONG/web-tech/security/dependabot/363). 로컬 수정·검증과 main 병합·배포·알림 해소를 구분한다.

## 조치와 근거

[GHSA-7589-6fvf-x4pw / CVE-2026-121707](https://github.com/Effect-TS/effect/security/advisories/GHSA-7589-6fvf-x4pw)는 `Schema.TemplateLiteral`의 여러 String span이 만드는 정규식 backtracking 문제다. 불일치 입력을 검사하는 동안 동기 실행이 길어져 이벤트 루프를 막을 수 있다. 영향 버전은 `<=3.22.0`, 최초 수정은 `3.22.1`이며 [공식 수정 #6761](https://github.com/Effect-TS/effect/pull/6761)은 문자열 span 전용 선형 matcher를 도입했다. 조회 시 GitHub Dependabot·audit는 High, upstream 권고 페이지는 Moderate로 표시했으므로 심각도의 출처를 구분한다. 영향 범위와 수정 버전은 일치했다.

기존 `catalogs.web.effect`의 `^3.20.0`을 `^3.22.1`로 올리고 `effect@^3: ^3.22.1` override를 추가했다. catalog만 변경하면 Prisma가 고정한 간접 의존성은 남을 수 있다. 3.x만 대상으로 하여 미래의 4.x를 강제로 3.x로 낮추지 않는다. 실제 잠금·설치 버전은 **3.20.0·3.21.2 → 3.22.4 한 버전**이다. 다른 패키지 버전·워크플로·애플리케이션 소스는 바꾸지 않았다.

`pnpm why --recursive effect --depth 6`에서 확인한 경로:

- `vuln-radar → effect`: 직접 의존성.
- `vuln-radar-backend → prisma → @prisma/config → effect`: 간접 의존성. `@prisma/client → prisma` 경로에도 연결된다.

앱 소스에서 Effect나 `Schema.TemplateLiteral`의 직접 import를 찾지 못했다. 설치 사실만으로 운영 요청의 도달 가능성·외부 악용·침해를 확정하지 않는다. 미사용 선언 제거는 이번 보안 patch와 분리했다.

## 재현 방법

저장소 루트에서 Node 24를 PATH로 선택하고 실행했다. 아래 감사 JSON은 비교를 위한 임시 비공개 보관용이며 공개 artifact로 올리지 않는다.

```sh
corepack pnpm install --frozen-lockfile --ignore-scripts
node --experimental-strip-types --test scripts/security-effect-advisory.test.mts
corepack pnpm exec tsc --noEmit --target ES2023 --module NodeNext --moduleResolution NodeNext --types node --allowImportingTsExtensions --erasableSyntaxOnly --skipLibCheck --strict scripts/security-effect-advisory.test.mts scripts/security-fixtures/effect-template-literal.mts
corepack pnpm test:repo
corepack pnpm --filter vuln-radar build
corepack pnpm --filter vuln-radar typecheck
corepack pnpm --filter vuln-radar test:lib
corepack pnpm --filter vuln-radar lint
corepack pnpm --filter vuln-radar-backend build
corepack pnpm --filter vuln-radar-backend typecheck
corepack pnpm --filter vuln-radar-backend test --runInBand
corepack pnpm --filter vuln-radar-backend test:e2e --runInBand
corepack pnpm --filter vuln-radar-backend lint
corepack pnpm validate:catalog
corepack pnpm why --recursive effect --depth 6
corepack pnpm audit --json
corepack pnpm audit --prod --json
```

동일한 합성 동작 검사를 패치 전 설치본에서 먼저 실행했다. 별도 기준 checkout을 사용할 때는 다음 경로를 해당 checkout으로 바꾼다. 변경하지 않은 구버전 의존성·lockfile이 필요하며 종료 1이 기대 결과다.

```sh
EFFECT_SECURITY_WORKSPACE=/path/to/baseline node --experimental-strip-types --test --test-name-pattern='bounded TemplateLiteral' scripts/security-effect-advisory.test.mts
```

## 결과와 증거

| 검사             | 결과                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 구버전 음성 대조 | 직접 3.21.2·Prisma 3.20.0에서 2개 모두 모듈 로드 확인 후 `ETIMEDOUT`. 각각 8초 상한으로 부모가 자식을 종료, 예상 실패 2개                                           |
| 수정본 보안 회귀 | 6/6 통과. catalog·3.x override·모든 lock package/snapshot·실제 설치본·정상 Prisma 설정 검사                                                                         |
| 동작·정상 대조   | 두 경로에서 `Schema.is`, 동기 decode, 비동기 decode가 5,000자 합성 불일치 입력을 거부. 빈 span·줄바꿈·Unicode·긴 정상 입력과 짧은 숫자 혼합 schema의 정상 동작 유지 |
| 저장소 전체 검사 | 304/304 통과, 실패·skip 0. 새 6개는 기존 `test:repo` glob에 포함돼 CI 변경 없이 실행 대상이 됨                                                                      |
| 프론트 소비자    | 공용 UI·vuln-radar production build, typecheck, lint 통과. 라이브러리 36/36 통과                                                                                    |
| 백엔드 소비자    | Prisma Client 생성·Nest build·typecheck·lint 통과. unit 15 suites·67/67, mock 저장소 HTTP 2 suites·12/12 통과                                                       |
| TS 실행 호환     | 새 테스트·fixture의 strict·erasable 검사 통과. Node 24 타입 제거 실행을 사용                                                                                        |
| 감사             | 전체 audit High 1건 → 0건·종료 0. 수정 후 production audit도 0건·종료 0. 권고 ignore·dismiss는 하지 않음                                                            |

실행 가능한 증거는 [회귀 테스트](../../../scripts/security-effect-advisory.test.mts)와 [격리 fixture](../../../scripts/security-fixtures/effect-template-literal.mts)다. 자식 프로세스는 V8 old-space 128MiB·8초 deadline·64KiB 출력 상한을 가지며, 상속할 환경 변수를 제한한다. old-space 설정은 프로세스 전체 메모리의 상한이 아니다. 같은 이벤트 루프의 타이머에 의존하지 않고 부모가 강제 종료한다. 실제 API나 사용자 데이터로 부하를 주지 않는다. 완료 시간은 통과 여부 관측이지 정밀 성능 벤치마크가 아니다.

중간 포맷 실행에서 pnpm의 실행 전 의존성 재검증이 sandbox의 공유 store 접근 제약과 겹쳐 생성된 `node_modules`가 불완전해졌다. 이 별도 작업 트리만 승인된 환경에서 `pnpm install --force --frozen-lockfile --ignore-scripts`로 복구했다. 소스·lockfile·보안 assertion을 완화하거나 의존성 재검증을 비활성화하지 않았으며 위 결과는 복구 후 검사다.

## 한계와 후속 작업

catalog 참조는 11개 manifest에서 통과했고 변경 코드·설정·문서의 포맷과 diff 검사도 통과했다. 문서 검사기의 `validate`에 실제 작업 파일 snapshot을 전달하여 새 미추적 문서까지 포함한 4개 변경 문서의 구조·목차·상대 링크를 검사했다. 실제 Git index는 변경하지 않았으며 빈 stage에 대한 성공을 작업 파일 검증으로 간주하지 않았다.

- 감사 0건은 해당 시점 registry DB와 의존성 graph의 결과다. 실제 운영 배포·새로운 권고·모든 악용 조건에 대한 무위험 보증이 아니다.
- 합성 공격은 임시 자식 프로세스 안에서만 검사했다. 실제 Prisma 개발 서버·외부 endpoint 공격·운영 DB·NAS 컨테이너 교체는 검사하지 않았다.
- 이 보고서는 최초 로컬 검증의 결과다. 후속 사용자 요청으로 패치·테스트·정제 문서를 나눠 커밋·푸시하고 main 대상 PR의 CI·리뷰를 확인한다. 실제 원격 SHA·결과는 연결된 Jira·Confluence와 PR에서 추적하며 이전 로컬 성공을 원격 CI 성공으로 표시하지 않는다. main 병합·운영 배포는 이번 요청에서 제외한다.
- #363의 원격 해소는 main 반영 후 GitHub가 다시 평가한 상태를 별도 확인해야 한다. 원시 로그·audit 응답·인증 값·개인 경로는 공개 파일에 포함하지 않으며 문서 공개·승인 해시 등록은 최종 파일별 검수 후 진행한다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-20-effect-redos.md)
- [보안 업데이트 지식](https://web-tech-service.atlassian.net/wiki/pages/19496961)
- [공개 검수 절차](../../process/publication-review.md)
