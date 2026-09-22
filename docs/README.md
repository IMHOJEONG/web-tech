# 프로젝트 문서 안내

이곳은 모노레포의 설계·운영·검증 기록입니다. 블로그에 공개되는 글은 `apps/docs/data`, `apps/docs/category`에서 별도로 관리합니다.

## 필요한 문서 찾기

| 알고 싶은 내용                              | 위치                                                 | 관리 기준                               |
| ------------------------------------------- | ---------------------------------------------------- | --------------------------------------- |
| 왜 이런 구조와 정책을 선택했는가?           | [설계와 정책](architecture/README.md)                | 현재 유효한 결정, 계약, 대안과 제약     |
| 실행·배포·장애 대응·테스트를 어떻게 하는가? | [운영 및 재현 절차](runbooks/README.md)              | 반복 실행 가능한 명령과 준비 조건       |
| 실제로 무엇을 검증했고 결과는 어땠는가?     | [검증 보고서](verification/README.md)                | 날짜, 대상 버전, 조건, 결과, 증거, 한계 |
| 어느 작업에서 무엇이 바뀌었는가?            | [월별 작업 기록](worklog/README.md)                  | 변경 이유, 범위, 다음 작업              |
| 다음에 무엇을 해야 하는가?                  | [할 일](todo/)                                       | 우선순위와 완료 조건                    |
| 다음 작업에도 재사용할 지식은?              | [지식 모음](knowledge/README.md)                     | 개념과 반복되는 교훈                    |
| 협업·문서 작성 규칙은?                      | [문서화 규칙](process/codex-documentation-policy.md) | 공통 프로세스                           |
| 예제나 실험용 파일은?                       | [예제](examples/)                                    | 배포 콘텐츠와 구분되는 참고 자료        |

## 최근 검증 바로가기

- [운영 sticky header 및 성능 검증](verification/performance/2026-09-19-docs-sticky-header-deployment-verification.md)
- [CLS 배포 검증](verification/performance/2026-09-19-docs-cls-deployment-verification.md)
- [Cache Components 정적 셸 검증](verification/cache/2026-09-16-docs-static-shell-verification.md): 당시 실패 기록이며 현재 운영 상태와 구분합니다.

## 문서가 다시 커지지 않게 하는 기준

- 작업 기록은 `worklog/YYYY-MM/YYYY-MM-DD-주제.md`에 짧게 남깁니다.
- 실행 방법은 runbook, 특정 실행 결과는 verification에 둡니다. 같은 내용을 두 문서에 복사하지 않고 링크로 연결합니다.
- 검증 JSON 등 원본 증거는 `verification/artifacts/`에 두고 관련 보고서에서 연결합니다. 토큰, 개인정보, 전체 인증 헤더는 저장하지 않습니다.
- 테스트 코드를 추가한 변경 기록은 worklog에 남길 수 있습니다. 파일명에 `test`가 있다는 이유만으로 검증 보고서로 분류하지 않습니다.
- 과거 기록의 수치는 당시 환경에 대한 증거입니다. 최신 정책을 대체하지 않습니다.
- 문서 링크는 저장소 내 상대경로를 사용합니다. 개인 PC의 절대경로를 새 링크에 넣지 않습니다.

상세 분류 및 이동 기준은 [문서 역할과 구조](process/documentation-organization.md)를 참고합니다.
