# 요청별 스트림 로그 정책 수립

## Summary

취소와 장애를 오류 문자열로 단정하지 않도록 요청별 관측 계약과 단계적 구현 기준을 문서화했다. 런타임 코드는 변경하지 않았다.

## Changed

- [정책](../../architecture/docs-request-lifecycle-logging-policy.md): 요청 ID, 경로, prefetch, 완료·종료, 소요 시간, 선행 오류와 판정 우선순위.
- [ADR-0008](../../architecture/adr-0008-request-lifecycle-observability.md): 선택 이유와 대안, 미구현 상태.
- [TODO](../../todo/todo.md#infra--tooling): 로컬 계측, Preview 상관관계, 운영 수집의 분리된 완료 조건.

## Notes

설치된 Next.js의 instrumentation 문서와 현재 테스트 전용 Node 계측, Better Stack 전송 범위를 확인했다. Node 공식 HTTP 문서의 finish/close 의미를 정책에 연결했다. 문서 형식·링크 검사를 수행하며 실행 코드 변경이 없어 빌드·E2E 재실행은 이번 범위가 아니다.

## Open Questions

Vercel에서 앱 오류와 플랫폼 요청 ID를 연결할 수 있는 범위, finish/close 관측 가능 여부, 보관·외부 수집 비용은 실제 Preview 검증이 필요하다. 관측 누락을 정상 취소로 채우지 않는다.

## Next

정책의 완료 조건에 따라 fixture 요청 계측과 판정 테스트를 먼저 구현한다. 확인 전까지 운영 로그 필터링·알림 완화는 적용하지 않는다.
