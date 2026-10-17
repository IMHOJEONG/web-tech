# 테스트 직접 작성과 IDE 점검 가이드

## Summary

2026-10-12에 테스트를 직접 읽고 작성할 수 있도록 시작 파일, runner 선택, IDE 점검 절차와 리뷰 기준을 정리했다.

## Changed

- [테스트 직접 작성과 IDE 점검 가이드](../../runbooks/test-authoring-ide-guide.md)를 추가했다.
- runbooks 및 월별 작업 목차를 갱신했다.
- 구현·테스트·실행 설정을 대조하고 현재 구조의 장점과 보완 후보를 구분했다. 테스트 runner나 CI 설정 변경은 하지 않았다.

## Notes

프로젝트 Node.js v24.12.0에서 검색어·페이지네이션 단위 테스트 6개가 통과했다. Playwright의 검색 정책 파일을 chromium-desktop으로 `--list`하여 테스트 3개를 발견했다. 실제 브라우저 E2E 실행·IDE 확장 버튼·전수 테스트는 수행하지 않았다.

실행 명령:

```sh
mise exec -- node --experimental-strip-types --test apps/docs/lib/search-query.test.ts apps/docs/widgets/docs-index/model/docs-index-pagination.test.ts
mise exec -- pnpm --filter docs exec playwright test e2e/search-query-policy.spec.ts --project=chromium-desktop --list
```

Node.js 24, VS Code Node debugger, Playwright VS Code 공식 자료를 확인했다. 기존 미커밋 구현·콘텐츠를 유지했으며 가이드 예제 테스트 파일은 생성하지 않았다. 새 구조 결정은 없어 ADR은 해당 없음.

## Open Questions

IDE의 Node 실행 경로와 Test Explorer 사용 경험을 실제 사용자 환경에서 확인한 뒤 공용 launch/task 구성을 추가할지 판단한다.

## Next

사용자가 검색어 규칙 하나를 단위 테스트로 작성하고 실패·통과 결과를 읽은 뒤, 같은 규칙의 화면 E2E를 확인한다. 이후 기존 목록의 assertion·격리·CI 범위를 전수 검사한다.
