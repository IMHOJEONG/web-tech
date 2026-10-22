# Railway 보안 공지 기반 자격 증명 교체 계획

## Summary

사용자 요청으로 공식 사고 공지와 vuln-radar main `4e61767`의 코드 사용처를 대조했다.
값 없이 교체 대상·소비처·순서·중단 위험·검증 조건을 정리했으며 실제 교체·배포는 수행하지 않았다.
[KAN-28](https://web-tech-service.atlassian.net/browse/KAN-28)에서 계획을 추적하고
[KAN-27](https://web-tech-service.atlassian.net/browse/KAN-27)의 배포 전환과 구분한다.

## Changed

- [자격 증명 교체 runbook](../../runbooks/vuln-radar-railway-credential-rotation.md)을 추가했다.
- DB 원본 비밀번호·접속 문자열·공유 API 토큰·선택적 NVD 키·관리 접근을 분류했다.
- 공식 사고 대응용 Regenerate와 정기 회전용 dual-role 대안을 구분했다.
- `DIRECT_URL` 우선순위·`DATABASE_URL` 활성화 조건·단일 토큰의 401 구간,
  Vercel 재배포 필요·프록시 토큰 주입·mock fallback의 검증 함정을 반영했다.
- runbook과 이번 월별 목차에 문서를 연결했다. 기존 전환 기록·다른 브랜치·stash는 보존한다.

## Notes

- 공식 세부 PostgreSQL·GitHub 권고는 웹 읽기 도구에서 접근 오류가 나서 같은 공식 URL의 공개 HTML로 확인했다.
  PostgreSQL·Vercel 문서와 일반 회전 가이드도 대조했다. 공식 본문 전체를 문서에 복제하지 않았다.
- 앞선 읽기 전용 메타데이터에서 기존 backend·Postgres·GitHub 소스와 해당 프로젝트 bucket 0개를 확인했다.
  workspace 전체의 키 존재 여부·개별 값·실제 DB role·재사용 여부는 확인하지 않았다.
- `.env` 실제 파일·CLI 인증 파일·실제 DB 연결·전체 변수 export를 읽지 않았다.
  env 예시·소스 코드와 변수 이름만 사용했다. 새 비밀값 생성·폐기·회전은 하지 않았다.
- 기존 docs 토큰 정책은 docs 범위이므로 일괄 확대하지 않고 원칙만 연결했다. 새로운 인증 방식이나
  DB role 구조를 구현한 것은 아니므로 별도 ADR은 만들지 않았다.
- 최초 작성은 별도 `codex/vuln-production-main` 작업 트리의 로컬-only 상태였다.
  후속 사용자 요청으로 운영 전환 기록과 교체 계획을 별도 커밋·푸시 범위로 분리한다.
  실제 토큰·DB 자격 증명 교체는 여전히 승인 범위에서 제외한다.
- 문서 delta·상대 링크·Prettier·`git diff --cached --check`를 통과했다.
  KAN-28은 검토 중이며 댓글 10017의 실제 3열 표와 내용 일치를 재조회했다.
  Confluence v60에서도 기존 본문 보존과 이번 요약의 저장 결과를 확인했다.

## Open Questions

- 실제 Railway 참조식·복사한 DB URL·운영 DB role·NVD 키 설정 여부와 외부 소비처는 운영자의 비공개 확인이 필요하다.
- 침해 징후, 허용 중단 시간, 배포 차단 중 즉시 차단 여부는 실제 회전 실행 전에 정해야 한다.
- 공개 프록시의 쓰기 경로 접근 통제와 최소 권한 app DB role 분리는 후속 보안 검토 대상이다.

## Next

1. 운영자가 값 없는 inventory의 실제 사용 여부와 모든 소비처를 확정한다.
2. 플랫폼 복구 상태·보안 위험과 허용 중단 시간을 확인하고 실행 범위를 별도 승인한다.
3. runbook 순서로 실제 회전 후 새 연결·구 자격 증명 거부·배포 ID와 실제 DB source를 검증한다.
4. [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)에
   실행 결과와 원격 원본 링크를 갱신한다. 계획 작성과 실제 교체 완료를 구분한다.
