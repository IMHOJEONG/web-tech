# Web·Mobile 주제 필터 구현

## Summary

공간을 차지하던 정적 소개 카드 3개를 실제 공개 글의 주제 필터로 바꿨다. 짧은 소개와 목록을 같은 채널에서 탐색한다.

## Changed

- 기존 shadcn Button과 locale Link를 재사용하고 기존 primary/surface/outline 토큰으로 선택·기본·포커스 상태를 표현했다.
- 주제 정규화·집계·필터링은 `hub-topic-filter`, 표시와 접기는 `HubTopicFilters`, 서버 데이터와 번역 조합은 `ChannelHubPage`로 분리했다.
- Web 카테고리 문서를 합칠 때 누락되던 tags/topicLabel/readMinutes를 보존했다.
- 실제 태그와 개수를 표시하고, 주제 없는 글은 전체 목록에 유지한다. 처음 6개 주제 외에는 더 보기로 펼친다.
- `/web?topic=react`처럼 URL을 유지하고 기존 최근 6개 글 제한을 제거했다. 큰 hero와 정적 핵심 영역 수 대신 간단한 제목·설명·문서 수·수정일을 표시한다.
- 한국어·영어 문구, 단위 테스트, 브라우저 회귀 테스트를 추가했다. 새 모델 테스트를 `test:lib`와 Node 테스트 타입 검사에 포함했다.
- 정책은 [필터 정책](../../architecture/docs-feed-filter-policy.md#webmobile-주제-필터)에 정리했다.

## Notes

Node 24, 로컬 개발 서버, 원격 목록 비활성화 조건에서 실행했다.

```sh
pnpm --filter docs exec node --experimental-strip-types --test widgets/content-hub/model/hub-topic-filter.test.ts
pnpm --filter docs exec playwright test e2e/hub-topic-filters.spec.ts --workers=1
pnpm --filter docs exec tsc --noEmit
pnpm --filter docs test:lib
```

- 신규 단위 테스트 7개와 브라우저 테스트 18개 통과. 전체 docs 타입 검사와 변경 TypeScript 파일 lint 통과.
- Chromium 390/768/1280px에서 한국어·영어, 밝은·어두운 테마, Enter 선택, 선택 개수, 초기화, 새로고침, 뒤로·앞으로 이동을 검사했다.
- 320px에서 펼쳐진 주제 버튼의 가로 넘침과 터치 높이도 확인했다. 최종 모바일 다크모드 캡처에서 선택한 주제가 접힌 목록에서도 보이는 것을 확인했다.
- 로컬 Mobile에는 공개 글이 없어 빈 목록과 필터 숨김을 검사했다. 원격 메타데이터 필터링은 단위 테스트로 확인했으며 실제 NAS 데이터와의 브라우저 연동은 실행하지 않았다.
- `test:lib`는 149개 중 147개 통과, 2개 실패로 종료했다. 원인은 기존 `sitemap.test.ts:127`의 고정 날짜 `2026-08-29`와 HEAD의 `data/canvas/readme.md` 수정일 `2026-09-20` 불일치다. 자식 검사와 상위 검사가 함께 실패로 집계되었다. 이번 변경에서 두 파일은 수정하지 않았다.
- Safari/Firefox, 실제 모바일 기기, 프로덕션 빌드는 실행하지 않았다.

## Open Questions

기존 sitemap 테스트의 날짜 검증을 실제 콘텐츠 수정과 독립적인 fixture로 분리할지 후속 검토가 필요하다. 현재 커밋 범위에 해당 수정은 포함하지 않는다.

## Next

`http://127.0.0.1:3001/ko/web`에서 확인한다. 실데이터 Mobile과 글 수 증가 시 페이지네이션은 후속 검증 대상으로 남긴다. 커밋·푸시는 요청 시 진행한다.
