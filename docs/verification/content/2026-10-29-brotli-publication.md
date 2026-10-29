# Brotli 글 게시 전 검증

## 대상과 조건

- 검증: 2026-10-29 KST. 사용자 게시 승인 후 최신 main `0da7979b1d43c80ed28873a66fa9be222b2534d4`에서 Brotli 기고 커밋만 분리했다.
- 글: [Node.js Brotli 취약점, 실행 중인 런타임까지 확인하기](../../../apps/docs/category/be/node-js/node-brotli-runtime-security.mdx). `status: published`, 게시일·갱신일 2026-10-29. 기존 본문·출처·도식은 유지한다.
- 게시 상태의 MDX SHA-256: `d160b25a174df4d1ae66b50cef7ffab633f5341302d974adfb9a197c961d3e4b`.
- 격리 빌드의 checkout은 `a86ecbfebd77fdac462569025258b8ecd144edc3`이며 미커밋 차이는 이 글의 `status`·두 날짜 세 필드뿐이었다. 이 변경을 포함한 게시 커밋은 `2ac0f1d84058098c7c3d31a0057429b9488c1ccc`다. checkout·MDX hash·세 필드 차이를 함께 확인해 같은 게시 상태를 검사했다. 위 hash는 실제 빌드 디렉터리에서도 일치했다. 두 커밋 간 나머지 변경은 운영 검증 문서·증거·목차이며 앱 실행 코드는 같다.
- Node 24.22.1, pnpm 12.14.0, Next.js 16.4.3, Playwright 1.62.1. 원격 목록과 개발 검사 UI를 끈 격리 production 서버, 390/1280px × light/dark 4조건.

## 재현 방법

로컬 실험실의 기존 Brotli 검사 파일 네 개를 바꾸지 않고 별도 작업 폴더에 복사했다. 두 JSON 바인딩의 `articlePath`만 게시 작업 트리로, `sourcesPath`는 해당 작업 트리의 고정 upstream snapshot으로 지정했다. 실험실의 다른 미커밋 변경은 수정하지 않았다. 아래 첫 명령은 바인딩을 준비한 검사 폴더에서, 빌드 명령은 게시 변경을 복사한 격리 저장소에서 실행했다.

```bash
node --test scripts/brotli-article-source.test.mts scripts/brotli-decoder-source.test.mts
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false CI=true pnpm --filter docs build
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false DOCS_ENABLE_REACT_INSPECTION=false \
  pnpm --filter docs exec next start --hostname 127.0.0.1 --port 3051
```

실제 방문 경로는 `/ko/docs/category/be/node-js/node-brotli-runtime-security`다. Chromium에서 본문 H1·원인 설명, 이미지 로드와 alt, diff 추가/삭제 행, 클립보드와 코드의 정확한 일치, 문서 전체 가로 넘침을 확인했다. 검색은 `/ko/docs?q=Brotli`의 실제 카드 Link를 클릭했다. ko/en 상세·feed와 `/sitemap.xml`도 확인했다.

## 결과와 증거

- [원문 검사 출력](../artifacts/2026-10-29-brotli-publication-source-tests.txt): 원문 실행·엄격 타입·정상 Brotli 왕복·여섯 C/diff 발췌 및 음성 대조군 **16개 통과, 실패/skip 0**. 정상 입력 624바이트 → 54바이트, 복원 일치. 실행·fixture 각 3회.
- 격리 production 빌드: 성공. 20개 콘텐츠 검사 포함. 임시 diff 미리보기 글은 복사하지 않았다. 최초 실행의 전체 transcript는 보존하지 못했으므로, 같은 checkout과 게시 metadata로 다시 빌드해 exit 0과 [재실행 전체 로그](../artifacts/2026-10-29-brotli-publication-build.log)를 보존했다. 로그 SHA-256은 `f6c230ef105ce83d92a146981a1fe459fd20e549bab4555aafc4e0f188de8f1d`다. 10-28 content 검사 artifact를 이번 빌드의 증거로 대신하지 않는다.
- [실제 화면 관측](../artifacts/2026-10-29-brotli-publication-local.json): 네 조건 모두 상세 200·본문 표시·이미지 네 개 로드·정확한 복사, 문서 가로 넘침 0px. [모바일 dark](../artifacts/2026-10-29-brotli-publication-390-dark.jpg), [데스크톱 light](../artifacts/2026-10-29-brotli-publication-1280-light.jpg).
- ko/en 상세·feed와 사이트맵, 검색 카드 실제 이동: 통과. 상태 코드만으로 not-found 여부를 판단하지 않고 글 제목과 본문을 함께 확인했다.
- 콘텐츠 검사의 새 placeholder 경고는 `임시 보호`, `8바이트 임시 입력 버퍼`라는 기술 용어가 `/임시/` 규칙과 일치한 결과다. 미완성 문구가 아니므로 본문이나 검사 기준을 바꾸지 않았다. 기존 TCP 글의 같은 경고와 구분한다.
- 최초 브라우저 실행은 macOS 권한 제한으로 종료됐고 허용된 실행에서 재검사했다. 초기 검사기의 light class 가정·검색 카드 accessible name 가정은 실제 앱의 테마 저장 방식·경로와 제목을 함께 검사하는 선택자로 수정했다. 최종 네 조건과 검색 동선을 모두 다시 통과했다.

## 한계와 후속 작업

현재 결과는 로컬 production이다. 원격 PR CI·main 병합·Vercel Production 확인은 별도 단계이며, 아직 완료로 간주하지 않는다. 악성 입력·취약점 악용·실제 NAS 런타임 패치·WAF 차단을 검증한 결과가 아니다. upstream C 발췌는 고정 소스 대조이며 부분 C를 컴파일하지 않았다. 본문에서 별도로 명시한 Vercel 확인일 10-28은 과거 확인 시점으로 유지했다.

PR #76의 초기 게시 커밋 `2ac0f1d`는 [원격 CI](https://github.com/IMHOJEONG/web-tech/actions/runs/40799988279) 13개 job·종합 Test가 모두 통과했다. CodeQL·두 Vercel Preview도 통과했다. CodeRabbit의 문서 보완 두 건(격리 빌드 기준 커밋·보존 transcript)에 따라 위 식별자를 명시하고 빌드를 재실행했다. 이 문서 보완 후 새 head의 CI·리뷰를 재확인해야 하며 이전 성공을 새 head의 결과로 간주하지 않는다.

## 관련 문서

- [기존 초안 검토·근거](2026-10-28-brotli-security-article.md)
- [게시 작업 기록](../../worklog/2026-10/2026-10-29-brotli-publication.md)
- [KAN-44](https://web-tech-service.atlassian.net/browse/KAN-44)
