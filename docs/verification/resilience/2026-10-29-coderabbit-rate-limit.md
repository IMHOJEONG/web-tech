# CodeRabbit 리뷰 한도 예외 검증

## 대상과 조건

- 2026-10-29 KST, Node24.22.1·pnpm12.14.0, main `0da7979b1d43c80ed28873a66fa9be222b2534d4` 기반 별도 브랜치.
- 대상: `scripts/squash-merge.mts`와 회귀. Brotli PR #76·drain 조사·임시 diff preview는 변경에 포함하지 않는다.
- 실제 #76 head: `3e33e4ce6abf36878594b96dc390dc298bf90413`. CodeRabbit check-run `123211021536`의 App 신원·완료 NEUTRAL·한도 제목/summary를 직접 확인했다.

## 재현 방법

저장소 루트에서 Node24를 선택하고 실행한다. 첫 두 명령은 로컬 검사이며 마지막 명령은 현재 열려 있는 같은 head의 PR을 GitHub에서 **읽기만** 한다. 승인된 병합은 동일 명령에 `--merge`를 추가하되 새 head·CI·리뷰를 다시 확인한다.

```bash
node --test scripts/squash-merge.test.mts
pnpm typecheck:squash
pnpm pr:squash --repo IMHOJEONG/web-tech --pr 76 \
  --expected-head 3e33e4ce6abf36878594b96dc390dc298bf90413 \
  --message-file /private/tmp/brotli-publication-squash-message.txt
```

메시지 파일은 [정책의 형식](../../process/squash-merge-preflight.md)을 지키는 최종 메시지다. 해당 PR이 병합되거나 head가 바뀌면 마지막 명령이 차단되는 것이 정상이며 과거 성공을 재사용하지 않는다.

## 결과와 증거

- 회귀 **65개 통과**, 실패/skip0. 기존 실제 commitlint·메시지 스냅샷·head 고정·임시 파일 정리와 기존 차단 조건을 유지한다.
- 새 양성: 공식 App 한도 체크의 페이지네이션 조회, 병합 인수 head 고정, 예외 감사 출력과 `reviewPerformed: false`.
- 새 음성: App id/slug/owner·head·체크 ID·제목/summary 변조, 일반 neutral·failure·skip·진행 중·다른 CI 실패·중복 이름·빈/잘못된 페이지·인증/timeout/JSON 오류. 모두 병합 명령을 보내지 않았다.
- strict TypeScript 검사 통과. 읽기 전용 독립 검토에서도 차단해야 할 결함이 발견되지 않았다. 독립 검토는 실제 원격 조회나 전체 회귀를 대신하지 않는다.
- PR #76 실제 읽기 전용 사전검사는 `check-only`로 성공했다. 예외 ID·head·사유가 실제 체크와 일치하고 리뷰 미수행을 명시한다. 초기 구현 단계의 라이브 검증이며 main 전파나 실제 병합 성공을 뜻하지 않는다.

원본 회귀 출력과 실제 읽기 전용 판정은 [증거 목차](../artifacts/README.md)의 10-29 CodeRabbit 구역에 연결한다. 원격 CI와 정책 PR의 main 반영은 별도 확인 대상이다.

## 한계와 후속 작업

App ID·출력 형식은 현재 GitHub.com 원본을 기준으로 고정했다. 공급자가 변경하면 다시 조사하고 테스트를 갱신해야 한다. 모든 외부 서비스 중단이나 새로운 사유를 자동 예외로 처리하지 않는다. 서버 required checks·사람 승인·미해결 리뷰의 우회 기능이 아니다. 무료 대안은 공식 조건을 비교했을 뿐 설치·모델 비용·우리 저장소에서의 정확도는 검증하지 않았다.

## 관련 문서

- [ADR-0024](../../architecture/adr-0024-advisory-review-rate-limit.md)
- [작업 기록](../../worklog/2026-10/2026-10-29-coderabbit-rate-limit.md)
