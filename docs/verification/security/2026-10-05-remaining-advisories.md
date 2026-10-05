# 잔여 취약점의 의존성 경로와 입력 경계 조사

## 대상과 조건

- 검토일: 2026-10-05, Asia/Seoul.
- 로컬 기준: `codex/security-fast-uri-multer`, main `2dde9133a766a08089bcaa5111d2db713dcfc9fa` 기반의 미커밋 의존성 갱신 상태.
- 배포 브랜치 코드 비교: fetch 후 `origin/feature/docs`의 `a51966182b8a844bda9c03b610220d93899f1a5b`.
- 환경: Node.js 24.12.0, pnpm 11.10.0. registry audit, 공식 GitHub advisory, npm 릴리스 목록, 저장소 코드를 대조했다.
- 실제 운영 서버에 공격 입력을 보내거나 RCE·서버 중단을 재현하지 않았다. 원격 Git 참조와 실제 배포 SHA의 일치 여부는 미검증이다.

## 재현 방법

저장소 루트에서 의존성과 릴리스를 조회했다.

```bash
git fetch origin main feature/docs
mise exec -- pnpm why -r next brace-expansion braces
mise exec -- pnpm audit --json
mise exec -- pnpm audit --prod --json
mise exec -- pnpm view next@16.3.6 version engines --json
mise exec -- pnpm view brace-expansion@5.0.12 version engines --json
mise exec -- pnpm view braces version versions --json
git grep -n -E 'ImageResponse|next/og|@vercel/og|satori|resvg' origin/feature/docs -- apps packages
git show origin/feature/docs:apps/docs/app/og/article.png/route.tsx
git show origin/feature/docs:apps/docs/lib/article-sharing.ts
git show origin/feature/docs:apps/docs/lib/get-category.ts
```

`apps/docs`에서 짧고 정상적인 brace 문법을 사용해 패턴 해석만 확인했다. 파일 검색이나 HTTP 요청은 실행하지 않았다.

