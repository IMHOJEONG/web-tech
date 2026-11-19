# ADR-0033: 합성 PR 검사와 승인된 비공개 콘텐츠 검증 분리

## 상태와 범위

- 상태: 적용 중
- 대상: docs의 GitHub Actions 콘텐츠 입력과 자격 증명 경계
- 결정일: 2026-11-18
- 최종 검토: 2026-11-19
- 적용 위치: 일반 합성 CI와 기존 수동 인증 workflow는 main에 반영됐다. 원래 결정 본문은 유지하며 실행 신원 고정·재실행 금지는 [후속 ADR-0034](adr-0034-content-ci-identity-approval.md)로 분리한다. 후속 구현은 PR #101에서 검증하며 main 미반영이다. 사용자가 설정한 보호 Environment와 네 신원 변수는 조회·정책 검사를 통과했다. secret·실행 환경 분리·실제 인증 CI는 미준비이며, Vercel Production의 비공개 Git 공급 전환과는 별개다.

## 배경

별도 미커밋 콘텐츠 이전 작업은 승인한 비공개 Git 발행본을 빌드 입력으로 사용하는 방향이다. 그 로더·원문·운영 전환은 이 CI 전용 PR에서 제외한다. 일반 PR에 인증을 전달하면 PR 코드·의존성 설치 훅이 원문이나 키를 읽을 수 있다. 읽기 전용 키도 원문의 기밀성을 보장하지 않는다. 외부 fork뿐 아니라 저장소 내부 PR도 신뢰된 main과 구분한다.

기존 테스트는 실제 원문의 경로·제목·목차·코드·이미지 입력을 사용한다. 원문을 단순히 제거하거나 테스트를 skip하는 대신 동일한 기능 계약을 가진 공개 합성 문서를 준비한다. 합성 입력의 성공은 실제 발행본 검증을 대체하지 않는다.

## 결정

1. 일반 CI는 비공개 콘텐츠 키와 보호 Environment를 참조하지 않는다. Node 준비 후 의존성 설치 전에 임시 hosted checkout의 `data/category`를 합성 문서로 교체한다. checkout의 원본은 runner 임시 공간에 보존하며 로컬 실행·연결 경로·자격 증명 혼입은 거절한다. 기존 테스트 명령·timeout·retry·뷰포트 조건은 유지한다.
2. 실제 원문은 별도 수동 workflow에서만 읽는다. `workflow_dispatch`, 원본 코드 저장소, `refs/heads/main`, branch 종류, 40자리 `approved_sha == github.sha`를 요구한다. 입력으로 다른 PR·브랜치·태그·가변 ref를 checkout하지 않는다.
3. secret이 없는 선행 job이 콘텐츠 통합 파일·빌드 명령·고정 lock 준비 상태를 확인한 뒤 원격 Environment를 조회한다. 별도 전환 구현이 아직 main에 없거나 지정 reviewer, 자기 승인 금지, 관리자 bypass 금지, 정확히 main branch만 허용하는 정책이 없거나 조회에 실패하면 다음 job은 시작하지 않는다. Environment를 코드가 자동 생성·완화하지 않는다.
4. 후속 job은 `docs-private-content` Environment 승인을 받고 같은 SHA를 checkout한다. 콘텐츠 저장소 하나의 읽기 전용 키는 검증 step에만 전달한다. 의존성 설치에는 키가 없고, 설치 훅도 실행하지 않는다. 검증은 승인된 main의 코드를 실행하며 private Git SHA는 release lock으로 고정한다.
5. 인증 job은 공유 캐시·빌드 산출물·원문·로그·화면을 업로드하지 않는다. 빌드 출력은 메모리에서 검사하고 키를 제거한 뒤 로컬 production 서버의 목록·검색·한/영 상세를 검증한다. Vercel·NAS·운영 배포 권한은 부여하지 않는다.

GitHub Environment 승인은 코드가 생성하는 사람이 아니다. 한 계정을 사용자와 AI가 함께 쓰면 플랫폼 설정을 바꿀 권한까지 분리되지 않는다. 자기 승인을 막은 현재 결정에서는 실행 주체와 승인 주체를 분리해야 한다. 준비되지 않았다고 승인 기준을 낮추지 않는다.

## 대안과 영향

- 모든 PR에 키 제공: 구현은 쉽지만 비신뢰 코드가 콘텐츠와 키를 읽을 수 있어 제외한다.
- `pull_request_target`으로 PR 코드를 실행: base 문맥의 권한과 PR 코드가 섞이므로 사용하지 않는다. 일반 CI의 성공 artifact를 인증 job으로 가져와 실행하지도 않는다.
- 모든 테스트를 실제 글에 고정: 글 수정이 일반 코드 CI와 연결되고 공개 저장소의 원문 제거를 막는다. 실제 발행본은 별도 신뢰 경로에서 검증한다.
- 합성 PR 검사 + 승인된 main 검증: 두 데이터 경로와 승인 준비가 필요하지만 비밀값을 일반 PR에서 분리한다. 실제 원문의 누락·URL·자산 검수는 별도 발행 검증 책임으로 남는다.

이 결정은 GitHub Actions 경계다. Vercel의 기존 Preview 환경 변수, 키 회전·발급, GitHub 보호 설정과 권한 분리 계정을 자동 변경하지 않는다. NAS 전용 글 이전은 사용자의 수동 작업이며 운영 전환 차단 사유와 따로 관리한다.

## 관련 문서

- [ADR-0034: 실행 Bot·사람 승인 신원 고정](adr-0034-content-ci-identity-approval.md): 이 ADR의 합성/인증 경로 분리는 유지하고 새 권한 정책만 보완한다. 원래 결정을 폐기하거나 대체하지 않는다.
- [CI 실행 절차](../runbooks/docs-private-content-ci.md)
- [이번 로컬 회귀 결과](../verification/content/2026-11-18-content-ci-isolation.md)
- [작업 기록](../worklog/2026-11/2026-11-18-content-ci-isolation.md)
- [GitHub Environment 관리](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments): reviewer·자기 승인·branch 정책과 secret 접근 조건.
- [GitHub의 pull_request_target 보안 경계](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target): 비신뢰 PR 코드를 권한 있는 문맥에서 실행하는 위험.
- [GitHub 실행자·재실행 주체](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#github-context) · [실제 승인 이력 API](https://docs.github.com/en/rest/actions/workflow-runs#get-the-review-history-for-a-workflow-run).
- [Confluence 지식: 실행 봇과 사람 승인](https://web-tech-service.atlassian.net/wiki/pages/19922945): 실행 기록과 구분한 개념·판단 기준. 실제 인증 활성화는 미완료다.
