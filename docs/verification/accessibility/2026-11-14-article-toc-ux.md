# 본문 공통 목차 UI/UX 검증

## 대상과 조건

- 검증일: 2026-11-14 KST.
- 기준: main `b4caa565` 기반 `codex/docs-toc-ux-20261114`의 변경. UI 구현 `886dfd52`, 목차 회귀 `cad86ba9` 및 이 보고서와 같은 가이드 변경을 검사했다. 기능 브랜치의 로컬 검사이며 운영 반영은 아니다.
- 환경: Node 24.22.1, pnpm 12.14.0, Next 개발 서버와 Playwright Chromium. 로컬 문서만 사용하고 원격 콘텐츠 조회는 껐다.
- 화면: 390×844, 768×1024, 1280×800. 라이트/다크, reduced-motion, 24px root 글자 검사를 포함한다. 실제 기기와 브라우저 확대율 검사와는 다르다.
- 기존 진단 문서·미커밋·stash와 다른 작업 트리는 변경하지 않았다. 테스트 출력·화면은 저장소 밖 비공개 임시 폴더에 두며 공개 artifact는 추가하지 않는다.

## 재현 방법

저장소 루트에서 고정한 도구 버전을 사용한다.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @web-tech/ui build
pnpm --filter docs typecheck
pnpm --filter docs exec eslint widgets/article-toc/model/active-heading.ts widgets/article-toc/model/use-active-heading.ts widgets/article-toc/ui/toc.tsx widgets/article-toc/ui/toc-links.tsx widgets/article-toc/ui/toc-summary.tsx widgets/article-detail/ui/article-content-layout.tsx e2e/article-toc-navigation.spec.ts --max-warnings 0
node --experimental-strip-types --test apps/docs/widgets/article-toc/model/active-heading.test.ts
DOCS_E2E_PORT=3064 pnpm --filter docs test:e2e article-toc-navigation.spec.ts article-anchor-scroll.spec.ts journal-design.spec.ts --workers=2 --retries=0 --output=/private/tmp/docs-toc-ux-results
```

포트 3064는 사용하지 않는 로컬 포트로 바꿀 수 있다. 마지막 output 경로는 checkout 밖이어야 한다. 공용 설정·의존성 버전·훅·검사 기준은 바꾸지 않는다.

## 결과와 증거

| 검사                             | 결과                                       | 범위                                                                                                       |
| -------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 순수 위치/앵커 함수              | 6개 통과                                   | 잘못된 percent escape, 한글/번호 ID, 경계/역방향 스크롤, 마지막 구간, 1000개 제목·입력 보존                |
| docs 타입                        | 통과                                       | 공용 콘텐츠 계약 build 후 전체 타입 검사                                                                   |
| 변경 코드 lint                   | 통과                                       | 오류·경고 0건                                                                                              |
| 최초 브라우저 실행               | 서버 시작 실패                             | 샌드박스의 localhost listen EPERM. 앱 테스트 결과와 구분                                                   |
| 승인 후 첫 36개 브라우저 검사    | 29개 통과·4개 화면 범위 조건 skip·3개 실패 | reduced-motion CSS의 transition-property는 none이나 duration 값은 0.15초. 새 duration 0초 검사 실패를 보존 |
| 모션 지속 시간 보완 후 같은 검사 | 32개 통과·4개 화면 범위 조건 skip·실패 0건 | transition-none과 duration-0을 함께 명시. 검사 기준/timeout/retries는 유지                                 |
| 별도 라이트/다크 화면 확인       | 4개 통과                                   | 390×844와 1280×900의 문서 가로 넘침 0px. 모바일 다크 펼침과 데스크톱 라이트 이동 후 화면을 직접 확인       |

새 테스트는 실제 본문에서 현재 항목과 hash를 확인하고, 수동 스크롤이 hash를 바꾸지 않는지 검사한다. 모바일은 선택 후 닫힘·제목 focus, Escape의 summary 복귀를 확인한다. 기존 번호 heading 링크·헤더 가림·목록 탐색 검사를 함께 유지한다.

4개 skip은 데스크톱 전용 앵커 검사 2개와 모바일 전용 목록/닫기 검사 2개가 해당하지 않는 화면에서 제외된 결과다. 순수 함수 검사는 위 명령으로 별도 실행했으며, 기존 `test:lib` 파일 glob에 자동 포함된다고 간주하지 않는다.

로컬 확인 서버는 원격 조회를 끈 채 포트 3064에서 실행했다. `/ko/docs/web/javascript-event-loop-runtime`에서 스크롤과 모바일 펼침을 확인할 수 있다. 사용자 검토용 서버이며 production 빌드 검증을 대체하지 않는다.

## 한계와 후속 작업

- 현재 위치는 화면 픽셀 기반 안내이며 읽기 완료율이나 사용자가 실제 읽었다는 지표가 아니다.
- 실제 NAS 원격 API, production 빌드/배포, Safari/Firefox·실기기·스크린리더 검사는 미실행이다. 공유 컴포넌트를 쓴다는 이유로 원격 운영까지 통과했다고 표시하지 않는다.
- 첫 CSS 실패는 실제 움직임 관측이 아니라 계산된 duration 값에 대한 실패였다. 보완 뒤 동일 검사에서 통과했다.
- 로컬 화면은 사용자가 확인했고 목차 UI·가이드·예제 코드의 공개 검수 후 작업별 커밋·푸시를 승인했다. main 병합·배포·NAS 변경은 이번 승인 범위가 아니다.

## 작성 가이드 후속 검증

2026-11-14 같은 기준에서 사용자가 로컬 화면 확인을 완료한 뒤 작성 가이드와 합성 예제를 추가했다. production 코드 동작은 추가로 바꾸지 않았다.

```sh
pnpm --filter docs typecheck:node-test
pnpm --filter docs exec node --experimental-strip-types --test lib/article-toc-guide.test.ts
pnpm --filter docs test:lib
pnpm --filter docs validate:content
pnpm --filter docs exec eslint lib/article-toc-guide.test.ts widgets/article-toc/examples/toc-options.ts --max-warnings 0
```

- 예제 전용 4개와 이를 포함하는 `test:lib` 358개 모두 통과했다. 예제 옵션은 실제 `Toc` props를 참조하며 `typecheck:node-test`에도 포함된다.
- 실제 합성 Markdown의 H2~H4 6개, 고유 ID/본문 일치, 코드 펜스 안 제목 제외, draft 유지, 모바일 공통 필터와 원격 H1 제외·기존 ID 보존·H5 미추출을 검증했다. NAS 실문서 테스트는 아니다.
- 콘텐츠 23개는 통과했으나 Brotli·TCP 글의 기존 placeholder 표현 경고 2개는 유지했다. 실제 글을 이번 가이드 범위에서 수정하지 않았다.
- 초기 전용 검사 1개는 `gray-matter`의 YAML 엔진 호환성으로 실패했다. 가이드 검사에서만 이를 새로 사용한 것이므로 실제 로컬 파서와 같은 `vfile-matter`로 바꿔 재검증했다. 의존성·공통 설정은 변경하지 않았다.
- 예제는 `docs/examples`의 비공개 기본 제외 규칙을 변경하지 않고 위젯의 `examples` 아래 합성 fixture로 분리했다. 실제 콘텐츠 수집 대상인 `data`/`category`에 추가하지 않았다.

## 공개 검수와 커밋 전 재검증

사용자가 이번 목차 구현·회귀·작성 가이드와 합성 예제만 공개 검수 후 커밋·푸시하도록 승인했다. 소스와 최종 문서 내용을 확인했고 원시 trace·캡처·로그·실제 NAS 응답·자격 증명·기존 진단 작업은 포함하지 않는다. 공개 문서와 합성 예제 Markdown의 최종 bytes를 검수 해시로 기록한다. 합성 예제의 `draft`는 블로그 미게시 상태이며 공개 Git에서 비공개라는 뜻이 아니다.

같은 명령을 재실행해 라이브러리 358개, 위치 판정 6개, 브라우저 32개 통과·화면 범위 조건 4개 skip을 확인했다. 브라우저 retries는 0을 유지했다. docs 타입 검사도 통과했다. 원격 CI·배포 검증은 아직 수행하지 않았다.

현재 설치된 로컬 훅은 포맷·문서·commitlint이며 pre-push 훅은 없는 상태다. 공통 훅을 이번 작업에서 변경하지 않고 공개 인덱스·커밋 메시지·전송 범위 검사를 명시적으로 실행한다. 이는 전역 훅 설치나 서버 측 강제 적용 완료를 뜻하지 않는다.

## 관련 문서

- [작성·연결 가이드](../../runbooks/docs-article-toc-guide.md)
- [목차 공통화 경계](../../architecture/docs-document-ui-reuse-policy.md)
- [작업 기록](../../worklog/2026-11/2026-11-14-article-toc-ux.md)
