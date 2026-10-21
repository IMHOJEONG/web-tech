# 기본 브랜치 취약점 조사와 콘텐츠 의존성 패치

## Summary

사용자 요청에 따라 main c3a93c9에서 별도 보안 브랜치를 만들었다. GitHub 경고 5개를 조사하고 registry audit 11개까지 대조해 Vite·sanitize-html·Hono·markdown-it을 공식 수정 버전으로 갱신했다. 전체 audit에는 공식 패치가 없는 braces high 1개가 남고 production audit은 0개다.

## Changed

- catalog의 Vite 최소·minor 범위와 sanitize-html 최소 버전, Hono override, docs-backend의 markdown-it 최소 버전 및 lockfile을 갱신했다.
- 새 보안 회귀 5개와 실제 docs sanitizer 회귀 1개를 추가했다. 새 테스트는 TypeScript이며 기존 test:repo 및 docs test:lib 경로에 포함된다.
- 전후 audit·도달 조건·실패·한계를 [검증 보고서](../../verification/security/2026-10-21-vite-content-advisories.md)와 [정제 증거](../../verification/artifacts/2026-10-21-security-content-audit.json)에 분리했다.
- 기존 braces 추적은 유지하고 이번 해결과 미해결을 구분한다. 경고 dismiss·무시 설정·비공식 fork·major 전환은 추가하지 않았다. 새 ADR이 필요한 구조 변경은 없다.
- 사용자 요청으로 PR #51 제목·본문의 담당자 실명 표기를 제거했다. 앞으로 같은 정보를 반복하지 않도록 PR 템플릿과 [추적 규칙](../../process/issue-tracking.md)에 기준을 추가했다. Jira 담당자 배정은 유지하며, 규칙 변경은 보안 패치와 별도 커밋으로 분리한다.

## Notes

저장소 회귀 63개, docs 라이브러리 254개, docs-backend 단위/E2E 47개 및 check, vuln-radar 단위 6개·lint·typecheck·build, vuln-radar-backend 단위 26개·typecheck·build를 통과했다. 새 테스트의 strict·erasableSyntaxOnly 검사도 통과했다. docs production build와 두 화면 E2E 148개는 3001 개발 서버와 충돌하지 않게 env를 복사하지 않은 별도 작업 트리에서 통과했다. 실제 실패 주입 로그와 기존 콘텐츠 경고는 검증 보고서에서 구분한다.

[KAN-20](https://web-tech-service.atlassian.net/browse/KAN-20)은 사용자 승인대로 임호정에게 할당했다. [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)에 요약과 실제 원격 커밋·PR 링크를 연결한다. KAN-3 전체를 이번 패치로 완료 처리하지 않는다. 기존 TCP 초안 복구 스냅샷·브랜치·다른 작업 트리를 변경하거나 원격에 보내지 않았다.

## Open Questions

braces 공식 패치 또는 검증된 개발 경로 제거. 실제 Windows/WSL 에디터 통합·NAS 이미지·배포 후 경고 종료는 미검증이다. registry와 GitHub의 경고 집계가 다른 이유를 데이터 동기화 지연만으로 확정하지 않는다.

## Next

이번 보안 변경만 커밋·푸시하고 main 대상 PR에서 동일 SHA의 CI·리뷰를 확인한다. 사용자 병합 승인 전 main에 직접 push하거나 자동 병합하지 않는다. 병합 후 경고 종료와 실제 소비 앱 배포는 별도 검증한다.
