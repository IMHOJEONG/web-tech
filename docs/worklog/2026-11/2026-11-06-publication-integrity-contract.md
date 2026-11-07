# 공용 게시 revision·manifest 검증 구현

## Summary

사용자 요청에 따라 공용 revision·manifest·포인터 스키마와 순수 무결성 검증을 별도 publication subpath로 추가했다.
변조·누락·크기 초과와 기존 소비자 호환을 검사했다. 실제 NAS 설정·기존 API·배포는 변경하지 않았다.

## Changed

- `publication-schema.ts`: strict 버전·식별자·포인터·정렬/중복·경로·개별/합계 budget과 canonical published index 계약.
- `publication-integrity.ts`: canonical manifest 생성·SHA-256 검증, index/HTML 길이·해시·UTF-8·문서 집합의 전체 체인 검사.
- `publication.test.ts`: 독립 hash 기대값과 합성 fixture로 정상·실패·경계값 회귀.
- dual ESM/CJS export와 패키지 로컬 import 확장자 재작성. 기존 root export·앱 API는 유지.
- [ADR-0028](../../architecture/adr-0028-nas-content-revision-snapshots.md)의 제안 상태는 유지하고 첫 단계의 로컬 구현만 명시했다.
- 패키지 README·역할별 목차·TODO와 [검증 보고서](../../verification/content/2026-11-06-publication-integrity-contract.md)를 연결했다.

## Notes

검증 기준은 HEAD `fa583dd49eb0f53d569b66741b09e78ee5a8fa3f` 위 변경이다. 선행 실험 4개 커밋과 NAS 설계를 보존했다.
실행 명령·검사 결과·최초 기대 오류 차이는 검증 보고서에 기록한다. 임시 원시 자료는 공개 범위에 넣지 않는다.
후속 사용자 승인으로 구현을 `cdf47ec`에 커밋했다. 정제 ADR·검증·기록·목차는 별도 커밋하고,
승인된 최종 문서 bytes의 검수 해시를 기록한다. 비밀값·개인정보·권리·공개 의도를 확인했으며
합성 fixture 외 실제 응답·원시 자료·초안은 포함하지 않는다. 푸시·배포는 하지 않는다.
[KAN-58 댓글](https://web-tech-service.atlassian.net/browse/KAN-58?focusedCommentId=10085)과
[Confluence 댓글 v6](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817?focusedCommentId=14581761)에
로컬 구현·공용83개/프론트354개/backend31개·미검증 범위를 추가하고 3열 표와 기존 이력 보존을 재조회했다.
페이지 본문은 변경하지 않았으며 KAN-58은 과거 원인 미확정과 NAS 미적용을 남긴 진행 중 상태다.

## Open Questions

- NAS snapshot builder가 검수된 입력과 완성 출력의 고정·공개 승인을 어떤 단계에서 보장할 것인가?
- 실제 NAS의 파일 안전 접근·publisher 잠금·포인터 교체·중단 복구를 어떻게 검증할 것인가?
- 초기 document count·합계 budget을 실제 corpus 측정 후 유지할 것인가?

## Next

다음 구현은 사용자 요청에 따른 격리 임시 디렉터리의 snapshot builder·원자적 승격이며
실제 NAS 설정과 운영 API 연결은 별도 승인·검증 전까지 변경하지 않는다.
