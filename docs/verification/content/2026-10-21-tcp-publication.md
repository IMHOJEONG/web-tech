# 승인된 TCP 소켓 학습 문서 게시 검증

## 대상과 조건

- 2026-10-21 Asia/Seoul. 사용자가 기존 미커밋 문서의 게시와 CI 통과 후 PR 병합·Production 확인까지 승인했다.
- 최신 main `0324278c7c874ff85c045f67094fb8800bbf7234` 기반 `codex/publish-tcp-socket-lab-20261021`에서 게시 변경을 분리했다. 원래 `codex/docs-tcp-draft`의 38개 미커밋 파일과 다른 운영 작업은 변경하지 않는다.
- [실제 MDX](../../../apps/docs/category/be/node-js/tcp-socket-endpoints-lab.mdx)의 본문·실행 코드와 도식은 10-20 검토본 그대로다. `status: published`, 발행일·수정일 `2026-10-21`만 게시 메타데이터로 갱신했다. 본문 SHA-256은 `962ffe82fae3ac2ada3f064bf5c410ec6e2993949b403511f3fa4279278447ae`다.
- macOS, Node 24.12.0, pnpm 11.10.0, Next.js 16.3.8, Playwright Chromium. 원격 index를 끈 production 모드 서버는 격리된 `127.0.0.1:3021`에서 실행했다. 운영 비밀값·NAS 원문·기존 개발 서버를 사용하거나 변경하지 않았다.
- 추적: [KAN-17](https://web-tech-service.atlassian.net/browse/KAN-17), [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira). KAN-16은 이전 로컬 검증 완료 이력으로 유지한다.

## 재현 방법

원문 실행은 기존 실험실 `streaming-backpressure-lab`의 변경 없는 `socket-article-source.test.mts`, `article-code-parts.mts`, `tcp-socket-endpoints.mts`를 임시 검사 공간에 복사했다. binding의 `articlePath`만 이번 게시 작업 트리의 실제 MDX를 가리키도록 설정했다. 기존 실험실이나 원래 초안 파일은 수정하지 않았다.

```bash
mise exec -- node --test /tmp/tcp-publish-source-lab-20261021/scripts/socket-article-source.test.mts
mise exec -- pnpm --filter docs validate:content
mise exec -- env BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false DOCS_SITE_URL=http://127.0.0.1:3021 pnpm --filter docs build
mise exec -- env BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false DOCS_SITE_URL=http://127.0.0.1:3021 pnpm --filter docs start --hostname 127.0.0.1 --port 3021
```

서버가 준비된 뒤 다른 터미널의 저장소 루트에서 실행한다. 검사기는 로컬 origin과 공개 Production origin만 허용하며 로그인·배포 보호 우회·캐시 만료 요청을 하지 않는다.

```bash
mise exec -- node docs/verification/artifacts/2026-10-21-tcp-publication-check.mts http://127.0.0.1:3021 /tmp/tcp-publication-local-20261021
mise exec -- pnpm test:repo
```

일반 URL 직접 접근과 목록 Link 클릭은 별도로 확인한다. 스트리밍 not-found의 HTTP 상태만으로 공개 본문을 판정하지 않고 `.mdx-wrapper`, 고유 본문과 제목·canonical·robots를 함께 검사한다.

## 결과와 증거

| 검사                    | 로컬 결과                                                                                         | 증거                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| MDX 실제 코드와 fixture | 14개 통과: strict 타입·각 3회 주소/포트·운영체제 소켓·본문, 음성 사례·선택 캡처 대기              | [원문 검사](../artifacts/2026-10-21-tcp-publication-source-tests.txt) |
| 콘텐츠·production build | 19개 문서 계약·스타일 통과, build 성공                                                            | 아래 경고 판정과 실행 명령                                            |
| 공개 상세               | ko 320/390/670/1280px, en 390/1280px의 6개 조건에서 고유 본문·H1 하나·index 허용·canonical 확인   | [로컬 JSON](../artifacts/2026-10-21-tcp-publication-local.json)       |
| 도식·조작               | 각 조건에서 이미지 2개 decode, 접기 4개·실제 clipboard 복사 통과, 가로 넘침·중첩 문단·pageerror 0 | 같은 JSON과 [모바일 도식](../artifacts/2026-10-21-tcp-packet-390.jpg) |
| 발견 경로               | 검색 API 유일한 대상 결과·ko/en sitemap·목록 카드 Link에서 상세 이동 통과                         | 같은 JSON                                                             |
| 저장소 회귀             | 58개 통과                                                                                         | `pnpm test:repo`                                                      |

콘텐츠 경고 1건은 본문의 “운영체제가 임시로 선택하는 포트” 중 `임시`를 placeholder 휴리스틱이 감지한 것이다. 실제 TODO나 미완성 문구가 아니므로 정확한 설명을 유지하고 검사기·경고 수준을 완화하지 않았다. 정상 종료 코드와 경고 존재를 구분한다.

[데스크톱 본문](../artifacts/2026-10-21-tcp-top-1280.jpg)과 모바일 도식을 직접 시각 확인했다. 이전 다중 에이전트의 기술·독자 이해·존댓말 검토는 본문과 도식이 동일한 범위에서 재사용한다. 새 패킷 캡처나 CPU 실험을 수행했다고 주장하지 않는다.

## 한계와 후속 작업

현재는 게시 브랜치의 로컬 검증이다. PR CI·CodeQL·리뷰, 승인된 main 병합, 같은 SHA의 CI·Production READY·공개 도메인 관측은 각각 별도 결과로 확인한다. 예전 PR의 성공을 이번 변경의 검증으로 대체하지 않는다.

실기기 Safari·관리자 tcpdump 재캡처·운영 장애 주입·캐시 무효화는 하지 않는다. 새로운 구조·공개 계약 변경이 없어 ADR을 추가하지 않았다. 10-16/10-20 문서의 “draft·미커밋 유지”는 당시 기록이며 현재 사용자 게시 승인과 구분한다.

## 관련 문서

- [이번 작업 기록](../../worklog/2026-10/2026-10-21-tcp-publication.md)
- [10-20 초안 재검증](2026-10-20-tcp-draft-recheck.md)
- [10-16 초안 준비](2026-10-16-tcp-draft-preparation.md)
- [main Production 배포 절차](../../runbooks/docs-main-production-deployment.md)
