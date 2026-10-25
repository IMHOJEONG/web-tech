# Primary 글자 대비와 실제 브라우저 접근성 보완

## Summary

주황 배경은 유지하고 primary foreground를 짙은 색으로 통일해 작은 버튼 글자의 대비를 개선했다. 실제 브라우저 회귀와 Figma Light/Dark 대응을 함께 확인했다.

## Changed

- 공용 CSS의 두 테마 `--primary-foreground`와 primary CTA focus를 보완했다.
- 공용 Button·링크 Badge의 primary focus 외곽선·시스템 Highlight를 추가했다.
- UI 단독 대비/키보드 fixture·테스트·solid color helper와 실제 페이지 CTA E2E를 추가했다.
- [토큰 정책](../../architecture/docs-design-token-usage-policy.md#primary-대비-기준), [검증 보고서](../../verification/accessibility/2026-10-25-primary-action-contrast.md), artifact·스크린샷과 목차를 갱신했다.

## Notes

기준 HEAD `ddce1ec`+기존 미커밋 작업 트리다. 초기 실제2.64:1 실패를 재현하고 기본 약6.40:1로 보완했다. 최종 UI58개·실제 블로그12개가 통과했다. 상세 명령·수치·초기 환경/계측 실패·증거는 검증 보고서가 원본이다.
Figma의 승인된 primary 토큰과8개 focus master만 보완했으며 짧은 라벨의 outline resize도 검사했다. 공식 연결·추가 결제 없음. 공개 API나 컴포넌트 책임은 바뀌지 않아 기존 ADR을 대체하거나 새 ADR을 만들지 않았다.
루트 작업 트리·다른 브랜치·기존 앱/미디어/초안 변경은 보존했다. 같은 KAN-36·Confluence 안내를 갱신한다. 구현 검증 마감 시점에는 커밋·푸시·배포를 하지 않았다.

마감 시 Jira 댓글10024의3열 표·기존 본문·새 primary 결과를 재조회했다. Confluence v130 쓰기 후 재조회는 다른 작업의 추가가 반영된 v131이었다. 비교 결과는 기존 본문과 이번 구역을 보존한 채 KAN-35 문단만 추가된 것으로 확인했다. 다른 작업을 덮어쓰지 않았다. 문서 working-tree delta53개 검사 오류0개와 Git diff 검사도 통과했다. 스테이징 없이 확인했으며 원격 코드 반영과 구분한다.

## Open Questions

전체 페이지/variant·Safari/Firefox·실기기·스크린 리더·production 빌드·원격 CI는 미검증이다. 기존 밝은 주황 텍스트 링크 등의 다른 역할은 이번 수정 범위가 아니다.

## Next

사용자가 이번 대비 보완의 커밋·푸시를 승인했다. `codex/docs-content-motion-20261023`에서 공용 코드·회귀 테스트·정책·증거·이번 목차 항목만 분리한다. 미디어·최근 글 패널·이전 Figma 기록과 원본은 포함하지 않으며, 목차는 부분 스테이징해 기존 내용을 보존한다. 공개 검증 문서는 별도 미커밋 Figma 문서에 의존하지 않도록 직접 보드 링크와 이번 증거를 사용한다.

원격 커밋 링크는 KAN-36과 Confluence에 기록한다. 이번 승인은 PR 생성·병합·배포 승인이 아니며, 원격 CI와 운영 배포는 이후 단계에서 확인한다. 별도 승인 없이 공식 매핑·공통 설정 보호 우회는 하지 않는다.
