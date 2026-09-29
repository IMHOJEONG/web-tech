# Obsidian 프로젝트 연동 기준 추가

## Summary

`web-tech` 블로그 프로젝트를 Obsidian 지식 저장소와 연결해 실제 작업 흐름으로 검증할 수 있도록 knowledge map을 추가했다.

## Changed

- `docs/knowledge-map.md` 추가
- `docs/README.md`에 프로젝트 지식 진입점 추가
- Obsidian `06. 만들고 싶은 것/블로그 만들기/개요.md`에 실제 저장소 경로와 knowledge map 연결 추가

## Notes

- 코드와 테스트의 source of truth는 `web-tech` 저장소다.
- Obsidian은 설계 이유, 학습 맥락, 반복 가능한 도메인 지식을 관리한다.
- 기존 UI 마이그레이션 등 미커밋 변경사항은 이번 연결 문서 작업과 분리했다.

## Open Questions

- 저장소 내부의 첫 번째 구현 작업을 어떤 기능으로 선택할지 아직 정하지 않았다.
- Obsidian project hub에 commit hash와 작업 기록을 어느 정도까지 남길지 운영하면서 조정한다.

## Next

- [ ] 검색·필터·페이지네이션 URL 설계를 첫 번째 실습 범위로 고정한다.
- [ ] 해당 작업의 `docs/knowledge-map.md` 읽기 목록과 Obsidian 도메인 노트를 사용해 구현을 시작한다.
- [ ] 구현 후 반복 가능한 지식을 Routing 또는 Browser 허브에 흡수한다.
