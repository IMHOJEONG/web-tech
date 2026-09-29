# 공용 UI 전용 회귀 테스트 CI 연결

## Summary

개선 목록 3번의 공용 UI fixture와 실제 docs 소비 화면 테스트를 CI의 독립 matrix job으로 연결했다.

## Changed

- `.github/workflows/ci.yml`에 `test:ui`·`test:ui:consumer` job을 추가했다. 기존 Test 시간 예산을 공유하지 않고 각각 20분 제한으로 실행한다.
- 기존 push·PR 범위와 action SHA를 유지했다. matrix fail-fast를 끄고 실패를 숨기는 옵션은 추가하지 않았다.
- [브랜치 정책](../../process/branch-policy.md#공용-ui-회귀-검사)에 실행·재현·실패 대응과 원격 required checks의 경계를 기록했다.

## Notes

[로컬 검증](../../verification/content/2026-09-26-shared-ui-ci.md)에서 fixture 62개와 production 소비 화면 16개, build·타입 검사 및 workflow YAML 검사를 통과했다. GitHub Actions 실행·ruleset 변경은 수행하지 않았다. 기존 미커밋 작업을 포함해 커밋하거나 푸시하지 않았다.

## Open Questions

Ubuntu runner의 실행 시간과 성공 여부는 push 후 확인해야 한다. 두 check를 required checks로 등록할지, Vercel 배포가 CI 성공을 기다리도록 할지는 별도 운영 설정이다.

## Next

사용자 지정 순서 `1 → 3 → 2 → 4 → 5`에서 다음은 2번 원격 문서 본문 작성 규칙의 공용 검증 적용이다. 이후 검색 제출 방식과 ADR 검증 근거 연결을 검토한다.
