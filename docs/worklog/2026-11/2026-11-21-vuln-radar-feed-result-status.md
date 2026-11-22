# Feed 랜드마크 커밋과 결과 상태 개선

## Summary

검색 랜드마크 코드와 정제 기록 8파일을 `7f5863a2`에 로컬 커밋했다. 검색 결과가 바뀔 때 기존 상태 요소가 교체되는 것을 확인하고, 계속 유지되는 결과 상태 영역을 적용했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## Changed

- `role="status"`와 `aria-atomic="true"`를 적용한 영역에 검색 완료 후 결과 수·페이지 또는 0건 문구를 넣는다. 검색·페이지 상태 문구의 현지화 포맷을 함께 사용한다. [검증 보고서](../../verification/accessibility/2026-11-21-vuln-radar-feed-result-status.md)
- 앱 내부 상태 메시지 변경이다. API 계약과 공유 컴포넌트 책임이 유지되므로 새 ADR은 필요하지 않았다.

## Notes

- 랜드마크 커밋의 실제 훅·공개 검수·commitlint가 통과했다. 이번 결과 상태 변경은 로컬 미커밋이다. 공통 지침 변경은 없다.
- 검색 결과 상태 노드가 계속 유지되고 검색·필터·페이지 이동이 동작하는 것을 세 엔진·두 폭에서 확인했다.
- KAN-83 검증 표와 Confluence 운영 댓글 v18을 재조회했다. 별도 지식 v19에 상태 노드를 유지하는 기준을 추가하고 본문·공식 근거 링크·운영 안내의 상위 경로를 확인했다. [Confluence 지식 문서](https://web-tech-service.atlassian.net/wiki/pages/19464193)

## Open Questions

VoiceOver 등 실제 스크린리더가 완료 메시지를 읽는 방식과 타이밍은 미검증이다.

## Next

실제 스크린리더에서 검색어를 연속 입력하고 0건·다음 페이지까지 이동하면서 발화와 포커스를 확인한다.

## 결과 상태 커밋과 실제 Safari 후속 검증

결과 상태 코드와 정제 기록 9파일을 `573e9595`에 로컬 커밋했다. 포맷·문서·공개 검수 훅과 커밋 메시지 검사가 통과했다. 실제 Safari에서 검색 영역 이름·입력 레이블, 26건에서 31건과 0건으로의 갱신, 두 번째 페이지·검색 입력 포커스를 확인했다. VoiceOver 로터와 완료 발화의 직접 관측을 요청했다. 기존 검증 기준을 새 화면에서 실행한 결과이므로 별도 지식 내용 추가는 필요하지 않았다. [Safari 후속 검증](../../verification/accessibility/2026-11-21-vuln-radar-feed-result-status.md#실제-safari-후속-검증)

KAN-83 검증 표와 Confluence 운영 댓글 v19를 갱신하고 재조회했다. Safari 후속 기록은 로컬 미커밋이다. [Confluence 운영 기록](https://web-tech-service.atlassian.net/wiki/pages/65817?focusedCommentId=20250739)

### VoiceOver 발화 누락 확인

사용자가 로터의 `탐색 조건`을 확인했고 결과 31건·0건의 발화 누락을 재현했다. VoiceOver 유틸리티에서 라이브 영역 활성화를 확인한 뒤, 첫 응답 전에 빈 영역을 마운트하고 `aria-live="polite"`를 명시했다. 세 엔진 두 폭에서 노드 유지와 검색 회귀가 통과했고 Safari의 접근성 트리에 완료 문구가 표시됐다. 수정 후 실제 발화를 확인할 수 있도록 Safari 테스트 탭을 열어뒀다. 코드와 기록은 로컬 미커밋이다. [재검증 보고서](../../verification/accessibility/2026-11-21-vuln-radar-feed-result-status.md#voiceover-발화-누락과-재검증)

KAN-83 검증 표와 Confluence 운영 댓글 v20을 갱신하고 재조회했다. 별도 지식 v20에는 DOM 검증과 실제 발화 관측이 엇갈린 사례를 추가했고 본문·근거·운영 안내 경로를 확인했다. [Confluence 지식 문서](https://web-tech-service.atlassian.net/wiki/pages/19464193)
사용자가 수정 후 VoiceOver에서 31건과 0건 모두 읽혔다고 확인했다. 사용자 보고를 실제 발화 통과 근거로 기록했다. 수정 코드와 검증 기록을 사용자 요청에 따라 로컬 커밋한다.
