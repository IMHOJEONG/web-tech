# 새 경고 5건과 개발 의존성 재점검

## Summary

사용자 요청으로 잔여 취약점을 다시 검사했다. production 5건·전체 7건이며 두 audit 모두 종료 코드 1이다. 패키지 존재와 실제 악용 조건을 구분했고 버전을 변경하지 않았다.

위 수치는 `c574bbd`의 패치 전 관측이다. 이 기록을 커밋하는 시점에는 PR #36 패치가 main·feature에 전달됐으므로 [후속 패치 검증](../../verification/security/2026-10-09-security-patches.md)과 연결하고 TODO를 현재 진행 상태로 정리했다. 과거 artifact의 결과는 덮어쓰지 않았다.

## Changed

- [검증 보고서](../../verification/security/2026-10-09-remaining-advisories.md)에 현재 경로·공식 advisory·패치 출시·상위 호환성·후속 검사 범위를 기록했다.
- [실행 요약](../../verification/artifacts/2026-10-09-remaining-advisories.json)에 민감정보 없는 registry 결과와 audit 집계를 보관했다.
- TODO와 검증·artifact·월별 목차에 결과를 연결했다. 이전 NAS 보류 결정과 다른 글 초안을 유지했다.

## Notes

패치 6개 모두 registry 존재를 확인했다. braces는 아직 실제 출시 패치가 없다. KaTeX 패치는 rehype-katex 범위 밖이며 Typography 최신도 취약 selector parser를 고정한다. 기존 seroval·sharp의 override 하한은 새 패치를 보장하지 않는다.

운영에 공격 입력을 보내지 않았고 패키지 설치·lockfile 수정·커밋·푸시는 수행하지 않았다. 새로운 구조 결정이 아닌 검사 기록이므로 ADR을 추가하지 않았다.

## Open Questions

- KaTeX/Typography를 실제로 사용하는 화면 범위를 검사한 뒤 상위 업데이트·제거·제한적 override 중 어느 방향을 선택할 것인가?
- 운영 이미지의 proxy trust·librsvg와 서버/브라우저 역직렬화 경로는 배포 검증 시 추가 확인이 필요하다.

## Next

main 기반 보안 브랜치에서 proxy-addr와 patch 범위 내 갱신부터 수행하고 두 backend·docs·vuln-radar·공용 CSS의 회귀를 검사한다. 버전 범위를 벗어나는 항목은 별도 작업으로 분리한다. NAS 게시·외부 백업은 기존대로 추후 점검이다.
