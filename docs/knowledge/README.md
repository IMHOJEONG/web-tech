# 프로젝트 지식 정리

## 목적

이 폴더는 이 프로젝트를 진행하면서 배운 점과, 다음 작업자가 미리 알고 있으면 시간을 아낄 수 있는 내용을 파트별로 정리하는 공간입니다.

이 폴더는 아래 질문에 답하도록 유지합니다.

- 이 프로젝트에서 자주 헷갈리는 지점은 무엇인가
- 이미 한 번 겪은 문제를 다음엔 어떻게 피할 수 있는가
- 어떤 규칙이 사실상 운영 기준처럼 쓰이고 있는가

## 운영 규칙

작업 실행 이력과 배운 지식은 [분리 기준](../process/issue-tracking.md#작업-기록과-배운-지식의-분리)을 따릅니다. Confluence에는 재사용할 개념·교훈을 주제별로 설명하고 이 저장소에는 구현에 결합된 원본과 탐색 링크를 유지합니다. 아래 지식 페이지는 실제 생성된 문서이며, 이 색인과 공통 지침의 main 반영 여부는 작업 기록과 구분합니다.

- [웹 현대화 판단: Baseline·타입 설정·런타임](https://web-tech-service.atlassian.net/wiki/pages/19464193)
- [보안 업데이트 운영: 패치·병합·배포·알림 해소](https://web-tech-service.atlassian.net/wiki/pages/19496961)
- [콘텐츠 캐시 운영: 무효화와 최신 게시 완료](https://web-tech-service.atlassian.net/wiki/pages/19234822)

- 구현 중 반복적으로 설명하게 되는 내용은 여기에 승격합니다.
- 단발성 메모는 `worklog`에 남기고, 재사용 가치가 생기면 여기로 옮깁니다.
- 문서는 파트 기준으로 나눕니다.

현재 파트 구조:

- `docs/knowledge/docs-app/`
  - `apps/docs`의 정보구조, 렌더링, UI 운영 지식
- `docs/knowledge/content-platform/`
  - 원격 콘텐츠 API, authoring, asset, 인증 관련 지식
- `docs/knowledge/design-system/`
  - 디자인 토큰, 테마, 코드 블록, 반응형 UI 기준
- `docs/knowledge/infra-tooling/`
  - pnpm, env, build, next.config, 배포/도구 관련 지식

## 작성 기준

주제별 설명:

- [화면 표시와 hydration, DOM 소유권](docs-app/hydration-readiness-and-dom-ownership.md): SSR 화면이 보인 뒤에도 React 작업이 남을 수 있는 이유와 스켈레톤 검사 사례.

각 파트 문서는 아래 정도를 기본 구조로 권장합니다.

- 배운 점
- 자주 실수하는 부분
- 현재 운영 기준
- 다음에 보면 좋은 관련 문서
