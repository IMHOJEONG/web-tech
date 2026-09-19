# 검증 보고서

실제로 실행한 시험과 측정 결과를 보관합니다. 현재 정책은 [architecture](../architecture/README.md), 실행 절차는 [runbooks](../runbooks/README.md), 구현 변경 이력은 [worklog](../worklog/README.md)에서 확인합니다.

## 성능과 화면 안정성

- [09-19 상세 렌더링 회귀 검증](performance/2026-09-19-article-production-regression.md): 상세 16개 통과, 스트리밍 검사 2개 실패. 동시 변경을 정리한 후 재검증 필요.

| 보고서                                                                                                 | 대상                                     |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| [09-19 Sticky header 운영 검증](performance/2026-09-19-docs-sticky-header-deployment-verification.md)  | 긴 글 스크롤, TOC 위치, 12회 성능 재측정 |
| [09-19 CLS 배포 검증](performance/2026-09-19-docs-cls-deployment-verification.md)                      | 셸 교체와 초기 레이아웃 안정성           |
| [09-18 레이아웃 이동·텍스트 지연 진단](performance/2026-09-18-docs-layout-shift-text-lcp-diagnosis.md) | 수정 전 원인 및 폰트 차단 비교           |
| [09-18 성능 기준선](performance/2026-09-18-deployed-performance-measurement.md)                        | 최초 배포 측정 기록                      |

재현 절차: [배포 성능 측정](../runbooks/docs-deployed-performance-measurement.md), [브라우저·기기 점검](../runbooks/docs-responsive-browser-device-checklist.md).

## 캐시와 정적 셸

- [09-19 게시 갱신 브라우저 검증](cache/2026-09-19-content-publication-browser-test.md): webhook 이후 목록·검색·상세 DOM과 인증 경계.
- [09-16 언어 URL 전환 후 정적 셸 검증](cache/2026-09-16-docs-static-shell-verification.md): 당시 운영 모델 통과, Cache Components 전체 앱 실패. 이후 조치와 구분하여 읽습니다.
- 재현 절차: [캐시 프로덕션 통합 시험](../runbooks/docs-content-cache-production-test.md).
- 테스트 도입 및 변경 과정은 [9월 작업 기록](../worklog/2026-09/README.md)에 유지합니다.

## 원본 증거

[artifacts 목록](artifacts/README.md)에서 JSON 측정값을 찾을 수 있습니다. 각 결과의 환경·표본·한계는 연결된 보고서와 함께 확인해야 합니다. 이 폴더의 결과만으로 현재 배포가 통과했다고 판단하지 않습니다.

보고서 작성과 이동 기준은 [문서 역할과 구조](../process/documentation-organization.md)를 따릅니다.
