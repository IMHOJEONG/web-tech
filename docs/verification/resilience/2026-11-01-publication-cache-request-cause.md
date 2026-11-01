# 게시 캐시·503 요청 관측의 간헐 실패 조사

## 대상과 조건

- 검증일: 2026-11-01 KST. [KAN-58](https://web-tech-service.atlassian.net/browse/KAN-58)은 사용자 승인으로 KAN-57과 구분한 별도 버그다. 상태는 진행 중이며 최초 트리거는 미확정이다.
- 기준 main `57563f37079fb31e70da12163df456d0cdfd35dd`, 새 브랜치 `codex/docs-e2e-cache-observation-20261101`. [운영 배포 검증](../deployment/2026-11-01-pr81-offline-toc-production.md)을 먼저 완료했다.
- 진단 보완의 로컬 코드 커밋은 `9446a7e64f12e10553fe8447e8e4c546c44765ca`다. 검수 시점에는 아직 원격 푸시·main 반영 전이며 운영 수정으로 표시하지 않는다.
- Node 24.22.1·pnpm 12.14.0·Next 16.4.3·Chromium, 합성 loopback origin·production Next 서버, workers 1·retries 0. 운영 NAS와 실제 토큰은 사용하지 않았다.
- 과거 실패는 수정 전 전체 176/178, 실패 두 검사 분리 2/2, 같은 소스 전체 반복 178/178이었다. 그 이력을 새로운 통과 결과로 덮어쓰지 않는다.

## 재현 방법

루트 의존성이 설치된 저장소 루트에서 실행한다. 아래 설정은 자체 build와 합성 서버를 기동한다. 원시 출력은 공개 artifact로 업로드하지 않는 제한된 로컬 디렉터리를 사용한다.

```sh
pnpm --filter docs test:article:prod \
  article-e2e/content-publication.spec.ts article-e2e/request-cause-next.spec.ts \
  --repeat-each=5 --reporter=list --output=/tmp/docs-cache-cause-baseline
pnpm --filter docs test:article:prod --reporter=list \
  --output=/tmp/docs-cache-cause-full
pnpm --filter docs test:article:prod article-e2e/request-cause-next.spec.ts \
  --reporter=list --output=/tmp/docs-cache-cause-focused
pnpm --filter docs lint
```

원래 두 실패의 trace에서 필요한 상태·응답 버전·완료 문구의 존재만 추출했다. 별도 비공개 preload로 로컬 Next의 cache get/set/invalidate 순서를 관측하되 fetch 키·정상 캐시 정책은 바꾸지 않았다. 이 계측을 붙인 3회 반복과 정상 5회 반복을 구분한다.

추가 음성 대조는 **격리된 로컬 preload에서만** 무효화된 tag의 expiry를 미래로 옮겨 stale 반환을 강제로 유도했다. 정상 설정의 재현이나 실제 OS clock 이상을 관측한 시험이 아니며, 이 비공개 진단 preload는 앱·CI에 도입하지 않는다. 운영 환경변수나 웹훅의 `{ expire: 0 }` 계약을 바꾸지 않았다.

## 결과와 증거

- artifact 상대 링크: **해당 없음**. 원시 trace·응답·진단 preload는 [공개 검수 경계](../../architecture/adr-0025-publication-boundary.md)에 따라 공개하지 않으며, 별도 정제 artifact는 이 조사에서 보관하지 않았다. 아래 표와 실행 범위 설명이 공개용 집계이고, 이를 원시 실행 결과 파일이나 독립적으로 재검증된 증거로 대체해 부르지 않는다. 명령을 재실행해도 과거 간헐 실패나 비공개 preload의 통제 대조가 그대로 재현된다는 보장은 없다.

| 항목                | 실제 결과                                                                           | 판단                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 과거 게시 검사      | origin 제어 204·index V1·웹훅 200 뒤 `/ko/docs`의 HTML 응답 200 자체에 V2 표시      | 단순 텍스트 기대값·입력 locator 문제로 볼 수 없음. 서버 캐시 상태를 먼저 조사해야 함.                                                        |
| 과거 503 검사       | upstream 503과 응답 완료를 관측했지만 실제 HTML에 정상 원격 본문 종료 문구가 포함됨 | 마지막 저장 trace에도 console 이벤트가 없었음. 즉시 파일 읽기 뒤 로그가 늦게 도착했을 뿐이라고 확정할 근거도 없음.                           |
| 정상 5회 반복       | 두 파일 총 60개 통과                                                                | 수정 전 실패를 재현하지 못함. 간헐 문제가 없다는 증거는 아님.                                                                                |
| cache 계측 3회 반복 | 두 파일 총 36개 통과                                                                | 이 표본에서 invalidate를 가로지른 set 구간·cache-write 경고는 관측하지 못함. 다른 실행의 in-flight race를 배제하지 않음.                     |
| 강제 stale 대조     | 1개 검사에서 기대대로 실패                                                          | background upstream 503과 오래된 정상 본문 공존을 만들자 새 본문 판정에서 먼저 실패. 이 인위 조건이 원래 실행의 최초 원인이었다는 뜻은 아님. |
| 진단 순서 보완      | 정상 전체 production 178개·lint·포맷 통과                                           | 기존 503·console·stream assertion을 삭제하지 않고 실제 응답 결과를 먼저 검사함.                                                              |

진단 순서 보완 후의 전체 178개 성공과, 이어진 합성 인증 helper 통일 후 최종 요청 원인 검사 8개 성공은 실행 범위를 구분한다. 최종 타입·lint·포맷 검사도 통과했다. boolean 판정의 강제 stale 대조는 기대한 false 대신 true를 받아 1개 실패했으며, 이때 HTML 원문을 출력하지 않는 것도 확인했다. 이는 의도적인 음성 대조 실패다.

Next의 설치된 `server/lib/patch-fetch.js`는 stale 분기에서 origin 재조회를 시작하면서 기존 응답을 반환할 수 있다. 따라서 transport의 503만으로 해당 페이지 render 실패를 보장할 수 없다. 과거 trace와 합성 대조는 이 경로와 일치하지만, 과거 실행이 왜 그 상태로 들어갔는지까지 입증하지는 못한다.

보완은 [요청 원인 검사](../../../apps/docs/article-e2e/request-cause-next.spec.ts)에서 성공 본문이 없는지 확인한 뒤 console 이벤트를 검사한다. 실패 출력도 HTML 전체 대신 boolean으로 제한한다. 변경 파일의 기존 inline 합성 Bearer 문자열 때문에 최초 공개 검사가 차단됐으며 기존 공용 fixture helper로 통일했다. 실제 인증값을 바꾸거나 검사 규칙·예외를 추가하지 않았다.

## 한계와 후속 작업

- 확인된 것은 잘못된 오류 분류를 막는 검사 보완과 관측 경로다. 원래 캐시의 최초 stale 진입 원인 해결은 **미완료**다.
- 다음 재현에서는 origin 버전 전환·웹훅·캐시 생성 시각·in-flight 완료·요청 상관관계를 함께 수집해야 한다. clock 비교·늦은 쓰기는 후보이지 확정 결론이 아니다.
- 운영 캐시 정책·의존성·환경변수, timeout·skip·강제 클릭은 변경하지 않았다. 새 main 병합·추가 운영 배포도 하지 않았다.
- 원시 trace·응답·개인 경로·비밀값은 공개하지 않는다. 위 표는 정제 집계이며 private probe를 저장소에 포함하거나 재현된 결함을 자동 수정한 것으로 표시하지 않는다.

## 관련 문서

- [선행 PR #81](https://github.com/IMHOJEONG/web-tech/pull/81)
- [KAN-58](https://web-tech-service.atlassian.net/browse/KAN-58)
- [Confluence 조사 기록](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817?focusedCommentId=13828120)
- [작업 기록](../../worklog/2026-11/2026-11-01-pr81-deploy-cache-diagnostics.md)
