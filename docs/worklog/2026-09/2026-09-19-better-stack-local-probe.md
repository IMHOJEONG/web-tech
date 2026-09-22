# Better Stack 로컬 진단 도구 정리

## Summary

미커밋 상태였던 Better Stack 진단 스크립트와 실행 안내를 검토해 독립 커밋으로 정리했다.

## Changed

- `test:better-stack:local`과 content contract 사전 빌드를 연결했다.
- 임시 Next 앱과 loopback API를 사용해 정상/비정상 payload의 사이트맵 fallback을 비교한다.
- 실제 전송 함수의 결과를 테스트 복사본에서 관측하고 개발 환경 이벤트와 실행 ID로 구분한다.
- [운영 안내](../../runbooks/docs-remote-payload-observability.md)에 외부 전송 영향과 Live tail 확인 방법을 기록했다.

## Notes

Node.js 24에서 `better-stack.test.ts`, `content-api-observability.test.ts`의
단위 테스트 8개와 스크립트 ESLint가 통과했다. 검토 과정에서 실제 env 파일이나
토큰 값을 읽지 않았고, 외부 Source에 이벤트를 보내는 진단 명령은 실행하지 않았다.
단위 테스트는 fetch를 대체하므로 실제 인증·수집·알림 성공의 증거가 아니다.

## Open Questions

개발 전용 Source에서 진단 명령 실행 후 수집과 알림 도달 여부를 별도 확인해야 한다.

## Next

운영자가 전송 대상과 환경을 확인한 뒤 진단 명령을 명시적으로 실행한다.
