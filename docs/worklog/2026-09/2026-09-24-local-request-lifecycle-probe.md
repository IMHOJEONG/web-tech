# 로컬 요청 생명주기 계측과 테스트

## Summary

테스트 전용 요청별 JSON 계측과 판정 테스트를 추가했다. 운영 로깅, prefetch 설정, 에러 필터는 변경하지 않았다.

## Changed

- 상태 모델, Node HTTP 관측 어댑터, fixture Next preload를 역할별로 분리했다.
- requestId, 경로, prefetch 신호, finish/close, 단조 시계 시간, 오류 단계·선행 오류를 기록한다.
- 응답 이벤트를 요청별 비동기 문맥에 연결하고 기존 Next console 오류는 그대로 유지한다.
- 브라우저 응답 대기 없이 dispatch 시점의 테스트 ID도 기록해 응답 전 중단을 대조한다.
- [실행 절차](../../runbooks/docs-article-rendering-regression.md#로컬-요청별-계측)와 [검증 보고서](../../verification/cache/2026-09-24-local-request-lifecycle.md)에 재현 방법·한계를 분리했다.

## Notes

전체 production suite 80개, build·타입 검사, 변경 파일 ESLint를 통과했다. 별도 상세 진단에서 document 21건 완료·0건 실패, 스트림 오류 2건의 요청 연결을 확인했다. 상세 증거와 부분 관측의 한계는 보고서에 기록했다. 기존 Better Stack·Obsidian 변경은 건드리지 않았다.

## Open Questions

Vercel의 요청 ID 연결과 강제 종료, Next onRequestError의 관측 범위는 여전히 미검증이다. 테스트 전용 console 관측은 모든 선행 오류를 포착하는 운영 해법이 아니다.

## Next

Preview 계측은 별도 단계로 진행한다. 확인되지 않은 종료를 정상 취소로 낮추거나 운영 오류 로그를 숨기지 않는다.
