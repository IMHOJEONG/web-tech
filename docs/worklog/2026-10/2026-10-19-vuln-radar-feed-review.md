# PR #44 피드 리뷰 보완

## Summary

[PR #44](https://github.com/IMHOJEONG/web-tech/pull/44)의 미해결 리뷰 4개를 실제 코드와 대조해 모두 유효함을 확인하고 수정했다. 작업 브랜치는 `codex/vuln-radar-feed`이며 기존 배포 브랜치 `feature/vuln-radar`는 수정하지 않는다.

## Changed

- [상세 해석 문서](../../../apps/vuln-radar/docs/006_vulnerability_detail_and_security_notes.md)의 개인 PC 절대경로 6개를 실제 저장소 상대경로로 변경했다. 리뷰에 지적된 신뢰성 정책 링크와 같은 문서의 기존 링크도 함께 정리했다.
- [검색 모델](../../../apps/vuln-radar/src/pages/feed/model/feed-filters.ts)에서 `evidenceCompleteness.missing`을 제외했다. 미확인 KEV 근거가 실제 악용 신호처럼 검색되지 않도록 했으며, 실제 `isKev`·제목·워치리스트·충돌 설명은 계속 검색한다.
- [모델 테스트](../../../apps/vuln-radar/src/pages/feed/model/feed-filters.test.ts)에 미확인 근거 제외와 기존 설명 검색 보존 회귀 테스트 2개를 추가했다.
- [필터 UI](../../../apps/vuln-radar/src/pages/feed/ui/feed-filter-bar.tsx)는 그룹마다 `fieldset`·`legend`로 이름을 제공하고 버튼은 `aria-pressed`로 선택 상태를 전달한다. `min-w-0`으로 fieldset의 최소 너비 때문에 모바일 레이아웃이 넘치지 않도록 했다.
- [피드 페이지](../../../apps/vuln-radar/src/pages/feed/ui/feed-page.tsx)는 데이터가 없을 때만 전체 오류 화면으로 전환한다. 캐시된 목록이 있으면 현재 필터·목록을 유지하고 `role="status"` 안내와 재시도 버튼을 보여준다. 재시도 중 버튼을 비활성화하며 정상 응답을 받으면 경고를 제거한다. 빈 배열 캐시도 유지한다.
- 새 경고 문구를 한국어·영어 메시지에 함께 추가하고 [피드 필터 정책](../../../apps/vuln-radar/docs/010_feed_page_filtering.md)을 갱신했다.

## Notes

### 로컬 검증

Node `24.12.0`에서 수행했다. 앱 명령은 `apps/vuln-radar`를 기준으로 한다.

```sh
node --experimental-strip-types --test ./src/pages/feed/model/*.test.ts
node node_modules/typescript/bin/tsc --noEmit
node ../../node_modules/eslint/bin/eslint.js src/pages/feed src/shared/i18n/messages.ts --max-warnings 0
node node_modules/vite/bin/vite.js build --outDir /tmp/pr44-vuln-feed-build
```

- 모델 테스트 6개, 타입 검사, 변경 영역 ESLint 경고 0, Vite production 빌드 모두 통과했다. Vite는 외부 임시 출력 디렉터리를 자동 비우지 않는다는 안내를 출력했다.
- 문서 내 상대 링크의 목적지 존재 여부를 별도 확인한다. 커밋 전 staged 포맷·문서·비밀정보 패턴 검사와 commitlint를 수행한다.

### 브라우저 재현

기존 사용자 서버와 분리된 3194 포트에서 아래와 같이 Vite를 실행했다. Playwright는 저장소에 이미 설치된 docs 검증 도구를 로컬 확인용으로만 사용했다. 새 의존성이나 앱 간 런타임 의존성을 추가하지 않았다.

```sh
VITE_API_BASE_PATH=/api/review-fixture node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 3194 --strictPort
```

임시 `/tmp/pr44-feed-browser.test.ts`를 Node의 `--experimental-strip-types --test`로 실행해 아래 5개 시나리오를 모두 통과했다. 브라우저는 외부 HTTP 요청을 차단하고 로컬 `/api/review-fixture/feed`를 mock했다. reliability 필드가 생략된 정상 응답도 사용해 기존 API의 unknown 기본값을 거쳤다.

1. 1280px: 세 필터 그룹을 접근성 이름으로 조회하고, 키보드 Space 선택 시 `aria-pressed` 전환과 KEV 검색 결과를 확인했다.
2. 390px: 같은 검사를 반복하고 페이지 수준 가로 넘침이 없음을 확인했다.
3. 정상 목록 조회 후 Playwright clock으로 60초 자동 갱신과 Query 재시도를 진행했다. 두 번의 502 이후에도 기존 CVE·검색어가 유지되고 전체 오류 화면은 나타나지 않았다. 재시도 정상 응답 후 새 목록으로 갱신되고 경고가 사라졌다.
4. 정상 응답이 빈 배열인 경우도 같은 자동 갱신 실패·복구 흐름을 확인했다. 빈 결과 화면과 검색어가 유지됐다.
5. 처음부터 502이고 캐시가 없는 경우 전체 오류 화면을 유지했다. 재시도 성공 시 정상 목록으로 복구됐다.

이는 로컬 Chromium·mock API 검증이다. 임시 브라우저 검사 파일은 커밋하거나 CI에 연결하지 않았고, 실서비스 API·운영 배포와 Safari·실기기는 검증하지 않았다. 모델 회귀 테스트 2개는 앱 코드와 함께 보존한다.

### 리뷰 대응

- 문서 링크: [discussion_r4313986572](https://github.com/IMHOJEONG/web-tech/pull/44#discussion_r4313986572).
- 검색 정확성: [discussion_r4313986587](https://github.com/IMHOJEONG/web-tech/pull/44#discussion_r4313986587).
- 필터 접근성: [discussion_r4313986594](https://github.com/IMHOJEONG/web-tech/pull/44#discussion_r4313986594).
- 캐시 보존: [discussion_r4313986612](https://github.com/IMHOJEONG/web-tech/pull/44#discussion_r4313986612).

코드·검증 근거를 push한 뒤 해당 스레드에 답변하고 해결 처리한다. Resolve는 CI 통과나 운영 배포 완료를 의미하지 않으며, 이후 새 리뷰가 생기면 별도로 판단한다.

## Open Questions

원격 CI·후속 리뷰와 실제 백엔드 연동 결과는 새 커밋에서 확인해야 한다. 임시 브라우저 검증을 vuln-radar 전용 CI suite로 정식 연결할지는 별도 과제다.

## Next

PR #44에 수정 커밋을 push하고 해결된 리뷰 4개를 정리한 뒤 최신 SHA의 CI 상태를 확인한다. main 병합이나 기존 배포 브랜치 변경은 하지 않는다.
