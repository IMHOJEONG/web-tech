# ADR-0027: 본문 제목 ID와 기존 fragment 링크의 호환성

## 상태와 범위

- 상태: 적용 중
- 대상: docs의 `renderArticleContent` runtime MDX 본문·목차와 제목 스크롤 여백
- 결정일: 2026-10-31
- 최종 검토: 2026-10-31
- PR #81의 로컬 구현·회귀 범위다. main 병합·운영 배포는 별도이며 원격 HTML 정규화와 정적 `@next/mdx` loader의 ID 정책을 대체하지 않는다.

## 배경

목차는 GitHub slug 규칙을 사용하지만 기존 제목 컴포넌트는 `slugifyHeading`으로 ID를 다시 만들었다. 문장부호가 있는 제목의 목차 링크가 본문의 ID와 달랐다. parser의 ID를 보존하면 목차 이동은 맞지만 이미 공유한 이전 fragment가 사라진다. 작성자가 지정한 ID와 자동 ID의 충돌, 중복 제목, h5·h6의 sticky header 가림도 함께 고려해야 한다.

## 결정

- ID 할당과 TOC의 최종 href 연결은 [본문 heading transform](../../apps/docs/lib/rehype-article-headings.ts)이 담당한다. MDX 컴포넌트는 전달받은 ID를 다시 계산해 덮어쓰지 않는다.
- 글 전체를 먼저 살펴 앞뒤에 있는 명시적 ID를 예약한다. 문자열·숫자 literal과 표현식 없는 template literal 등 정적으로 알 수 있는 JSX 값만 읽으며 작성자의 JavaScript를 실행해 ID를 알아내지 않는다.
- 우선순위는 **작성자가 명시한 ID → 기존 fragment의 첫 대상 → 새 canonical ID**다. 충돌하는 자동 ID에는 결정적인 suffix를 붙인다. 기존 ID와 다른 새 제목의 ID가 우연히 같아도 이전 링크를 새 제목이 빼앗지 않게 한다.
- 기존 h1~h4의 `slugifyHeading` 값이 canonical ID와 다르면 해당 제목 안에 높이 0·`aria-hidden` 호환 앵커를 둔다. 기존에 같은 ID가 중복됐다면 브라우저의 종전 첫 대상에 맞춰 한 곳만 소유한다. 명시된 ID와 충돌하면 호환 앵커를 중복 생성하지 않고 명시 ID를 유지한다. 이미 모호한 두 대상을 같은 fragment 하나로 모두 보존할 수 있다고 약속하지 않는다.
- 정적인 native JSX 제목에 ID가 없으면 같은 충돌 할당에 참여시킨다. Markdown 제목만 들어가는 기존 TOC 범위와 H1 제외 설정은 유지한다. 본문 제목과 TOC의 수·depth가 예상과 다르면 잘못된 href를 내보내지 않고 실패한다.
- h5·h6와 호환 앵커에도 기존 제목과 같은 header 기반 `scroll-margin-top`을 적용한다. 호환 span은 높이·탭 정지점·읽을 내용을 추가하지 않는다.

작성자가 직접 중복 지정한 ID, 동적으로 계산한 ID, 컴포넌트가 실행 중 생성하는 DOM ID까지 정적 transform이 증명하지는 못한다. 동적 제목을 안정적인 외부 링크 대상으로 쓰려면 작성자가 고유한 정적 ID를 지정해야 한다. 이 변경은 그러한 코드를 임의 평가하거나 명시 ID를 자동 개명하지 않는다.

## 대안과 영향

- GitHub slug만 적용: 단순하지만 기존 fragment가 사라지고 작성자 ID와도 충돌한다.
- 모든 ID에 새 prefix 사용: 충돌은 줄일 수 있으나 이미 배포된 링크를 일괄 변경하므로 제외한다.
- 이전 slug만 유지: 기존 링크에는 유리하지만 기존 중복 ID를 해결하지 못하고 parser와 TOC를 다시 조정해야 한다.
- 제목 컴포넌트별 전역 counter: 서로 다른 렌더·요청·스트리밍의 상태가 섞일 수 있으므로 사용하지 않는다. 할당 상태는 transform 호출 안에만 둔다.
- 선택한 방식은 추가 span과 충돌 관리가 필요하지만 현재 canonical 링크와 이전 fragment를 함께 제공한다. 제목 변경 자체, 이미 충돌한 작성자 ID, 동적 DOM까지 자동 보존하는 URL 영속 서비스는 아니다.

## 관련 문서

- [PR #81](https://github.com/IMHOJEONG/web-tech/pull/81) · [KAN-57](https://web-tech-service.atlassian.net/browse/KAN-57)
- [정제 검증 보고서](../verification/resilience/2026-10-31-offline-save-diagnostics.md)
- [작업 기록](../worklog/2026-10/2026-10-31-offline-save-diagnostics.md)
- [실제 production 상세의 커스텀 렌더러 회귀](../../apps/docs/article-e2e/article-heading-anchors.spec.ts)
