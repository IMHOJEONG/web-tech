# Confluence 지식 문서와 작업 기록 분리

## Summary

사용자 요청에 따라 웹 현대화·보안 업데이트·콘텐츠 캐시의 배운 개념과 운영 교훈을 Confluence의 별도 지식 문서 3개로 작성했습니다. 작업 댓글 갱신만으로 지식 문서화가 완료됐다고 보고하지 않도록 공통 지침도 보강했습니다.

기준 main `53ab14e5`, 작업 브랜치 `codex/confluence-knowledge-20261119`입니다. 기존 Modern Web Guidance 설치·스캔의 미커밋 작업은 별도 작업 트리에 유지했습니다. 초기 지식 게시 단계에서는 커밋·푸시 없이 로컬 지침과 Confluence 게시를 구분했습니다. 후속 사용자 요청으로 공통 지침·색인·이 기록만 공개 검수 후 별도 커밋·푸시하고 main 반영용 PR의 CI·CodeRabbit과 추적 기록을 확인합니다. 앱 코드·NAS·초안·stash·배포·main 병합은 이번 후속 범위에서도 제외합니다.

## Changed

- [웹 현대화 판단](https://web-tech-service.atlassian.net/wiki/pages/19464193): Baseline·타입·런타임·회귀의 차이와 KAN-83 스캔의 오탐·보류·후속 후보를 설명합니다. 단순 타입 설정 확인을 실제 컴파일 실패 증명으로 확대하지 않습니다.
- [보안 업데이트 운영](https://web-tech-service.atlassian.net/wiki/pages/19496961): 패치·검증·병합·배포·알림 fixed를 별도 증거로 확인하는 기준과 PR #96 사례를 설명합니다. 과거 알림 0건을 현재 안전성 보증으로 쓰지 않습니다.
- [콘텐츠 캐시 운영](https://web-tech-service.atlassian.net/wiki/pages/19234822): 캐시 계층·웹훅·기대 내용 검증·revision/세대와 legacy/private-git 발행 방식의 차이를 설명합니다. 운영 모드 전환 완료는 추정하지 않습니다.
- [공통 AGENTS](../../../AGENTS.md), [추적 규칙](../../process/issue-tracking.md#작업-기록과-배운-지식의-분리), [문서화 정책](../../process/codex-documentation-policy.md), [지식 색인](../../knowledge/README.md)에 승격 조건·형식·원본 책임·마감 보고와 지식 링크를 반영했습니다.
- 추적: [KAN-84](https://web-tech-service.atlassian.net/browse/KAN-84). 새 페이지는 기존 운영 안내 65817 하위에 두었으며 기존 댓글·페이지·편집 초안·공유 권한은 변경하지 않았습니다. 상위 문서 본문을 덮어쓰거나 미게시 편집 내용을 함께 게시하지 않았습니다.

## Notes

- 작성일: 2026-11-19 KST. Confluence 기존 주제·하위 페이지와 Jira를 검색해 중복을 확인하고 주제 페이지 3개를 생성했습니다. 개념 → 프로젝트 사례 → 판단 기준 → 주의점 → 근거 구조와 검토일·범위·미검증 상태를 포함했습니다.
- 공식 Baseline·TypeScript lib·Next revalidateTag·Dependabot·Next.js 권고를 확인하고 저장소의 실제 정책·Route Handler·ADR-0032 및 설치된 Next 16.4.6 문서와 대조했습니다. 지식 문서는 새 측정·취약점 재현·운영 발행 수행 보고서가 아닙니다.
- 생성된 페이지의 published/current 상태, 제목·본문 절·근거 링크·KAN-84 연결을 재조회했고 운영 안내의 실제 하위 페이지 3개를 확인했습니다. 기술 원본 링크는 존재하는 원격 커밋·문서만 사용하며 미푸시 MWG 스캔은 KAN-83으로 연결했습니다.
- 최초 검증은 공통 지침·색인의 로컬 변경을 대상으로 했습니다. Confluence 지식 게시와 main 지침 적용을 구분합니다. 코드·데이터 흐름·공용 UI 계약은 바뀌지 않아 새 ADR 대신 문서 운영 규칙을 갱신했습니다. 변경 문서 구조·상대 링크·목차의 작업 트리 검사와 선택 파일 Prettier·Git diff 검사를 통과했습니다. 페이지에서 참조한 저장소 파일 10건은 실제 커밋 객체에 존재함을 확인했습니다. 앱 변경이 없어 로컬 빌드·E2E는 재실행하지 않았습니다. 후속 원격 SHA·CI·리뷰 결과는 실제 PR과 KAN-84·Confluence 작업 요약에서 별도로 추적합니다.

## Open Questions

기존 누적 작업 이력의 대규모 이동·삭제와 Confluence 전체 페이지 재구조화는 이번 범위 밖입니다. 지식 페이지에 현재 운영 설정을 자동 복제하지 않으며 관련 계약·환경이 바뀔 때 재검토합니다.

## Next

최종 공개 검수 후 요청된 공통 지침 커밋·푸시·PR·최신 head의 CI·리뷰를 확인하고 KAN-84·Confluence 작업 요약을 갱신합니다. 지식 페이지 3개 본문은 이 PR에 복제하지 않습니다. main 병합·운영 배포와 기존 MWG·초안·stash·NAS 작업은 제외하며, 지침의 main 전파는 PR 생성과 별개로 확인합니다.
