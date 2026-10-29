# 승인된 Brotli 기고 게시

## Summary

사용자가 draft 기고의 게시를 승인했다. 최신 main 기반의 별도 브랜치에 Brotli 글과 연결 자료만 가져오고 게시 메타데이터를 전환했다. [검증 보고서](../../verification/content/2026-10-29-brotli-publication.md)에 원문·빌드·화면 검사를 연결한다.

## Changed

- 기고 `b70ef7c`를 최신 main에 분리 적용한 `a86ecbf` 위에서 게시 상태·날짜만 변경했다. 본문·출처·도식과 기존 검토 이력을 보존한다.
- NAS 승인 도구·공통 작성 지침·다른 기록 커밋·임시 diff preview는 포함하지 않는다.
- `drain` 조기 종료 점검은 독립 [KAN-47](https://web-tech-service.atlassian.net/browse/KAN-47)이며 이 게시 PR의 backpressure 본문 수정에 포함하지 않는다.

## Notes

실제 MDX 바인딩 16개, 격리 production 빌드, 네 화면 조건·정확한 복사·검색 Link·ko/en 목록/상세·사이트맵이 통과했다. 기술 용어 `임시`의 placeholder 오탐과 초기 검사기 가정 오류는 보고서에 구분했다. 실행 코드·설계·공개 계약은 바꾸지 않아 새 ADR은 필요하지 않다. 본문이 같으므로 기존 기술·초보 독자·존댓말 다중 검토와 원문 바인딩 검사를 재사용한다.

[KAN-44](https://web-tech-service.atlassian.net/browse/KAN-44)와 [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817)에 로컬 검증·원격 게시 단계를 구분해 연결한다. 원격 기록과 PR CI·main·Production은 실제 결과를 확인한 뒤 갱신한다.

## Open Questions

게시 PR의 원격 검사·리뷰 및 운영 반영 확인이 남았다. NAS 변경은 수행하지 않는다.

## Next

게시 변경만 push·PR로 검증한 뒤 사용자 게시 승인 범위에서 최종 메시지 사전검사·main 병합을 진행한다. 같은 SHA의 CI·Production과 공개 글·목록·검색·사이트맵을 확인한다.
