# 저장소 테스트 전수 검사 전 목록 정리

## Summary

2026-10-12에 feature/docs HEAD `d8c0952`와 현재 작업 트리를 기준으로 테스트 파일, 실행 명령, CI 연결을 조사했다. 전수 검사 전에 목록을 먼저 보여달라는 요청에 따라 suite 실행과 코드 수정은 하지 않았다.

## Changed

- [테스트 전체 목록과 실행 경로](../../runbooks/repository-test-inventory.md)를 추가했다.
- runbooks 목차와 이 달의 작업 목차를 갱신했다.
- 테스트 파일 131개를 현재 검사 대상 129개와 과거 실험 증거 2개로 나눴다. 독립 검증·측정 스크립트는 별도 목록으로 기록했다.

## Notes

파일 접미사 검색, runner import, package.json 스크립트, Jest/Playwright 설정, CI 호출을 대조했다. 케이스 수·성공률·coverage는 측정하지 않았다. 미추적 테스트 3개와 미커밋 수정 테스트 1개를 목록에 표시했다. 기존 미커밋 콘텐츠와 구현 변경을 보존했으며 커밋·푸시는 수행하지 않았다. 구조나 공개 계약의 변경이 없으므로 새 ADR은 해당 없음.

## Open Questions

CI 명시 호출이 없는 폰트 preload, 코드 접기·Activity·푸시 브라우저, Vuln Radar API E2E를 상시 검사로 올릴지는 실제 검사 비용과 fixture 격리를 확인한 뒤 결정한다.

## Next

목록 확인 후 단위·계약 검사, Backend API, 브라우저 회귀, 환경 의존 스크립트 순으로 assertion·격리·실행 결과를 점검한다. 이번 단계에서는 전수 실행을 시작하지 않았다.
