# TCP 초안·도식 보존 상태와 로컬 재검증

## 대상과 조건

- 관측: 2026-10-20 23:49~23:58 Asia/Seoul. 세부 UTC 시각은 각 artifact에 있습니다.
- 기준: `codex/docs-tcp-draft`, HEAD `ebc61ad4f0700e71437315a255872c790093bb94` 위의 미커밋 작업 트리. 이 HEAD의 원격 CI·배포 성공을 주장하지 않습니다.
- 대상: [TCP MDX](../../../apps/docs/category/be/node-js/tcp-socket-endpoints-lab.mdx), 소켓 끝점과 새 패킷 흐름도의 SVG·PNG.
- 환경: macOS, Node.js v24.12.0, pnpm 11.10.0, Next.js 16.3.8, Playwright Chromium. viewport 320/390/670/1280×1000, 실기기 아님.
- [KAN-16](https://web-tech-service.atlassian.net/browse/KAN-16), [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)에 검증 상태와 로컬-only 범위를 연결합니다. 비공개 원문·화면·원시 로그는 외부 기록에 올리지 않습니다.

## 재현 방법

실험실 `/Users/coder/Desktop/project/labs/streaming-backpressure-lab`에서 `pnpm test:sockets`를 실행했습니다. 기존 `socket-article-source.json`과 `.test.mts`가 실제 MDX 다섯 블록을 추출해 fixture와 대조하고 strict 타입·본문·주소/포트·운영체제 소켓 상태를 검사합니다.

저장소 루트에서 `pnpm --filter docs validate:content`, `pnpm --filter docs dev --hostname 127.0.0.1`을 실행했습니다. [개발 preview](http://127.0.0.1:3001/ko/preview/category/be/node-js/tcp-socket-endpoints-lab)의 첫·마지막 고유 본문, 두 도식, noindex, 네 접기, 가로 넘침과 pageerror를 확인했습니다. 임시 검사기는 `/private/tmp/tcp-recheck-20261020/ui.mts`와 `ordinary.mts`입니다.

## 결과와 증거

| 검사           | 결과                                                                                     | 근거                                                                |
| -------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 원문 보존      | 10-16 최종 원문과 같은 SHA-256 `3488475d…46a50b0`, draft 유지                            | [해시·Git 상태](../artifacts/2026-10-20-tcp-recheck.json)           |
| 도식 보존      | 두 도식의 SVG·PNG 총 4개 해시 불변, 새 packet-flow 두 파일은 미추적 유지                 | 같은 JSON의 `draftAndDiagramsUnchanged`                             |
| Git 상태       | HEAD·브랜치 동일, 인덱스 비어 있음                                                       | 같은 JSON. 이번 작업에서 staging·commit·push 없음                   |
| 원문과 fixture | strict 타입 각 1회·일반 실행 각 3회·음성 사례·캡처 대기 포함 14개 통과                   | [테스트 원문](../artifacts/2026-10-20-tcp-recheck-source-tests.txt) |
| 캡처 대기      | Enter 전 LISTEN 1/ESTABLISHED 0, 필터와 실제 포트 일치, Enter 후 HTTP 200·본문·완료 통과 | 같은 테스트. 실제 tcpdump 실행 아님                                 |
| 콘텐츠 검사    | frontmatter·본문 스타일 19개 파일 통과                                                   | [출력](../artifacts/2026-10-20-tcp-recheck-content.txt)             |
| 개발 화면      | 네 폭 모두 HTTP 200, noindex, 두 이미지 decode, 접기 4개, 첫·마지막 본문, 질문·정답 없음 | JSON의 `previewObservation`                                         |
| 화면 오류      | 네 폭 모두 페이지 가로 넘침 0, 중첩 문단 0, pageerror 없음                               | 같은 관측값                                                         |
| 일반 문서 경로 | 초안 대신 not-found 화면, MDX 0개, noindex. 스트리밍 HTTP 200                            | JSON의 `ordinaryRoute`                                              |

[모바일 도식](../artifacts/2026-10-20-tcp-recheck-packet-390.jpg), [데스크톱 도식](../artifacts/2026-10-20-tcp-recheck-packet-1280.jpg), [데스크톱 본문 시작](../artifacts/2026-10-20-tcp-recheck-top-1280.jpg)을 직접 시각 확인했습니다.

기술·독자 이해·존댓말을 세 에이전트가 읽기 전용으로 검토했습니다. 4-tuple·완료 신호·ACK·FIN, 도식의 12개 방향과 [10-11 캡처](2026-10-11-node-tcp-packet-capture.md), 짧은 CPU 요약과 [별도 CPU 관측](2026-10-11-node-event-loop-cpu.md)이 일치했습니다. 질문·퀴즈 제거, 코드 접기, 다음 글 예고도 유지됐습니다. 필수 수정 사항은 없었습니다. 작가 관점의 이전 조언은 별도 수정 승인으로 해석하지 않아 원문을 바꾸지 않았습니다.

### 최초 검사 오류와 후속 판정

첫 콘텐츠 검사는 샌드박스 registry 접근 실패와 pnpm의 비대화형 modules 재설치 중단으로 실패했습니다. 허용된 환경에서 같은 workspace 명령을 재실행해 통과했으며, 강제 삭제·CI 설정을 이용한 모듈 초기화·lockfile 변경은 하지 않았습니다.

[최초 브라우저 결과](../artifacts/2026-10-20-tcp-recheck-initial-ui.json)는 네 preview 검사 뒤 일반 경로를 반드시 HTTP 404로 기대해 실패했습니다. 실제 DOM을 추가 관측한 결과 `요청한 문서를 찾지 못했습니다`, noindex, MDX 없음이 확인됐습니다. 설치된 Next.js의 `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md`는 스트리밍 not-found의 HTTP 200을 명시합니다. 해당 계약에 맞춰 본문·noindex·초안 부재로 판정했고 앱은 수정하지 않았습니다. 초기 실패와 후속 관측 시각을 분리했습니다.

Jira 댓글 형식 안내 조회 한 번도 MCP timeout으로 실패했으나 같은 도구 재조회로 복구했습니다. 최종 기록은 아래 작업 기록에 연결합니다.

외부 기록 마감은 자정을 넘어 2026-10-21 00:00 KST에 완료했습니다. KAN-16의 댓글 10006은 재조회에서 3열 표·댓글 총 1개로 확인됐고, Confluence v13의 기존 구역과 새 이슈 연결도 확인했습니다. 독립적인 로컬 재검증 작업만 완료 처리했으며 초안 게시·커밋 권한을 변경하지 않았습니다.

## 한계와 후속 작업

새 관리자 권한 패킷 캡처·CPU/keep-alive 실험·production build·공개 배포·실기기 Safari는 수행하지 않았습니다. 도식은 10월 11일의 과거 실측이며 현재 선택 캡처 모드의 관리자 권한 재실행 성공으로 확장하지 않습니다. 개발 환경의 일반 경로 비노출을 운영 전체의 비공개 검증으로 일반화하지 않습니다.

사용자 게시 승인 대기를 유지합니다. 검증 기록도 로컬-only이며 원문·도식과 함께 스테이징·커밋·푸시·게시하지 않았습니다. 구조·데이터 흐름·공개 계약·공용 컴포넌트 책임 변경이 없어 ADR을 추가하지 않았습니다.

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-20-tcp-draft-recheck.md)
- [10-16 초안 준비·편집 이력](2026-10-16-tcp-draft-preparation.md)
- [소켓·패킷 실험 절차](../../runbooks/node-tcp-local-observation.md)
