# Vite+ 호환성 보완과 override 범위 정리

## Summary

[KAN-34](https://web-tech-service.atlassian.net/browse/KAN-34)의 조사 후 사용자 승인으로 PostCSS·Babel·nanoid 해석과 peer 경고를 보완했다. 관련 소비자를 검증했으며 기존 도구와 Railway 보안 보류는 유지한다. 후속 승인으로 설정·호환성, 회귀 도구, 검증 문서를 작업별 로컬 커밋으로 분리한다. 푸시하지 않는다.

## Changed

- 전역 PostCSS override를 제거해 원래 소비자 범위를 존중한다.
- Babel/nanoid의 전역 강제를 호환 요청에만 수렴하는 exact convergence 규칙으로 바꿨다. styled-jsx 5.1.6의 누락 Babel 7 peer 범위를 보완했다.
- 검증된 3개 소비자에만 Vite alias 1.4.0 호환 예외를 두고 실제 core·내장 버전·원래 peer 범위·모듈 동일성을 회귀 검사한다.
- 기존 보안 최소 버전 목적은 유지했다. 나머지 보안 override는 제거 근거가 없어 유지한다.
- [수정 판단·재현·최종 검증](../../verification/integration/2026-10-24-viteplus-dependency-remediation.md)에 증거를 연결했다. 과거 실패·조사 결과는 덮어쓰지 않았다.

## Notes

peer 0건, CLI 8개, 기존 통합 25개, 저장소 120개, docs 285개, backend 48/13개를 확인했다. Next production + 소비자 화면 16개와 UI 외부 tarball CSS·SSR·types·React 중복 검사까지 통과했다. 자세한 명령과 잔여 범위는 검증 보고서에 있다.

PostCSS는 원래 범위에 따라 core 8.5.31과 Next 8.5.23으로 해석된다. Babel 8 오류는 기준 main의 문제였으나 이번에 함께 보완해 7.29.6 실제 변환 성공으로 확인했다. nanoid 3.3.20은 PostCSS의 CJS 계약과 보안 floor를 만족한다.

## Open Questions

별도 기존 audit 13건과 Linux/CI 검증, main 채택 여부가 남아 있다. 전체 보안 완료나 배포 완료로 보고하지 않는다.

## Next

로컬 커밋 이후에도 원격 CI·운영 채택은 미검증으로 유지한다. 별도 승인 전 push·PR·Railway 배포를 하지 않는다.
