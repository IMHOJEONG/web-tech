# vuln-radar 전체 검색·서버 페이지네이션

## Summary

운영 검증 문서를 먼저 커밋한 뒤 기존 25개 표본 검색을 서버 전체 DB 검색으로 분리했다. 초기 구현은 작업별 로컬 커밋으로 정리했고, 이후 별도 승인으로 PR #89의 검증·병합·자동 운영 배포를 진행했다. 초기 미배포 기록과 후속 운영 결과는 아래 Notes에서 구분한다.

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

2026-11-11 병합 전 재검토: [추가 Minor](https://github.com/IMHOJEONG/web-tech/pull/89#discussion_r4532621082)에 따라 같은 보고서의 명령에 watchlist·기록된 `CVE-2023-4911` 상세·`/overview`와 `/feed` HTML 검사를 명시했다. 문서의 Node 명령을 그대로 추출해 실행하여 집계 대조와 모든 GET 검사의 통과를 확인했다. 현재 첫 Feed 항목 대신 기록된 상세 ID를 사용하고, 과거 집계값·수집 시각 재현 및 브라우저 렌더링은 검사 범위 밖임을 구분했다. 기존 시점 표본과 정제 artifact는 유지한다.

### 2026-11-11 병합·운영 검증

- 후속 문서 커밋 `f2db82d`의 [PR CI](https://github.com/IMHOJEONG/web-tech/actions/runs/43031357715)·[CodeQL](https://github.com/IMHOJEONG/web-tech/actions/runs/43031350598)·CodeRabbit 검사가 모두 통과했다. 리뷰 스레드 2개 해결·미해결 0건을 재조회했다. 최종 메시지 사전검사 후 사용자 승인에 따라 PR #89를 squash 병합했다. 실제 main은 `3408b1950d340d814bf671412d1519f2b753a761`, 병합 시각은 22:49:51 KST다.
- 같은 SHA의 Vercel Production deployment `7711853000`과 Railway GitHub deployment `7711844811`이 성공했다. Railway CLI에서도 실제 배포 `fbd2d321-7d89-4575-9769-d9eac02f2166`의 main·commitHash 일치·SUCCESS·중지 false·인스턴스 RUNNING을 확인했다. 환경 이름 `development`와 health의 기존 메타데이터는 변경하지 않았다.
- 23:04 KST 공개 프록시 GET 표본: database 95,970건·3,839페이지, 첫 두 페이지 각 25개·중복 0, 기존 25개 표본 밖 `CVE-2026-97185` 검색·상세 성공. P0/KEV 필터 328건·실제 빈 결과·잘못된 page/중복 page의 400·overview/status 집계 일치를 확인했다. 수집에 따라 건수는 바뀔 수 있다.
- 같은 공개 도메인의 Chromium 1280px·390px에서 다음 페이지 클릭·리로드 복원·검색 시 페이지 초기화·상세 Link·뒤로가기 query 복원을 검사했다. 검사 중 pageerror·backend 5xx·페이지 가로 넘침은 각각 0이다. 실기기·다른 브라우저 엔진·운영 부하는 검증하지 않았다.
- [main CI](https://github.com/IMHOJEONG/web-tech/actions/runs/43032686880) attempt 1은 브라우저 설치 7개 실패·matrix 1개 취소·집계 실패다. 같은 SHA의 실패 작업만 attempt 2로 재실행했으나 브라우저 8개 모두 `Install Playwright Chromium`에서 DNS 실패·설치 종료 코드 100으로 다시 중단됐다. 두 실행 모두 이 작업들의 assertion 실행 전 실패다. 최종 CI는 failure이며 통과로 기록하지 않는다. 타입·lint·커밋·단위/HTTP 계약 검사는 성공했다. DNS 장애의 더 깊은 원인과 실행기/패키지 서버 복구는 미확정이며, 기존 PR의 `responseFinished=false` 실패와 혼동하지 않는다.
- [main CodeQL](https://github.com/IMHOJEONG/web-tech/actions/runs/43032687538)·[Documentation](https://github.com/IMHOJEONG/web-tech/actions/runs/43032687256)은 성공했고 main의 열린 CodeQL 경고는 0건이다. 배포 성공·운영 표본 통과를 main 전체 CI 성공으로 바꿔 기록하지 않는다.
- 운영 DB·토큰·환경변수·수집·배포 설정 변경, 수동 재배포 및 NAS 접속은 하지 않았다. 원시 HTTP 응답·실행 로그·캡처는 공개하지 않는다. Jira KAN-67 댓글 10096과 Confluence 댓글 16580609에 같은 결과와 미검증 범위를 기록하고 재조회했다. 이 병합 후 작업 기록은 후속 CI 보완 브랜치에서 별도 문서 커밋으로 정리하며, 실제 main 반영과 구분한다.

## Open Questions

깊은 offset·substring 검색 성능은 운영 규모의 부하 검증 전이다. 실행 중 수집으로 요청 간 페이지 경계가 움직이는 경우 cursor 전환이 필요한지 실측해야 한다.

## Next

초기 구현 후 푸시·PR·병합·자동 운영 배포는 각각 후속 승인을 받아 진행했다. 위 운영 검증 당시에는 CI 실행기 설정·검사 조건을 변경하지 않았으며, 패키지 서버 DNS 실패 조사는 별도 후속 작업으로 분리했다. 운영 규모 검색 부하와 깊은 offset 비용도 별도 과제로 남긴다. 운영 데이터·자격 증명·수집 설정은 변경하지 않았다.
