# 잔여 의존성 보안 패치 우선 반영

## Summary

문서 커밋·푸시보다 보안 조치를 먼저 진행했다. main `3134150` 기반 별도 보안 브랜치에서 출시된 패치를 적용하고 기존 feature/docs 변경은 보존했다.

## Changed

- workspace override·lockfile에서 proxy-addr, sharp, source-map-js, seroval, KaTeX, selector parser를 갱신했다.
- 상위 범위를 벗어나는 두 패키지는 parent-scoped override로 제한하고 KaTeX의 호환성 경고 배포는 제외했다.
- `scripts/security-dependencies.test.mjs`에 실제 전이 의존성 회귀 검사 7개를 추가했다. 기존 CI의 저장소 테스트에 자동 포함된다.
- [검증 보고서](../../verification/security/2026-10-09-security-patches.md), audit artifact, 목차와 보안 TODO를 추가했다.

## Notes

[검증 결과와 한계](../../verification/security/2026-10-09-security-patches.md#결과와-증거)를 참고한다. 패치 대상 advisory는 사라졌지만 braces high 1개가 남아 audit 종료 코드는 1이다. NAS·운영 데이터·비밀값은 변경하지 않았다.

구조·공개 계약·공용 UI 책임은 바뀌지 않았다. 기존 ADR과 충돌하는 새 설계 결정은 없어 ADR을 추가하지 않았다.

사용자 승인 후 보안 구현·회귀 테스트를 `5fa50ab`로 커밋했다. 검증 보고서·증거·TODO는 별도 문서 커밋으로 분리한다. 원격 CI·운영 배포 완료를 의미하지 않는다.

## Open Questions

상위 패키지의 공식 보안 버전 지원과 braces 실제 패치 출시 시점을 계속 확인해야 한다.

## Next

보안 브랜치 푸시 후 PR CI·main 병합·배포 브랜치 전달 순으로 검증한다. feature/docs의 glob 제거를 main에 전달하는 작업과 Linux 배포 검증은 별개로 남긴다.
