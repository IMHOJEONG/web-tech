# Vite+ peer 경고와 공용 lockfile 소비자 영향 조사

## Summary

[KAN-34](https://web-tech-service.atlassian.net/browse/KAN-34)의 후속으로 peer 경고의 패키지 버전 비교와 실제 연결 버전을 구분했다. lockfile은 의미상 optional 연결도 바뀌며, 별도 PostCSS 요청 범위 불일치를 발견했다. 의존성·mise·pnpm·Turborepo·Railway 설정은 변경하지 않았다.

## Changed

- 생산/개발 그래프를 비교하는 TypeScript 분석기와 6개 단위 검사를 추가했다. 기존 검사기 타입 검사 범위에 포함했다.
- 기준 main의 manifest/lockfile만 오프라인 고정 설치하는 대조 도구를 추가했다. 원래 checkout이나 실험 lockfile을 변경하지 않고 임시 기준선을 정리한다.
- [검증 보고서](../../verification/integration/2026-10-24-viteplus-peer-lockfile-impact.md)에 재현 명령·범위·원본 JSON·미검증 항목을 연결했다.

## Notes

새 검사기 6개와 전체 저장소 114개, docs 285개, docs-backend 13개, 두 Nest 빌드와 공용 UI 빌드·타입을 확인했다. styled-jsx/Babel 8 실패는 기준 main에서도 재현되어 이번 실험이 새로 만든 장애로 분류하지 않았다. 두 환경의 Next 내장 Babel 7 변환은 통과했다.

Vite+의 실제 core는 모두 같지만 alias 버전 1.4.0이 peer 범위와 맞지 않는다. 별도로 core가 요청하는 PostCSS 8.5.30 이상 대신 기존 override에 의해 8.5.26이 연결된다. 미해결 경고를 숨기거나 공통 규칙을 완화하지 않았다.

## Open Questions

- core에 한정한 PostCSS 해석 수정과 기존 공용 override 보존을 어떻게 결합할 것인가?
- 다른 앱의 optional 연결 변경을 줄일 것인가, 소비자 CI를 확대해 수용할 것인가?

## Next

사용자 검토 후 의존성 해석 보완 범위를 승인받는다. 이 조사만으로 실험을 main에 채택하거나 Railway 보안 보류를 해제하지 않는다. 미커밋 상태이며 푸시·배포는 하지 않았다.
