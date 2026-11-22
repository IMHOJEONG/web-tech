# Node.js 보안 공지와 실행 런타임 조사

## Summary

[KAN-43](https://web-tech-service.atlassian.net/browse/KAN-43). 10월 Node 보안 공지를 공식 원문과 대조했다. 로컬 24.12.0과 main CI 24.21.0이 보안 릴리스 24.22.1보다 낮음을 확인했고, NAS/Railway/Vercel은 실제 운영 버전 미확인으로 구분했다.

## Changed

- [영향 검토 보고서](../../verification/security/2026-10-27-node-runtime-security-review.md)에 런타임별 근거·우선순위·패치/재빌드/배포 검증 순서를 정리했다.
- 정상 Brotli JSON만 사용한 loopback 최소 Nest 진단기를 추가해 인증 거절 전 body 해독을 확인했다. exploit 성공이나 실제 운영 AppModule 검증으로 표현하지 않는다.
- 공통 설정·의존성·런타임·배포는 변경하지 않았다. 기존 필터 미커밋과 NAS/H1/대비 작업은 보존한다.

## Notes

진단기 실행 403·Guard 1회·해독된 body 확인은 통과했다. main CI 원본 로그 12개 job에서 cache Node 24.21.0을 확인했다. 이 검토는 문서와 읽기 전용 관측이며 patched Node의 기능 회귀는 아직 실행하지 않았다.

진단기 타입·문서 delta·읽기 전용 포맷·diff 검사를 통과했다. 이전 필터 소스 4개 blob은 동일하고 실제 인덱스는 비워뒀다. [Jira 댓글 10033](https://web-tech-service.atlassian.net/browse/KAN-43?focusedCommentId=10033)의 3열 표와 [Confluence](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817) v170의 본문 보존·검토 항목 1개를 재조회했다. 커밋·푸시하지 않았다.

## Open Questions

NAS/Railway 실행 이미지의 Node patch·digest, Vercel 실제 함수 patch·새 배포 보호 적용 여부는 미확인이다.

## Next

승인 후 main 기반 보안 브랜치에서 Node 24 패치·CI 캐시 선택·Docker base 갱신을 분리해 반영하고 회귀 검사 및 운영 교체를 검증한다.

## 2026-10-28 게시 준비

PR #69의 재현 명령 지적을 대조해 macOS 전용 임시 경로를 `mktemp` 기반으로 고쳤다. 과거 로그·관측은 바꾸지 않는다. 독립 PR 목차는 기존 관련 주제 옆으로 옮겨 가상 병합 충돌을 줄인다.

Node 24.22.1에서 예제 전용 타입 검사와 정상 Brotli 진단을 재실행해 통과했다. 새 결과는 검증 보고서의 별도 artifact로 연결했다.

원본 작업 트리는 그대로 보존하고 최신 main `e2126a40` 기반 별도 브랜치로 선행 조사만 분리했다. 실행 진단기는 `docs/examples/node-runtime-security/`로 배치하고 전용 타입 검사 범위를 뒀다. 위 미커밋·구버전·미배포 언급은 10월 27일 당시 기록이며 후속 패치 결과는 검증 보고서의 연결 문서를 따른다. 운영 환경 변경이나 악성 PoC는 포함하지 않는다.
