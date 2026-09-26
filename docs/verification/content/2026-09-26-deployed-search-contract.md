# 공개 배포의 검색 입력 계약 재검증

## 대상과 조건

- 검사 시작: 2026-09-26 22:16:52 KST (`13:16:52.085Z`), 약 117초.
- 대상: `https://heap-forge.app`. 공개 GET·화면 입력·이동만 수행했다. 배포·캐시 삭제·웹훅·운영 설정 변경은 하지 않았다.
- 테스트 코드: `d7305af`의 기존 `search-query-policy.spec.ts`와 `about-author.spec.ts`. 이 커밋의 새 검색 이동 테스트를 운영에 실행한 것이 아니다.
- macOS, mise Node 24.12.0, Playwright 1.62.1 Chromium. 모바일 390×844·데스크톱 1280×800, worker 1, retry 0, timeout 60초, assertion timeout 15초.

## 재현 방법

실행 명령은 저장소 루트의 `mise exec -- pnpm --filter docs exec playwright test --config=/private/tmp/docs-adr0007-deployed.config.cjs`였다. 임시 설정은 webServer 없이 공개 도메인과 위 두 spec만 선택한다. 임시 파일이 사라지면 다음 동등한 설정을 `/tmp/docs-adr0007-deployed.config.cjs`에 작성하고 `apps/docs`를 cwd로 실행한다.

```js
const { defineConfig } = require(
  require.resolve("@playwright/test", { paths: [process.cwd()] }),
);
module.exports = defineConfig({
  testDir: `${process.cwd()}/e2e`,
  testMatch: ["search-query-policy.spec.ts", "about-author.spec.ts"],
  timeout: 60000,
  expect: { timeout: 15000 },
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: "/tmp/docs-adr0007-deployed-results.json" }],
  ],
  outputDir: "/tmp/docs-adr0007-deployed-output",
  use: { baseURL: "https://heap-forge.app", trace: "off" },
  projects: [
    {
      name: "deployed-mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "deployed-desktop",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
  ],
});
```

GitHub 상태는 저장소 루트에서 다음 읽기 명령으로 확인했다. ref는 시간이 지나면 바뀌므로 보고서의 SHA와 함께 읽는다.

```bash
gh api repos/IMHOJEONG/web-tech/commits/feature/docs/status
gh api 'repos/IMHOJEONG/web-tech/deployments?sha=1c7bac56a690233d320b1e4a2dc83627b277b3ba&per_page=20'
gh api repos/IMHOJEONG/web-tech/deployments/6631907084/statuses
git merge-base --is-ancestor 7e5115d 1c7bac56a690233d320b1e4a2dc83627b277b3ba
```

## 결과와 증거

- 14개 통과, 실패·제외·재시도 0개. [추출한 결과 JSON](../artifacts/2026-09-26-deployed-search-contract.json)에 테스트명·프로젝트·시간을 보존했다. 원본 응답·인증정보·사용자 콘텐츠는 포함하지 않는다.
- 검색 6개: 두 화면 크기에서 직접 URL/API의 첫 query·40 code point 제한·공백 처리, 헤더/본문의 이모지 제한·합성 IME 조합 중 제출 방지·조합 종료 제한을 확인했다. 검색 spec은 한국어 경로를 사용한다.
- About 8개: 한국어·영어 × 라이트·다크 × 두 화면 크기의 기존 콘텐츠·구조·포커스 회귀 검사다. ADR 검색 계약의 증거 수를 14개로 부풀리지 않는다.
- GitHub 원격 `feature/docs`는 `1c7bac56a690233d320b1e4a2dc83627b277b3ba`였다. 입력 계약 구현 `7e5115d68e057e143a8fb0e9fa78ec7580f25d5d`가 조상임을 exit 0으로 확인했다.
- GitHub deployment `6631907084`, 환경 `Production – web-tech`, 상태 `success`, 기록 시각 `2026-09-24T06:46:17Z`. [불변 배포 URL](https://web-tech-jqbs5lqfz-hojeong-ims-projects.vercel.app)과 [Vercel 상태 링크](https://vercel.com/hojeong-ims-projects/web-tech/EXsyw5nnZtm6CH8BgqjWKVr1jfTd)를 확인했다. vuln-radar의 별도 성공 상태는 docs 증거에서 제외했다.

## 한계와 후속 작업

- 이전 대화에서 언급한 “배포 후 14개 통과”의 원본은 저장소 기록에서 확인하지 못했다. 이번 14개는 오늘 새로 실행한 검사이며 과거 결과를 소급 복원한 것이 아니다.
- GitHub 배포 성공과 공개 도메인 화면 검사는 독립 증거다. 이 검사 중 Vercel alias의 불변 배포 매핑을 조회하지 않았으므로 공개 화면이 정확히 위 SHA라고 단정하지 않는다.
- NFC의 분해형 입력, 실제 OS IME, 영어 검색 흐름, Safari·Firefox·보조기기는 이번 공개 검사에서 검증하지 않았다. 로컬 계약 검사와 혼동하지 않는다.
- 데스크톱 본문 검색 테스트 하나는 약 36.7초였다. 통과는 지연이 적절하다는 뜻이 아니며 네트워크·원격 API·렌더링 중 어느 단계가 원인인지 계측하지 않았다.
- 미푸시 커밋의 CI 연결·원격 본문 검증·검색 이동 개선은 배포 검증 대상이 아니다. 특히 `d7305af`의 결과는 [로컬 이동 검증](2026-09-26-search-navigation.md)으로 구분한다.

## 관련 문서

- [ADR-0007](../../architecture/adr-0007-search-input-contract.md)
- [기존 구현 검증](../../worklog/2026-09/2026-09-23-adr-followup-improvements.md)
- [이번 문서 상태 갱신](../../worklog/2026-09/2026-09-26-search-adr-evidence.md)
