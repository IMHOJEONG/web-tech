# 검증 보고서

실제로 실행한 시험과 측정 결과를 보관합니다. 현재 정책은 [architecture](../architecture/README.md), 실행 절차는 [runbooks](../runbooks/README.md), 구현 변경 이력은 [worklog](../worklog/README.md)에서 확인합니다.

## 성능과 화면 안정성

- [09-23 공개 배포 접근성 재검증](accessibility/2026-09-23-deployed-shell-recheck.md): 20개 통과·4개 조건부 제외. 이전 CSS 누락 증상은 현재 재현되지 않으며 원인은 미확정.

- [09-23 코드·UI/UX 현황 분석](accessibility/2026-09-23-docs-code-ux-review.md): 빌드 재검증, 반영된 화면과 개선 후보 구분.

- [09-23 배포 접근성 점검](accessibility/2026-09-23-deployed-shell.md): 키보드 이동 통과, 포커스 CSS 누락 확인과 미검증 범위.

- [09-19 로컬 문서 읽기 중복 제거](performance/2026-09-19-local-document-reads.md): 요청 내 파일 읽기 공유와 요청 간 재읽기 검증.

- [09-19 상세 렌더링 회귀 검증](performance/2026-09-19-article-production-regression.md): 상세 16개 통과, 스트리밍 검사 2개 실패. 동시 변경을 정리한 후 재검증 필요.

| 보고서                                                                                                 | 대상                                     |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| [09-19 Sticky header 운영 검증](performance/2026-09-19-docs-sticky-header-deployment-verification.md)  | 긴 글 스크롤, TOC 위치, 12회 성능 재측정 |
| [09-19 CLS 배포 검증](performance/2026-09-19-docs-cls-deployment-verification.md)                      | 셸 교체와 초기 레이아웃 안정성           |
| [09-18 레이아웃 이동·텍스트 지연 진단](performance/2026-09-18-docs-layout-shift-text-lcp-diagnosis.md) | 수정 전 원인 및 폰트 차단 비교           |
| [09-18 성능 기준선](performance/2026-09-18-deployed-performance-measurement.md)                        | 최초 배포 측정 기록                      |

재현 절차: [배포 성능 측정](../runbooks/docs-deployed-performance-measurement.md), [브라우저·기기 점검](../runbooks/docs-responsive-browser-device-checklist.md).

## 캐시와 정적 셸

- [09-19 Next.js 체크리스트 1차 검증](cache/2026-09-19-nextjs-checklist-phase-one.md): production suite·캐시 통과와 미검증 범위, 서버 스트림 오류 기록.
- [09-19 게시 갱신 브라우저 검증](cache/2026-09-19-content-publication-browser-test.md): webhook 이후 목록·검색·상세 DOM과 인증 경계.
- [09-16 언어 URL 전환 후 정적 셸 검증](cache/2026-09-16-docs-static-shell-verification.md): 당시 운영 모델 통과, Cache Components 전체 앱 실패. 이후 조치와 구분하여 읽습니다.
- 재현 절차: [캐시 프로덕션 통합 시험](../runbooks/docs-content-cache-production-test.md).
- 테스트 도입 및 변경 과정은 [9월 작업 기록](../worklog/2026-09/README.md)에 유지합니다.

## 콘텐츠

- [09-26 공용 UI CI 연결 검증](content/2026-09-26-shared-ui-ci.md): fixture 62개·production 소비 화면 16개 통과, 원격 Actions 미검증 범위.

- [09-22 콘텐츠 편집과 Canvas hover 진단](content/2026-09-22-content-editorial-and-canvas-hover.md): 글 4개 보완과 일반 버튼 대조군·headless 비교.

- [09-22 이벤트 루프 예제 검증](content/2026-09-22-event-loop-example.md): 본문 예제를 Chrome에서 10회 반복 검증.

- [09-22 공용 UI main 기준 분리 검증](content/2026-09-22-shared-ui-main-baseline.md): 블로그 변경 없이 공용 UI만 적용한 브랜치 검사.

- [09-22 Base UI 전환 검증](content/2026-09-22-base-ui-migration.md): 공용 UI·Activity·production 소비 화면과 번들 비용.

- [09-21 Activity 포커스 실험](content/2026-09-21-activity-focus.md): DOM·Effect 보존, Sheet 포털 잔존과 외부 배치 비교.

- [09-20 공개 글 독해 검토](content/2026-09-20-content-readability-review.md): 로컬 공개 글 10개의 설명 흐름과 편집 우선순위.
- [09-20 로컬 콘텐츠 재점검](content/2026-09-20-local-content-review.md): 15개 변환, 이미지 참조, ARIA 본문 중복 확인.

## 원본 증거

[artifacts 목록](artifacts/README.md)에서 JSON 측정값을 찾을 수 있습니다. 각 결과의 환경·표본·한계는 연결된 보고서와 함께 확인해야 합니다. 이 폴더의 결과만으로 현재 배포가 통과했다고 판단하지 않습니다.

보고서 작성과 이동 기준은 [문서 역할과 구조](../process/documentation-organization.md)를 따릅니다.
