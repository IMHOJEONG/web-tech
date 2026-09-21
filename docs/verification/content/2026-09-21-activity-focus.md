# Activity 숨김과 Dialog 포커스 분리 실험

## 대상과 조건

- 검증일: 2026-09-21, KST 기준 작업 기록.
- 기준 커밋: `7b5e94f3513d8f6e287f4391039ed6338d732b69` 위의 미커밋 실험 코드. 운영 배포 검증이 아니다.
- Node 24.12.0, React/React DOM 19.2.6, Radix Dialog 1.1.15, Playwright 1.62.1, headless Chromium 151.0.7922.34.
- React development bundle에서 Strict Mode off/on을 각각 실행한다. 8개 시나리오 × 2개 모드이며 retry는 없다.
- 실제 공용 `@web-tech/ui/components/sheet`를 사용한다. 이 컴포넌트는 Radix Dialog 기반이며 Portal을 body에 렌더링한다.
- 별도 esbuild 번들과 Playwright route fulfillment로 실행한다. Next.js 라우트, NAS 콘텐츠 API, 인증 토큰, 기존 개발 서버를 사용하지 않는다.
- CSS는 기본 위치와 hit test에 필요한 최소 규칙만 적용했다. Tailwind 닫힘 애니메이션은 포함하지 않았다.

## 재현 방법

저장소 루트에서 의존성과 Chromium이 설치되어 있어야 한다. Node 버전은 mise 프로젝트 설정을 따른다.

```sh
mise exec -- pnpm --filter docs test:activity-lab
```

이 명령은 공용 UI 빌드, 전용 TypeScript 검사, Playwright 실험을 순서대로 수행한다. 런타임 앱이나 기존 글을 수정하지 않는다. 운영 경로에 실험 페이지를 추가하지 않았다.

눈으로 따라가려면 같은 루트에서 다음을 실행한다. Inspector에서 단계 실행하면서 브라우저와 콘솔의 `window.activityLab.events`를 확인할 수 있다. `activity.test`는 Playwright가 로컬 응답으로 가로채는 실험용 주소이며 일반 브라우저에서 직접 접근할 서버 주소가 아니다.

```sh
mise exec -- pnpm --filter docs exec playwright test --config=playwright.activity.config.ts --project=chromium --headed --debug
```

기록을 다시 남길 때는 아래 JSON reporter를 사용한다. 기존 기준선 파일을 덮어쓰지 않도록 새 실행은 `/tmp`에 저장한다.

```sh
PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/activity-focus.json mise exec -- pnpm --filter docs exec playwright test --config=playwright.activity.config.ts --reporter=list,json
```

## 결과와 증거

[실행 원본 JSON](../artifacts/2026-09-21-activity-focus.json)에 각 테스트 결과와 `activity-observations.json` attachment가 있다. attachment의 body는 base64 인코딩이며 React 버전, Effect·포커스 이벤트, 마지막 DOM 상태, hit test, 브라우저 오류를 담는다.

| 시나리오                                   | 관측 결과                                                                                 | 판단                                           |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Activity hidden → visible                  | 같은 input DOM, 입력값, React count 상태 유지. Effect 정리 후 재실행                      | 상태 보존과 Effect 생명주기는 별개             |
| hidden input에 focus 호출                  | isConnected는 true지만 화면 전환 버튼에 포커스 유지                                       | 연결 여부만으로 복귀 대상을 판단할 수 없음     |
| 조건부 실제 unmount → mount                | 기존 input은 disconnected, 입력값과 count 초기화                                          | Activity 숨김과 다른 대조군                    |
| Effect cleanup에서 무조건 focus            | DOM이 남아 있는데 이전 작업 버튼으로 포커스 이동                                          | cleanup을 실제 삭제 전용 훅으로 취급하면 안 됨 |
| 보이는 Sheet를 Escape로 닫기               | Content 제거 후 보이는 trigger로 복귀                                                     | 기존 기본 동작의 대조군                        |
| 열린 Sheet를 포함한 Activity 숨기기        | close-auto-focus 콜백 실행, open=true 유지, 포털은 보이며 다음 화면 버튼을 Overlay가 덮음 | 숨김은 Dialog 닫힘과 동의어가 아님             |
| 같은 commit에서 open=false와 hidden 적용   | 상태와 포커스는 바뀌어도 closed 상태 Overlay가 남아 클릭을 가로챔                         | 포커스 복귀만 고치면 충분하다는 가설 기각      |
| Root/Content를 Activity 밖에 배치하고 닫기 | Overlay 제거, 외부 버튼으로 복귀, 실제 클릭으로 재진입, 다시 열고 Escape 닫기도 정상      | 이 구성에서 통과한 비교 대안                   |

