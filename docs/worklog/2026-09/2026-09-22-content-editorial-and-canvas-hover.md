# 운영체제·입문 글 보완과 Canvas hover 진단

## Summary

운영체제 설명을 먼저 수정하고 ARIA·V8·Next.js의 제목과 본문 범위를 맞춘 뒤 Canvas hover를 비교 검증했다.

## Changed

공유 메모리·가상 레지스터 등 용어와 사례·출처를 추가했다. ARIA는 조사 기록으로, V8은 입문 노트로, Next.js는 탐색 체크리스트로 정리했다. Canvas는 일반 버튼 대조군과 포인터 이벤트를 수집하는 진단을 추가했고 글에 후속 결과를 남겼다. slug와 앱 런타임은 유지했다.

## Notes

콘텐츠 19개 테스트·16개 파일 작성 규격 통과. headless 비교는 두 실행 모두 9/9 통과했고 headed는 외부 포인터 이동이 있는 두 사례에서 실패했다. [검증 보고서](../../verification/content/2026-09-22-content-editorial-and-canvas-hover.md)에 재현 명령·원본 JSON·미검증 범위를 기록했다. 구조·계약 변경이 없어 신규 ADR은 필요하지 않다. 다른 작업의 Obsidian 변경은 보존했다.

## Open Questions

과거 ARIA와 Canvas 실패의 원인은 당시 환경·이벤트 기록이 부족해 이번 결과로 확정할 수 없다.

## Next

ARIA의 실제 재현과 V8 출력 분석은 증거를 확보한 뒤 추가한다. Canvas headed는 외부 입력이 없는 전용 환경에서 비교한다.
