# 오프라인 UTF-8 입력 계약 수정

## Summary

ADR 감사 F1의 입력 크기 검사 오류를 수정했다. 문자열 길이가 아니라 UTF-8 byte 수로 기존 1MiB 계약을 검사한다.

## Changed

- 순수 입력 검사 함수를 스냅샷 생성 경로에 연결했다. 정확히 1MiB는 허용하고 초과하면 기존 size 오류로 종료한다.
- ASCII·한글·이모지의 경계값, 마크업·속성, 단독 surrogate를 단위 테스트로 검사한다.
- 실제 저장 UI에서도 경계값을 검사하고 초과 입력 시 이전 CacheStorage 저장본이 유지되는지 확인한다.

## Notes

- ADR 검토: [ADR-0015](../../architecture/adr-0015-explicit-offline-article-snapshots.md)의 기존 결정 유지. 입력 한도를 바꾸지 않았으므로 새 ADR은 만들지 않는다.
- 단위 테스트 12개, 개발 환경 전체 오프라인 브라우저 테스트 50개, Production 경계 테스트 6개가 통과했다. 개발·Production 경계 테스트는 각각 두 Chromium 프로젝트에서 6개다.
- 문서 테스트 319개, 앱 타입 검사·변경 파일 lint·로컬 Production 빌드가 통과했다. 기존 TCP 글 placeholder 경고 1개는 변경하지 않았다.
- Worker의 최종 저장 한도와 이미지 정책은 변경하지 않았다. 개인 환경 변수·토큰을 사용하지 않았고 실제 배포는 하지 않았다.
- 작업 추적: [KAN-39](https://web-tech-service.atlassian.net/browse/KAN-39). ADR 관계·절차와 통합 검증 보고서는 별도 후속 커밋으로 분리한다.

## Open Questions

- Safari/Firefox·실기기와 운영 배포는 미검증이다.

## Next

- ADR-0009·0015의 부분 대체 연결과 매 작업의 ADR 검토 절차를 별도 작업 단위로 정리한다.
