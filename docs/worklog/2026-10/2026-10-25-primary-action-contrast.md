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

## 다음 단계 승인 후 PR 분리

이후 사용자의 다음 단계 진행 요청에 따라 PR 준비·원격 CI 검증으로 진행했다. 원래 브랜치의 미반영41개 파일을 통째로 올리지 않고 최신 main `4e80275`에서 대비 개선만 분리해 코드 커밋 `2902044`를 만들었다. 기존 브랜치·원격 커밋 `d660f4bc`·미커밋·stash와 기존3001 서버를 보존했다. 목차 충돌3개는 main 내용을 유지하면서 이번 링크만 추가했다.

분리한 소스에서 전체 UI68개+실제 앱12개 재검증과 타입/변경 파일 ESLint를 통과했다. 명령·관측값은 [보고서의 후속 검증](../../verification/accessibility/2026-10-25-primary-action-contrast.md#main-기반-pr-분리후속-검증)과 기존 artifact에 이어 기록했다. lockfile·의존성·공통 설정·앱 기능은 추가 변경하지 않았다. 공개 계약 변경이 아니므로 새 ADR은 필요하지 않다.

이번 단계는 PR 생성·리뷰·원격 CI 확인까지만이며 main 병합·Production 배포는 사용자 승인 전 실행하지 않는다. PR과 실제 검사 URL은 Jira KAN-36·Confluence의 같은 기록에 연결하고 재조회한다.

## PR #62·#63 병합 승인 후 통합

사용자가 두 PR 병합을 승인했다. #62는 최종 squash 메시지 전체 사전검사 후 main `f8fbc068d633796d64343ea01aabee0e35a3f32c`로 병합했다. #63의 기존 head `54ed9a9`는 CI·문서·CodeQL·Preview를 통과했지만 CodeRabbit은 사용량 제한으로 실제 리뷰를 수행하지 않았다. 미해결 리뷰 스레드는 두 PR 모두 0개였으며 자동 체크 성공을 실제 리뷰 승인으로 간주하지 않았다.

#62 병합 직후 #63은 문서 목차 3개 충돌로 사전검사가 중단됐다. 최신 main을 merge로 통합하고 양쪽 목차 링크를 모두 보존했다. 코드 충돌·자동 원문 변환·의존성 변경은 없고 기존 브랜치·미커밋·stash는 수정하지 않았다. 새 head의 CI 재검증 이후에만 다시 최종 메시지를 검사해 #63 병합을 요청한다. main CI·Vercel Production·NAS 이미지 게시/컨테이너 교체는 각각 별도 결과로 구분한다.