```bash
mise exec -- node --input-type=module -e '
import fg from "fast-glob";
for (const sub of ["react", "{react,v8}"]) {
  console.log(JSON.stringify({
    sub,
    tasks: fg.generateTasks(`category/fe/${sub}/*.{md,mdx}`)
      .map(task => ({base: task.base, patterns: task.patterns}))
  }));
}'
```

## 결과와 증거

### 경고 수와 실제 패키지 수

전체 audit은 **5개 경고, 3개 패키지**였다. critical 1개·high 3개·moderate 1개다. production audit에는 **Next.js critical·braces high 2개**가 남았다. brace-expansion의 3개 경고는 이번 의존성 그래프에서 개발 도구 경로로 분류됐다.

| 패키지          | 현재 버전 | 경고                  | 확인된 대표 경로                                      | 조치 판단                                                  |
| --------------- | --------- | --------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| next            | 16.3.4    | critical 1개          | docs -> next                                          | 패치 16.3.6 이상과 관련 Next 패키지 정렬                   |
| brace-expansion | 5.0.9     | high 2개·moderate 1개 | ESLint·Jest·Nest CLI -> minimatch -> brace-expansion  | 5.0.12 이상, glob·CLI 회귀 확인                            |
| braces          | 3.0.3     | high 1개              | docs -> fast-glob 3.3.3 -> micromatch 4.0.8 -> braces | 공식 패치 미출시. 입력 경계 보강과 상위 패키지·대체안 검토 |

`origin/feature/docs`의 lockfile에서도 세 패키지는 각각 같은 버전이었다. 따라서 main만 갱신하고 배포 브랜치에 전달하지 않으면 해당 브랜치의 의존성은 그대로 남는다.

### Next.js: 취약 버전과 공격 조건은 구분

[공식 advisory](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j)는 Node.js의 `next/og` ImageResponse에 공격자가 제어하는 SVG 콘텐츠·속성·스타일을 전달할 때 RCE가 가능하다고 설명한다. Edge 구현 또는 해당 입력을 전달하지 않는 앱은 이 advisory의 영향 조건에서 제외된다.

main에서는 앱 코드의 ImageResponse 사용처를 찾지 못했다. 반면 `origin/feature/docs`에는 `/og/article.png`가 있고 `runtime = 'nodejs'`이며 query의 title·topic·author를 받는다. `normalizeOgText`가 길이·제어문자를 정리하고, 값은 `<div>`·`<span>`의 JSX 텍스트로 들어간다. 확인한 구현에는 요청값을 SVG 속성·스타일이나 raw SVG 마크업으로 직접 넣는 경로가 없었다.

따라서 **취약 버전 사용은 확정, 이 코드의 RCE 도달 가능성은 미확정**이다. 일반 JSX 텍스트도 이미지 생성 과정에서 내부 SVG로 변환될 수 있으므로 정적 검토만으로 완전한 안전을 주장하지 않는다. 길이 제한 역시 보안 패치를 대체하지 않는다. 패치 버전 16.3.6은 registry에 존재하며 Node.js 요구 사항은 `>=20.9.0`으로 Node 24와 호환된다.

### brace-expansion: 개발 도구의 가용성 문제

다음 세 경고는 중첩 brace 파싱의 스택 고갈 또는 재작성 비용 증가에 대한 것이다. 신뢰할 수 없는 glob 패턴을 처리하는 경우 문제가 된다.

- [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7): 중첩 그룹 확장 재귀, 5.0.11에서 패치.
- [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p): parseCommaParts의 재귀·배열 인자 처리, 5.0.10에서 패치.
- [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr): brace 재작성의 이차 시간 비용, 5.0.12에서 패치.

현재 override `>=5.0.7`은 새 경고의 취약 버전 5.0.9를 허용한다. 세 경고를 모두 처리하는 같은 major의 최소 버전은 5.0.12이며 실제 릴리스가 존재한다. Node.js 요구 사항 `20 || >=22`도 Node 24와 호환된다. 현재 production audit에 없지만 CI·개발 도구 입력의 가용성 문제는 별도로 고려한다.

### braces: 미출시 패치와 공개 입력 경계

여기서는 이름이 유사한 `brace-expansion`과 다른 패키지인 **`braces`**를 다룬다. 하나의 override로 둘 다 해결되지 않는다.

[공식 advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)는 3.0.3 이하의 중첩 패턴에서 스택 고갈 가능성을 설명하며 패치 버전은 `None`으로 표시한다. audit은 `>=3.0.4`를 패치 범위로 반환했지만 `pnpm view braces version versions`에는 최신 3.0.3까지만 존재했다. **audit의 비취약 범위 표기를 실제 패치 릴리스로 해석하면 안 된다.** 이번에 `braces >=3.0.4` override를 추가하지 않았다.

`apps/docs/lib/get-category.ts`의 getSubCategoryData·getCategoryData는 main·sub를 `category/${main}/${sub}/*.{md,mdx}`에 직접 삽입한다. 공개 카테고리 목록·상세 리다이렉트 라우트는 URL params를 그대로 전달하며, glob 실행 전에 categoryTree allowlist로 확인하지 않는다. findCategoryLabels는 표시 이름을 계산할 뿐 입력을 차단하지 않는다. 이 경로는 main과 비교한 feature/docs 코드에 모두 있다.

짧은 입력의 관측 결과는 다음과 같다.

| sub 입력   | generateTasks의 base              |
| ---------- | --------------------------------- |
| react      | category/fe/react                 |
| {react,v8} | category/fe/react, category/fe/v8 |

즉 URL 값이 단순 디렉터리 이름이 아니라 glob 문법으로 해석될 수 있는 입력 경계를 확인했다. 설치된 fast-glob 코드도 task 생성 중 `micromatch.braces(..., {expand: true})`를 호출하며 micromatch는 braces를 사용한다. HTTP 공격 재현이나 장애 발생을 확인한 결과는 아니다.

우선 허용된 main·sub 조합을 categoryTree로 검증하고 잘못된 값은 glob 실행 전에 거부하도록 보강하는 것이 적절하다. 이 조치는 해당 URL 경로의 위험을 줄이지만 패키지 전체의 경고를 없애지는 않는다. 검색 인덱스의 고정 패턴과 카테고리 URL 입력은 구분해 검사한다. 상위 패키지 패치 추적, glob 대신 디렉터리 순회 등 제거 대안은 별도 검토한다.

## 한계와 후속 작업

- Next.js 패치·카테고리 입력 allowlist 보강을 우선 처리하고 brace-expansion 갱신·CLI 검사를 진행한다. 이번 턴에는 패키지나 앱 코드를 추가 수정하지 않았다.
- braces의 미출시 버전을 강제하거나 이름이 다른 패키지로 alias하지 않는다. 단순 `braceExpansion: false`만으로 모든 parser 경로가 안전해졌다고 판정하지 않는다.
- 공용 allowlist 경계에 정상 분류, 잘못된 main/sub 조합, glob 문자 입력의 비실행 검사를 추가한다. 운영 서버에 깊게 중첩된 공격 패턴을 보내지 않는다.
- 이 보고서는 로컬 그래프·원격 브랜치 코드 조사이며 현재 Vercel 배포 SHA·실제 공격 성공 가능성을 검증한 것이 아니다. 패치 후 main 병합, feature/docs 동기화, CI·배포를 함께 확인한다.

## 관련 문서

- [후속 패치·입력 경계 구현 검증](2026-10-05-next-category-hardening.md): 이 조사 이후의 갱신 상태이며 당시 관측값과 구분한다.
- [기존 보안 갱신 검증](2026-10-05-fast-uri-multer.md)
- [조사 작업 기록](../../worklog/2026-10/2026-10-05-remaining-advisories-review.md)
- [보안 후속 TODO](../../todo/todo.md#dependency-security)
