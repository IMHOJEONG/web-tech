# 상세 오류 응답의 Content-Type 보완

## Summary

사용자 요청 순서대로 미커밋 H1 검증 문서2개를 먼저 커밋·푸시하고, 최신 main 기반 새 브랜치에서 404 Content-Type 경고를 수정했다. [KAN-38](https://web-tech-service.atlassian.net/browse/KAN-38)의 로컬 코드 변경이며 운영 적용은 하지 않는다.

## Changed

- H1 검증 문서2개만 [d9ca455](https://github.com/IMHOJEONG/web-tech/commit/d9ca45569335d70a84f5799e9dfcbd7d3e50aa31)로 커밋해 기존 codex/content-h1-warning-20261025에 푸시했고 원격SHA를 확인했다. 기존 훅 포맷·문서·커밋메시지 검사를 유지했다.
- 깨끗한 작업 공간에서 최신 main c1e2850 기반 `codex/docs-backend-content-type-20261026`을 생성했다. H1 후속 문서 커밋이나 기존 NAS 진단 미커밋을 섞지 않았다.
- 상세의 정적 HTML 헤더를 제거하고 조회·렌더링 성공 뒤에만 HTML 헤더를 설정한다. passthrough로 응답 전송·JSON 예외 처리를 Nest에 유지한다.
- HTML200·JSON401/404/500·경고 부재·cache/Vary·오류 정보 비노출 회귀와 API 계약·백엔드 안내를 보완했다. [검증 보고서](../../verification/content/2026-10-26-content-response-type.md)와 전후 증거를 연결한다.

## Notes

새 테스트를 먼저 실행해 수정 전 7개 경고 실패·3개 성공을 확인했다. 수정 후 집중10개·백엔드 단위13/HTTP49개·공용26개와 관련 lint·타입·build를 통과했다. 실제 콘텐츠 검증 경고와 예상된 renderer500 오류 로그는 숨기지 않았다. 정상/오류 Content-Type과 상태 코드를 함께 검사해 Nest 자동 JSON 보정 때문에 경고를 놓치지 않도록 했다.

기존 응답 계약을 안정화하는 수정이라 새로운 ADR은 만들지 않는다. H1 policy·slug/metadata/body 검증·인증·NAS 파일/이미지·운영 캐시·토큰은 변경하지 않는다. Jira·Confluence는 문서 커밋의 원격 반영과 새 코드의 로컬 반영·원격 미반영 상태를 구분한다.

## Open Questions

NAS에는 변경 이미지 배포 후 경고 부재를 별도로 검증해야 한다. frontend·다른 앱의 전역 예외 처리·streaming 응답은 이번 범위가 아니다. H1 후속 검증 문서 커밋은 별도 main 반영이 필요하다.

## Next

최초 구현 단계에서는 선행 문서2개만 푸시했고 새 수정은 로컬에 남겼다. 이후 사용자 승인으로 이번 브랜치의 코드·테스트·문서를 커밋·푸시하고 원격 검증을 진행한다. 직접 push에서 검사가 실행되지 않으면 main 대상 PR을 생성해 CI·CodeQL·리뷰를 확인한다. 실제 원격 SHA·PR·검사 실행과 결과는 같은 KAN-38·Confluence에 기록하고 재조회한다.

main 병합·NAS/Vercel/Railway 운영 배포·NAS 파일/토큰/캐시 변경은 승인 범위에 없다. 자동 Preview·PR 이미지 빌드는 운영 배포와 구분한다. 선행 H1 검증 문서 커밋 d9ca455는 이번 브랜치에 섞지 않는다.
