# NAS revision 검증 설계 초안

## Summary

사용자 요청에 따라 실험 공개 커밋과 분리해 NAS revision 검증을 설계했다.
현재 목록·본문의 독립적인 live Markdown 읽기를 코드로 확인하고,
불변 게시 스냅샷과 NAS 현재 포인터를 우선 제안했다. 구현·채택·NAS 실행 검증은 하지 않았다.

## Changed

- [ADR-0028](../../architecture/adr-0028-nas-content-revision-snapshots.md)을 `제안` 상태로 작성했다. 기존 ADR-0011은 유지한다.
- 입력 고정·공개 검수·목록/HTML 빌드·manifest 해시·포인터 전환과 요청별 lease 검증을 명세했다.
- 실험의 증가 숫자와 달리 운영 후보 generation은 불투명 UUID이며, 현재 값과 다르면 순서를 추정하지 않고 거절한다.
- 기존 API를 유지한 채 새 버전 읽기와 검증 경로부터 도입하고, 검증 결과 캐시와 웹훅 신호는 후속으로 분리했다.
- [architecture 목차](../../architecture/README.md)·[TODO](../../todo/todo.md)·월별 목차에 제안과 미구현 범위를 연결했다.

## Notes

이번에 승인된 공개 커밋은 실험 코드 `8e7963d0cb5a80ab2188c9aaa7618320ecc56b4e`와
정제 문서·검수 기록 `fa583dd49eb0f53d569b66741b09e78ee5a8fa3f`다. NAS 설계는 이 두 커밋에 포함하지 않았다.
실험 36개·기본 production 198개는 실험 코드의 재검증 결과이며 NAS 설계 구현의 테스트 결과가 아니다.

검토한 현재 코드는 ContentRepository·ContentService·ContentController·공용 콘텐츠 스키마·Compose다.
새 계약에 필요한 순수 스키마·validator와 실제 NAS의 mount·잠금·동기화는 아직 검증하지 않았다.
Node 24 파일 API와 Linux rename/fsync의 원자성·내구성을 구분해 문서 근거로 연결했다.
실제 원본 백업·자격 증명·NAS·Docker·Vercel·Cloudflare의 운영 상태와 설정은 조회하거나 변경하지 않았다.
저장소의 Compose 예제와 코드만 검토했다.
설계 초안 작성 시에는 검수 해시·stage·커밋·푸시·배포를 수행하지 않았다.
이후 공용 계약 공개 검수·커밋 요청에 따라 그 계약의 근거인 이 정제 설계와 목차도 함께 검수했다.
원시 증거·실제 NAS 설정·푸시·배포는 여전히 제외한다.

[KAN-58 검증 댓글](https://web-tech-service.atlassian.net/browse/KAN-58?focusedCommentId=10085)과
[Confluence 댓글](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817?focusedCommentId=14581761)에
로컬 커밋과 미커밋 제안을 구분해 기록하고 3열 표·SHA·기존 이력 보존을 재조회했다. 페이지 본문은 보존했다.
설계 문서 5개의 역할·상태·상대 링크 검사를 통과했으며 원격 동작 검증으로 표시하지 않는다.

## Open Questions

- NAS의 publisher 잠금·중단 복구·파일/디렉터리 동기화가 실제 볼륨에서 어떻게 동작하는가?
- pointer no-store 조회의 지연·장애 영향을 기존 deadline 안에서 감당할 수 있는가?
- 공개 철회·이전 revision 거절·미디어의 불변 URL·구세대 보관 기간을 어떻게 운영할 것인가?
- 향후 다중 발행자가 필요하면 파일 권위 모델을 유지할지 트랜잭션 저장소를 도입할 것인가?

## Next

제안 검토 후 공용 revision·manifest·포인터 스키마와 순수 hash validator부터 별도 구현한다.
원본 변조·헤더만 바뀐 이전 본문·혼합 목록/본문·중단/경쟁·rollback·원격 실패 중 로컬 유지 회귀를 먼저 정의한다.
공용 계약과 정제 문서의 로컬 커밋은 후속 사용자 승인 범위다. 실제 NAS 적용은 별도 승인 후 진행한다.
