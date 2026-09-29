# web-tech Knowledge Map

## 목적과 경계

`web-tech`는 실제 코드와 실행 결과를 관리하는 모노레포다. Obsidian은 설계 이유, 학습 맥락, 반복 가능한 도메인 지식을 관리한다.

- 코드 저장소: 이 저장소
- Obsidian vault: `/Users/coder/Desktop/web-test`
- Obsidian 프로젝트 허브: `06. 만들고 싶은 것/블로그 만들기/개요.md`
- 이 문서의 역할: 작업 시작 전에 읽을 지식의 범위와 작업 후 흡수 위치를 고정한다.

코드와 테스트의 source of truth는 이 저장소에 둔다. Obsidian vault 전체를 복사하거나 submodule로 연결하지 않는다.

## 프로젝트 구성

- `apps/docs`: 공개 블로그·문서 화면
- `apps/docs-backend`: 콘텐츠 API와 원격 콘텐츠 연동
- `packages/docs-content-contract`: 콘텐츠 계약과 공유 타입
- `packages/ui`: 공용 UI 컴포넌트와 디자인 시스템
- `docs/architecture`: 장기 설계와 정책
- `docs/runbooks`: 반복 실행 절차
- `docs/verification`: 특정 실행의 검증 결과
- `docs/worklog`: 작업 단위 기록
- `docs/knowledge`: 반복 재사용 지식

## 작업 시작 순서

1. `docs/architecture/README.md`에서 현재 적용 중인 ADR을 확인한다.
2. Obsidian의 `블로그 만들기` 프로젝트 허브를 읽는다.
3. 이번 변경과 직접 관련된 Obsidian 도메인 노트만 5~10개 이내로 읽는다.
4. 저장소의 기존 architecture, runbook, knowledge 문서를 먼저 찾는다.
5. 기존 문서로 부족한 경우에만 공식 문서를 조사한다.
6. 구현 후 필요한 검증 명령과 문서 역할을 정한 뒤 작업한다.

## 첫 번째 읽기 목록

Obsidian vault에서 다음 노트를 프로젝트의 기본 진입점으로 사용한다.

- `06. 만들고 싶은 것/블로그 만들기/개요.md`
- `01. Javascript/Framework/React/개요.md`
- `01. Javascript/Framework/Next.js - Details!/개요.md`
- `01. Javascript/Code-Frontend/Routing/필터 정렬 페이지네이션 URL 설계 방법.md`
- `11. Infra/Web/Sitemap 잘 준비하는 방법.md`
- `11. Browser/Chrome DevTools/개요.md`

변경 주제가 인증·콘텐츠 API·UI·성능 중 하나로 좁혀지면 위 목록 전체를 읽지 않고 해당 도메인 노트만 추가한다.

## 작업 후 흡수 규칙

- 구현 세부사항과 테스트 결과는 이 저장소의 문서에 기록한다.
- 프로젝트에서 반복해서 사용할 설계 원칙은 Obsidian 도메인 허브로 흡수한다.
- 프로젝트에만 유효한 결정은 Obsidian 프로젝트 허브의 작업 기록에 남긴다.
- 공식 문서 조사는 질문, source, 결론, 흡수 위치를 남긴다.
- commit hash가 중요한 결정과 연결되면 Obsidian 프로젝트 허브에 기록한다.

### 흡수 위치 선택

| 새로 얻은 내용             | 1차 기록 위치                               | Obsidian 흡수 위치                            |
| -------------------------- | ------------------------------------------- | --------------------------------------------- |
| URL·검색·필터·페이지네이션 | `docs/architecture/`                        | JavaScript Routing 허브, 블로그 프로젝트 허브 |
| SEO·sitemap·robots         | `docs/architecture/` 또는 `docs/runbooks/`  | Infra/Web 허브, 블로그 프로젝트 허브          |
| 콘텐츠 계약·API·인증       | `docs/architecture/` 또는 `docs/runbooks/`  | Backend·Network·Security 허브                 |
| UI·React·Next.js 구현 원칙 | `docs/knowledge/` 또는 `docs/architecture/` | React·Next.js 허브                            |
| 성능·회귀·브라우저 조사    | `docs/verification/`                        | Browser/Chrome DevTools 허브                  |

## 작업 종료 체크리스트

- [ ] 변경 목적과 대상 앱을 project hub 또는 worklog에 기록했다.
- [ ] 반복 실행할 절차는 runbook에 기록했다.
- [ ] 특정 실행 결과는 verification에 기록했다.
- [ ] 재사용 가치가 있는 지식은 Obsidian 도메인 허브에 흡수할 위치를 정했다.
- [ ] 저장소 문서 링크와 Obsidian 노트 경로가 실제로 존재한다.
- [ ] 개인 대화 archive와 비밀값을 저장소 문서에 넣지 않았다.
