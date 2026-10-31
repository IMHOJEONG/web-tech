# 메인 페이지를 글 중심 저널로 정리

## Summary

사용자가 보고 있는 `/ko`와 영어 메인을 기존 저널 UI에 맞춰 수정했다. 짧은 소개 다음에 최신 글 4개와 주제 탐색을 배치하고, 기존의 큰 3줄 hero·최신 글 앞 4개 대형 주제 카드·OPEN 장식을 줄였다. 기존 작업과 같은 로컬 브랜치에서 이어서 작업했으며 커밋·배포하지 않았다.

## Changed

- `LandingHero`: 명확한 한·영 소개와 모든 글(`/docs`)·블로그 소개(`/about`) 이동. 새 카피는 인터페이스 소개이며 게시 글을 수정하지 않는다.
- `RootLandingPage`: 소개 → 최신 글 Suspense → 주제 탐색 순서. 최근 글 fetch·fallback 경계와 canonical 링크는 유지한다.
- `LatestNoteRow`: 기존 `DocumentPreviewCard` 어댑터. 중복 OPEN·별도 카드 스타일을 제거하고 날짜·topic label을 공통 표현으로 표시한다.
- `LatestNotesFrame/Pending`: 동일한 섹션 헤더·행 레이아웃을 사용한다. 큰 외곽 패널·별도 좌우 여백을 없앴다.
- `ThematicFoundations`: Web·Backend·UI/UX의 작은 실제 탐색 링크로 변경. 고정 주제 수와 AREA 번호는 제거했다. Mobile 라우트·주요 메뉴는 삭제하지 않았다.
- 신규 브라우저 회귀와 CTA의 실제 `/docs` 목적지 검사를 반영했다. 이전 Feed·Docs 개선 변경은 되돌리지 않았다.

## Notes

- [KAN-56](https://web-tech-service.atlassian.net/browse/KAN-56)의 같은 저널 작업으로 관리한다. 상세 결과는 [검증 보고서의 메인 후속 구역](../../verification/accessibility/2026-10-31-blog-journal-implementation.md)에 연결했다.
- 타입·린트, 브라우저 22개 통과/2개 조건부 skip. 12개 한·영/테마/폭 화면을 관측했고 전체 가로 overflow는 0px였다. 소개를 유지하는 부분 로딩도 회귀에 포함했다.
- 캡처는 테마 초기화 이후 수행했다. raw 캡처·JSON·임시 probe는 공개 저장소나 외부 기록에 첨부하지 않았다.
- 새 라이브러리·lockfile·공용 UI API·인증·캐시 정책은 변경하지 않았다. 기존 ADR-0003/0005의 화면 역할과 표시 책임을 유지하므로 별도 ADR을 추가하지 않는다.
- 공개 검수 manifest·stage·커밋·푸시·배포는 하지 않았다. 기존 원본 checkout의 초안은 계속 보존한다.
- 후속 빌드·백업 요청: [Figma 편집 레이어 백업](https://www.figma.com/design/TZNgMFGeYfNpVCtAgdnDMr)에 desktop 한국어 8개 화면을 저장했다. 사용자는 원본 폰트를 유지하고 설치 후 편집하기로 선택했으며, missing-font 재연결은 남아 있다. 모바일·모든 interaction 상태를 백업했다고 주장하지 않는다.
- 최종 빌드 exit 0과 3032 프로덕션 smoke 20회 HTTP 200·가로 넘침/실행 오류 0건을 확인했다. 백업 스크립트는 최종 소스에서 제거했다. 기존 게시 글 두 개의 스타일 경고와 검증 조건은 [동일 검증 보고서](../../verification/accessibility/2026-10-31-blog-journal-implementation.md)에 기록했다.

## Open Questions

- 실제 독자 선호·과제형 관찰, Safari·실기기와 운영 콘텐츠 연결 검증은 별도다.
- Confluence 안내는 앞선 작업에서 collaborative draft 저장 충돌로 기록 대기 중이다. 기존 미게시 내용을 공개하거나 덮어쓰지 않는다.

## Next

사용자의 빌드·배포 요청에 따라 최종 파일별 공개 승인 후 커밋·푸시·PR 검증을 진행한다. main 병합은 최종 메시지 사전검사와 사용자 승인·CI·리뷰 조건을 충족한 뒤 수행하며, 로컬 빌드 통과를 운영 배포 완료로 표시하지 않는다.