최종 16개 assertion 시나리오가 통과했다. 잘못된 동작을 기대값으로 둔 **특성 확인 검사**도 포함한다. 이 숫자는 모든 조합이 올바른 UX라는 의미가 아니다. React나 Radix를 업데이트해서 문제 동작이 바뀌면 해당 기대값과 이 보고서를 함께 검토해야 한다.

초기 실행은 14개 중 9개 통과, 5개 실패였다. 포털이 숨겨질 것이라는 가정 때문에 네 번의 실제 클릭이 차단되었고, Strict Mode에서 재표시 setup이 한 번일 것이라는 가정도 실패했다. force click이나 고정 대기로 실패를 우회하지 않았다. 포털 잔존을 직접 검사하는 대조군으로 전환하고, 별도의 배치 대안을 추가했다.

Strict Mode off의 최초 setup은 1회, on은 2회였다. 재표시 시 setup 증가량도 각각 1회와 2회였다. 이는 해당 development 버전의 관측값이며 Effect 실행 횟수를 제품 로직의 계약으로 사용하라는 의미가 아니다.

## 해석과 적용 경계

핵심은 React 트리와 실제 DOM 위치의 차이다. 이 실험에서는 Activity 안의 `section`이 display:none이 되었지만, 그 아래 React 자식인 Sheet의 포털 DOM은 body에 따로 존재했다. 단순히 래퍼가 숨겨졌다는 사실로 포털과 상호작용 차단까지 해제됐다고 판단할 수 없었다. 모든 Activity·Portal 조합에 동일한 문제가 있다는 일반화는 하지 않는다.

비교 대안은 보존할 페이지 콘텐츠만 Activity 안에 두고, Sheet의 Root와 포털 Content는 밖에서 생명주기를 유지한다. 화면 전환 시 open을 false로 바꾸고 복귀 훅은 현재 보이는 외부 버튼을 선택한다. 숨겨진 trigger로 돌아가지 않도록 목적지를 별도로 정한다.

이 결과는 기존 글의 `isConnected` 조건을 일반적인 가시성 판정으로 확장하면 안 된다는 근거다. 또한 임의의 300ms 대기가 아니라, **무엇을 보존하고 무엇을 닫아야 하는지 경계를 나누는 방법**을 먼저 검토할 이유가 된다.

공식 문서의 Activity 상태·DOM 보존과 Effect 정리 설명은 [React Activity](https://react.dev/reference/react/Activity)를 참고했다. 복귀 훅의 공개 계약은 [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)를 참고했다. 공식 문서의 현재 버전과 이 실험의 설치 버전은 다를 수 있으며, 포털 잔존 및 횟수는 이 실험의 관측 결과다.

## 한계와 후속 작업

- Safari·Firefox·모바일·VoiceOver/NVDA는 검사하지 않았다. headless Chromium DOM 포커스는 스크린 리더 읽기 위치를 증명하지 않는다.
- production React, Next.js 라우트 전환·Cache Components, 실제 Tailwind 애니메이션, Suspense, 중첩 Dialog, 빠른 재열기는 미검증이다.
- 비교 대안은 애니메이션 없는 실험에서 통과했다. 실제 적용 전에 닫힘 전환과 완료·취소 생명주기를 포함해야 한다.
- 닫힘 완료 후 페이지를 숨기는 순차 방식도 대안이지만 이번 실험에서는 실행하지 않았다.
- 경고 문자열 발생 여부를 성공 기준으로 삼지 않았다. 이번 검사로 aria-hidden 경고가 재현 또는 해결됐다고 주장하지 않는다.
- 실험 성공을 이유로 블로그 운영 UI에 Activity를 도입하거나 기존 글을 published로 바꾸지 않았다.

## 관련 문서

- [실험 코드](../../../apps/docs/activity-e2e/activity-focus.spec.ts)
- [React 실험 화면](../../../apps/docs/activity-e2e/fixtures/activity-lab.tsx)
- [포커스 심화 글 초안](../../../apps/docs/data/shadcn/dialog-focus-restoration.mdx)
- [작업 기록](../../worklog/2026-09/2026-09-21-activity-focus-lab.md)
