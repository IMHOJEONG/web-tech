# PR #59 squash 병합과 자동 배포 확인

## 대상과 조건

이 문서는 **2026-10-25 당시의 실행·관측 기록**을 2026-10-29 로컬 정리에 옮긴 것입니다. 아래 명령은 당시 이력이며 지금 병합·배포를 재실행하라는 절차가 아닙니다. 이번 이식에서 원격 API·배포·registry를 새로 조회하지 않았으며 당시 성공을 현재 운영 상태로 확대하지 않습니다.

- 확인일: 2026-10-25 KST. 원격 원본 시각은 UTC이며 아래 표에는 KST를 병기한다.
- 사용자 승인: [PR #59](https://github.com/IMHOJEONG/web-tech/pull/59)의 main squash 병합, Railway 자동 배포와 docs-backend 이미지 게시 결과 확인. 기존 audit 13건은 [KAN-35](https://web-tech-service.atlassian.net/browse/KAN-35)의 별도 미조치 과제로 유지한다.
- 검증 head `8ec93728e29346de705c8297c1141d44e51137e7`, base `16c51e9911f041b125a445b3939966986426a0b4`, 실제 main squash `d0b25a5122fd9b4377b559270c10680c984e2aed`.
- 로컬 Git 객체의 committer 시각은 `2026-10-25T10:23:19+09:00`이다. 아래 PR 병합 시각 `10:23:20 KST`는 당시 원격 `mergedAt` 기록으로, 커밋 객체 시각과 구분한다.
- Railway 프로젝트 `vuln-radar-service`, 환경 `development`, 서비스 `web-tech/vuln-radar-backend`. NAS에는 접속하거나 컨테이너를 교체하지 않았다.

## 재현 방법

인증된 GitHub·Railway CLI, 기존 mise Node 24.12.0·pnpm 12.14.0을 사용했다. 비밀값은 출력·문서화하지 않는다.

병합 전 모든 검사 SUCCESS·OPEN·MERGEABLE·CLEAN·리뷰 5개 해결/미해결 0건을 다시 확인했다. [최종 메시지 사전검사](../../process/squash-merge-preflight.md)에 따라 임시 파일의 메시지 전체와 예상 head를 검사한 뒤, 명시 승인으로만 `--merge`를 실행했다.

```sh
mise exec -- pnpm pr:squash --repo IMHOJEONG/web-tech --pr 59 \
  --expected-head 8ec93728e29346de705c8297c1141d44e51137e7 \
  --message-file "$MESSAGE_FILE" --merge
gh pr view 59 --repo IMHOJEONG/web-tech --json state,mergedAt,mergeCommit
gh run list --repo IMHOJEONG/web-tech --branch main \
  --commit d0b25a5122fd9b4377b559270c10680c984e2aed \
  --json databaseId,name,status,conclusion,url
gh run view 40150434084 --repo IMHOJEONG/web-tech --log
```

`MESSAGE_FILE`은 당시 최종 메시지 파일의 경로를 뜻한다. 머신별 임시 경로는 보관하지 않는다. 실제 최종 메시지는 다음 내용이었다.

```text
build(vuln-radar-app): adopt Vite+ development and build tooling

Keep the existing tests, mise, pnpm and Turborepo workflows.
Validate dependency compatibility and isolate verification Git environments.

Refs: KAN-34
```

Railway CLI는 다음 읽기 호출을 사용했다. 연결 설정을 쓰는 `railway link`는 실행하지 않았다.

```sh
RAILWAY_PROJECT_ID=f10820d3-0068-466b-a2a9-afd1bea21376 \
RAILWAY_ENVIRONMENT_ID=2102cd4d-3c08-4ae9-b76e-dd620606778f \
  railway status --json
railway logs 66be9dc9-ad64-4fbe-bf79-9fbd3680536d \
  --project f10820d3-0068-466b-a2a9-afd1bea21376 \
  --environment 2102cd4d-3c08-4ae9-b76e-dd620606778f \
  --service f587ac0c-f2b6-44a8-93c2-13cedaf443f3 \
  --deployment --lines 30 --filter '"Nest application successfully started"' --json
curl --silent --show-error --fail --max-time 20 \
  --write-out '\nHTTP %{http_code}\n' https://vuln-radar-api-dev.up.railway.app/api/health
docker buildx imagetools inspect \
  ghcr.io/imhojeong/web-tech-docs-backend:sha-d0b25a5122fd9b4377b559270c10680c984e2aed \
  --format '{{json .Manifest}}'
```

Railway 상태 JSON은 기존 인증의 읽기 응답에서 대상 서비스의 배포 ID·상태·커밋·브랜치·인스턴스 상태만 추출했다. 전체 설정이나 로그 원본은 artifact로 보관하지 않았다. 최초 사용자 정의 GraphQL 조회는 `Not Authorized`였으나 Railway CLI의 같은 대상 조회는 성공했다. 이 실패를 배포 실패로 해석하거나 권한·토큰·소스 연결을 변경하지 않았다.

## 결과와 증거

| 대상                 | 관측 결과                                                                                                                                                                                                                                                        | 판정                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| main 병합            | MERGED, `d0b25a5`, 10:23:20 KST (`01:23:20Z`)                                                                                                                                                                                                                    | squash 완료. `merge-requested` 응답뿐 아니라 실제 PR 상태·커밋을 재조회                                 |
| Railway 자동 배포    | [배포 66be9dc9](https://railway.com/project/f10820d3-0068-466b-a2a9-afd1bea21376/service/f587ac0c-f2b6-44a8-93c2-13cedaf443f3?id=66be9dc9-ad64-4fbe-bf79-9fbd3680536d&environmentId=2102cd4d-3c08-4ae9-b76e-dd620606778f), main·동일 전체 SHA, 생성 10:23:22 KST | SUCCESS·deploymentStopped false·인스턴스 RUNNING. 수동 deploy/redeploy 호출 없음                        |
| 애플리케이션 시작    | 같은 배포의 `Nest application successfully started`, 10:24:41 KST                                                                                                                                                                                                | 시작 로그 확인. GitHub 동일 커밋의 Railway status도 success                                             |
| 공개 health          | `/api/health` HTTP 200, `status: ok`, service `vuln-radar-backend`, env `development`, storage `database`                                                                                                                                                        | 읽기 한 번. 직접 DB 쿼리나 수집 호출은 아님                                                             |
| docs-backend 게시    | [Docs Backend Image run 40150434084](https://github.com/IMHOJEONG/web-tech/actions/runs/40150434084) SUCCESS, 같은 main SHA의 태그·manifest push 완료                                                                                                            | GHCR 게시 성공. NAS 배포 완료가 아님                                                                    |
| 원격 이미지 manifest | OCI index와 linux/amd64 manifest를 registry에서 재조회                                                                                                                                                                                                           | 아래 digest가 push 로그와 정확히 일치. unknown/unknown 항목은 attestation이며 별도 실행 아키텍처가 아님 |
| main 문서·커밋 검사  | [Documentation](https://github.com/IMHOJEONG/web-tech/actions/runs/40150433895)·[Push on main](https://github.com/IMHOJEONG/web-tech/actions/runs/40150433950) SUCCESS                                                                                           | 배포 결과와 별도                                                                                        |
| main 전체 CI         | [CI run 40150434055](https://github.com/IMHOJEONG/web-tech/actions/runs/40150434055) SUCCESS                                                                                                                                                                     | 최종 13개 job 전부 success. 초기 browser 검사 진행 상태와 구분해 완료 후 다시 대조함                    |

게시 태그와 digest:

```text
ghcr.io/imhojeong/web-tech-docs-backend:sha-d0b25a5122fd9b4377b559270c10680c984e2aed
index: sha256:ad34566200c53eb8b52be53bd5bbc3c40db1c62d833fe598333b89439589a513
linux/amd64: sha256:940c3351a368a682697e18549acf296b4cf3cda2e28479a49cad239156d3f380
```

## 한계와 후속 작업

- 배포 성공·프로세스 시작·health를 확인한 결과다. 전체 운영 기능·수집 소스·DB 데이터 정합성·복구 리허설을 검증했다는 의미가 아니다. health의 storage는 서비스 상태 응답이며 별도의 DB SQL 검증은 하지 않았다.
- health의 frontendOrigin은 `http://localhost:3000`이었다. 현재 프론트 프록시를 통한 기능/CORS 적합성은 이 점검으로 증명하지 않으며 설정을 임의 수정하지 않았다.
- 보안 경고 13건을 재감사하거나 해결하지 않았다. KAN-35와 KAN-32의 전체 보안 재개 조건은 유지하며, 이번 명시 승인에 따른 병합·자동 배포만 구분해 기록한다.
- NAS pull/up·운영 DB·수집 endpoint·토큰·환경변수·자동 배포 설정 변경은 하지 않았다. 기록 문서는 로컬 미커밋이며 새 문서 게시를 위한 push를 추가로 실행하지 않았다.

## 관련 문서

- [실험 설계와 현재 범위](../../architecture/vuln-radar-viteplus-experiment.md)
- [병합 전 검증과 자동 배포 경계](../integration/2026-10-24-pr59-baseline-fixes.md)
- [이번 작업 기록](../../worklog/2026-10/2026-10-25-pr59-main-autodeploy.md)
