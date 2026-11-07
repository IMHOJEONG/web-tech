# 공용 계약 커밋·임시 snapshot 교체 실험

## Summary

사용자 승인 범위의 공용 계약·정제 문서를 각각 로컬 커밋한 뒤, 새 임시 디렉터리에서만 snapshot builder와 포인터 교체를 검증했다.
실제 NAS·기존 API·컨테이너 설정은 바꾸지 않았다. 후속 사용자 승인으로 실험 구현·회귀와 정제 문서도 공개 검수 후 작업별 로컬 커밋한다.

## Changed

- `cdf47ec`: 공용 publication 스키마·순수 validator·회귀·dual export.
- `6b80476`: 정제 ADR·검증·기록·목차와 승인 해시. 중복 검수 항목은 사용자 승인으로 해당 미푸시 커밋 1개만 재작성했다.
- `apps/docs-backend/src/publication-lab/`: pre-rendered 합성 입력의 candidate 생성·실제 bytes 재검증·release 승격과 독점 잠금·포인터 교체.
- `97709cc`: 위 실험 구현·회귀 소스 2개를 공개 검수 후 로컬 커밋. 정제 문서·목차 7개와 검수 해시는 다음 커밋으로 분리한다.
- 초기화 marker·expected generation·새 UUID·이전 lease·포인터 교체 이후 불확정 오류를 분리했다.
- [검증 보고서](../../verification/content/2026-11-07-snapshot-pointer-lab.md)와 역할별 목차·TODO에 로컬 적용과 미검증 경계를 연결했다.

## Notes

검증 날짜는 KST 2026-11-06~07이다. 공용 계약 커밋 범위의 공개 검사·format·문서 delta·commitlint는 통과했다.
실험 집중35개는 최종 5회 연속 통과했다. 동시 rename에서 path/fd stat의 nlink=0을 훼손으로 오판한 최초 실패와
단계별 수정·재현 명령은 보고서에 보존한다. raw 자료는 커밋이나 외부 댓글에 복사하지 않는다.

기존 사용자 이력·stash·원시 자료·개발 서버는 보존했다. 최초 실험 종료 시 두 로컬 커밋의 푸시·PR·배포와
새 실험의 stage·공개 검수 해시·커밋은 수행하지 않았다.
최종 전체 backend66개·타입·lint·Nest build가 통과했고 실험 root는 0개가 남았다.
[KAN-58 댓글](https://web-tech-service.atlassian.net/browse/KAN-58?focusedCommentId=10085)과
[Confluence 댓글 v7](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817?focusedCommentId=14581761)에
로컬 두 커밋·미커밋 실험·실패와 한계를 추가하고 3열 표·기존 댓글 이력 보존을 재조회했다.
페이지 본문의 미게시 편집은 보존하며 KAN-58은 과거 최초 원인 미확정·운영 미검증으로 진행 중이다.

위 미커밋 보존 기록은 최초 실험 종료 시점의 경계다. 이후 사용자가 이번 실험과 정제 문서만 공개 검수·커밋하도록 승인했다.
소스 2개·문서 7개의 비밀값·개인정보·권리·공개 의도를 확인했으며 원시 로그·실제 응답·개인 경로·초안은 포함하지 않는다.
소스와 정제 문서를 분리하고 최종 문서 bytes의 검수 해시를 기록한다. 같은 경로의 기존 승인 항목은 갱신하며 중복 항목은 만들지 않는다.
전체 backend66개·타입·lint·Nest build를 다시 통과했고, 최종 커밋 SHA와 범위 검사는 기존 원격 댓글에 추가한다.
로컬 커밋만 수행하며 푸시·PR·배포·실제 NAS 조치는 계속 제외한다.

## Open Questions

- 실제 NAS 볼륨에서 잠금·원자적 교체·sync·전원 장애 내구성을 어떤 격리 환경에서 시험할 것인가?
- 입력 고정·사람 공개 승인·Markdown 렌더·assets를 snapshot builder 앞단에서 어떻게 연결할 것인가?
- 초기화 intent/남은 잠금의 수동 복구·공개 철회·보관 정책을 어떻게 승인할 것인가?

## Next

NAS용 publisher·버전 API·프론트 lease 연결 전
운영용 잠금 소유권·중단 복구·입력 승인 경계를 먼저 설계한다. 실제 NAS 설정은 추가 승인 전 변경하지 않는다.
