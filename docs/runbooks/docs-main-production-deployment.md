# 블로그 main 배포 운영

## 목적과 준비 조건

대상은 Vercel `web-tech` 프로젝트의 `apps/docs`와 공개 도메인 `heap-forge.app`이다.
Production Branch는 `main`, Node.js는 `24.x`다. 다른 앱의 배포 브랜치·NAS 컨테이너는 이 절차의 대상이 아니다.
GitHub `gh`와 Vercel CLI의 해당 저장소·팀 권한이 필요하다. 2026-10-20 검증 도구는 Vercel CLI 53.1.1이었다.

비밀값을 명령 인수나 결과 문서에 넣지 않는다. 환경변수는 key·대상 환경·등록 여부만 확인하며,
API 프로젝트 응답 전체에는 env가 포함될 수 있으므로 그대로 출력·저장하지 않는다.

## 실행 순서

저장소 루트에서 작업 트리와 main을 확인한다. 미커밋 초안이나 stash를 임의로 적용·폐기하지 않는다.

```bash
git status --short --branch
git fetch origin main
git log -1 --format='%H %s' origin/main
gh run list --branch main --limit 10
```

1. 배포할 main SHA의 CI·Documentation·보안 검사 결과를 확인한다. 다른 SHA의 성공이나 Preview READY만으로 대체하지 않는다.
2. 같은 SHA의 Preview를 확인한다. Preview 보호는 유지하고 공식 `vercel curl` 또는 승인된 브라우저 인증을 사용한다.
3. Project Settings에서 Root Directory `apps/docs`, Node `24.x`, Production 환경변수, 도메인 연결과 접근 보호를 확인한다. Preview와 Production의 변수 목록이 같다고 가정하지 않는다.
4. 위험한 운영 전환에서는 Production 환경으로 별도 빌드하고 도메인을 아직 배정하지 않는다. 프로젝트 전역 자동 도메인 설정을 끄지 않고 배포 단위 `--skip-domain`을 사용한다.
5. 스테이징의 목록·검색·로컬/원격 상세와 데스크톱/모바일 탐색을 확인한 뒤 승격한다. 아래 명령의 ID는 검증한 배포 ID로 바꾼다.

```bash
vercel inspect DEPLOYMENT_ID --wait --timeout 8m --scope hojeong-ims-projects
vercel curl /ko/feed --deployment DEPLOYMENT_ID --scope hojeong-ims-projects
vercel promote DEPLOYMENT_ID --yes --timeout 5m --scope hojeong-ims-projects
```

이번 최초 전환은 로컬 파일을 업로드하지 않고 GitHub의 검증된 main SHA로 Production 배포를 생성했다.
CLI/API로 직접 배포할 때도 working tree·초안·로컬 `.env`가 업로드되지 않는 소스 경로를 선택한다.
이미 검증한 Production 스테이징을 승격하면 재빌드하지 않지만, Preview 승격은 Production 환경으로 재빌드될 수 있다.

Production Branch는 Dashboard의 Git 설정에서 확인한다. 2026-10-20 최초 전환은
[공식 Terraform provider의 branch 전용 API](https://github.com/vercel/terraform-provider-vercel/blob/main/client/project.go)를 확인하고
`PATCH /v9/projects/{projectId}/branch`의 `{"branch":"main"}`을 사용했다.
일반 프로젝트 PATCH에 추측한 필드를 넣지 않는다. 변경 후에는 프로젝트를 다시 읽어 실제 branch를 확인한다.

## 기대 결과

- 운영 도메인의 alias가 검증한 배포 ID를 가리키고 그 배포의 Git ref/SHA가 main 검증 대상과 일치한다.
- `/ko/feed`, `/ko/docs`, 검색, `/ko/web`, `/ko/mobile`, `/ko/ui-ux`, `/ko/about`, `/en/feed`, 로컬/원격 상세, `/robots.txt`, `/sitemap.xml`이 정상이다.
- 일반 방문자 권한의 브라우저에서 카드 이동·검색 제출·모바일 Drawer 닫기, 이미지 표시와 가로 넘침을 확인한다. 최소 폭 390px와 1280px를 비교한다.
- 인증 없는 `POST /api/revalidate/content`는 401이고 Preview는 보호된다. 정상 토큰으로 캐시를 만료시키는 시험은 별도 게시 검증으로 분리한다.
- Runtime Logs의 error/5xx를 별도로 조회한다. 표본에 오류가 없다는 사실을 전체 기간 무장애로 확대하지 않는다.

```bash
curl -I https://heap-forge.app/ko/feed
curl -i -X POST https://heap-forge.app/api/revalidate/content \
  -H 'Content-Type: application/json' --data '{}'
vercel logs DEPLOYMENT_ID --no-follow --no-branch --level error --since 20m \
  --scope hojeong-ims-projects
vercel logs DEPLOYMENT_ID --no-follow --no-branch --status-code 5xx --since 20m \
  --scope hojeong-ims-projects
```

main push가 곧 CI 통과를 의미하지 않는다. 현재 자동 Vercel 배포는 GitHub CI 성공을 기다리도록 새로 설정하지 않았다.
주요 라우트 회귀·실제 5xx·timeout·hydration 장애가 있으면 배포 성공 표시만 보고 유지하지 않는다.

## 실패 대응과 복구

스테이징 검증 실패 시 승격하지 않고 현재 Production을 유지한다. 전환 후 회귀 시 이전 정상 Production ID를 확인해 롤백한다.
플랜별 rollback 자격과 deployment 보존 상태를 실행 전에 확인한다.

```bash
vercel rollback PREVIOUS_PRODUCTION_ID --yes --timeout 3m --scope hojeong-ims-projects
```

alias·공개 라우트·로그를 다시 확인한다. 롤백은 Git branch나 NAS 원문, 환경변수, DB를 되돌리지 않는다.
main의 후속 자동 배포가 복구를 덮어쓰지 않도록 배포를 중단하고 필요 시 Production Branch를 이전 값으로 복원한 뒤 원인을 조치한다.
branch 복원도 운영 설정 변경으로 기록한다. 이번 전환에서는 실제 롤백이나 장애 주입은 실행하지 않았다.

기존 `feature/docs`와 초안은 보존 종료를 별도로 승인받기 전 삭제·강제 동기화하지 않는다.
이전 브랜치에서 개발을 재개하지 않고 새 main 기반 작업 브랜치와 PR을 사용한다.

## 관련 검증

- [10-20 main Production 전환 결과](../verification/deployment/2026-10-20-docs-main-production-transition.md)
- [브랜치 정책](../process/branch-policy.md)
- [플랫폼 복구 정책](../architecture/platform-recovery-policy.md)
- [Vercel staged 배포와 승격](https://vercel.com/docs/deployments/promoting-a-deployment)
- [Vercel deploy의 skip-domain](https://vercel.com/docs/cli/deploy)
