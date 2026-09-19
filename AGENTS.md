# 저장소 공통 작업 지침

## 문서 작성과 갱신

이 규칙은 모노레포 전체의 프로젝트 운영 문서에 적용합니다. 작업 디렉터리의 추가 지침도 함께 확인합니다.

문서를 새로 만들거나 갱신하기 전에 다음 기준을 읽고 따릅니다.

- [문서 역할과 구조](docs/process/documentation-organization.md)
- [역할별 문서 템플릿](docs/process/documentation-templates.md)
- [문서화 운영 규칙](docs/process/codex-documentation-policy.md)

필수 순서:

1. 같은 역할과 주제의 기존 문서를 먼저 찾습니다. 기존 문서 갱신으로 충분하면 중복 생성하지 않습니다.
2. 설계는 architecture, 절차는 runbooks, 실행 결과는 verification, 변경 이력은 worklog로 분류합니다.
3. 해당 역할의 템플릿을 적용하고 설명은 기본적으로 한국어로 작성합니다. 미검증 항목은 명시하며 결과를 추정해서 채우지 않습니다.
4. 작업 기록은 `docs/worklog/YYYY-MM/YYYY-MM-DD-주제.md`에 작성합니다. 검증 증거는 `docs/verification/artifacts/`에 둡니다.
5. 역할별 README와 월별 목차를 함께 갱신합니다. 저장소 내 링크는 상대경로로 작성하고 목적지 존재 여부를 확인합니다.
6. 결과와 절차를 여러 문서에 복제하지 않고 연결합니다. 비밀정보와 인증 헤더는 문서 및 artifact에 기록하지 않습니다.

블로그 공개 글은 프로젝트 운영 문서 템플릿의 대상이 아닙니다. 해당 앱의 frontmatter와 콘텐츠 작성 규칙을 따릅니다.

## 변경 범위와 검사

- 커밋 시 다른 작업의 변경을 포함하거나 전체 저장소를 자동 포맷하지 않습니다. 필요한 파일만 명시적으로 포맷하고 diff를 확인합니다.
- `pnpm format:staged:check`와 `pnpm validate:docs --staged`는 인덱스만 읽습니다. 검사 실패 시 파일이나 인덱스를 자동 수정하지 않습니다.
- 부분 스테이징 파일은 전체를 다시 add하지 말고 의도한 변경 범위를 재검토합니다.
- 문서 상태, 검토일, 증거 보관과 CI 범위는 [문서 품질 검사](docs/process/documentation-quality-gates.md)를 따릅니다.
