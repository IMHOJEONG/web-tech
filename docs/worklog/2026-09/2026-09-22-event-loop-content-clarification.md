# 이벤트 루프 설명과 실행 예제 보완

## Summary

microtask 우선순위를 "경향"으로 설명하던 문장을 checkpoint의 처리 규칙으로 바꾸고 직접 실행할 예제를 추가했다.

## Changed

호출 스택·task·microtask를 풀이하고, 중첩 microtask와 타이머의 순서를 단계별로 설명했다. 브라우저 예제를 Node.js나 화면 갱신 순서로 일반화하지 않도록 범위를 명시했다. 본문에서 추출하는 브라우저 테스트와 [검증 보고서](../../verification/content/2026-09-22-event-loop-example.md)를 추가했다.

## Notes

Chrome에서 10회 반복 검사, 콘텐츠 단위 테스트 19개와 파일 16개의 작성 규격 검사를 통과했다. 실행 명령과 원본 결과는 보고서에 있다. 앱 구조·데이터 흐름·공개 계약의 변경이 아니므로 새 ADR은 추가하지 않았다. 다른 작업의 Obsidian 문서 변경은 보존했다.

## Open Questions

렌더링 시점과 Node.js 실행 맥락 비교는 이번 검증 범위가 아니다.

## Next

운영체제 글의 주소 공간 분리와 명시적 공유 메모리 설명을 다음 편집 대상으로 유지한다. Canvas hover 안정성 조사는 별도다.
