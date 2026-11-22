# 본문 이미지 커밋과 폰트 로딩 측정

## Summary

본문 이미지 변경과 정제 기록 16파일을 `775eb593`에 로컬 커밋했다. 다음 계획인 실제 폰트 요청·전송량 측정과 격리 선로딩 제거 실험을 완료했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## Changed

실제 fonts.ts를 사용하는 격리 Next 프로덕션 fixture에서 8조건의 기준과 실험을 비교했다. 제품 폰트 설정은 변경하지 않았다. [결과와 범위](../../verification/performance/2026-11-22-docs-font-loading.md)

## Notes

커밋에는 이미지 코드·의존성·보고서와 해당 목차 행만 포함했다. 공유 목차의 다른 변경은 부분 stage로 보존했다. 실제 훅과 커밋 범위 공개 검수·commitlint가 통과했다. 원시 자료와 기존 다른 미커밋 작업은 포함하지 않았다.

글꼴의 CSS 사용과 preload의 차이를 기존 Confluence 지식에 정리했다. 제품 구조·공개 계약의 변경이 없어 ADR과 공통 지침 변경은 없다. 폰트 측정 기록은 로컬 미커밋이다. [지식 문서](https://web-tech-service.atlassian.net/wiki/pages/19464193)

## Open Questions

한글 텍스트 표시 시간, 운영 LCP·CLS, locale 전환과 브라우저별 결과는 미검증이다. 저장소 밖 fixture의 root 제한에 따른 최초 실패와 Webpack 전환은 보고서에 기록했다.

## Next

격리 실험의 한글 cold-load 표시 시간과 fallback 기하를 비교해 선로딩 변경의 제품 적용 여부를 판단한다.

KAN-83 기존 검증 표와 Confluence 운영 댓글 v27에 이미지 커밋·폰트 측정·미검증 범위를 기록하고 재조회했다. 별도 지식 v24의 본문·근거와 기존 운영 안내의 탐색 경로도 확인했다.

## 측정 기록 커밋과 권장안 적용

폰트 측정 기록 7파일을 `06adc7a0`에 커밋했다. 해당 문서·정제 artifact와 목차 행만 포함했고 실제 훅·공개 검수·commitlint가 통과했다.

한글 첫 표시·웹폰트 준비·LCP·CLS를 느린 연결과 일반 연결의 48개 유효 실행에서 비교했다. 악화를 관측하지 않아 Pretendard preload=false를 적용했다. 초기 긴 본문 harness의 입력 오류와 재실행은 검증 보고서에 기록했다. 제품 설정의 타입·린트가 통과했다.

사용자가 요청한 무료 한글 폰트 대안은 SUIT·Wanted Sans·Spoqa Han Sans Neo·Noto Sans KR의 공식 OFL 배포를 확인했다. 현재 UI 본문의 첫 비교 후보로 SUIT를 권장하며 후보별 실제 용량과 가독성은 미비교다. 서체 교체는 수행하지 않았다. 공통 지침과 ADR의 새 변경은 없다.

원래 Next 항목의 후속 계획은 이번 적용으로 진행됐다. 적용 코드와 후속 기록은 로컬 미커밋이며 운영 CWV와 실제 전체 페이지의 검증은 남아 있다.

KAN-83의 기존 3열 표와 Confluence 운영 댓글 v28을 갱신하고 커밋·48실행·적용·미검증 상태를 재조회했다. 별도 지식 v25에는 첫 표시와 웹폰트 준비의 구분, 동일 입력 검증 기준을 추가하고 본문·근거 링크와 기존 탐색 경로를 확인했다.
