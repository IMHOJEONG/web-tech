# 메인 시연 제거와 탐색 모션 보완

## Summary

사용자 검토 후 메인의 코드 접기 시연을 제거하고 실제 글 탐색에 연결된 모션으로 대체했다.
[KAN-31](https://web-tech-service.atlassian.net/browse/KAN-31)의 대안 검토이며 처음에는 커밋·푸시·배포 없이 로컬에서 확인했다.
사용자 로컬 확인 후 모션 코드·회귀 검사·문서의 작업별 커밋으로 분리한다. 기존 미디어 비교 도구·녹화·제안 문서는 커밋하지 않고 보존한다.

## Changed

- 루트·Feed에서 시연 widget 연결을 제거했다. 녹화본·제작 도구·비연결 player는 보존했다.
- Feed·Web/Mobile 허브·Docs 결과 목록만 상태 key로 갱신해 같은 카드도 필터 전환에 맞춰 등장한다.
- 재사용 CSS로 280ms 등장·짧은 stagger·fine-pointer 2px 이동·정적인 키보드 focus를 정리했다.
- Docs는 등장 wrapper와 hover 링크를 분리했다. 루트 row·주제 카드도 focus 피드백과 reduced-motion을 보완했다.
- 이전 메인 영상 연결 전용 검사는 제거하고 현재 요구에 맞는 `test:motion`과 별도 Playwright 검사를 추가했다.
- [검증 원본](../../verification/performance/2026-10-23-content-interaction-motion.md)에 재현 명령과 한계를 기록했다.

## Notes

색·표면·그림자 토큰·Server Component·URL query 구조는 유지했다. 필터나 입력 전체를 remount하지 않는다.
기존 미커밋 작업과 다른 작업 트리의 NAS·보안 기록은 보존했다. 새 라이브러리·토큰·운영 설정 변경은 없다.
이전 영상 연결의 검사 결과는 당시 기록으로 남기며 현재 적용 상태로 표시하지 않는다.
전용 모션 28개·기존 카드/필터/페이지네이션 44개와 전체 타입·변경 소스 lint가 통과했다. desktop 전용 검사의 모바일 실행 2개는 의도된 skip이다.
KAN-31 기존 3열 댓글과 [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817) v78을 갱신·재조회해 기존 본문과 링크 보존을 확인했다.

## Open Questions

- 실제 기기·공개망·production 성능은 아직 검사하지 않았다.
- 시연 자산을 본문에 적용하는 것은 별도 승인 범위다.

## Next

- 로컬에서 필터·카드 피드백을 사용자와 확인한다.
- 검토 후 커밋·운영 반영 여부를 결정한다.
