# Docs Resource Content Roadmap

## Status

Adopted on 2026-09-12.

## Purpose

HeapForge의 문서를 단편적인 메모 모음이 아니라 문제를 이해하고 직접 검증할 수 있는 기술 리소스로 확장한다. 카테고리 수보다 실제 문서 밀도와 품질을 먼저 확보한다.

## Quality Bar

양질의 리소스는 다음 질문에 답해야 한다.

1. 독자가 이 글을 읽어야 하는 문제 상황이 분명한가?
2. 용어를 나열하지 않고 작동 원리를 설명하는 mental model이 있는가?
3. 실무에서 실패 지점을 좁히는 순서가 있는가?
4. 직접 실행하거나 관찰할 수 있는 예제와 점검표가 있는가?
5. 과도한 일반화, 보안 위험, 운영상 주의점을 함께 설명하는가?
6. RFC, 표준, 공식 문서처럼 확인 가능한 1차 자료로 이어지는가?

위 항목은 품질을 확인하는 질문이지 모든 글에 같은 목차를 강제하는 template이 아니다. 정의만 나열한 문서는 피하되, 글의 성격에 따라 장애 기록, 질문, 실험, 비교처럼 가장 자연스러운 출발점을 선택한다.

## Writing Voice

- 제목은 `{기술명} 가이드`, `{기술명} 총정리`보다 독자가 실제로 마주치는 질문이나 대비를 드러낸다.
- 모든 글을 `이 문서에서 확인할 것`, `실무 점검표`, `공식 자료` 순서로 반복하지 않는다.
- 글 첫머리에는 추상적인 학습 목표보다 이 개념이 필요해지는 장면이나 오해를 먼저 둔다.
- 영어 용어는 정확성을 위해 필요할 때 사용하되, 영어 명사를 연달아 나열해 문장을 만들지 않는다.
- checklist, table, callout은 정보를 더 잘 읽게 할 때만 사용하고 형식을 채우기 위해 넣지 않는다.
- 직접 겪지 않은 장애나 실험을 작성자의 경험처럼 꾸미지 않는다. 재현하지 않은 내용은 일반 원리 또는 확인할 가설로 표현한다.

## Category Principles

- 실제 published 문서가 없는 카테고리는 UI에 먼저 노출하지 않는다.
- 한 문서가 들어오면 subcategory로 시작할 수 있지만, main category는 분명한 후속 주제 목록을 가져야 한다.
- top-level navigation 승격은 5~10개 이상의 문서와 독립적인 탐색 목적이 확인된 뒤 검토한다.
- 프레임워크 이름보다 오래 유지되는 문제 영역을 우선한다.
- 같은 주제를 local과 remote에 중복 게시하지 않고 canonical route를 하나로 유지한다.

## Initial Category Map

| Main category    | Subcategory | 핵심 질문                                          | 상태          |
| ---------------- | ----------- | -------------------------------------------------- | ------------- |
| FE               | React       | 컴포넌트와 실행 경계를 어떻게 나누는가             | 운영 중       |
| FE               | Browser     | 브라우저는 어떻게 로드하고 렌더링하는가            | published     |
| BE               | Node.js     | 요청, 비동기 작업, 장애 경계를 어떻게 운영하는가   | 운영 중       |
| Computer Science | OS          | 실행 흐름과 자원은 어떻게 관리되는가               | 운영 중       |
| Computer Science | Network     | 요청은 어떤 계층을 지나며 어디서 실패하는가        | draft 검수 중 |
| Infrastructure   | Containers  | 프로세스를 어떻게 패키징하고 안전하게 서비스하는가 | draft 검수 중 |

## Rollout Sequence

### Phase 1: 실행 경로의 기초

- Browser: 첫 화면은 어디에서 늦어지는가 (`published`)
- Network: 502 앞에서 서버부터 의심하지 않기 (`draft`)
- Containers: 살아 있는 컨테이너, 준비되지 않은 서비스 (`draft`)

이 단계는 프론트엔드, 백엔드, 배포 문제를 같은 실행 흐름으로 연결하는 기준선을 만든다.

### Phase 2: 신뢰성과 검증

- Testing: unit, integration, contract, E2E 테스트 경계
- Observability: log, metric, trace와 correlation ID
- Security: SSRF, secret 관리, 인증과 인가 경계
- API Design: idempotency, pagination, error contract, rate limit

`Testing`, `Observability`, `Security`는 각각 최소 2개의 published 문서를 준비한 뒤 독립 subcategory 노출을 검토한다.

### Phase 3: 깊이 있는 시스템 주제

- OS: virtual memory, file descriptor, scheduling
- Network: HTTP caching, proxy, connection reuse, QUIC
- Browser: event loop, rendering, storage, security boundary
- Infrastructure: container networking, reverse proxy, deployment rollback

Phase 3에서는 단일 개념 글보다 앞선 기준 문서를 연결하는 reading path와 실험 기록을 우선한다.

## Resource Selection Rules

외부 자료는 다음 우선순위로 선택한다.

1. RFC, 표준 명세, 공식 API reference
2. 브라우저·런타임·프레임워크의 공식 문서
3. 공식 engineering guide 또는 maintainer가 관리하는 자료
4. 재현 가능한 연구나 기술 분석

링크를 추가할 때는 단순한 “참고”가 아니라 해당 자료에서 무엇을 더 확인할 수 있는지 문맥을 제공한다. 특정 버전에 종속된 동작은 버전과 확인 날짜를 함께 기록한다.

## Publication Checklist

1. 기존 글과 핵심 질문이 중복되지 않는지 확인한다.
2. 독자가 읽고 나서 직접 확인할 수 있는 절차가 있는지 본다.
3. 명령어와 코드가 안전한 기본값을 사용하는지 검토한다.
4. 공식 자료 링크가 현재 유효하고 본문 주장과 연결되는지 확인한다.
5. `pnpm --filter docs test:content`를 통과한다.
6. 상세 route와 `/docs` 검색·section 분류를 확인한다.

## Related Docs

- `docs/runbooks/docs-contributor-guide.md`
- `docs/architecture/docs-content-authoring-markup-policy.md`
- `docs/architecture/docs-computer-science-channel-evaluation.md`
- `docs/architecture/docs-infra-channel-evaluation.md`
