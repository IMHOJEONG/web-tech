# About의 근거 없는 버전·운영 상태 표시 제거

## Summary

실제 앱 버전이나 모니터링과 연결되지 않은 `VERSION 2.0.4`, `운영 중`, `STATUS: LIVE` 배지를 제거했다. About의 목적에 맞게 작은 소개 문구로 대체했다.

## Changed

- 한국어는 `HEAP-FORGE 소개`, 영어는 `About HEAP-FORGE`로 표시한다.
- 상태를 암시하던 점·둥근 테두리·강조 배경을 없애고 기존 텍스트 토큰을 사용한다.
- 번역 키를 `about.hero.status`에서 `about.hero.eyebrow`로 바꿨다. 실제 패키지 버전은 변경하지 않는다.
- 기존 About E2E에 소개 문구, 잘못된 상태 표시의 부재, main/h1 단일성, 페이지 가로 넘침 검사를 추가했다.
- 작성자 소개의 추상적인 표현을 개발 문제와 해결 과정, 웹 개발·서비스 운영 기록을 설명하는 문장으로 바꿨다. 한국어·영어를 함께 수정하고 E2E에서 새 소개 문구를 확인한다.

## Notes

대안은 배지를 완전히 비우기, 소개용 짧은 문구로 대체하기, 실제 배포 정보에 연결하기다. 현재는 독자가 페이지의 성격을 바로 이해할 수 있는 소개 문구를 선택했다. 개발 메타데이터를 장식용으로 만들지 않는다.

실제 버전이 필요하면 릴리스 정책과 연결한 변경 이력에서 제공한다. 운영 상태는 모니터링의 측정 기준·갱신 시각이 있는 별도 상태 화면에서 다루며, 정적인 정상 운영 문구를 대체재로 넣지 않는다.

[About 콘텐츠 정책](../../architecture/adr-0004-about-content-and-shared-shell.md)에 따른 작은 UI·카피 수정이므로 새 ADR은 만들지 않았다.

2026-09-23, Node 24에서 다음 검증을 수행했다. 명령은 저장소 루트 기준이며 `mise exec --`로 실행했다.

- `pnpm --filter docs exec eslint widgets/about-us/ui/about-us.tsx e2e/about-author.spec.ts --max-warnings 0`: 통과.
- `DOCS_E2E_PORT=3116 pnpm --filter docs exec playwright test e2e/about-author.spec.ts --workers=1`: 12개 통과. ko/en × light/dark × Chromium 모바일·태블릿·데스크톱을 검사했다. 원격 콘텐츠와 외부 로그 전송을 끈 별도 테스트 서버를 사용했다.
- About 소개 영역의 스크린샷을 테스트 산출물에 저장했다. 프로덕션 빌드·배포 검증은 이번 범위에서 수행하지 않았다.

## Open Questions

소개 영역의 시작 시점 등 다른 고정 문구는 이번 수정 대상이 아니며, 실제 이력과의 일치 여부는 별도로 확인해야 한다.

## Next

사용자 요청에 따라 버전·운영 상태 표시 제거와 작성자 소개 변경을 하나의 커밋으로 묶는다. 다른 작업의 변경은 제외하며 푸시는 이번 요청 범위가 아니다.
