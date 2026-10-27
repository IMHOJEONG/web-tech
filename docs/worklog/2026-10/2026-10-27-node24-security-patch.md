# Node 24 보안 patch와 CI·Docker gate

## Summary

[KAN-43](https://web-tech-service.atlassian.net/browse/KAN-43). main `e8ab3bd6`에서 별도 `codex/security-node24-20261027` 작업 트리를 만들고 Node 24.22.1을 적용했다. 기존 필터 및 선행 조사 미커밋 15파일의 SHA-256 일치를 확인해 보존했다.

## Changed

- 로컬/CI patch pin과 실제 Node 최소 버전 gate를 추가했다. Node 24 major와 기존 pnpm/서명/lockfile 정책은 유지한다.
- 두 backend의 빌드/실행 base를 공식 patch tag·multi-arch index digest로 고정하고 실제 버전 검사를 추가했다. 이미지 workflow의 base pull·정책 path filter를 보완했다.
- Git hook wrapper의 구버전 경로 fallback을 제거하고 mise·gate를 우선한다. 버전/CI/Docker/로컬 wrapper/정상 Brotli·TLS 회귀 12개와 격리 컨테이너 smoke를 추가했다.
- [검증 보고서](../../verification/security/2026-10-27-node24-security-patch.md)에 실행 명령·중간 실패·이미지·경고·미검증을 구분했다. 운영 절차와 README를 갱신했다.

## Notes

저장소 165개에 신규 12개가 포함된다. docs lib 307, production 162, docs-backend unit 31/HTTP 55, vuln backend unit 48과 전체 lint/typecheck 및 두 amd64 이미지 빌드가 통과했다. 상세 결과와 한계는 보고서를 따른다.

로컬 이미지의 실행 Node와 gate hash를 대조했고 docs 이미지의 health·401·목록·HTML도 network none으로 확인했다. 실제 DB·NAS·Railway·Vercel은 건드리지 않았고 commit/push·이미지 게시·운영 배포도 하지 않았다. linked worktree의 hooks prepare 경고 및 Prisma system libssl 경고는 별도 후속 범위로 남긴다.

## Open Questions

KAN-43은 검토 중이다. 구현 검증 댓글 10034의 3열 표와 Confluence v172의 추가 구역·기존 본문 보존을 재조회했다. 원본·PR·원격 검사 링크는 검증 보고서에 연결했다.

운영 이미지 교체·Vercel 재배포·운영 DB 연결 및 새 원격 CI 결과는 미검증이다. 코드 patch 반영과 운영 보안 조치 완료를 구분한다.

## Next

사용자 승인으로 실행 정책 `3493e63`, CI·Docker·회귀 `9827277`, 문서 `7efc571`을 분리 커밋·푸시하고 [PR #68](https://github.com/IMHOJEONG/web-tech/pull/68)을 생성했다. 실제 커밋 훅을 통과했고 저장소 165개·toolchain 타입 검사를 재확인했다. 연결 앱 PR쓰기403은 중복 조회 후 기존 인증CLI로 복구했다. 기존 필터 15파일은 여전히 해시가 같으며 가져오지 않았다. 최초 원격 실행의 일부 검사 통과와 진행 중 상태를 보고서에 구분했다. 이번 연결 기록을 별도 커밋한 뒤 최신 head의 전체 원격 CI를 확인하고 같은 Jira·Confluence에 결과를 갱신한다. main 병합·운영 이미지 게시·교체·실제 DB 확인은 별도 승인 단계다.
