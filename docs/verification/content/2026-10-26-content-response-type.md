# 상세 오류 응답의 Content-Type 검증

## 대상과 조건

- 확인일: 2026-10-26 KST, macOS arm64·mise Node 24.12.0·Nest 11.1.19.
- 기준 main: `c1e2850cbfdf50bd7761729b32d1af5ffe045596`. `codex/docs-backend-content-type-20261026`의 로컬 미커밋 수정, [KAN-38](https://web-tech-service.atlassian.net/browse/KAN-38).
- 임시 content 디렉터리·fixture 토큰·로컬 HTTP만 사용했다. NAS·운영 API·실제 토큰·Vercel/Railway·웹훅·DB는 사용하지 않았다.
- 선행 H1 검증 문서2개는 사용자 승인으로 [d9ca455](https://github.com/IMHOJEONG/web-tech/commit/d9ca45569335d70a84f5799e9dfcbd7d3e50aa31)에 별도 커밋·원래 H1 브랜치에 푸시하고 ls-remote 일치를 확인했다. 이 커밋은 새 main 기반 브랜치에 섞지 않았다.

## 재현 방법

저장소 루트에서 실행한다. HTTP 검사는 로컬 listener를 허용해야 한다.

```sh
mise exec -- pnpm --filter docs-backend test:e2e --runInBand \
  --testPathPatterns app.e2e-spec.ts \
  --testNamePattern 'detail response content types'
mise exec -- pnpm --filter docs-backend check
mise exec -- pnpm --filter @web-tech/docs-content-contract test
mise exec -- pnpm validate:docs
git diff --check
```

첫 명령은 집중10개만 실행하므로 기존 app 회귀23개는 skipped로 표시된다. 전체 회귀는 check의 단위·HTTP suite로 별도 실행하며 생략하지 않는다.

## 결과와 증거

원인은 상세 route의 정적 `text/html` 헤더가 controller 호출 전에 설정되는 데 있다. metadata·본문 거부·문서 없음·렌더링 오류는 Nest JSON 예외 응답이지만 기존 HTML 헤더와 충돌했다. 설치된 router-execution-context의 guard→status/headers→controller 순서와 ExpressAdapter의 불일치 경고 후 JSON 보정 코드를 확인했다. 기존 외부 응답도 adapter 보정 후 JSON이었으므로 외부 응답이 HTML이었다고 설명하지 않는다.

수정은 조회·렌더링 성공 뒤 `response.type('html')`만 설정하고 `passthrough: true`로 전송·기본 예외 처리를 Nest에 남긴다. custom ExceptionFilter·로그 비활성화·예외 catch 후 성공200 반환은 추가하지 않는다.

| 검사              | 관측 결과                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| 수정 전 집중 회귀 | 3개 통과·7개 실패. JSON 응답 자체는 맞아도 경고 spy가 404 여섯 경로·렌더링500의 실제 adapter 경고를 탐지           |
| 수정 후 집중 회귀 | 10개 통과. 동일 경고 spy의 불일치 경고0·HTML200·JSON401/404/500·기존 cache/Vary·비공개 메시지 검사                 |
| 백엔드 전체       | 단위13개·HTTP49개, lint·타입·Nest build 통과                                                                       |
| 공용 계약         | 26개 통과. H1 warning·본문 실패·metadata/route 계약 유지                                                           |
| 본문·보안 경계    | 원문·H1·공개 상태·토큰 guard·renderer는 미수정. 검증 원문·토큰·실제 렌더링 예외 메시지가 오류 응답에 포함되지 않음 |

404 표본은 없는 글·잘못된 slug 경로·불완전 metadata·draft·archived·HTML주석 본문 실패다. 401은 토큰 누락/불일치이며 500은 renderer에 일회성 예외를 주입했다. 잘못된 본문의 `Rejected invalid content document` 경고는 계속 기록되는지도 assert한다. warning spy는 원래 logger를 호출하며 경고를 숨기지 않고 각 테스트 후 복구한다.

의도적으로 주입한 renderer500의 `private-render-failure` 서버 로그는 성공한 검사에서도 출력된다. 이는 이번 fixture의 예상된 오류 로그이며 새 운영 장애 관측이 아니다. 테스트는 해당 예외가 HTTP500·일반 JSON으로 처리되고 응답에는 원문 예외 문자열이 없음을 확인한다. [전후 요약 증거](../artifacts/2026-10-26-content-response-type.json)에 기준 commit·수정 controller blob·집중 검사 결과를 기록했다.

## 한계와 후속 작업

- 최초 로컬 검증은 미커밋·미푸시 상태에서 수행했다. 이후 사용자 승인으로 코드·회귀·문서를 커밋·푸시하고 원격 검증을 진행한다. 실제 head·PR·CI·CodeQL·리뷰 결과는 같은 KAN-38 기록에 연결한다. NAS의 실제 경고가 사라졌다고 선언하지 않으며 이미지 게시·컨테이너 교체·운영 404 재검증은 후속 승인 범위다.
- 401 guard는 controller 이전에 실행된다. 이번에 인증 오류의 cache/Vary 정책을 새로 정의하지 않았으며, 인증 후 controller에 도달한 404/500의 기존 헤더를 유지한다.
- 정상 상세는 문자열 렌더링이다. streaming response나 다른 앱의 글로벌 예외 처리·비표준 interceptor까지 검증한 것은 아니다.
- 최초 로컬 검증에서 frontend build·브라우저 E2E·전체 monorepo 검사·원격 CI·CodeQL은 미실행이었다. 후속 원격 결과는 이 로컬 결과와 구분한다. 응답 계약을 바꾸지 않는 backend 수정이며 새 ADR은 만들지 않는다.
- H1 문서 기록 커밋은 원래 브랜치에만 푸시했다. 기존 PR #62의 main 병합에 소급 포함되지 않으며 별도 main 반영이 필요하다.

## 관련 문서

- [API 응답 계약](../../architecture/blog-content-api-contract.md#content-type과-오류-처리)
- [작업 기록](../../worklog/2026-10/2026-10-26-content-response-type.md)
