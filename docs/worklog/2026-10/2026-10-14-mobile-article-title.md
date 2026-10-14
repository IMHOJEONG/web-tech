# 모바일 문서 제목 크기 보완

## Summary

사용자 요청으로 640px 미만의 문서 H1을 기본 38.4px에서 32px로 줄였습니다. 데스크톱 규칙은 유지합니다.

## Changed

- [문서 CSS](../../../apps/docs/app/css/mdx.css): 모바일에서 font-size 2rem, line-height 1.2를 적용합니다. 픽셀 고정값 대신 기본 글자 크기에 비례하도록 구현합니다.
- [검증 보고서](../../verification/accessibility/2026-10-14-mobile-article-title.md), 관련 역할별 목차와 실제 측정값을 연결합니다.

## Notes

CSS의 표현 보완이며 공개 계약·본문·예제·공용 컴포넌트 책임 변경이 없어 ADR 대상이 아닙니다. 다른 draft·개발 preview 작업은 포함하지 않습니다. 로컬 운영용 빌드와 실제 반응형 표시를 검사합니다.

## Open Questions

실기기 Safari의 표시 검사는 수행하지 않았습니다.

## Next

검사 통과 후 기존 feature/docs 배포 경로에 반영하고 공개 페이지에서 모바일 32px·데스크톱 64px과 헤더 배치를 확인합니다.
