# 헤더 가독성과 탐색 개선

## Summary

헤더 전체 재설계 대신 로고, 검색 진입점, 현재 메뉴 표시 세 가지만 개선했다.
기존 65px 헤더 높이와 메뉴 구성, 언어 및 테마 전환은 유지한다.

## Changed

- 로고를 18px와 좁은 자간으로 조정했다. 모바일과 데스크톱에 같은 기준을 적용했다.
- 1024px 이상에서는 검색 아이콘에 `문서 검색` / `Search docs`를 함께 표시한다.
  좁은 화면에서는 44px 아이콘 버튼으로 유지한다.
- 현재 메뉴에 옅은 primary 배경과 밑줄을 표시한다. 모바일 drawer에도
  `aria-current="page"`를 적용했다.
- 검색창은 헤더를 기준으로 배치해 모바일에서 오른쪽으로 잘리지 않도록 했다.
  검색창의 접근 가능한 이름과 연결 관계를 명시하고 Escape로 닫으면 버튼에 포커스를 돌려준다.
- `apps/docs/e2e/header-clarity.spec.ts`에 테마·언어·화면 폭별 검사를 추가했다.

## Notes

Node 24 환경에서 로컬 개발 서버를 대상으로 검증했다.

```sh
pnpm --filter docs exec playwright test \
  e2e/header-clarity.spec.ts e2e/shell-navigation.spec.ts --workers=1
pnpm --filter docs exec tsc --noEmit
pnpm --filter docs exec eslint \
  widgets/app-shell/ui/header.tsx \
  widgets/app-shell/ui/navigation.tsx \
  widgets/app-shell/ui/mobile-nav-drawer.tsx \
  feature/search/ui/search.tsx e2e/header-clarity.spec.ts --max-warnings 0
```

- 브라우저 검사: 17개 통과. 10개는 해당 viewport 대상이 아니어서 의도적으로 제외했다.
- Chromium 390/768/1280px에서 한국어·영어와 밝은·어두운 테마를 확인했다.
- 320/390/640/768/1024/1280px에서 검색창 경계, 가로 넘침, 로고·메뉴·검색 버튼 겹침을 확인했다.
- 메뉴 이동, 현재 메뉴 표시, 검색 입력 및 이동, Escape 후 포커스 복귀를 확인했다.
- 타입 검사와 변경 파일 lint는 통과했다. 생성된 헤더 캡처도 직접 확인했다.
- 초기 테스트의 중복 버튼 선택, 중첩 locator 범위, light 클래스 가정을 수정한 뒤 재검증했다.
- 로컬 서버 프로세스에만 원격 콘텐츠 목록과 외부 로그 전송 비활성화를 적용했다.
  `.env` 파일과 배포 설정은 변경하지 않았다.
- 실제 모바일 기기, Safari/Firefox, 프로덕션 빌드 및 배포 검증은 이번 범위에 포함하지 않았다.

## Open Questions

로고 크기와 활성 메뉴 강조 정도는 로컬 화면에서 사용자가 확인한 뒤 확정한다.

## Next

`http://127.0.0.1:3001/ko/web`에서 직접 확인한다. 이번 변경은 커밋·푸시하지 않았다.
