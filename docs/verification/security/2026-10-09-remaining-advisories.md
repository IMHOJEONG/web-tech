# 잔여 의존성 취약점과 패치 가용성 재점검

## 대상과 조건

- 검증일: 2026-10-09, Asia/Seoul.
- 기준: `feature/docs`, `c574bbd`. NAS 검증 보류 문서와 다른 글 초안의 미커밋 변경은 보존했다.
- 환경: Node.js 24.12.0, pnpm 11.10.0, 현재 lockfile에 대한 registry audit·공식 advisory·소스 정적 조사.
- 패키지 설치·갱신, lockfile 변경, 공격 재현, NAS SSH 접속, 운영 요청·배포는 수행하지 않았다. 배포 컨테이너의 실제 버전과 설정은 별도 확인 대상이다.

이 보고서는 `c574bbd`의 **패치 전 조사 기록**이다. 이후 PR #36의 패치가 main과 feature 브랜치에 반영됐다. 당시 audit·registry 관측값은 변경하지 않으며 현재 구현과 회귀 결과는 [후속 패치 검증](2026-10-09-security-patches.md)을 참고한다. 운영 배포 검증과는 구분한다.

## 재현 방법

저장소 루트에서 실행한다. audit 종료 코드 1은 취약점 발견이며 검사 도구가 실행되지 않았다는 뜻이 아니다.

```bash
mise exec -- pnpm audit --prod --json
mise exec -- pnpm audit --json
```

실제 패치 출시와 상위 의존성 범위를 조회했다. `pnpm view`는 설치 명령이 아니다.

```bash
mise exec -- pnpm view proxy-addr@2.0.8 version engines --json
mise exec -- pnpm view source-map-js@1.2.2 version engines --json
mise exec -- pnpm view sharp@0.35.5 version engines --json
mise exec -- pnpm view seroval@1.6.3 version engines --json
mise exec -- pnpm view katex@0.18.2 version engines --json
mise exec -- pnpm view postcss-selector-parser@7.1.6 version engines --json
mise exec -- pnpm view braces version engines --json
mise exec -- pnpm view rehype-katex version dependencies peerDependencies --json
mise exec -- pnpm view @tailwindcss/typography version dependencies peerDependencies --json
mise exec -- pnpm view @tailwindcss/typography@0.5.19 dependencies --json
```

## 결과와 증거

production **5건**(critical 1, high 3, low 1), 전체 **7건**(critical 1, high 4, moderate 1, low 1)이다. 두 audit 모두 종료 코드 **1**이다. 앞선 5건 외에 새로운 advisory가 추가되지는 않았다. `braces`는 개발 도구에만 남는다. [정제된 실행 요약](../artifacts/2026-10-09-remaining-advisories.json).

### 운영 의존성 5건

| 패키지        | 현재 → 확인한 패치 | 심각도   | 주된 의존 경로                                     |
| ------------- | ------------------ | -------- | -------------------------------------------------- |
| proxy-addr    | 2.0.7 → 2.0.8      | critical | 두 backend → NestJS platform-express → Express     |
| sharp         | 0.35.4 → 0.35.5    | high     | docs → Next.js → sharp, optional 의존성            |
| source-map-js | 1.2.1 → 1.2.2      | high     | docs의 PostCSS·Sass·sanitize-html, vuln-radar Sass |
| seroval       | 1.6.2 → 1.6.3      | high     | vuln-radar → TanStack router-core/seroval-plugins  |
| katex         | 0.16.45 → 0.18.2   | low      | docs → rehype-katex                                |

다섯 패치 모두 registry에 실제 존재한다. engines가 명시된 네 패키지는 Node 24 범위를 허용한다. KaTeX 조회에는 engines 필드가 없으므로 Node 호환성 검증 완료로 표시하지 않는다. 설치·빌드·동작 호환성은 다섯 패키지 모두 미검증이다.

### 영향 조건과 코드 근거

