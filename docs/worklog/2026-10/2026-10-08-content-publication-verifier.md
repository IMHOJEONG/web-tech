# 캐시 만료와 실제 게시 결과 검증 분리

## Summary

웹훅의 `revalidated: true`만으로 발행 성공을 판단하지 않도록 CLI에 제한 시간·횟수 안의 목록·검색·상세 내용 확인을 추가했다. NAS 운영 검증에 앞서 모의 서버와 실제 Next.js production fixture로 확인했다.

## Changed

- 기존 `.mjs` 명령 진입점은 유지하고 TS 모듈로 기대값 검증·응답 판정·polling을 분리했다. native Node 24 테스트도 TS로 추가했다.
- 기본 호출은 기대값 JSON이 필수이며 POST는 1회만 수행한다. `--verify-only`는 공개 조회만, `--invalidate-only`는 명시적인 만료 전용 모드다.
- `test:content`에 14개 native 시험을 연결하고 Node 테스트 타입 검사에 포함했다. 실제 production CLI 시험도 기존 article E2E에 연결했다.
- 검색 API의 locale-neutral href와 화면의 localized 링크 차이를 실제 계약에 맞게 반영했다.
- [갱신 정책](../../architecture/docs-content-cache-revalidation-policy.md), [사용 절차](../../runbooks/docs-content-publication-verification.md), [NAS 안내](../../runbooks/docs-backend-nas-deployment.md), [TODO](../../todo/todo.md)를 갱신했다. 기존 정책의 후속 구현이므로 새 ADR은 만들지 않았다.

## Notes

[검증 보고서](../../verification/cache/2026-10-08-content-publication-verifier.md)에 명령·결과·첫 실패와 보정·남은 스트림 로그를 기록했다. 콘텐츠 34개, 작성 규칙 18개, 타입·린트, production 빌드와 desktop E2E 3개가 통과했다.

로그와 artifact에 실제 문서 원문·토큰·인증 헤더를 남기지 않았다. Production/NAS 요청과 파일 변경, 커밋·푸시는 수행하지 않았다. 다른 작업의 HTTP 스트리밍 초안과 문서 변경은 유지했다.

## Open Questions

- NAS에서 명령을 실행할 checkout·Node 24 환경과 승인된 테스트 글/원복 계획은 운영 실행 전에 정해야 한다.
- 이전 문구와 명확히 구분되는 기대값을 선택해야 한다. CLI 성공은 전 독자·전 기기나 원자적 게시 보장이 아니다.

## Next

NAS의 승인된 테스트 글 V1→V2, 기본 CLI 실행, 공개 반영과 원복을 실제 배포에서 확인한다. 기존 스트림 종료 진단은 별도 조사로 유지한다.
