# 카테고리 번역과 OG 캐시의 운영 후속 검증

## 대상과 조건

- 검증일: 2026-10-06 KST, 브라우저·OG 검사 완료 22:45:32.
- 대상: `feature/docs` 커밋 `13d7267c7f0481bd2b4523836cbdec48984e4e0f`, 공개 `https://heap-forge.app`.
- GitHub Vercel 상태와 도메인의 Production READY 배포 `dpl_E42JteK9LsHZWn96ghCmv3KRnqkd`가 일치한다.
- Node.js 24.12.0과 Playwright의 설치된 Chrome 채널을 headless 사용했다. 1280×844·390×844, ko/en의 전체·FE·React·Node.js 카테고리 16개 조건이다.
- 공개 GET만 수행했다. NAS·WAF·Cloudflare 설정·캐시 purge·웹훅 POST·보호 우회 토큰 생성은 하지 않았다.

## 재현 방법

저장소 루트에서 커밋별 검사와 실제 도메인의 배포를 확인했다.

```sh
gh api repos/IMHOJEONG/web-tech/commits/13d7267c7f0481bd2b4523836cbdec48984e4e0f/check-runs
gh api repos/IMHOJEONG/web-tech/commits/13d7267c7f0481bd2b4523836cbdec48984e4e0f/status
vercel inspect heap-forge.app --scope hojeong-ims-projects --format=json
gh api repos/IMHOJEONG/web-tech/dependabot/alerts/336
mise exec -- node /private/tmp/heap-forge-followup-20261006.ts
```

마지막 파일은 이 머신의 임시 verifier이며 저장소 CI 테스트가 아니다. 검사 조건은 [지속 관리되는 번역 E2E](../../../apps/docs/e2e/category-localization.spec.ts)를 참조했다. 브라우저에서 ko/en 각각 `/category`, `/category/fe`, `/category/fe/react`, `/category/be/node-js`를 두 viewport로 열어 H1·주제 설명·최근 업데이트·기존 글 링크·noindex 부재·가로 넘침을 비교하면 된다. 문서 수 label의 세부 검사는 이번 운영 probe에 포함하지 않았다.

OG는 HEAD가 아닌 GET 본문으로 확인했다.

```sh
curl -sS -D - -o /tmp/heap-forge-og.png \
  'https://heap-forge.app/og/article.png?title=HEAP-FORGE&topic=WEB'
curl -sS -D - -o /tmp/heap-forge-og-fresh.png \
  'https://heap-forge.app/og/article.png?title=HEAP-FORGE&topic=WEB&v=ttl-check-20261006'
```

인증·쿠키·보호 우회 값을 로그나 artifact에 공유하지 않는다. `gh run list --branch feature/docs`는 빈 목록을 반환했지만 커밋 check-runs에는 성공 기록이 존재했다. 빈 목록만으로 CI 미실행을 판단하지 않았다.

## 결과와 증거

[관측 JSON](../artifacts/2026-10-06-deployed-followup.json)은 공개 UI 문구와 허용된 응답 헤더만 담는다.

| 검사                | 결과                                                                                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI·문서 검사        | [CI](https://github.com/IMHOJEONG/web-tech/actions/runs/37323830238)·[Documentation](https://github.com/IMHOJEONG/web-tech/actions/runs/37323830398)와 Vercel Preview Comments 포함 check-run 8개 success |
| 배포 연결           | GitHub의 web-tech 배포와 공개 도메인의 READY 배포 일치                                                                                                                                                    |
| 카테고리            | 16개 조건 통과. 영어 H1·주제 설명·최근 업데이트 번역 확인, 작성된 한국어 글 제목과 기존 href 유지                                                                                                         |
| 가로 넘침·실행 오류 | 대상 카테고리에서 가로 넘침 없음, pageerror 0개                                                                                                                                                           |
| 공개 OG             | 2개 GET 모두 200, PNG signature·1200×630·nosniff 통과                                                                                                                                                     |
| OG 브라우저 TTL     | 두 URL 모두 `public, max-age=14400`: 앱의 1시간 계약과 불일치                                                                                                                                             |
| 원격 Browser 제목   | 공개 상세 H1은 여전히 `Browser 동작 원리`, `Update!` 두 개                                                                                                                                                |
| 잔여 보안 알림      | Dependabot #336 open·High, `braces`                                                                                                                                                                       |

OG 두 응답은 모두 Cloudflare MISS·Vercel MISS·Age 0이었다. 따라서 이전 URL의 캐시 HIT만으로 4시간 TTL을 설명할 수는 없다. Cloudflare zone·Cache Rules는 읽지 않았으므로 특정 규칙을 원인으로 확정하지 않는다. 이번에는 Vercel origin 직접 비교와 실제 1일 CDN 만료를 검사하지 않았다. [전날의 origin 비교](2026-10-05-deployed-blog-smoke.md)와 [분리 헤더 운영 절차](../../runbooks/docs-seo-metadata-routes.md)를 함께 참고한다.

잔여 [공식 advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)는 `braces <=3.0.3`의 깊은 중첩 패턴으로 인한 스택 소진 DoS를 High로 분류하며 패치 버전은 None이다. 입력 허용 목록을 강화한 것과 패키지 취약점 제거는 다르다. 이번에 exploit 입력을 운영 서버로 보내거나 전체 의존성을 다시 audit하지 않았다.

## 한계와 후속 작업

1. Cloudflare Browser Cache TTL·해당 OG 경로 Cache Rules를 확인하고 origin 헤더 존중 후 공개 `max-age=3600`을 재검증한다. 설정 변경은 별도 승인과 운영 작업이다.
2. 원격 H1은 사용자가 NAS 원문에서 정리한다. 프론트에서 H1을 H2로 자동 보정하지 않는다. 원문 수정·게시 갱신 후 H1을 다시 확인한다.
3. `braces` 사용 경로와 제거 가능한 의존성 대안을 조사하고 공식 패치를 추적한다. 다른 서비스까지 안전하다고 일반화하지 않는다.

이번 범위는 번역 배포와 공개 응답 표본이다. Safari·Firefox·실제 기기·전체 라우트·NAS 원문 수정·웹훅 갱신·캐시 만료·Runtime Logs 전체 오류 유무는 미검증이다. 새 글·CSS의 기존 미커밋 변경은 보존했고 앱 코드는 수정하지 않았다.

## 관련 문서

- [전날 운영 점검](2026-10-05-deployed-blog-smoke.md)
- [카테고리 번역 구현](../../worklog/2026-10/2026-10-05-category-localization.md)
- [OG 헤더 분리 구현](../../worklog/2026-10/2026-10-05-og-cache-header-boundary.md)
- [이번 작업 기록](../../worklog/2026-10/2026-10-06-deployed-followup.md)
- [후속 TODO](../../todo/todo.md#ui--ux)
