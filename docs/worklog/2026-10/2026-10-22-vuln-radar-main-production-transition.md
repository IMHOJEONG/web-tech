# vuln-radar main Production 전환 착수

## Summary

2026-10-22 KST에 사용자의 운영 변경 요청으로 Vercel `vuln-radar`의 Production Branch를
`feature/vuln-radar`에서 `main`으로 변경하고 재조회했다. 설정 전환은 완료했지만
실제 프런트엔드 운영 배포와 백엔드 API 갱신은 아직 완료하지 않았다.

15:37 KST 후속 확인에서는 재로그인에 성공했지만 Railway 플랫폼의 배포 중단으로
최신 backend 반영이 다시 차단됐다. 아래 최초 인증 실패와 현재 플랫폼 장애는 서로 다른 원인이다.

- [PR #54](https://github.com/IMHOJEONG/web-tech/pull/54)의 main SHA:
  `4e61767e2aa7a53537ef388a5c9759d80faaf8ab`.
- 기존 [KAN-27](https://web-tech-service.atlassian.net/browse/KAN-27)과
  [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)에서 후속 배포를 추적한다.

## Changed

- 공식 [Vercel Terraform provider 구현](https://github.com/vercel/terraform-provider-vercel/blob/main/client/project.go)의
  `UpdateProductionBranch` 요청을 확인하고 branch 전용 PATCH API로 `main`을 설정했다.
- root `apps/vuln-radar`, Node `24.x`, 자동 도메인 할당, Preview 보호, 환경변수 키/대상은
  변경 전후 동일하다. 비밀값은 출력하거나 문서에 저장하지 않았다.
- 운영 alias가 가리키는 기존 배포 `dpl_FXGUCQRdkc1nKpfL264A5sPZRihi`는 유지했다.
  Git ref는 여전히 `feature/vuln-radar`, SHA는 `779051b943ced52ee31ff3f588213dbe12f0091c`다.
- backend 갱신 전 새 frontend를 승격하지 않았다. 브랜치 추적 설정과 현재 서비스 중인 배포는 별개다.
  이후 main push는 Production 대상으로 처리되므로 후속 변경에서도 backend 계약을 확인해야 한다.
- 기록은 main 기반 별도 `codex/vuln-production-main` 작업 트리에 작성했다.
  기존 브랜치·미커밋 작업·stash를 이동하거나 삭제하지 않았다. 최초 작성 때는 로컬-only였으며,
  후속 사용자 요청에 따라 운영 전환 기록과 교체 계획을 별도 문서 커밋으로 보존한다.
  문서 커밋·푸시는 실제 운영 배포나 자격 증명 교체를 뜻하지 않는다.

## Notes

실행한 운영 설정 변경과 재조회 명령이다. 저장소 파일 업로드·재배포·DB 변경 명령은 아니다.

```bash
vercel api /v9/projects/prj_miX9ZspJaLSlCdwrBb27hFlBkmDI/branch \
  -X PATCH -f branch=main --scope hojeong-ims-projects --silent
vercel api /v9/projects/vuln-radar --scope hojeong-ims-projects
railway status --json
```

프로젝트 조회 응답은 필드 allowlist로 비교했다. 변경 전후 차이는 `link.productionBranch` 하나다.
전체 응답이나 토큰을 artifact에 저장하지 않았다. 공개 도메인의 읽기 전용 GET은
2026-10-22 15:06 KST에 다음 결과를 보였다.

| 검사                         | 관측 결과                                          | 판단                                                |
| ---------------------------- | -------------------------------------------------- | --------------------------------------------------- |
| `/overview`                  | HTML 200                                           | 경로 접근 가능. 실제 화면 회귀 검증을 대체하지 않음 |
| `/api/backend/health`        | JSON 200                                           | 서비스 응답 가능. 새 버전 배포 증거는 아님          |
| `/api/backend/overview`      | JSON 200, `p0-open`, `p1-open`, `kev-new`만 존재   | 새 `total-vulnerabilities` 집계 없음                |
| `/api/backend/ingest/status` | JSON 200, `observation` 없음                       | 이전 수집 상태 계약                                 |
| `/api/backend/kev`           | JSON 200, 25개 항목 모두 `epssScore` 필드 없음     | 이전 KEV 계약                                       |
| Railway CLI                  | OAuth refresh `invalid_grant`, linked project 없음 | 배포 권한·대상 확인 차단                            |

사용자에게 `railway login` 재인증을 요청했다. 프로젝트·서비스 ID를 추측해 연결하거나
운영 토큰을 조회·복사하지 않았다. 브라우저 제어 도구도 초기화 오류로 사용할 수 없었다.
운영 DB migration·seed·수집 실행, NAS 작업은 수행하지 않았다.

이번 기록의 문서 delta 검사·Prettier 검사·`git diff --cached --check`를 통과했다.
기존 작업 트리 9개의 HEAD·브랜치·상태·변경 파일 해시와 stash/backup ref·stash reflog는
전후 비교에서 동일했다. KAN-27 댓글 10016과 Confluence v58에 결과를 반영하고 재조회해
기존 본문 보존과 저장된 내용의 일치를 확인했다. 새 ADR을 요구하는 구조 변경은 없다.

### 재인증 후 Railway 플랫폼 장애 확인

기존 `vuln-radar-service` 프로젝트의 `web-tech/vuln-radar-backend`를 조회로 확인한 뒤
이번 작업 디렉터리에 연결했다. Railway 환경 이름은 `development`지만 현재 운영 API가 사용하는
기존 환경이며, 새 Production 환경이나 서비스를 생성하지 않았다. 배포 root는 `/`,
builder는 Dockerfile, 경로는 `/apps/vuln-radar-backend/Dockerfile`이다.

- 기존 backend 배포: `b98c29f5-8e6d-483d-a469-29f8244de688`, 상태 `SUCCESS`,
  main SHA `c3a93c9a849cf23ffe0cebab734a64ad582b1b54`.
- 현재 GitHub main은 승인 대상 `4e61767e2aa7a53537ef388a5c9759d80faaf8ab`와 동일하다.
- `railway service source connect --repo IMHOJEONG/web-tech --branch main`과
  `railway redeploy --from-source` 모두 `Deploys have been paused due to an upstream issue`로 거절됐다.
  자동 재시도나 로컬 소스 업로드로 우회하지 않았다. source 변경 성공도 주장하지 않는다.
- 실패 후 배포 목록을 재조회했고 새 배포는 없다. backend와 Postgres의 기존 active 배포,
  source·manifest·도메인·시작 설정이 전후 동일하다. Vercel Branch는 main, 실제 운영 배포는 기존 ID다.

정확한 대상 선택 후 실행한 재배포 명령은 다음과 같다. 새 승인 없는 DB 변경이나 토큰 교체를 포함하지 않는다.

```bash
railway redeploy --from-source \
  --project f10820d3-0068-466b-a2a9-afd1bea21376 \
  --environment 2102cd4d-3c08-4ae9-b76e-dd620606778f \
  --service f587ac0c-f2b6-44a8-93c2-13cedaf443f3 --yes --json
```

[Railway 공식 상태](https://status.railway.com/)의 06:29 UTC 공지는 Pro·Enterprise 빌드 복구를
알리지만 이 서비스 배포 메타데이터의 플랜은 Hobby이며 실제 배포 요청은 아직 거절됐다.
06:37 UTC의 읽기 전용 공개 API 재검사에서도 health·overview·ingest/status·kev는 JSON 200이며
새 집계·관측·KEV 점수 필드는 여전히 없다. 프런트엔드 승격·새 화면 회귀 검증은 진행하지 않았다.

같은 상태 페이지와 [10월 21일 공식 보안 공지](https://blog.railway.com/p/security-disclosure-wednesday-october-21st)는
환경변수 저장 시스템의 비인가 접근 가능성과 일부 복호화 가능성을 알리며 Railway에 보관한
API 키·DB/registry 자격 증명 등 비밀값의 교체와 비정상 활동 점검을 권고한다.
이번 프로젝트의 실제 유출을 확인한 것은 아니며, 재로그인이 서비스 비밀값 교체를 대신하지 않는다.
값은 조회·공개·교체하지 않았다. 배포 복구와 별도로 영향 범위와 안전한 교체 순서의 사용자 판단이 필요하다.

## Open Questions

- 기존 운영 대상·배포 SHA·root/build/start는 재인증 후 확인했다. 최신 main 반영과
  source 재연결은 현재 플랫폼의 배포 중단에 막혔다. 최초 인증 실패만으로 자동 배포 누락의 원인을 확정하지 않는다.
- 플랫폼 보안 공지의 영향과 비밀값 교체 순서, GitHub 연결 재승인 필요 여부를 별도로 확인해야 한다.
- main Preview `dpl_3LhyMKCN1m29pbncjincJWpUbzor`가 READY인 사실은 Production 배포나
  공개 접근 검증 성공을 의미하지 않는다. Preview는 인증 없는 요청을 로그인으로 보낸다.

## Next

1. Hobby 배포 복구 상태와 보안 공지 대응 범위를 확인한다. 새 토큰·DB 비밀번호를 임의로 만들지 않는다.
2. main의 backend를 기존 운영 환경에 배포하고 위 API의 새 필드와 health를 재검증한다.
   이번 PR은 DB schema 변경을 포함하지 않으며 별도 DB 변경 승인은 없다.
3. 같은 검증 SHA의 frontend를 Production 환경으로 배포·검증한 뒤 운영 alias를 전환한다.
4. 배포 ID·SHA·공개 API·화면·Runtime Logs를 확인하고 기존 배포를 복구 대상으로 보존한다.
   플랫폼 배포 차단 상태에서는 운영 전환 전체를 완료로 표시하지 않는다.

관련 구현 검증은 [전체 통계](../../verification/integration/2026-10-21-vuln-radar-overview-statistics.md),
[KEV 근거](../../verification/integration/2026-10-21-vuln-radar-kev-evidence.md),
[수집 관측](../../verification/integration/2026-10-22-vuln-radar-ingest-status.md),
[부분 API 장애](../../verification/integration/2026-10-22-vuln-radar-partial-failures.md)를 따른다.
