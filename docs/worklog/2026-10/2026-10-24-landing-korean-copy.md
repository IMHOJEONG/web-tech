# 메인 최근 글 안내의 한국어 문구 개선

## Summary

메인 우측 패널의 ‘최근 글 / 최근에 정리한 글’을 ‘기술 기록 / 새로 올라온 글’로 바꿔 같은 뜻의 반복과 어색한 표현을 줄였다.

## Changed

`rootLanding.latestNotes` 한국어 번역을 변경하고 독립 `e2e/landing-copy.spec.ts`를 추가했다. 영문·목록 정렬·실제 링크·로딩 화면 구조는 유지한다.
미커밋 소개 패널 테스트의 기대값도 로컬에서 맞췄지만, 이 테스트와 미디어/UI 작업은 이번 문구 전용 커밋에 포함하지 않는다.

## Notes

로컬 개발 서버에서 `mise exec -- pnpm --filter docs exec playwright test e2e/landing-reading-panel.spec.ts --workers=1`로 소개 패널15개를 통과했다.
한국어/영문·라이트/다크·모바일/태블릿/데스크톱과 큰 기본 글자 재배치를 확인했다. 변경 파일의 Prettier 검사도 통과했다.
분리 커밋용 `mise exec -- pnpm --filter docs exec playwright test e2e/landing-copy.spec.ts --workers=1`도6개 통과했다.
이 검사는 미커밋 패널의 test ID나 레이아웃에 의존하지 않고 실제 메인 제목과 영문 유지 여부를 확인한다.
KAN-31의 기존 메인 개선 작업에 이어 기록하며 별도 이슈나 ADR은 만들지 않는다.
사용자 후속 승인으로 문구·독립 회귀·이 기록과 목차만 커밋/푸시한다. 기존 미커밋 미디어·비교 도구·녹화본은 보존하며 별도 배포는 요청하지 않는다.
현재 브랜치에는 열린 PR이 없으며 일반 CI push 대상은 main/feature/docs다. codex 브랜치 푸시만으로 일반 CI가 실행된다고 간주하지 않는다.

## Open Questions

없음.

## Next

푸시한 정확한 SHA와 CI 실행 여부를 확인한다. CI 미실행·배포 미확인을 성공으로 표시하지 않는다.
