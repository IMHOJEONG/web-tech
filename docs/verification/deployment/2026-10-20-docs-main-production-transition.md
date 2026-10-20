# 블로그 main Production 전환 검증

## 대상과 조건

- 검증일: 2026-10-20 KST. 상세 UTC 시각은 아래 artifact에 기록했다.
- main SHA: `ebc61ad4f0700e71437315a255872c790093bb94`.
- 프로젝트: Vercel `web-tech`, root `apps/docs`, Node `24.x`.
- 도구: Vercel CLI 53.1.1, Node 24, 저장소의 Playwright Chromium.
- 전환 전: `feature/docs`, SHA `23fcab4376f72797cd97913217569ed5c03666a5`, Production `dpl_3pvjKDwvTcDPhZ4Caxokprdbdno5`.
- main Preview: `dpl_AKNA65fw26HBDydeuzV1WX8TuZ1r`.
- 전환 후: Production Branch `main`, Production `dpl_FnvNrJEPhWTMwtvcqAe44uXV4zDJ`, 공개 도메인 `heap-forge.app`.

## 재현 방법

저장소 루트에서 아래 식별자를 사용했다. HTTP·브라우저 검사는 실행 당시 임시 하네스로 수행했고,
지속 운영 절차는 [runbook](../../runbooks/docs-main-production-deployment.md)에 분리했다.
원격 프로젝트 응답·토큰·쿠키는 artifact에 포함하지 않았다.

```bash
gh run view 39277930536 --repo IMHOJEONG/web-tech
vercel inspect dpl_FnvNrJEPhWTMwtvcqAe44uXV4zDJ --wait --timeout 8m \
  --scope hojeong-ims-projects
vercel curl /ko/feed --deployment dpl_FnvNrJEPhWTMwtvcqAe44uXV4zDJ \
  --scope hojeong-ims-projects
node --experimental-strip-types /tmp/docs-deploy-http-smoke.mts \
  main-production https://heap-forge.app
node /tmp/docs-main-browser-smoke.cjs main-production
node /tmp/docs-main-public-boundaries.cjs
vercel logs dpl_FnvNrJEPhWTMwtvcqAe44uXV4zDJ --no-follow --no-branch \
  --level error --since 20m --scope hojeong-ims-projects
```

임시 스크립트 경로는 실행 명령의 기록이지 저장소에 설치된 명령이 아니다.
13개 HTTP 경로는 `/ko/feed`, `/ko/docs`, `/ko/docs?q=stream`, `/ko/web`, `/ko/mobile`,
`/ko/ui-ux`, `/ko/about`, `/en/feed`, 로컬 상세 2개, 원격 `/ko/docs/web/browser`, robots와 sitemap이다.
로컬 상세는 JavaScript Event Loop와 Node.js HTTP 스트리밍 글을 표본으로 선택했다.
상태 코드뿐 아니라 제목·본문 종류·오류 화면 부재도 함께 검사했다.

## 결과와 증거

| 검사                     | 결과                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 동일 main SHA 검사       | CI run `39277930536` 및 Documentation·CodeQL·백엔드 이미지 workflow 성공. 전환 직전 commit check 17개가 success/skipped/neutral의 완료 상태임을 재확인 |
| Preview                  | HTTP 13/13 통과                                                                                                                                        |
| Production 환경 스테이징 | HTTP 13/13, Chromium 1280×800 라이트·390×844 다크 통과                                                                                                 |
| 운영 공개 도메인         | 인증 우회 없이 HTTP 13/13, 위 두 Chromium 조건 통과                                                                                                    |
| 사용자 동작              | 피드 카드 → 로컬 본문/코드, 본문 검색 제출, 데스크톱 About 이동, 모바일 Drawer 이동·닫기 통과                                                          |
| 화면·이미지              | 두 폭에서 가로 넘침 0, 공개 피드의 화면 내 이미지 데스크톱 2개·모바일 1개 로드, uncaught pageerror 및 동일 origin 5xx 0                                |
| 설정                     | root·Node·전역 자동 도메인 할당·Production 환경변수 key 목록·도메인 연결·Preview 보호 유지                                                             |
| 공개 경계                | 로컬 상세 canonical 정상, 토큰 없는 revalidation POST 401, 기존 vercel.app 도메인 307 리디렉션, Preview 미인증 302                                     |
| Runtime Logs             | 스테이징·승격 후 표본 각 50건 모두 info. 별도 최근 20분 error·HTTP 5xx 조회 각 0건                                                                     |
| 배포 출처                | alias 조회에서 `heap-forge.app` → 새 배포 ID, 배포 Git ref main 및 SHA 일치                                                                            |
| 보존                     | feature/docs 로컬·원격 SHA 불변, 모든 기존 feature ref·stash 목록 불변, 비공개 초안 23개 SHA-256 일치                                                  |
| 다른 서비스              | vuln-radar Production Branch와 현재 운영 배포 ID 불변                                                                                                  |

- [main CI 실행](https://github.com/IMHOJEONG/web-tech/actions/runs/39277930536)
- [Production 배포](https://vercel.com/hojeong-ims-projects/web-tech/FnvNrJEPhWTMwtvcqAe44uXV4zDJ)
- [민감정보를 제외한 원본 검증 집계](../artifacts/2026-10-20-docs-main-production-transition.json)

스테이징 생성과 branch 변경 사이에도 기존 운영 alias가 이전 Production을 가리키는지 확인했다.
Production 환경으로 만든 격리 배포가 검증된 뒤 branch를 바꾸고 `vercel promote`로 도메인을 승격했다.
프로젝트 전역 자동 도메인 할당을 끄지 않았고 GitHub SHA를 소스로 사용해 로컬 초안 업로드를 피했다.
설정 비교의 필드 별칭 오류 한 건은 실제 `enableAffectedProjectsDeployments` 필드로 재검증해 보존을 확인했다.

## 한계와 후속 작업

- 단일 시점의 smoke이며 실제 사용자 전체·실기기·Safari/Firefox·전 세계 리전 성능을 보증하지 않는다. CLI 왕복 시간과 공개 HTTP 시간을 성능 개선 수치로 비교하지 않는다.
- Runtime Logs는 조회 시점과 표본 제한이 있다. 상세 건수는 artifact를 따른다. source 로그가 표본에 없으면 local/remote 신규 origin 요청 발생까지 입증한 것으로 보지 않는다.
- 기존 콘텐츠 작성 문구·번역 전체를 교정하거나 NAS 원문을 수정하지 않았다. 실제 운영 콘텐츠 발행과 정상 토큰 webhook 호출은 실행하지 않았다.
- 토큰 값은 확인·복사·변경하지 않았다. env key 보존과 인증 없는 접근 거절은 토큰 회전·정상 게시 검증을 대체하지 않는다.
- 실제 rollback·장애 주입·부하 시험은 미실행. 이전 Production은 보존했으며 복구 명령과 데이터 경계는 runbook에 기록했다.
- GitHub CI가 성공해야만 Vercel이 승격하도록 하는 신규 gate는 이번 범위에 없다. 앞으로도 동일 SHA의 CI와 배포를 각각 확인한다.
- 기존 feature/docs·초안·CI push 예외는 그대로 유지했다. 보존 종료와 예외 제거는 별도 승인·PR이 필요하다.

## 관련 문서

- [main 배포 운영 절차](../../runbooks/docs-main-production-deployment.md)
- [브랜치 정책](../../process/branch-policy.md)
- [전환 작업 기록](../../worklog/2026-10/2026-10-20-docs-main-production-transition.md)
