# CodeQL High #38 제목 검사 ReDoS 보완 검증

## 대상과 조건

- 일시: 2026-10-22 KST, macOS, Node 24.12.0, pnpm 12.14.0.
- 기준: main `16cc39878f2cb2aa61a3cb4a187e6bb962ce0313`.
- 수정 코드: `1ab8053a5727e75ce56885536ab0a3237d3bccd9`.
- 작업: `codex/security-codeql38-heading-scan`, [KAN-30](https://web-tech-service.atlassian.net/browse/KAN-30).
- 대상: [High #38](https://github.com/IMHOJEONG/web-tech/security/code-scanning/38),
  `js/polynomial-redos`, `packages/docs-content-contract/src/body-style.ts`.
- 악성에 가까운 합성 본문은 로컬 child process에만 전달했다. 운영 요청·NAS 콘텐츠·실제 토큰·DB를 변경하지 않았다.

## 재현 방법

저장소 루트에서 lockfile대로 의존성을 설치한 뒤 실행한다.

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- node --experimental-strip-types --test \
  packages/docs-content-contract/src/body-style-performance.test.ts
mise exec -- pnpm --filter @web-tech/docs-content-contract test
mise exec -- pnpm --filter @web-tech/docs-content-contract lint
mise exec -- pnpm --filter @web-tech/docs-content-contract typecheck
mise exec -- pnpm --filter docs test:content
mise exec -- pnpm --filter docs-backend check
mise exec -- pnpm --filter docs build
```

수정 전에는 기준 main에 새 performance test만 추가하고 첫 명령을 실행했다.
테스트는 고정 코드의 별도 Node 프로세스에서 250,000개 공백이 포함된 본문을 검사한다.
`## ` + 공백 + `word\rrest`처럼 매칭에 실패하는 입력을 앞에 두고, CR·U+2028·U+2029와
두 공백 위치 조합 6개, 긴 정상 제목·기존 공백 전용 제목 2개를 검사한다.
10초에 child process를 종료하므로 정규식 회귀가 있어도 테스트 러너의 event loop까지 영구 정지시키지 않는다.
실제 입력을 코드 문자열로 보간하지 않으며 shell도 실행하지 않는다.

## 결과와 증거

### 원인과 수정

기존 `^(#{1,6})\s+(.+?)\s*$`의 구분 공백·본문·후행 공백이 같은 문자들을 소비한다.
긴 공백 뒤의 내부 줄 구분자와 비공백 접미부가 실패를 유도하면 반복 구간 사이에서 다시 분할하며 탐색한다.
이는 [CodeQL의 모호한 반복 구간 제거 권고](https://codeql.github.com/codeql-query-help/javascript/js-polynomial-redos/)에 해당한다.

고정 길이 접두부 `^(#{1,6})\s`를 먼저 판별하고, 내장 `trim()`과 줄 구분자 검사로 내용을 분리했다.
제목 판별은 줄 길이에 비례하는 별도 스캔들이며 긴 반복 구간을 함께 backtracking하지 않는다.
기존 Unicode 공백·내부/후행 줄 구분자·공백 전용 내용 판정을 유지한다.
H1·제목 깊이·callout·fence·메타데이터 API와 기존 실패/경고 문구는 바꾸지 않았다.

| 검사                  | 결과                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------ |
| 수정 전 격리 회귀     | 10,007ms에 child `ETIMEDOUT`, 1개 실패. 러너가 종료를 회수했다.                            |
| 수정 후 격리 회귀     | 프로세스 기동과 8개 입력 검사 포함 약 65.65ms, 통과. 한 번의 로컬 표본이며 SLA가 아니다.   |
| 공용 계약             | 타입 검사·22개 테스트·lint·타입 검사 통과. 공백/줄 구분자 경계 18개도 명시적으로 검사했다. |
| 기준 코드와 동작 대조 | 9개 접두부 × 10문자 alphabet의 길이 0~4 suffix, 99,999개 본문의 전체 결과 동일.            |
| 로컬 소비자           | 34개 테스트, frontmatter·본문 스타일 검사 19개 문서 통과.                                  |
| NestJS 소비자         | lint·타입 검사, unit 13개·HTTP E2E 34개, CJS 공용 계약과 Nest build 통과.                  |
| docs 라이브러리·빌드  | 라이브러리 285개·Production build 통과. 컴파일 7.7초, TypeScript·정적 33개 생성 완료.      |
| 원격 CI·CodeQL        | PR 생성 후 확인. 로컬 성공을 원격 경고 해소로 표시하지 않는다.                             |

99,999개 대조는 별도 로컬 하네스로 원래 작업 트리의 미수정 모듈과 새 모듈을 가져와 실행했다.
alphabet은 공백·TAB·CR·LF·U+2028·U+2029·`x`·`#`·NBSP·BOM이며
접두부는 빈 값·`#`·`##`·`###`·`######`·`#######`·선행 공백과 `##`·TAB/공백 뒤의 `##` 조합이다.
이는 유한 입력 집합의 호환성 증거이며 모든 문자열에 대한 수학적 증명은 아니다.

로컬 콘텐츠 테스트의 최초 실행은 sandbox의 loopback `listen` 제한 `EPERM`으로 중단됐다.
제품 코드를 바꾸지 않고 동일 테스트를 로컬 서버 실행 권한으로 재실행해 통과했다.
최초 sandbox 내 docs build는 컴파일 단계에서 진행하지 않아 이번에 시작한 프로세스만 종료했다.
권한을 허용한 동일 명령은 완료됐다. 환경 차이만으로 세부 정지 원인을 확정하지 않는다.
기존 TCP 공개 글의 placeholder 스타일 경고는 남겼으며 공개 글은 수정하지 않았다.

## 한계와 후속 작업

- 이 함수는 로컬 글 검증과 docs-backend의 게시 문서 파싱이 공유한다. NAS의 긴 비정상 본문이
  목록/상세 검증의 동기 처리 시간을 점유할 수 있지만 운영 악용·무인증 공개 공격을 재현한 것은 아니다.
- 백엔드 API 인증·파일 접근·frontmatter 게시 상태 검사를 우회하는 수정이 아니다.
- 본문 전체 byte budget, 다른 정규식·Markdown 렌더러 성능과 기존 스트림 로그 원인 조사는 이번 범위 밖이다.
- main 경고는 PR 수정·CI와 별개다. 병합·NAS 이미지 재배포 전 운영 해소로 표시하지 않는다.
- 기존 canonical 분류 worklog·미커밋 작업·stash는 원래 작업 트리에 그대로 보존한다.

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-22-codeql38-heading-redos.md)
- [공용 본문 검증 소비자](../content/2026-09-26-shared-body-validation.md)
- [콘텐츠 작성 규칙](../../architecture/docs-content-authoring-markup-policy.md)
- [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817)
