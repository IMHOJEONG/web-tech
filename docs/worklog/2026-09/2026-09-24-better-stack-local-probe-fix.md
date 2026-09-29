# Better Stack 로컬 검증의 사이트맵 500 수정

## Summary

로컬 검증 스크립트가 검색 공용 모듈을 임시 앱에 복사하지 않아 정상 사이트맵 요청부터 500으로 실패했다. 임시 앱에 `shared` 전체를 포함하도록 수정했다.

## Changed

- [로컬 검증 스크립트](../../../apps/docs/scripts/test-better-stack-local.mjs): 일부 shared 하위 폴더만 복사하던 목록을 통합했다. 모듈 해석 오류가 있으면 원본 서버 로그나 비밀값을 노출하지 않고 의존성 점검 메시지를 표시한다.
- 실행 절차는 기존 [원격 콘텐츠 관측 runbook](../../runbooks/docs-remote-payload-observability.md)을 따른다.

## Notes

- 2026-09-24 Asia/Seoul, Node.js 24.12.0, `d6c60cf` 기반 작업 트리에서 `node apps/docs/scripts/test-better-stack-local.mjs`를 실행했다.
- 수정 전 `Sitemap should return HTTP 200`, `500 !== 200`을 재현했다.
- 수정 후 정상·잘못된 payload 모두 HTTP 200과 같은 로컬 URL 42개를 반환했고 수집 API가 테스트 이벤트 1건을 받아들였다.
- Live tail 조회용 ID: `local-probe-a6c5603c-2ad0-4c7b-8bbd-c2603364a041`, 환경: `development`.
- 운영 코드·공개 계약·배포 구조 변경이 없는 테스트 수정이므로 새 ADR은 추가하지 않았다.

## Open Questions

Better Stack 대시보드 표시와 이메일 알림 수신은 미검증이다.

## Next

해당 실행 ID로 Live tail 수신을 확인한다. 커밋·배포는 별도 진행한다.
