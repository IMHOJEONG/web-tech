# vuln-radar 전체 검색·서버 페이지네이션

## Summary

운영 검증 문서를 먼저 커밋한 뒤 기존 25개 표본 검색을 서버 전체 DB 검색으로 분리했다. 이후 사용자 승인으로 빌드 보완·서버·프론트·회귀·문서를 작업별 로컬 커밋으로 정리했다. 푸시·배포하지 않았다.

## Changed

- [ADR-0029](../../architecture/adr-0029-vuln-radar-feed-search.md)에 별도 검색 API·검증·동일 snapshot count/page·오류·URL 계약을 정의했다.
- backend에 입력 parser·Prisma where 구성·transaction 페이지 조회를 추가하고 기존 item mapper를 재사용했다. 기존 Overview 응답·인증 guard는 유지했다.
- frontend에 URL parser·요청 직렬화·pagination 컴포넌트를 분리했다. 조건 변경 페이지 초기화·debounce·페이지별 캐시·pending 결과 숨김을 적용했다.
- 기존 Vite+ 빌드의 tsconfig path 해석 실패를 재현했다. 의도한 `@` src 경로를 명시 alias로 보완한 후 빌드가 성공했다. 도구 버전·의존성·lockfile은 변경하지 않았다.
- API parser·repository·인증 HTTP·프론트 URL 모델 회귀와 기존 PostgreSQL/브라우저 통합 도구의 43개 데이터 페이지·검색 검사를 추가했다.
- root CI의 기존 단위 테스트와 별도로 vuln-radar HTTP 계약 검사를 연결했다. backend pretest는 생성 타입을 준비한다. 원격 CI 실행이나 Docker 통합의 CI 연결을 뜻하지 않는다.

## Notes

- 커밋 구분: 빌드 `479ed4f`, 서버 검색·단위 회귀 `4f61a07`, 프론트 검색·페이지 및 모델 회귀 `36dd129`, HTTP·통합 회귀/CI `53070c8`. 이 문서와 ADR·검증·정제 증거·목차는 후속 문서 커밋으로 분리한다.
- 최초 선행 문서 커밋 `5ec2afa`의 manifest에 README 경로 3개가 중복되어 이력 공개 검사가 실패했다. 사용자 승인 후 원본 커밋은 백업 브랜치에, 미커밋 문서는 전용 stash에 보존했다. 중복만 보완한 선행 커밋 `a2b4acf` 위에 4개 커밋을 재적용하고 문서를 복원했다. 재구성 전후 구현·테스트 파일 차이는 없고 manifest만 다르다. 원본 백업과 stash는 삭제하지 않았다.
- 커밋 전 프론트 36개·backend 67개·HTTP 12개와 두 앱의 타입·lint·빌드를 재검사했다. 기존 통합 26개 그룹의 실행 당시 base와 runner 해시는 변경하지 않았다.
- 후속 전체 공개 검사에서 긴 합성 토큰과 임시 DB URL 템플릿도 자격 증명 패턴으로 차단됐다. 검사기를 완화하지 않고 짧은 합성 토큰 및 URL 객체의 런타임 조립으로 보완해 회귀 커밋을 재구성했다. HTTP 12개·실제 DB/브라우저 26개를 다시 통과했고 전체 커밋 공개 검사도 통과했다. 이전 실행 기준 커밋과 원시 증거는 백업 ref·저장소 밖에 보존했다.

[검증 보고서](../../verification/integration/2026-11-10-vuln-radar-feed-search.md)에 명령·최초 실패·최종 결과와 미검증 범위를 기록했다. [KAN-67](https://web-tech-service.atlassian.net/browse/KAN-67) 댓글 10096과 [Confluence 후속 기록](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira?focusedCommentId=16580609)을 저장·재조회했다. 미푸시 파일을 원격 링크로 표시하지 않는다.

2026-11-11 리뷰 후속: [PR #89의 Minor](https://github.com/IMHOJEONG/web-tech/pull/89#discussion_r4521455112)에 따라 [운영 검증 보고서](../../verification/deployment/2026-11-10-vuln-radar-operational.md)의 배포 SHA 대조 절차를 보완했다. GitHub의 배포 레코드 두 개가 고정 SHA와 일치하고 각각 성공 이력이 있음을 읽기 전용으로 재확인했다. 합성 SHA 불일치에서 종료 코드 1도 확인했다. TODO는 화면과 API 경로를 구분했다. 과거 운영 표본과 앱 동작은 변경하지 않았다.

## Open Questions

깊은 offset·substring 검색 성능은 운영 규모의 부하 검증 전이다. 실행 중 수집으로 요청 간 페이지 경계가 움직이는 경우 cursor 전환이 필요한지 실측해야 한다.

## Next

푸시·PR·배포는 별도 승인 후 진행한다. backend 선배포와 frontend 후배포가 필요하다. 운영 데이터·자격 증명·Railway·Vercel은 이번 작업에서 변경하지 않았다.
