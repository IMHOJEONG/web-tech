# 워커 스레드 글 발행과 학습·운영 지식 정리

2026-11-21 기록 정리: 아래 초안 상태·실행·서버 유지·발행 결과는 11-20 당시 관측이다. 이번에는 정제 기록만 대조하며 원문·원시 자료를 복사하거나 실험·브라우저·게시·배포를 다시 실행하지 않는다.

## Summary

사용자가 검토한 워커 스레드 글의 공개 전환·커밋·운영 배포와 본문·흐름도·사이트맵 검증을 요청했다. 발행은 [KAN-63](https://web-tech-service.atlassian.net/browse/KAN-63), 전체 학습·운영 지식 정리는 [KAN-86](https://web-tech-service.atlassian.net/browse/KAN-86)에서 추적한다.

## Changed

- 기존 작업 트리·미추적 원고·지침은 보존했다. 최신 main `2728665e`의 별도 작업 트리에서 release lock 한 파일만 변경했다.
- 승인 원고의 본문·27회 관측표·두 도식은 유지하고 상태·발행일만 변경했다. 비공개 콘텐츠 커밋 `f30b4e3a8877554d502bdc7846df29e883d83a59`는 원고와 검수 해시만 포함하며 원격 main 존재를 확인했다.
- 앱 커밋 `7652b91f`와 [PR #105](https://github.com/IMHOJEONG/web-tech/pull/105)는 고정 revision과 새 URL만 포함한다. 다른 수정·원시 자료·개인 경로·키·설정은 포함하지 않는다.
- [전체 학습·운영 판단](https://web-tech-service.atlassian.net/wiki/pages/20217870)과 [Node 입출력·CPU·워커·풀](https://web-tech-service.atlassian.net/wiki/pages/20119583)의 지식 본문을 작성하고 기존5개 주제와 연결했다.

## Notes

실제 원문6조각의 대조·strict 타입·별도 TCP 송신 실행2개, 콘텐츠·템플릿51개·목차10개·앱 타입·발행본19편·검수 자산15개 준비와 Production 빌드가 통과했다. 최초 직접 메타 검사는 공용 계약 dist 생성 전이라 실패했고 표준 pretest 빌드 후 재검사해 통과했다. 기존 두 글의 placeholder warning은 유지했다.

지식 문서의 실제 본문·근거 링크·운영 안내 하위 계층과 댓글 링크를 재조회했다. 다중 검토의 sitemap500 직접 원인과 CPU 평균 한계 지적을 반영했다. Better Stack 수집 수락을 이메일 수신으로, 콜백 시각을 커널 도착으로, 일반 CI를 인증 CI 성공으로 확대하지 않았다.

운영 안내 본문 추가는 도구 internal_error로 미저장임을 재조회했다. 반복 쓰기 대신 하위 계층과 footer 링크로 탐색을 연결했다. 지식 본문은 별도 페이지로 저장됐으며 진행 댓글과 구분한다. 공통 지침의 추가 로컬·원격 변경은 없고 기존 발행 절차 적용이라 새 ADR은 없다.

### 2026-11-21 미커밋 기록 정리

[KAN-51](https://web-tech-service.atlassian.net/browse/KAN-51)의 후속으로 관련 기록10개를 main 2cf837f0 기반 별도 로컬 작업 트리에 모았다. 원래 JSON의 본문 발췌·불필요한 배포 식별자와 본문 fingerprint는 재업로드하지 않고 고정 필드 요약3개로 분리했다. sourceSha256·제외 필드를 남겼으며 원본 파일·다른 미커밋·stash는 보존한다. 실제 콘텐츠 저장소의 글이나 원시 로그 파일은 조회하지 않았다. 기존 기록 JSON에서 읽은 본문 발췌는 새 파일에서 제외한다. 새 글 게시·콘텐츠 SHA 변경·키·운영 조치는 하지 않는다.

Node24.22.1·pnpm12.14.0에서 기존 잠금 의존성1418개를 오프라인으로 재사용했다. 다운로드·설치 훅·dotenv skill 승인은 없다. 요약3개는 원본과 구조 대조해 명시한 제외 필드 외 값이 동일했고, 조건별9회 합계27·최소/중앙/최대 범위와 두 발행본의 언어별 사이트맵1회 조건도 일치했다. 새 실험이나 운영 응답 재검증이 아니다.

후보13개를 공식 문서 validate의 읽기 전용 view로 검사해 오류0개, 공개 inspect는 승인 요구13개만 남았다. 자동 검출0개를 비밀정보 전수 감사·사람 승인으로 간주하지 않으며 index는 비어 있다. 명시한13개 파일만 포맷했다. 두 원본 작업 트리의244개 파일 bytes·HEAD/index/status와 양쪽 후보 목차5개의 main 링크를 대조해 보존을 확인했다. 원래 발췌 포함 JSON3개는 새 작업 트리에 복사하지 않았다. 앱·E2E·원문 실험 재실행은 이번 문서 정리 범위가 아니다.

공개 범위 승인 후 최종 bytes와 검수 목록을 stage하고 pnpm format:staged:check·pnpm validate:docs --staged·pnpm publication:staged를 적용한다. 실제 커밋·이력 검사와 로컬 읽기 전용 검사를 구분하며 푸시·PR·배포·원본 삭제는 하지 않는다. 기존 발행 절차와 공개 경계를 적용하므로 새 ADR·지식 페이지는 만들지 않는다.

KAN-51 기존 댓글10043의 후속3열 표와 [Confluence 정리 진행 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=20250686)(v4)을 재조회해 기존 이력·본문·링크 보존을 확인했다. 원시 자료 없이 정제한 로컬 준비 결과만 연결했고 미푸시 문서의 원격 링크는 만들지 않았다.

후속 사용자 승인으로 워커13개와 해당 공개 검수 목록만 최종 bytes를 검수해 독립 로컬 커밋으로 정리한다. 과거의 커밋 제외 문장은11-20 당시 범위다. 원본 JSON3개·다른 미커밋·stash는 새 커밋에서 제외하며 푸시·PR·원본 삭제는 하지 않는다. 실제 훅과 main 2cf837f04954d05d5ff409bdec6794ec28fd7f07 기준 publication 전체 이력·commitlint 결과는 같은 Jira 후속 표에서 로컬-only로 추적한다. 다음으로는 승인된 Atlassian 기록만 마무리하고 이후 작업은 진행하지 않는다.

## Open Questions

PR 검사·리뷰와 main `2cf837f0` 병합, 같은 SHA의 일반 CI·Production READY·공개 반영을 확인했다. 결과는 [검증 보고서](../../verification/content/2026-11-20-worker-thread-publication.md)에 분리했다. 실기기·외부망·동시 부하·신규 커널 계측은 미실행이다.

## Next

원시 로그·화면은 Git 밖에 보관하고 이 작업 기록은 추가 공개 Git 커밋에 포함하지 않는다. Jira KAN-63·KAN-86을 완료로 전환하고3열 마감 표와 Confluence 운영 안내 footer20217957의 저장을 재조회했다. 기존 주간 운영 점검에서 발행본을 확인하며 정상 글의 중복 배포는 필요하지 않다. 임시 발행 후보 서버만 종료하고 기존 개발 서버는 유지한다.
