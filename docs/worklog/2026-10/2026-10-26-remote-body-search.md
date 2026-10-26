# 원격 본문 검색 텍스트 계약과 로컬 회귀

## Summary

[KAN-29](https://web-tech-service.atlassian.net/browse/KAN-29)의 후속 승인으로 원격 published 본문 검색을 구현했다. [Confluence 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817)는 같은 과제의 결정과 원본을 연결한다. 최신 main 기반 전용 브랜치이며 기존 미커밋·초안·미디어·NAS 기록을 보존했다.

## Changed

- 공유 목록 스키마에 선택적 `searchText`를 추가하고, 백엔드가 검증된 published 본문에서 기존 Markdown 파서로 생성한다.
- 문서 metadata의 렌더링용 content는 비워 둔 채 두 원격 검색 어댑터에서만 검색 content로 전달한다.
- 본문 전용 일치·원격 우선·구형 API·갱신·비공개 제외·로컬 fallback·요청 수·안전한 발췌 회귀를 추가했다.
- [ADR-0019](../../architecture/adr-0019-remote-body-search.md)·API/경험 정책·TODO와 [검증 보고서](../../verification/content/2026-10-26-remote-body-search.md)를 연결한다. 별도 미디어 작업 공간의 ADR-0018 초안을 보존해 새 결정 번호는0019를 사용한다.

## Notes

렌더링 HTML·본문을 검색 때 전부 가져오지 않는다. 구형 API는 metadata-only이며 오래된 로컬 본문과 합치지 않는다. 새 의존성·lockfile·공통 설정·캐시/웹훅·운영 파일은 변경하지 않았다. 최초 docs lint는 fixture의 `module` 변수 이름을 Next 규칙이 경고했으며 `bundledModule`로 고쳐 규칙 완화 없이 재검증한다. 상세 결과·명령·미검증 범위는 검증 보고서에 기록한다.

최종 공용28·백엔드22+40·docs294·저장소153개가 통과했다. 앱/테스트 타입·관련 lint·공용 ESM/CJS/Nest build도 성공했다. 저장소 회귀 최초2개는 리스너 EPERM으로 실패해 같은 조건을 허용 환경에서 재검증했고 assertion·공통 설정은 바꾸지 않았다. 로컬 소스 blob10개와 관측 결과는 보고서의 artifact로 연결한다. Next production·UI 브라우저·원격CI·운영 배포는 미실행이다.

문서 delta는 기존 validator의 읽기 전용 작업 트리 view로 통과했고 인덱스는 변경하지 않았다. 변경 파일 포맷·diff 검사도 성공했다. KAN-29 기존 댓글10018의3열 표와 Confluence v141에 같은 작업의 결정·로컬 검증·운영 미검증을 기록하고 실제 저장·기존 본문 보존을 재조회했다. Jira 상태는 검토 중이며 본문 검색 외의 byte budget 과제까지 완료 처리하지 않았다. 첫 Jira 댓글 조회가 지연돼 읽기 전용 대기를 중단한 뒤 재조회했으며 중복 댓글은 생성하지 않았다.

## Open Questions

목록 크기 상한·대규모 파싱 비용은 후속 byte budget 과제다. 기존 로컬 MDX 본문 표현을 원격 Markdown 표현과 완전히 동일한 파서로 통일하는 작업은 포함하지 않는다. NAS H1 제외 원인과 외부 health 차단은 기존 작업으로 유지한다.

## Next

로컬 검증 후 별도 사용자 승인으로 커밋·푸시·PR·CI를 진행한다. 운영 적용은 백엔드 새 이미지와 프론트 배포·기존 게시 갱신/화면 확인이 필요하며 이번에는 하지 않는다. KAN-29의 다른 미완료 항목과 섞어 완료 처리하지 않는다.

## 커밋·푸시 승인 후 분리

사용자가 이번 작업의 커밋·푸시를 승인했다. 공유 계약·백엔드와 회귀는 `a6cce5c31384a3709340cb5ef3531214bcc8dea3`, 프론트 검색 연결과 회귀는 `14a49a107d1199ac0e5830cc2884a1afe6a9f7f6`로 분리했다. 두 커밋의 포맷·문서 delta·commitlint 훅이 통과했고 검증 artifact의 소스10개 blob도 모두 일치했다. 코드 변경 없이 정책·검증·TODO를 세 번째 커밋으로 묶는다.

공유 목차3개는 이번 검색 항목만 부분 스테이징한다. 기존 NAS/H1·primary 후속 기록과 NAS 조회 artifact는 제외하며 작업 파일 내용을 보존한다. 원격에는 명시적인 전용 브랜치만 push하고 main·다른 feature 브랜치·stash를 바꾸지 않는다. 실제 원격 head·커밋 링크와 자동 검사 유무는 같은 Jira/Confluence 기록에 재조회해 연결한다. 이번 승인은 PR 생성·병합·NAS 이미지 교체나 운영 캐시 갱신을 포함하지 않는다.
