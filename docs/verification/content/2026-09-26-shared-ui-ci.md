# 공용 UI CI 연결 검증

## 대상과 조건

- 날짜: 2026-09-26 KST.
- 기준: `feature/docs`, `1c7bac56a690233d320b1e4a2dc83627b277b3ba` 및 미커밋 작업 트리. 이번 변경은 CI job과 문서이며 기존 계측·사용자 변경은 유지했다.
- 환경: 로컬 macOS, mise Node 24.12.0, Next.js 16.3.4, Playwright 1.62.1의 headless Chromium.
- `test:ui`는 라이트·다크 fixture, `test:ui:consumer`는 원격 목록을 끈 로컬 production 서버 3115를 사용한다.

## 재현 방법

[브랜치 정책의 공용 UI 검사 절차](../../process/branch-policy.md#공용-ui-회귀-검사)에 따라 dev/build를 종료한 상태에서 저장소 루트에서 실행했다.

```bash
mise exec -- pnpm --filter docs test:ui
mise exec -- pnpm --filter docs test:ui:consumer
```

워크플로는 설치된 yaml parser의 `parseDocument`로 중복 키·구문 오류를 확인하고, matrix 두 명령·fail-fast 비활성·오류 무시 부재·Chromium 설치·frozen lockfile 설치를 assertion으로 검사했다. 원격 GitHub runner 실행을 대신하는 검사는 아니다.

## 결과와 증거

| 검사                                        | 실제 결과         |
| ------------------------------------------- | ----------------- |
| 공용 UI fixture                             | 62 passed (26.2s) |
| docs production 소비 화면                   | 16 passed (35.0s) |
| 공용 UI build·fixture 타입 검사             | 통과              |
| docs production build·콘텐츠 검사·타입 검사 | 통과              |
| YAML 구문과 matrix 연결 assertion           | 통과              |
| GitHub Actions 실행                         | 미실행            |

fixture는 클래스 병합·Button/Badge·Tooltip 설명 연결과 정리·Sidebar SSR hydration 및 breakpoint 변경을 포함한다. 소비 화면에서는 ko/en·라이트/다크 주제 필터와 모바일 Drawer 닫기·포커스 복귀·reduced-motion을 검사했다. 모든 검사는 재시도 없이 통과했다.

변경된 `.github/workflows/ci.yml`은 `Shared UI (test:ui)`, `Shared UI (test:ui:consumer)`를 별도 runner에서 실행한다. 기존 Test job과 분리하고 matrix fail-fast를 끄되 테스트 실패는 job 실패로 유지한다. 기존 action SHA와 Node 24 설정을 재사용했다.

## 한계와 후속 작업

- 로컬 macOS 결과이며 Ubuntu GitHub runner는 push 후 동일 SHA의 두 check를 확인해야 한다.
- required checks 등록과 Vercel 배포 대기는 원격 설정이며 이번 변경에 포함하지 않았다. CI 연결 자체가 직접 push 배포를 자동 차단하지는 않는다.
- Chromium 범위다. Safari·Firefox·실제 스크린 리더, 다른 앱과 외부 모노레포 소비 동작까지 보장하지 않는다. production Tooltip도 이번 소비 suite의 대상이 아니다.
- 두 matrix job은 각각 의존성 설치·브라우저 설치 비용이 있다. 범위를 축소하기 전에 실제 Actions 소요 시간을 확인한다.
- 실패 trace의 CI artifact 업로드는 추가하지 않았다. 로컬 출력 경로와 재현 절차는 브랜치 정책에 기록했다.
- 일반 앱 기능이나 Base UI API는 변경하지 않았으므로 새 ADR은 만들지 않았다. ADR-0006의 회귀 검사를 CI에서 실행하도록 보강한 작업이다.

## 관련 문서

- [ADR-0006](../../architecture/adr-0006-shared-ui-base-ui.md)
- [작업 기록](../../worklog/2026-09/2026-09-26-shared-ui-ci.md)
