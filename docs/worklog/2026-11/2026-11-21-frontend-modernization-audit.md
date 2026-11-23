# 프런트엔드 현대화 재검증과 코드 수정 전 계획

## Summary

사용자 요청에 따라 Modern Web Guidance로 저장소를 스캔하고 실제 소스·CSS·설치 문서로 후보를 검증했다. 제품 코드는 수정하지 않고 Sidebar·Skeleton의 동작 줄이기 처리와 썸네일 API 정리 순서를 제안했다. 기준은 `c6465f48c96aef681a42de77a584b25e69fd8525`와 기존 로컬 작업 트리다.

같은 날 사용자 후속 승인으로 권장 3개 파일을 실제 수정하고 공용 UI·docs 타입/린트, 기존 회귀와 세 브라우저 엔진의 변경 전후 비교를 완료했다. 최초 감사와 실제 적용의 결과는 연결한 보고서에서 구분한다.

## Changed

- [검증·우선순위·완료 조건](../../verification/accessibility/2026-11-21-frontend-modernization-audit.md)과 [정제 관측 요약](../../verification/artifacts/2026-11-21-frontend-modernization-audit.json), 역할별 목차를 추가·갱신했다.
- 기존 [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)의 이번 감사 댓글을 갱신하고 [Confluence 운영 기록](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira?focusedCommentId=20250739)을 연결했다. 기존 JavaScript 적용/PR 이력과 구분한다.
- [기존 현대화 지식](https://web-tech-service.atlassian.net/wiki/pages/19464193#현대화-후보는-실제-CSS와-소비-경로로-검증하기)에 실제 CSS·소비 경로로 오탐을 구분하는 기준을 추가했다. 새 지식 페이지는 만들지 않았다.

## Notes

아래 Notes는 최초 감사의 기록이며, 사용자 후속 승인에 따른 적용 결과는 마지막 절로 구분한다.

- 자동 검사 3범위, 후보별 keep/drop 대조와 Chromium 합성 CSS 관측을 수행했다. 최초 브라우저 실행의 샌드박스 실패와 승인 후 성공은 보고서에서 구분한다.
- 690개 소스 해시 동일, 이번 문서 6개의 Prettier 통과, 작업 트리 view의 문서 오류 0개와 기존 빈 인덱스를 확인했다. 인덱스를 다시 add하거나 사용자의 소스를 포맷하지 않았다.
- 지식 승격 이유: outline/클래스 이름만 보고 결함을 단정할 수 없고 실제 CSS·UA 포커스 변화와 소비 경로를 확인해야 한다는 재사용 기준을 얻었다. 지식 게시 v5의 추가 본문·기존 원격 근거 보존·공식 링크, 상위 운영 안내 연결과 진행 댓글 저장을 재조회했다.
- 이번에 공통 AGENTS·설정·공개 승인 기록을 변경하지 않았다. 공통 지침의 로컬/원격 반영을 새로 수행했다고 보고하지 않는다. 새 구조 결정이 없어 ADR 추가는 해당 없음이다.
- 미커밋·미푸시이며 전체 라우트·다른 엔진·실기기·성능·운영 검증은 미실행이다.

## Open Questions

선택 개선인 Vuln Radar 명시적 outline과 native 목차 실험의 제품상 이익은 후속 검증이 필요하다. 권장 코드 적용은 사용자 후속 승인 후 수행했다.

## Next

공용 모션 → 썸네일 API → 관련 소비 경로 회귀를 로컬 완료했다. 실제 LCP 우선순위 조정과 native overlay 교체는 근거를 확보한 별도 범위로 남긴다. 커밋·푸시·배포는 이번 요청에서 수행하지 않았다.

## 승인 후 실제 적용 기록

- Sidebar의 공간 전환·내부 메뉴·단순 회전과 Skeleton을 motion-safe로 제한했다. Thumbnail의 미사용 deprecated priority prop을 제거하고 lazy·실패 fallback을 유지했다.
- 프로젝트 `.agents` 스킬·공식 lock 출처와 pnpx CLI 1.0.1의 실제 검색/조회를 확인했다. 앱 런타임 의존성·설정·lockfile·공통 AGENTS는 수정하지 않았다.
- 최종 UI build·공용 UI/docs 타입·린트와 기존 primitive/hydration 32개가 통과했다. 앞선 68개 suite는 중간 소스의 결과이며 최종 결과와 합산하지 않는다.
- Chromium·Firefox·WebKit × 세 폭 × normal/reduce의 변경 전후 18조건·36실행에서 실제 컴포넌트의 모션·키보드·포커스·이미지 로딩/fallback을 확인했다. 임시 번들 환경·srcset 테스트 입력·무회전 표현의 초기 harness 실패와 최종 성공은 보고서에 구분했다.
- 지식 승격: transition 속성만 제한하고 duration을 남기면 초기 all과 조합해 모션이 유지될 수 있는 판단 기준을 기존 Confluence 지식 v8에 보완하고 원래 본문·새 근거를 재조회했다. 상위 운영 댓글 v2도 저장했다. 읽기 전용 장식 속성의 첫 댓글 저장 실패와 정규 HTML 복구는 보고서에 남겼다. 실제 소스·검증 원본은 같은 보고서와 artifact에서 관리한다. 새 ADR·중복 지식 페이지는 만들지 않았다.
- 마감 검사: 소스 3개·문서 6개의 의도한 9파일만 변경, 다른 기존 2,330개와 HEAD·인덱스 동일. 선택 9파일 포맷·diff와 작업 트리 view 문서 6개 검증 통과·오류 0개를 확인했다. 이번 Jira 실제 적용 댓글과 Confluence 운영/지식 저장은 재조회로 확인한다. 공통 지침의 로컬/원격 반영은 새로 수행하지 않았다.

## 사용자 요청 후 로컬 커밋

사용자의 현재 작업 커밋 요청에 따라 제품 소스 3개를 `545428a4`로 커밋했다. staged 포맷·문서·publication 검사와 실제 훅이 통과했다. 정제 기록 3개와 공유 목차의 이번 항목 3개만 별도 문서 커밋으로 분리하고 다른 작업·스킬·원시 자료는 제외한다. 원격 푸시·PR·배포는 수행하지 않는다. 다음 작업은 카드 hover 이동/확대의 reduced-motion 대응 한 주제다.
