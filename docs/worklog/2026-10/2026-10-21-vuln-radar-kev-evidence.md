# 통계 커밋 분리 후 KEV 근거 표시 보완

## Summary

사용자 요청에 따라 이전 통계 수정만 API·화면·회귀/CI·문서의4개 로컬 커밋으로 만들고 다음 우선순위인 KEV의 임의 점수·추정 대응 상태를 수정했다. 후속 승인으로 KEV도 작업별 커밋으로 분리하고 통계와 함께 main 대상 PR로 준비한다.

## Changed

- KEV API가 해당 취약점의 nullable EPSS를 직접 전달한다. 제한 Feed join과 점수0.5·심각도high 보충을 제거했다.
- 0과 미확인을 구분하고 실제 P0~P3를 표시한다. 빈 목록·조회 실패를 일반 Feed로 대체하지 않으며 중복 CVE행을 합친다.
- 백엔드3개·프런트5개 회귀 및 실제 API/브라우저 대조군을 추가했다. [표시 계약](../../architecture/vuln-radar-kev-evidence.md)과 [검증 보고서](../../verification/integration/2026-10-21-vuln-radar-kev-evidence.md)를 연결했다.

## Notes

통계 커밋은 `31ddb0a`, `c2b1d61`, `1ca8352`, `93e455c`다. 각 staged 포맷·문서 검사와 전체4개 commitlint를 통과했고 마지막 커밋 직후 작업 트리는 깨끗했다. 이후 변경은 [KAN-24](https://web-tech-service.atlassian.net/browse/KAN-24)의 KEV 작업으로 구분했다. KEV API·단위 회귀는 `1fa7a4e`, 화면·프런트 회귀는 `70ebe01`이며 통합 회귀·문서도 별도 커밋으로 분리한다. [KAN-23](https://web-tech-service.atlassian.net/browse/KAN-23) 댓글에는 로컬 커밋 분리 후속 기록을 추가했다.

격리 DB·실제 Nest·Vite·Chromium 통합16개, backend34개·frontend15개·HTTP4개가 통과했다. 기존 블로그 작업·TCP 자료·이전 Preview 보고서를 보존했고 운영 DB·자격 증명·배포 설정을 변경하지 않았다. 검증용 DB·서버는 자체 정리했다.

[Confluence 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira) v35에 통계 로컬 커밋과 KEV 미커밋 상태·검증 범위를 연결했다. 첫 갱신은 다른 세션의 동시 수정으로 snapshot stale이 반환돼 최신 본문을 다시 읽고 기존 내용을 보존해 재시도했다. KAN-23 기존 댓글·KAN-24의3열 표·Confluence 결과를 재조회했고 KAN-24는 검토 중이다. 새 커밋은 아직 푸시하지 않아 GitHub permalink를 만들지 않는다. 변경 파일 포맷·문서 링크/템플릿·diff 검사도 통과했다.

## Open Questions

EPSS 관측일·소스별 최신성, 실제 대응 상태 이력, 모바일 표 대체 UI는 별도 작업이다. 이번 변경으로 실제 대응 진행 상태를 관리하게 된 것은 아니다.

## Next

커밋 분리 후 `99bef79`의 `workingTreeDirty=false` 상태에서 통합16개·정리6단계를 다시 통과했다. 신규 API `1fa7a4e`, 화면 `70ebe01`, 회귀 `6aa03b0`, 문서 `99bef79` 이후에는 검증 결과·증거만 별도 커밋에 추가하며 런타임 코드는 변경하지 않는다. 이전 통계4개 커밋과 합쳐 통계·KEV 외 파일이 없는지 `origin/main` 대비 목록을 확인했다. 기존 블로그·TCP·.env·배포 설정은 포함하지 않는다.

후속 사용자 요청에 따라 KEV를 작업별 커밋으로 분리하고 통계·KEV 변경만 푸시해 main 대상 PR을 생성한다. 실제 원격 SHA·PR 링크·CI 진행 상태는 Jira·Confluence 마감 기록에 연결한다. 병합·운영 배포·Production Branch 전환은 별도 승인 작업이며 이번에 실행하지 않는다.
