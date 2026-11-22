# 프런트엔드 현대화 PR #111 리뷰 보완 검증

## 대상과 조건

2026-11-23 KST, [PR #111](https://github.com/IMHOJEONG/web-tech/pull/111)의 원격 기준 `fe88de8e`와 후속 수정이다. Node 24.22.1·pnpm 12.14.0·Next 16.4.6·Playwright 1.62.1을 사용한다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83) · [기존 현대화 지식](https://web-tech-service.atlassian.net/wiki/pages/19464193)

운영 원문·키 없이 공개 코드의 임시 사본과 기존 합성 corpus 17개·archived 1개·PNG 9개를 사용했다. 준비 경계는 [비공개 콘텐츠 CI 절차](../../runbooks/docs-private-content-ci.md)를 따른다. 기존 원본 checkout의 미커밋은 포함하지 않았다.

## 재현 방법

고정 의존성을 설치하고 공용 UI·콘텐츠 계약 패키지를 빌드한다. 수정한 코드만 합성 사본에 반영한 뒤 다음 검사를 실행한다.

```sh
pnpm --filter docs typecheck
pnpm --filter docs lint
pnpm --filter docs test:lib
pnpm --filter docs exec playwright test --config playwright.article.config.ts --grep 'legacy fragment works|request cause control|user search'
NODE_ENV=production DOCS_E2E_PORT=4391 pnpm --filter docs exec playwright test e2e/drawer-hydration-readiness.spec.ts e2e/docs-index-readiness.spec.ts e2e/search-navigation.spec.ts e2e/search-drawer.spec.ts --workers=2
```

article 설정의 기본 Turbopack 프로덕션 빌드 경고와 preview page의 `.nft.json`을 확인한다. 파일 수는 표본 비교이며 고정된 목표 수를 테스트로 강제하지 않는다. 이미지 크기 단위 검사의 public 탈출·symlink·missing fallback도 유지한다.

## 결과와 증거

기준 [CI run 45040120701](https://github.com/IMHOJEONG/web-tech/actions/runs/45040120701)은 실패했다. 반응형 세 작업은 한·영 hydration 각 2개가 이전 combobox 선택자를 찾았다. article-production의 본문 검색 제출·요청 종료·legacy fragment 3개도 실패했다. 린트·타입·단위/계약·공용 UI·오프라인·CRP·문서·컨테이너 및 두 Vercel Preview의 성공과 구분한다.

| 원인                                 | 보완과 판정 기준                                                                                                                                                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 입력 역할 변경의 소비자 검사 누락    | hydration 회귀를 searchbox로 갱신하고 초기 포커스·Escape 복귀 검사는 유지한다.                                                                                                                                       |
| 동적 realpath로 인한 전체 앱 tracing | public 이미지는 기존 명시적 tracing include로 수집한다. 동적 realpath에 Turbopack tracing 제외 주석을 적용하고 런타임 경계 검사는 유지한다. 기본 빌드의 전체 앱 경고와 배포 목록의 테스트 파일 포함이 사라져야 한다. |
| 스트리밍 로딩 화면의 입력 소실       | 교체될 fallback 검색 입력·제출은 disabled/busy로 표시한다. 실제 결과 폼이 준비된 뒤 입력·제출하도록 하고, 스트림을 붙잡는 회귀로 입력 소실 경로를 검사한다.                                                          |
| 뷰포트 밖 링크의 프리페치 대기       | 요청 종료 검사가 실제 Link를 화면에 노출한 뒤 프리페치 응답을 기다리도록 한다. 임의 프리페치 HTTP 요청·추가 재시도·timeout 증가로 대체하지 않는다.                                                                   |
| 완료 로그의 비동기 관측 경쟁         | 503 대조 검사는 응답 종료 로그가 저장될 때까지 기존 expect.poll로 기다린다. 종료=true·503·실패 본문과 오류 기록의 기준은 유지한다.                                                                                   |
| 재로딩 후 초기 fragment 이동 누락    | 본문·폰트 준비 후 동일 fragment의 대상이 화면 밖이고 scrollY=0일 때 한 번만 위치를 복구한다. 휠·터치·포인터·키 입력·hash 변경·unmount는 복구를 취소한다. 기존 ID·호환 alias와 header 여백은 유지한다.                |

로컬 기본 Turbopack의 preview page NFT는 기존 1,431항목·비의존성687개·테스트87개에서 합성 corpus 적용 후 892항목·비의존성148개·테스트0개로 바뀌었다. 입력 corpus가 달라 총수의 감소율을 성능 개선량으로 해석하지 않는다. 같은 7개 로컬 문서 입력의 후속 측정은 876/132/0이었다. 두 후속 빌드에서 whole-project 경고가 없었다. 민감정보 유출이나 실제 배포 시간·메모리 개선을 관측한 결과는 아니다.

최종 로컬 검사: docs typecheck·lint와 test:lib 385개, 프로덕션 article 18개, 세 폭의 hydration·스트리밍·검색 회귀 99개가 모두 통과했다. 중간 article 17통과/1실패는 503 종료 로그의 저장 경쟁이었고, 중간 반응형 95통과/4실패는 native GET 소비자가 disabled fallback을 복사한 문제였다. 각각 관측 완료·실제 폼 준비를 기다리게 보완한 뒤 위 최종 결과를 확인했다. timeout·retry·판정 기준을 낮추지 않았다. 임시 서버를 종료했고 검증한 소스 해시는 artifact에 고정했다.

수정 커밋·푸시 후 새 SHA의 CI를 재조회하며 최종 원격 결과는 같은 PR·Jira·Confluence에 연결한다. 이 문서의 로컬 통과를 원격 CI 성공으로 추정하지 않는다. [정제 요약](../artifacts/2026-11-23-frontend-modernization-pr-review.json)

## 한계와 후속 작업

PR의 실제 운영 배포·필드 CWV·실기기·VoiceOver 후속은 수행하지 않는다. VoiceOver 생략은 사용자 요청을 유지한다. 임시 설정·합성 입력·원시 로그·trace·캡처는 PR에 포함하지 않는다. 초기 fragment 복구는 위치 손실을 보완하며 일반 스크롤이나 이력 이동 전체를 재구현하지 않는다.

기존 검색·앵커 계약을 복구하는 변경으로 새 URL·ID·캐시 계약이나 공용 UI 책임의 결정은 없다. 새 ADR 대신 기존 정책에 적용 범위를 보완한다. 재사용할 tracing·화면 준비 상태·관측 종료 판단은 기존 Confluence 주제를 갱신한다.

## 관련 문서

- [리뷰 원본](https://github.com/IMHOJEONG/web-tech/pull/111#pullrequestreview-6013143798)
- [PR 준비·후속 작업 기록](../../worklog/2026-11/2026-11-23-frontend-modernization-main-pr.md)
- [앵커 계약](../../architecture/adr-0027-article-heading-anchor-compatibility.md)
- [검색 정책](../../architecture/docs-search-experience-policy.md)
