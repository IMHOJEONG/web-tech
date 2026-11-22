# MDX 본문 이미지의 우선순위와 크기 개선

## Summary

접근성 외 현대화 후보 중 첫 항목인 본문 이미지부터 적용했다. 기본 우선 로딩을 정리하고 로컬 이미지의 실제 크기를 주입했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## Changed

MDX 이미지 렌더러와 public 메타데이터 plugin, 런타임 MDX 연결, Next 이미지 파일 추적, sharp 직접 의존성과 catalog·lockfile을 갱신했다. 기존 정규화·MDX 기본 경로를 회귀 검사한다. [검증 보고서](../../verification/performance/2026-11-22-docs-article-images.md)

## Notes

34개 검사와 타입·린트가 통과했다. 세 엔진·두 폭에서 실제 렌더러 전후를 비교했다. 자세한 수치와 초기 검증 환경 실패는 보고서에 연결했다. 기존 다른 미커밋 파일은 보존했다. 공개 API·라우팅·공용 UI 계약의 새 결정이 없어 ADR을 추가하지 않았다. 공통 지침은 변경하지 않았다.

재사용할 이미지 요청·종횡비·sizes·미상 크기 fallback 기준은 기존 Confluence 지식 v23에 추가하고 본문과 근거 링크를 재조회했다. 운영 안내의 기존 지식 입구를 유지했다. [지식 문서](https://web-tech-service.atlassian.net/wiki/pages/19464193)

## Open Questions

미상 크기 원격 이미지의 공간 예약, 실제 LCP 후보, 전체 Next 빌드와 운영 환경은 후속 검증이다. 이번 변경과 정제 기록은 로컬 미커밋이다.

## Next

본문 이미지 변경을 검토한 뒤 다음 후보인 폰트의 실제 요청·전송량부터 측정한다.

KAN-83의 기존 3열 검증 표와 Confluence 운영 댓글 v26을 갱신하고 결과·지식 연결을 재조회했다. [운영 기록](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira?focusedCommentId=20250739)
