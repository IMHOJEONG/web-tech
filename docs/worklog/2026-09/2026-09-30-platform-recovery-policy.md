# 복구 목표와 배포 안전 운영 기준 보강

## Summary

기존 롤백 안내에 복구 목표·판단 기준·백업 보관·격리 리허설 기준을 추가했다. 실제 운영 설정과 복구 시간은 미검증이므로 정책은 제안 상태다.

## Changed

- [복구 정책](../../architecture/platform-recovery-policy.md)에 앱·콘텐츠·DB의 책임과 RTO/RPO 초안을 정의했다.
- [리허설 절차](../../runbooks/platform-recovery-drill.md)에 안전 조건과 DB 격리 복원 명령을 추가했다.
- 기존 NAS·Vercel 문서와 역할별 색인, TODO에 연결했다.

## Notes

운영 컨테이너·DB·Dashboard·백업 스케줄을 변경하지 않았다. 공식 PostgreSQL·Compose·Vercel 문서를 확인했다. `pnpm validate:docs`, 변경 9개 파일의 `prettier --check`, `git diff --check`가 통과했다. 실제 NAS/DB 복구는 별도 승인된 환경에서 수행한다.

## Open Questions

운영자가 목표 시간을 수용하는지, 별도 백업 저장소와 DB 제공자의 PITR·장애 전환 기능을 사용할 수 있는지 확인해야 한다.

## Next

대상 버전·백업 권한·보관 위치 확인 후 첫 격리 리허설을 실행하고 실제 복구 시간을 보고서에 남긴다.
