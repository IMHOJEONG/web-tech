# 번역·OG 캐시 배포 후속 점검

## Summary

최신 feature/docs의 CI·배포를 확인하고 공개 카테고리 번역과 OG 응답을 점검했다. 번역은 통과했지만 OG 4시간 TTL·원격 H1 두 개·braces High 알림은 남아 있다.

## Changed

- [검증 보고서](../../verification/security/2026-10-06-deployed-followup.md)와 비밀정보를 제외한 관측 artifact 추가.
- 역할별 목차와 TODO의 번역 배포 확인 상태 갱신.
- 앱 코드와 기존 새 글·CSS 변경은 그대로 유지했다. 구조·공개 계약 변경이 없어 새 ADR은 작성하지 않았다.

## Notes

실행 명령·결과·미검증 범위는 검증 보고서에 연결한다. GitHub 브랜치 실행 목록의 빈 결과 대신 커밋 check-runs로 성공을 확인했다. 커밋·푸시·NAS 수정·Cloudflare 설정 변경은 수행하지 않았다.

이번 문서 7개에 작업 트리 기반 공용 문서 검증기를 실행해 필수 섹션·상대 링크·목차·artifact JSON 검사를 통과했다. 명시한 파일만 Prettier로 정리했고 `git diff --check`도 통과했다. 인덱스는 변경하지 않았다.

## Open Questions

어떤 Cloudflare 설정이 공개 OG의 브라우저 TTL을 4시간으로 만드는지와 braces 제거 대안은 미확정이다.

## Next

Cloudflare TTL을 우선 확인하고 원격 글 제목 수정 이후 재검증한다. braces의 사용 경로·제거 대안 조사와 패치 추적을 별도 진행한다.
