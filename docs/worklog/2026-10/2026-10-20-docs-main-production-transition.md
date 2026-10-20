# 블로그 Production Branch를 main으로 전환

## Summary

최신 main의 CI·Preview와 Production 설정을 점검한 뒤 Production 환경 스테이징을 검증하고,
블로그 `web-tech` 프로젝트의 Production Branch와 공개 도메인을 main 배포로 전환했다.
기존 feature/docs와 비공개 초안은 그대로 보존했다.

## Changed

- 원격 Vercel 설정: Production Branch `feature/docs` → `main`, 검증된 배포를 `heap-forge.app`으로 승격.
- [브랜치 정책](../../process/branch-policy.md)에 현재 상태와 남은 CI 예외를 기록.
- [배포·복구 runbook](../../runbooks/docs-main-production-deployment.md), [검증 보고서](../../verification/deployment/2026-10-20-docs-main-production-transition.md)와 민감정보 없는 artifact 추가.
- 저장소 기록은 최신 main 기반 `codex/docs-main-production-transition`에 분리. 배포 소스는 검증된 main SHA 그대로 유지.

## Notes

Preview·Production 스테이징·공개 운영 도메인에서 각각 HTTP 13개 경로를 확인했다.
스테이징과 운영에서 Chromium 데스크톱/모바일 검색·카드·메뉴를 검사했다.
상세 결과와 미검증 범위는 보고서를 따른다. 다른 프로젝트 배포, NAS, 토큰 값, 기존 feature ref와 stash는 변경하지 않았다.

## Open Questions

- 기존 feature/docs 보존 종료와 workflow push 예외 제거 시점.
- Vercel 배포를 GitHub CI 성공과 연동하는 별도 gate의 도입 여부.

## Next

이후 기능은 최신 main에서 새 브랜치를 생성해 PR로 반영한다.
다음 main 병합 때 자동 Production 배포와 동일 SHA의 CI를 함께 확인한다.
기존 브랜치나 초안을 정리할 때는 별도 승인을 받고 미반영 작업·복구 참조를 먼저 확인한다.
