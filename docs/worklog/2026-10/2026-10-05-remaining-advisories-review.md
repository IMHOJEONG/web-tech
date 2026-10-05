# 잔여 취약점의 런타임 경로와 패치 가용성 확인

## Summary

남은 audit 경고 5건을 공식 advisory·registry·로컬 의존성 및 원격 배포 브랜치 코드와 대조했다. 실제 패키지는 next·brace-expansion·braces 세 개다. production audit에는 next·braces 두 경고가 남는다.

## Changed

- [조사 보고서](../../verification/security/2026-10-05-remaining-advisories.md)에 사용처와 신뢰할 수 없는 입력 경계를 기록했다.
- [TODO](../../todo/todo.md)의 braces 패치 권고를 미출시 사실과 입력 경계 보강 방향에 맞게 정정했다.
- 앞선 보고서의 audit 패치 범위 표기에 실제 릴리스 확인 결과를 연결했다.

## Notes

Next.js 16.3.6·brace-expansion 5.0.12 릴리스 및 Node 24 호환성을 확인했다. braces는 audit이 >=3.0.4를 표시하지만 공식 advisory는 패치 없음, registry 최신은 3.0.3이었다. 카테고리 URL 값의 glob 해석은 짧은 정상 brace 문법으로만 확인했다.

main과 feature/docs의 원격 참조를 fetch했지만 checkout·의존성·앱 코드는 바꾸지 않았다. 운영 서버에 공격 입력을 보내지 않았다. 구조 변경은 없으므로 새 ADR은 만들지 않았다.

## Open Questions

현재 Vercel 배포와 비교한 feature/docs SHA가 같은지, 이미지 생성 경로에서 실제 RCE 조건에 도달할 수 있는지는 미검증이다. braces의 상위 패치 또는 제거 대안도 후속 검토가 필요하다.

## Next

별도 보안 구현 작업으로 Next.js 패치와 카테고리 allowlist 검증을 우선 반영한다. 이후 brace-expansion 갱신·회귀 검사, braces 패치 추적과 배포 브랜치 동기화를 수행한다.
