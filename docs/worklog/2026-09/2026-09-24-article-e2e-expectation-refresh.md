# 상세·게시 갱신 E2E의 오래된 기대값 수정

## Summary

`920b0d0`의 [CI 실행](https://github.com/IMHOJEONG/web-tech/actions/runs/35961739790)에서 production article suite가 36개 통과·8개 실패했다. 실제 콘텐츠·번역과 테스트 기대값을 대조해 오래된 본문 문장과 검색 빈 화면 제목을 확인했다.

## Changed

- `article-detail.spec.ts`의 이벤트 루프 본문 문장과 마지막 참고 링크 문구를 현재 MDX에 맞췄다. 첫 heading·본문·마지막 heading·끝 표식·metadata·loading 종료·새로고침 검사는 유지한다.
- `content-publication.spec.ts`의 예전 한국어 빈 화면 제목을 현재 ko/en 제목으로 나누고 main의 h1으로 검증 범위를 좁혔다. 인증 실패 시 V1 유지, 정상 webhook 후 V2 반영과 V1 검색 카드 부재 검사는 유지한다.
- [렌더링 회귀 runbook](../../runbooks/docs-article-rendering-regression.md)에 본문·번역 편집 시 기대값 점검 절차를 추가했다. 앱 코드와 콘텐츠는 변경하지 않는다.

## Notes

기존 CI의 8개 실패는 두 검사 지점에 ko/en·모바일/데스크톱 조합이 각각 적용된 결과다. 첫 실패 다음에 실행될 끝 문장 검사도 이미 삭제된 문장을 참조하고 있어 함께 수정했다. CI의 stream closed 로그는 이 문구 불일치와 별개이며 이번 수정으로 해결했다고 간주하지 않는다.

2026-09-24, `920b0d0` 이후 작업 트리에서 Node 24와 Chromium을 사용했다. 저장소 루트에서 아래 명령을 실행했다.

```bash
mise exec -- pnpm --filter docs test:article:prod
```

production build 후 loopback fixture로 실행한 44개가 모두 통과했다(실패·제외 0개, Playwright 보고 1.2분). 기존 실패 조합 8개도 포함한다. 실제 NAS나 운영 webhook을 호출하지 않았다. ESLint는 변경 spec 2개를 대상으로 통과했다.

서버의 `The destination stream closed early` 로그는 이번 실행에서도 관측됐지만, 게시 갱신 검증과 브라우저 `pageerror` 부재 검사는 통과했다. 스트림 로그의 원인을 확정하거나 숨기지 않았으며 별도 진단 대상으로 유지한다.

기존 Better Stack·Obsidian 변경은 이번 작업에서 제외한다. fixture 환경의 `.next` build가 남으므로 일반 production 서버를 실행할 때는 실제 환경으로 다시 build한다.

## Open Questions

실제 Vercel/NAS와 GitHub runner 재실행 결과는 로컬 fixture 테스트와 구분한다. 원문에서 기대값을 자동 추출해 항상 통과시키거나 timeout을 늘리는 방식은 적용하지 않는다.

## Next

후속 커밋·push에서 같은 CI 작업의 결과를 확인하고 스트림 조기 종료 로그를 별도로 조사한다. 운영 콘텐츠는 변경하지 않는다.
