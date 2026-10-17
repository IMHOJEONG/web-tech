# CodeQL의 script 태그 테스트 검출 누락 보완

## Summary

PR #38 head `2a0ec98`에서 CodeQL High 경고 [#37](https://github.com/IMHOJEONG/web-tech/security/code-scanning/37)을 확인했다. 위치는 `code-disclosure.test.ts`의 테스트 정규식이며, 규칙은 `js/bad-tag-filter`다. 운영 sanitizer의 새 우회나 운영 XSS를 확인한 것이 아니라 보안 assertion이 대문자·속성·공백이 있는 태그를 놓치는 문제를 재현했다.

## Changed

- `apps/docs/feature/code-block/lib/code-disclosure.test.ts`의 `/<script>/`를 테스트 전용 `/<\/?script\b/i`로 보완했다. 대소문자·속성·줄바꿈·탭·닫는 태그 7개 표본으로 검출기를 검사한다. 이 정규식은 sanitizer가 아니다.
- 원격 코드 예제 6개를 JS 하이라이팅과 일반 텍스트의 두 경로로 검사한다. 접힌 미리보기를 포함한 결과에 실제 script 태그가 없고 전체 코드의 추출 문자열은 원문과 같은지 확인한다.
- `apps/docs/lib/remote-html-sanitizer.test.ts`에서 같은 계열의 실제 script 입력 6개를 검사한다. 기존 `sanitize-html`이 스크립트를 제거하고 안전한 문단만 남기는지 문자열 전체를 비교한다.
- 운영 렌더러·sanitizer·의존성·CodeQL 설정은 변경하지 않았다. 경고 억제나 강제 dismiss로 우회하지 않는다. 공개 계약·구조의 새 결정은 없어 ADR 추가는 해당 없다.
- 진행 중인 TCP 초안·도식·검증 파일은 제외한다. 공유 월별 목차는 이 작업 링크만 부분 스테이징한다.

## Notes

Node 24.12.0 환경에서 다음 순서로 검사했다.

```bash
mise exec -- node --experimental-strip-types --test \
  --test-name-pattern='script tag assertions' \
  apps/docs/feature/code-block/lib/code-disclosure.test.ts
mise exec -- node --experimental-strip-types --test \
  apps/docs/feature/code-block/lib/code-disclosure.test.ts \
  apps/docs/lib/remote-html-sanitizer.test.ts
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs lint
```

첫 명령은 수정 전 정규식을 유지한 상태에서 `<SCRIPT>` 검출 실패와 종료 코드 1을 재현했다. 정규식 수정 후 관련 테스트 14개, 타입 검사를 포함한 전체 라이브러리 테스트 232개, docs lint가 통과했다. 수정 테스트 두 파일의 Prettier 검사도 통과했다.

실제 HTML 처리에는 검증된 sanitizer/parser를 우선하라는 [CodeQL 공식 규칙 설명](https://codeql.github.com/codeql-query-help/javascript/js-bad-tag-filter/)과 기존 구현을 대조했다. 이 표본 검사만으로 모든 XSS 부재를 보증하지 않는다. 새 production 빌드·브라우저·운영 콘텐츠 검사는 이번 변경 범위에 포함하지 않는다.

## Open Questions

CodeQL CLI는 로컬에서 실행하지 않았다. 푸시 후 새 head의 원격 분석과 PR 보안 게이트를 확인해야 하며, 로컬 테스트 통과를 CodeQL 경고 해소 완료로 대신하지 않는다.

## Next

보안 테스트·이 기록·목차 링크만 커밋하고 `feature/docs`에 푸시한다. PR #38의 새 CodeQL 결과와 경고 #37의 상태를 확인한다. main 병합과 TCP 초안 공개는 별도 승인 범위다.
