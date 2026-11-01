# PR #81 오프라인 저장·목차 운영 배포 검증

## 대상과 조건

- 검증일: 2026-11-01 KST. 사용자가 main 병합·운영 검증을 먼저 하고 간헐 테스트 조사를 진행하도록 승인했다.
- [PR #81](https://github.com/IMHOJEONG/web-tech/pull/81)의 검토 head는 `7e0af17791767adf08022f29f95ffcaeca1875a5`, squash main은 `57563f37079fb31e70da12163df456d0cdfd35dd`다. [KAN-57](https://web-tech-service.atlassian.net/browse/KAN-57) 운영 저장 장애의 후속이다.
- Node 24.22.1·pnpm 12.14.0·Vercel CLI 53.1.1. 사용자 기존 프로필이 아닌 새 격리 Chrome 세션, 390px·1440px에서 검사했다.
- Production 배포는 `dpl_2EBr1mzHzzg98CAAoum1dBnvG6BW`, 배포 URL은 `web-tech-qcwt0zlw5-hojeong-ims-projects.vercel.app`이다. GitHub 배포 메타데이터의 main SHA와 CLI의 `production`·`Ready`·`heap-forge.app` alias를 대조했다. 로컬 초안·환경 파일을 업로드해 새 배포를 만들지 않았다.

## 재현 방법

저장소 루트에서 최종 squash 메시지 전체를 전용 도구로 검사한 후 같은 메시지·예상 head에 `--merge`를 붙였다. 실제 main SHA와 해당 CI를 별도로 확인했다. 토큰·정상 웹훅 인증값은 운영 검사에 사용하지 않았다.

```sh
pnpm pr:squash --repo IMHOJEONG/web-tech --pr 81 \
  --expected-head 7e0af17791767adf08022f29f95ffcaeca1875a5 \
  --message-file /tmp/pr81-squash-message.txt
# 위 사전검사와 사용자 승인 후 같은 명령에 --merge 추가
gh pr view 81 --repo IMHOJEONG/web-tech --json state,mergeCommit
gh run view 41265647910 --repo IMHOJEONG/web-tech
vercel inspect heap-forge.app --scope hojeong-ims-projects
vercel logs dpl_2EBr1mzHzzg98CAAoum1dBnvG6BW --project web-tech \
  --no-follow --no-branch --level error --since 15m --scope hojeong-ims-projects
```

메시지 파일은 예시 위치이며 실제 검사한 메시지 SHA-256은 `2c2aa3e5016c40e1d42c755a8a2ab36e6910d25d9948e3f29e2c492409dd7805`다. 브라우저는 Feed 로딩이 끝난 뒤 실제 카드로 Brotli 글에 들어가 `performance.timeOrigin` 불변을 확인하고 저장했다. 운영에 장애·합성 본문을 주입하지 않았다.

## 결과와 증거

| 검사               | 실제 결과                                                                                                                     | 판단                                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 병합·main CI       | 전용 메시지 검사·squash 병합, 동일 SHA CI·Documentation·CodeQL 성공                                                           | [main CI 41265647910](https://github.com/IMHOJEONG/web-tech/actions/runs/41265647910). PR Preview 성공으로 대신하지 않음.  |
| SPA 저장           | 두 폭 모두 저장 성공, Worker client pathname은 최초 `/ko/feed` 유지                                                           | 원래 실패 조건에서도 실제 현재 글 확인이 성공함.                                                                           |
| 오프라인 읽기      | 두 폭 모두 완전 오프라인 reload와 저장 목록 1개 확인                                                                          | 명시 저장한 글의 저장본·제목이 표시됨.                                                                                     |
| 목차·기존 fragment | 신고된 두 목차의 실제 제목 ID·header 아래 위치, 기존 alias 이동 성공                                                          | 모바일에서는 목차 닫힘·제목 포커스도 확인.                                                                                 |
| 주요 URL           | `/ko/feed`, `/ko/docs`, `/ko/web`, `/ko/mobile`, `/ko/ui-ux`, `/ko/about`, `/en/feed`, `/robots.txt`, `/sitemap.xml` 모두 200 | 이 표본의 응답 검사이며 검색 폼·모든 글의 기능 전수 검사가 아님.                                                           |
| 보안·배포 소스     | 무인증 웹훅 401, 운영 Worker와 승인 코드의 해시 일치                                                                          | 정상 인증 웹훅은 호출하지 않음.                                                                                            |
| 오류 표본          | 두 브라우저 폭의 pageerror 0개, 배포 대상 최근 15분 error·5xx 조회 표본 0건                                                   | 로그 조회는 프로젝트 미지정으로 처음 실패했고 `--project web-tech`를 명시한 재조회는 성공. 전체 기간 무장애를 뜻하지 않음. |

첫 브라우저 probe는 DOMContentLoaded 직후 클릭해 문서 전체가 다시 로드됐다. SPA 재현 증거로 채택하지 않았으며 Feed 로딩 완료 뒤 실제 카드 클릭으로 두 폭 모두 같은 document 이동을 다시 확인했다. 사용자 데이터·Worker·사이트 권한을 지우지 않았다.

## 한계와 후속 작업

기존 사용자 Chrome 탭·프로필·확장 프로그램·실기기·Safari는 미검증이다. 오래된 탭 bundle은 새로고침이 필요할 수 있다. 원시 trace·프로필·응답은 공개하지 않고 별도 비공개 로컬에 보관한다. NAS 배포·데이터와 다른 앱 설정은 변경하지 않았다.

간헐 테스트 조사는 배포 완료 후 새 main 기반 브랜치와 KAN-58로 분리했다. 이 후속 테스트 보완은 운영에 추가 배포하지 않았다.

## 관련 문서

- [원래 장애 검증](../resilience/2026-10-31-offline-save-diagnostics.md)
- [간헐 검사 조사](../resilience/2026-11-01-publication-cache-request-cause.md)
- [배포 운영 절차](../../runbooks/docs-main-production-deployment.md)
- [작업 기록](../../worklog/2026-11/2026-11-01-pr81-deploy-cache-diagnostics.md)
