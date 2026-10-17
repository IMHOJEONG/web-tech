# Docs 웹 푸시 MVP

## Summary

웹 푸시를 선택형 기술 실험으로 추가했다. 기존 문서 조회/캐시는 변경하지 않고, 실제 구독과 테스트 발송은 개인 설정 후 검증한다. 기본 비활성화이며 운영 배포나 실제 수신 완료를 의미하지 않는다.

## Changed

- 로컬 실제 연동 스크립트 `test:push:local` 추가. 개발 환경의 Next loopback 정규화 때문에 정상 BFF 요청이 403이 되는 문제를 보정하고 운영 출처 검사는 유지했다.

- docs: About 실험 패널, 한·영 카피와 Privacy 안내, 클릭 기반 구독/해지 hook, same-origin BFF, manifest와 push-only 서비스 워커.
- docs-backend: 독립 PushModule, 전용 구독/관리자 토큰, provider allowlist, 최대 20건 JSON 영구 저장, 직렬화/atomic rename, 관리자 단건 고정 테스트 발송과 404/410 정리.
- 환경 예시와 Turbo 환경 전달, 선택형 NAS Compose overlay, web-push 의존성과 타입 추가. 실제 운영 비밀값은 생성/저장하지 않았다. 테스트용 일회성 키만 임시 환경에서 사용했다.
- [ADR-0009](../../architecture/adr-0009-docs-web-push-experiment.md), [실험 runbook](../../runbooks/docs-web-push-experiment.md), TODO 추가.

## Notes

- Node.js 24.12.0에서 `pnpm --filter docs-backend test:e2e --runInBand`로 E2E 34개 통과: 기존 콘텐츠 18개와 푸시 16개. provider 발송은 mock이다. 분당 요청 제한과 시간 경과 후 회복도 검사했다.
- 백엔드 타입 검사와 린트 통과.
- 초기 E2E에서 파일 미존재 오류 판별이 Jest 실행 영역의 `instanceof Error`에 의존해 실패했고, 오류 코드 구조 검사로 변경 후 통과했다. 파일 손상은 빈 목록으로 숨기지 않는다.
- docs 라이브러리 192개, Chromium UI/API 6개 통과. 모바일 영어 표시의 가로 넘침과 미지원 브라우저 안내도 검사했다. 라이브러리 검사는 병행 작업의 현재 변경도 포함한다. `pnpm --filter docs test:lib`, `pnpm --filter docs test:push:browser`로 실행했다.
- docs 타입 검사와 변경 프론트 파일 린트, Nest 빌드, 문서 delta 검사와 `git diff --check` 통과. 처음 발견한 ky `prefixUrl` 옵션은 현재 설치 버전에 맞는 `prefix`로 바꿨고, 오래된 Next 생성 타입은 `next typegen`으로 갱신했다.
- 후속 실제 Chrome 검사에서 구독·제공자 수락·서비스 워커 수신·알림 생성·해지를 확인했다. 상세 조건과 실패했던 선행 시도는 [로컬 실제 연동 결과](../../verification/push/2026-10-03-local-web-push.md)에 기록했다. OS 배너·사용자 클릭·NAS volume·Vercel WAF와 Production 배포는 미검증이다. 전체 Next Production 빌드는 이번 작업에서 실행하지 않았다.

## Open Questions

- 실제 Chrome/Firefox/Safari와 iOS 홈 화면의 수신·클릭 조건 확인.
- 일반 사용자 활성화 전 구독 정보 보관 기간과 자동 삭제, 분산 rate limit, DB/발송 큐 도입 여부 결정.

## Next

개인 VAPID·전용 토큰 설정 후 NAS 테스트 발송 → OS 수신/클릭 → 해지 → 재시작 복원 확인. 로컬 실제 연동은 일회성 키로 확인했으며 배포 검증을 대체하지 않는다. 이후 신규 게시 알림을 별도 작업으로 설계한다. 캐시 갱신 webhook마다 알림을 보내지 않는다.
