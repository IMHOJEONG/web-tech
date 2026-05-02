# Platform Improvement TODO

이 문서는 `worklog`와 다르게, 여러 세션에 걸쳐 지속적으로 관리하는 개선 백로그입니다.

운영 규칙:

- 구현 중 새로 드러난 개선점은 이 문서에 먼저 추가합니다.
- 실제로 착수한 내용과 결정 과정은 `docs/worklog/`에 기록합니다.
- 구조적 결정으로 승격되면 `docs/architecture/` 문서로 분리합니다.

상태 표기:

- `[ ]` 아직 미착수
- `[-]` 진행 중 또는 방향 검토 중
- `[x]` 완료

우선순위:

- `P0` 현재 장애/회귀/운영 리스크
- `P1` 가까운 시일 내 반영 권장
- `P2` 품질 향상용 중기 과제

## Planning / Product

- [ ] `P1` `docs` 앱의 정보구조를 확정한다.
  - `Feed / Web / Mobile / UI/UX / About`의 목적, 관계, 이동 흐름을 명시
  - 상세 페이지와 허브 페이지의 역할 차이를 문서화
- [ ] `P1` 콘텐츠 운영 모델을 정한다.
  - `apps/docs/data` 기반 정적 운영을 유지할지
  - 별도 CMS/DB/API 계약으로 확장할지 결정
- [ ] `P2` 검색 경험의 목표를 정의한다.
  - 제목/본문/태그 검색 범위
  - empty state와 추천 검색어 정책

## Code / Architecture

- [ ] `P1` `apps/docs`의 FSD 3차 정리를 진행한다.
  - 남아 있는 `shared/layout`, `shared/navigation`의 최종 레이어 위치 확정
  - widget, feature, entity 경계 재점검
- [ ] `P1` `next-intl` 기준으로 i18n 사용 방식을 통일한다.
  - `Brand`, `Header`, `Footer`, `Search` placeholder 실제 메시지 연결
  - 언어별 메시지 키 네이밍 규칙 정리
- [ ] `P1` `docs` app shell의 responsive 정책을 widget 레벨까지 확장 적용한다.
  - `MainFeed`, `ArticleDetail`, `AboutUs` 내부의 `sm/md/lg` 사용 재점검
  - shell breakpoint와 content breakpoint 충돌 제거
- [ ] `P2` `MainFeed`, `HubPage`, `ArticleDetail`의 데이터 주입 방식을 정리한다.
  - curated static data와 real document data를 어디까지 분리할지 결정
- [ ] `P2` UI package build/export 전략과 소비 앱 설정을 지속 점검한다.
  - `transpilePackages`
  - build artifact usage
  - import path 안정성

## UI / UX

- [ ] `P0` `640px ~ 1023px` 구간의 shell/UI 동작을 실제 디바이스 기준으로 점검한다.
  - header
  - mobile drawer
  - bottom nav
  - article/feed spacing
- [ ] `P1` `MainFeed` 필터 버튼에 실제 인터랙션을 연결한다.
  - client filter
  - route transition
  - query string 기반 중 하나로 확정
- [ ] `P1` `About` contact form의 사용자 흐름을 확정한다.
  - 실제 전송
  - 제출 상태
  - 유효성 검사
- [ ] `P1` footer 링크를 실제 라우트 또는 외부 링크와 연결한다.
  - `PRIVACY`
  - `TERMS`
  - `CHANGELOG`
  - `GITHUB`
- [ ] `P2` empty state, loading state, error state의 시각 톤을 통일한다.
- [ ] `P2` keyboard navigation / focus ring / drawer close flow 접근성을 점검한다.

## Design / Design System

- [ ] `P1` Figma asset 의존 화면을 모두 `public/figma/*` 또는 정식 에셋으로 이관한다.
  - `article-detail` 외 나머지 페이지도 점검
- [ ] `P1` 디자인 토큰 사용 일관성을 높인다.
  - 하드코딩 색상, radius, shadow 제거
  - `design.md` 토큰 기준으로 치환
- [ ] `P2` mobile/top/bottom chrome 아이콘을 Figma 자산 또는 확정 아이콘 세트로 통일한다.
- [ ] `P2` 라이트 모드/다크 모드 시안 차이를 페이지별로 점검한다.
  - `About`
  - `Feed`
  - `ArticleDetail`
- [ ] `P2` typography scale과 실제 component usage를 대조한다.
  - headline/body/label usage mismatch 정리

## Infra / Tooling

- [ ] `P0` `pnpm` catalog 도입 이후 네트워크 가능한 환경에서 `pnpm install --lockfile-only` 재검증
- [ ] `P1` root `package.json`까지 catalog/버전 관리 전략을 확장할지 결정
- [ ] `P1` catalog reference 정합성 검사를 스크립트나 CI 체크로 자동화
- [ ] `P1` `docs`와 `web`의 공통 build/lint/typecheck 파이프라인을 Turbo 기준으로 정리
- [ ] `P2` design asset 동기화 절차를 runbook으로 정리
  - Figma local asset export
  - `public/figma/*` 저장 규칙
- [ ] `P2` 환경별 dev/build 체크리스트를 보강한다.
  - 폰트
  - asset
  - package build
  - i18n

## Content / Editorial

- [ ] `P1` `Mobile` 섹션의 실제 콘텐츠 초안을 작성한다.
- [ ] `P1` `UI/UX` 섹션도 상세형 static spotlight가 아니라 실제 문서 연결 구조로 확장할지 결정
- [ ] `P2` article metadata 정책을 정리한다.
  - author
  - read time
  - category label
  - thumbnail fallback

## Review Queue

- [ ] `P1` `docs-responsive-policy.md` 적용 이후 shell 회귀 테스트
- [ ] `P1` FSD 문서와 실제 폴더 구조의 불일치 재점검
- [ ] `P2` `apps/docs/shared/message/*.json` 키 사용 현황과 dead key 정리
