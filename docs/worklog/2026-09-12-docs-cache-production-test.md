# 2026-09-12 콘텐츠 캐시 프로덕션 통합 테스트

## Summary

이미 적용한 TTL과 webhook의 실제 동작을 로컬 프로덕션 환경에서 검증한다.

## Changed

- `test:cache:prod` 명령과 격리된 앱 빌드/실행 스크립트 추가.
- 실제 콘텐츠 조회 함수를 사용하는 임시 동적 검증 경로 추가.
- 원본 호출 횟수, 인증 실패, V1/V2 응답 및 실제 상세 렌더링 검증.
- 운영 절차와 P0/P1/P2 개선 우선순위 문서 추가.

## Notes

기존 카테고리/검색 미커밋 변경을 보존했다.
실제 비밀정보와 NAS를 사용하지 않으며 임시 앱은 Webpack으로 빌드한다.
`node apps/docs/scripts/test-content-cache-prod.mjs` 실행 통과:

- `next build --webpack` 및 `next start` 성공.
- 최초 조회: 목록 1회, 본문 1회.
- 반복 조회 및 잘못된 인증 후: 목록 1회, 본문 1회 유지.
- 정상 웹훅 후 최신 조회: 목록 2회, 본문 2회.
- V2 캐시 재사용 및 실제 상세 페이지 V2 본문 확인 성공.

현재 ky 요청은 이 로컬 프로덕션 검증에서 Next Data Cache 옵션을 정상 적용했다.
따라서 이번 변경에서는 운영 요청 코드를 수정하지 않았다.

## Open Questions

Vercel 캐시 전파와 NAS 장애 시 동작은 배포 환경에서 별도 확인해야 한다.

## Next

추가 문서화: `docs/knowledge/content-platform/next-data-cache-integration-lab.md`에
캐시 계층, 테스트 격리, 단계별 근거, 실패 조사 순서와 후속 실험 기록 양식을 정리했다.
지식 목록과 실행 가이드에서 연결했다. 이 추가 작업은 문서만 변경한다.

본문 조회 불가와 정상 빈 본문을 구분하는 오류 계약을 적용한다.
