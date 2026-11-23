# Noto 커밋과 화면별 JavaScript 분리 검증

## Summary

사용자 요청으로 Noto Sans KR 적용과 라이선스·검증 기록을 `f05f7f5f`에 로컬 커밋했다. 이어 기존 현대화 계획의 화면별 JavaScript 분리 후보를 실험했다. 전송량 이득에 비해 느린 연결의 표시가 늦어져 제품 적용을 보류했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## Changed

화면 3개의 dynamic import 후보를 실제 프로덕션 빌드로 비교하고 router를 기준안과 같은 bytes로 복구했다. 이번 후속의 최종 변경은 정제 검증 문서·artifact와 해당 목차다. 공용 API 클라이언트·의존성·공통 지침과 기존 다른 미커밋을 보존했다. [조건·결과·후속 기준](../../verification/performance/2026-11-22-vuln-radar-route-splitting.md)

## Notes

Noto 11파일의 실제 pre-commit·commit-msg 훅, 커밋 범위 publication·commitlint가 통과했다. 공유 목차는 이번 항목만 부분 스테이징했고 다른 변경을 커밋에 넣지 않았다. 공식 OFL 원문과 내부 저작권을 유지했다. 원문 라이선스의 줄 끝 공백은 diff 검사 경고로 구분했고 라이선스 bytes를 임의로 바꾸지 않았다. 최초 스테이징 보조 스크립트의 기본 출력 버퍼 한도를 폰트 파일보다 크게 보완해 완료했다.

후속 후보의 빌드 2개와 타입·린트·기존 테스트 36개가 통과했다. 초기 직접 진입 24회·선로딩 후 전환 6회와 세 엔진·두 폭·두 빌드의 기능 12조건을 비교했다. 검증 코드의 제목·입력 역할 가정 오류는 실제 DOM에 맞춰 복구했고 제품 결함으로 집계하지 않았다. 원시 자료와 후보 소스·빌드는 저장소 밖에 보관한다.

부분 파일의 감소율과 전체 초기 JS·압축 전송량의 차이, 추가 왕복으로 이득이 사라지는 판단 기준을 Confluence의 기존 현대화 지식 본문에 승격했다. 새 제품 결정을 적용하지 않아 ADR을 추가하지 않았다. 공통 지침의 로컬·원격 변경은 없다.

[KAN-83 요약 댓글](https://web-tech-service.atlassian.net/browse/KAN-83?focusedCommentId=10127)의 3열 표와 [운영 진행 댓글 v32](https://web-tech-service.atlassian.net/wiki/pages/65817?focusedCommentId=20250739)을 갱신했다. [별도 지식 본문 v28](https://web-tech-service.atlassian.net/wiki/pages/19464193#코드-분리는-진입-파일보다-전체-요청과-추가-왕복으로-판단하기)의 본문·원본 링크·상위 운영 안내 경로를 재조회했다. Noto 지식 항목에도 실제 로컬 커밋 상태를 반영했다.

## Open Questions

운영·실기기 LCP/INP와 실서비스 API 지연은 미검증이다. 분리 후보의 제품 적용과 의존성 정리는 수행하지 않는다. Noto는 로컬 커밋 상태이고 이번 후속 기록은 미커밋이다. 푸시·PR·배포는 수행하지 않았다.

## Next

Feed의 React Query 취소 신호가 실제 fetch까지 전달되는지 검토한다. 취소와 자체 timeout·캐시·재시도를 구분하며 기존 API 클라이언트 미커밋을 보존한다. 화면 분리는 무거운 독립 기능의 실제 비용이 커질 때 다시 측정한다.