1. **proxy-addr:** [공식 advisory](https://github.com/advisories/GHSA-jqcg-44mw-7w3h)의 IPv4-mapped IPv6 신뢰 subnet 조건에서 전달 IP를 위조할 수 있다. 두 backend의 `src/main.ts`, vuln-radar의 `bootstrap/app-bootstrap.ts`와 전체 `src` 검색에서는 `trust proxy` 설정을 찾지 못했다. [Express 기본값](https://expressjs.com/en/guide/behind-proxies/)은 false다. 따라서 현재 소스에서 취약 신뢰 설정을 확인한 것은 아니다. 운영 이미지·추가 middleware·프록시 설정의 동일성은 미검증이므로 패치 필요성을 없애는 근거로 삼지 않는다.
2. **sharp:** [공식 advisory](https://github.com/advisories/GHSA-wq5f-xc86-pv6w)는 librsvg의 메모리 문제와 특정 glibc Linux 조건의 RCE 가능성을 설명한다. prebuilt sharp 0.35.5는 수정 librsvg를 포함하며 시스템 librsvg 사용 시에는 해당 라이브러리도 확인해야 한다. docs의 `next.config.mjs`에는 `dangerouslyAllowSVG` 활성화가 없다. 이것만으로 모든 SVG decoding 경로·운영 바이너리 조건이 차단됐다고 증명하지 않는다. optional이라는 이유로 운영 영향에서 제외하지 않는다.
3. **source-map-js:** [공식 advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)는 공격자 제공 indexed source map의 비정상 offset에 의한 이벤트 루프 DoS다. 대부분 빌드 의존 경로지만 `sanitize-html → postcss`도 있어 production 목록에 포함된다. 현재 앱 소스에서 외부 source map을 직접 받는 경로는 확인하지 못했다. 전이 코드의 도달성까지 증명한 것은 아니므로 패치와 CSS·sanitizer 회귀 검사를 함께 수행한다.
4. **seroval:** [공식 advisory](https://github.com/advisories/GHSA-jp82-f5mq-hwhp)는 신뢰하지 않는 JSON 역직렬화에서 TypedArray 길이 검사 부족에 따른 CPU/메모리 고갈이다. vuln-radar는 Vite SPA이며 앱 소스에서 `fromJSON`, `fromCrossJSON`, SSR hydration 사용을 찾지 못했다. TanStack 내부 경로 전체의 비도달 증명은 아니다. 기존 override `>=1.5.3`는 1.6.2도 허용하므로 이번 패치를 보장하지 않는다.
5. **KaTeX:** [공식 advisory](https://github.com/advisories/GHSA-238p-pmpm-9mq7)는 다른 취약점으로 이미 prototype이 오염된 경우 trust 제한을 우회할 수 있다는 내용이다. KaTeX 자체가 prototype pollution을 생성한다는 뜻은 아니다. docs Next MDX 설정에는 `rehype-katex`가 있지만 동적 상세의 `lib/render-article-content.ts`에는 없다. 원격 HTML sanitizer 존재만으로 모든 로컬 MDX 결과도 안전하다고 단정하지 않는다.

### 단순 업데이트가 아닌 항목

- `rehype-katex` 최신은 조회 시점 7.0.1이며 KaTeX를 `^0.16.0`으로 요구한다. 패치 0.18.2는 이 범위를 벗어난다. 상위 패치 또는 수식 기능의 실제 필요성을 먼저 검토하고, override를 택하면 수식 렌더링·CSS·타입·오류 처리 회귀를 추가한다.
- `@tailwindcss/typography` 설치본 0.5.19와 최신 0.5.20 모두 `postcss-selector-parser@6.0.10`을 고정한다. 상위 버전만 올려서는 해결되지 않는다. 소스 검색에서 plugin 등록은 찾지 못했지만 `article-page-shell.tsx`의 `prose` 클래스가 있으므로 미사용 제거는 별도 판단·화면 회귀가 필요하다.
- 기존 sharp override `>=0.35.4` 역시 취약 0.35.4를 허용한다. lockfile과 버전 하한을 함께 검토해야 한다. 이번 조사에서 override는 변경하지 않았다.

### 개발 의존성 2건

- `braces@3.0.3`, high: ESLint/fast-glob과 두 backend ts-loader 경로. [공식 advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)에는 출시 패치가 없으며 registry 최신도 3.0.3이다. audit의 `>=3.0.4`를 설치 가능한 버전으로 취급하지 않는다. docs 운영 경로 제거는 [별도 검증](2026-10-09-braces-runtime-removal.md) 범위다.
- `postcss-selector-parser@6.0.10`, moderate: docs Typography 개발 경로. 패치 7.1.6 출시 확인. [공식 advisory](https://github.com/advisories/GHSA-rj75-hqrm-r3gf)의 공격 조건은 신뢰하지 않는 selector를 동기 파싱하는 경로이며 일반적인 신뢰 소스 빌드와 구분한다. 6→7 전환은 상위 호환성 검증 없이 일괄 강제하지 않는다.

## 한계와 후속 작업

- 감사 결과는 현재 checkout의 lockfile 기준이다. GitHub 기본 브랜치 Dependabot 상태, 운영 배포의 패치 여부와 일치한다고 가정하지 않는다. 악용이나 침해를 발견했다는 결과가 아니다.
- 안전한 조사만 실행했다. DoS/RCE 입력·prototype 변경·운영 IP 위조 검사는 수행하지 않았다. 앱 회귀 테스트를 다시 실행하거나 갱신 검증이 끝났다고 표시하지 않는다.
- 조치 순서는 proxy-addr 우선, sharp·source-map-js·seroval 패치, KaTeX/selector의 상위 호환성 또는 제거 검토, braces 패치 추적이다. 공통 의존성은 main 기반 별도 보안 브랜치에서 검사하고 병합 후 feature에 전파한다.
- NAS 게시·백업 보류를 해제하거나 SSH를 열 필요 없이 로컬 의존성 수정·회귀 검사를 진행할 수 있다. NAS 운영 이미지 검증·재배포는 이후 별도 승인 범위다.

## 관련 문서

- [보안 TODO](../../todo/todo.md#dependency-security)
- [작업 기록](../../worklog/2026-10/2026-10-09-remaining-advisories.md)
- [docs 운영 glob 경로 제거](2026-10-09-braces-runtime-removal.md)
