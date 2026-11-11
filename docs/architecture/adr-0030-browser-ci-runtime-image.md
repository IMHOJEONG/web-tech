# ADR-0030: 브라우저 CI의 사전 설치 런타임 격리

## 상태와 범위

- 상태: 적용 중
- 대상: CI의 shared-ui·offline-reading·docs-browser 작업. 전용 브랜치 로컬 구현이며 main 반영은 별도 승인.
- 결정일: 2026-11-11
- 최종 검토: 2026-11-12
- 추적: [KAN-67 후속](https://web-tech-service.atlassian.net/browse/KAN-67).

## 배경

main CI의 브라우저 작업 8개가 테스트 실행 전에 Ubuntu 패키지 서버 DNS 오류로 중단됐다. 성공한 PR 실행도 같은 Ubuntu 26.04 이미지였으므로 OS 전환이나 Playwright 미지원이 직접 원인이라고 단정할 수 없다. 매 작업의 `playwright install --with-deps`가 외부 apt 서버를 필수 경로로 만드는 구조를 보완한다.

## 결정

- 공식 `mcr.microsoft.com/playwright`의 버전·noble 태그와 OCI index digest를 고정한다. 현재 프로젝트의 Playwright 1.62.1에 맞춘다. OS 의존성과 브라우저는 이미지에서 제공하며 프로젝트 패키지는 기존 frozen lockfile로 설치한다.
- 호스트 `ubuntu-latest`는 유지한다. 앱의 OS 라이브러리 환경은 컨테이너에 고정되지만 호스트 커널·실행기의 DNS까지 고정하거나 수리하는 것은 아니다.
- 매 작업에서 apt·브라우저 재설치 대신 Chromium을 실제 실행해 합성 HTML을 렌더링한다. 누락·라이브러리 오류·렌더링 실패·정리 실패는 job 실패이며 다운로드 fallback은 없다.
- 기존 테스트 8개 실행, 실패 집계, timeout, Node 24 보안 하한과 공개 증거 제한을 유지한다. 사전 검사는 본 테스트를 대체하지 않는다.
- 오프라인 trace ZIP 검사는 이미지에 없는 `unzip` 대신 내장 Python 3의 표준 `zipfile.testzip()`으로 모든 멤버와 CRC를 읽기 검증한다. TypeScript가 `python3 -I`를 인수 배열로 실행하며 파일을 추출하지 않는다. Python·ZIP 누락/손상·timeout도 실패한다. apt나 새 npm 패키지로 보충하지 않는다.
- `test:repo`가 설치된 Playwright 버전과 모든 이미지 태그 일치·digest 고정·사전 검사 순서를 검사한다. 의존성 갱신 때 공식 이미지 버전과 digest도 검증하고 함께 갱신한다.

## 대안과 영향

호스트를 Ubuntu 24.04로 바꾸는 것만으로 DNS가 복구된다고 보장할 수 없다. 설치 재시도는 일시 장애에는 유효하지만 이미 같은 SHA의 재실행에서도 실패했고 apt 의존 경로가 남는다. 네임서버·mirror 강제 변경이나 인증 검증 해제는 원인 확인 없이 네트워크·공급망 경계를 바꾸므로 채택하지 않는다.

공식 이미지는 크기가 크고 MCR 접근이 새 준비 조건이다. 네트워크 장애 전체가 없어지는 것은 아니며 image pull·패키지 설치 실패는 그대로 실패해야 한다. 불변 digest는 자동 보안 갱신도 막으므로 정기 점검 및 Playwright 갱신 PR에서 재검증한다. root 컨테이너는 저장소의 신뢰된 합성 테스트용이며 외부의 신뢰할 수 없는 페이지 탐색이나 운영 서비스 이미지로 사용하지 않는다. `--init --ipc=host`는 공식 권고를 따르며 privileged·SYS_ADMIN·네임서버 우회는 추가하지 않는다.

## 관련 문서

- [원인 대조와 검증](../verification/resilience/2026-11-11-ci-browser-runtime.md)
- [작업 기록](../worklog/2026-11/2026-11-11-ci-browser-runtime.md)
- [Playwright 공식 Docker 안내](https://playwright.dev/docs/docker)
- [Playwright 공식 CI 안내](https://playwright.dev/docs/ci)
