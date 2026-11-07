# 임시 게시 스냅샷 생성·포인터 교체 검증

## 대상과 조건

- 검증일: 2026-11-06~07 KST. 공용 계약 `cdf47ec`·정제 문서 `6b80476` 위 미커밋 로컬 실험.
- Node 24.22.1·pnpm 12.14.0·macOS 로컬 파일시스템과 Jest. 실제 NAS·Docker·운영 API·네트워크는 사용하지 않았다.
- [실험 구현](../../../apps/docs-backend/src/publication-lab/snapshot-lab.ts)과 [회귀](../../../apps/docs-backend/src/publication-lab/snapshot-lab.spec.ts)는 공용 publication 계약을 사용한다. Nest 모듈·컨트롤러·기존 repository에는 연결하지 않았다.
- factory가 새 OS 임시 디렉터리만 생성한다. 외부 root 경로·CONTENT_DIR·토큰을 받지 않는다. 입력은 합성 published metadata와 완성 HTML bytes다.
- 후속 사용자 승인으로 동일 구현·회귀를 로컬 `97709cc`에 커밋했다. 관련 정제 문서·목차 7개는 별도 검수·커밋하며 이번 작업에서 원격 푸시·배포는 하지 않는다.

## 재현 방법

프로젝트 Node·pnpm과 의존성이 준비된 저장소 루트에서 실행한다. 별도 개발 서버나 NAS 접속은 필요하지 않다.

```sh
pnpm --filter @web-tech/docs-content-contract build
pnpm --filter docs-backend exec jest --runInBand --runTestsByPath src/publication-lab/snapshot-lab.spec.ts
pnpm --filter docs-backend test --runInBand
pnpm --filter docs-backend typecheck
pnpm --filter docs-backend lint
pnpm --filter docs-backend build
```

최종 집중 검사는 같은 명령을 별도 프로세스로 5회 연속 실행했다. 테스트는 factory가 만든 root만 사용하고
afterEach에서 정리한다. 별도 child process는 이 root의 잠금 파일을 만든 뒤 강제 종료하며 NAS 컨테이너를 종료하지 않는다.
기존 개발 서버·다른 작업 트리·stash·원시 자료는 정리 대상으로 삼지 않았다.

## 결과와 증거

### 공용 계약 커밋과 공개 검수

| 작업                            | 결과                                                                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 공용 스키마·순수 validator·회귀 | 로컬 `cdf47ec`. 공용 83개 재통과. 기존 소비자 프론트354개·backend31개 결과는 [선행 보고서](2026-11-06-publication-integrity-contract.md)에 보존 |
| 정제 설계·검증·기록·목차        | 로컬 `6b80476`. 승인한 8개 문서의 최종 bytes를 검수하고 해시 기록. 원시 자료·실제 응답·비밀값 제외                                              |
| 검수 중 수정                    | 최초 문서 커밋의 검수 경로 4개 중복을 확인했다. 사용자 승인 후 그 미푸시 문서 커밋 1개만 재작성했으며 기존 사용자 이력은 유지                   |
| 최종 커밋 범위                  | 기준 `fa583dd` 이후 두 커밋의 publication·format·문서 delta·commitlint 통과. 현재 실험은 이 커밋에 포함하지 않음                                |

### 파일 기반 게시 흐름

```text
완성 index·HTML의 소유 복사본
  → 공용 strict 계약·길이·해시·UTF-8·문서 집합 검사
  → 임시 candidate에 파일 쓰기·파일/디렉터리 sync
  → 디스크에서 실제 candidate bytes 재검증
  → releases/<revision>으로 rename (기존 동일 revision은 검증 후 재사용)
  → 독점 잠금 안에서 expected generation 대조
  → 검증한 release를 가리키는 임시 pointer 쓰기·sync
  → current.json으로 rename·부모 디렉터리 sync
```

build만으로 current가 바뀌지 않는다. index/HTML을 다시 렌더링하지 않으며 실제 Markdown 수집·공개 승인·asset 승격은 구현하지 않았다.
새 generation은 매 promote/rollback마다 발급하며, 이전 revision 복귀도 이전 generation을 재사용하지 않는다.

| 회귀                            | 관측 결과                                                                                                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 최초 게시·동일 산출물·빈 게시본 | 명시적 bootstrap만 최초 포인터 생성. 동일 revision은 검증 뒤 재사용하고 빈 게시본도 허용                                                                    |
| 버전 고정·복귀                  | V2 승격 뒤 이전 lease는 V1, 새 current 읽기는 V2. 새 인스턴스는 디스크에서 재조회. rollback은 같은 V1 revision/새 generation                                |
| 입력 오류                       | draft·누락·중복·추가 문서·경로 우회·잘못된 UTF-8·index/HTML 크기 초과는 candidate 노출 전 실패                                                              |
| 디스크 변조                     | 같은 길이의 HTML 변조·manifest 변경·누락·추가 파일·symlink·hardlink·크기 초과를 거절하고 기존 pointer bytes 유지                                            |
| candidate 재검증                | 쓰기 후 변조를 주입하면 release로 노출하지 않음                                                                                                             |
| 교체 전 중단                    | candidate 기록·release rename·pointer sync 뒤 주입 오류에서도 기존 포인터 유지. 완성된 미게시 release는 남을 수 있음                                        |
| 교체 후 중단                    | pointer rename 뒤 오류는 commit-uncertain. 실패했다고 과거 상태로 단정하거나 자동 rollback하지 않고 디스크 재조회에서 V2 확인                               |
| 동시 읽기·쓰기                  | 교체 전 보류 중 12개 읽기는 V1, 교체와 겹친 24개 읽기는 완전한 V1/V2만 반환. 두 번째 writer는 locked, 나중의 이전 expected generation은 generation-conflict |
| 별도 프로세스 잠금              | 다른 프로세스가 잡은 잠금을 존중. 그 프로세스를 SIGKILL해도 남은 파일을 자동 삭제·탈취하지 않음                                                             |
| 유실·재초기화                   | initialized marker 이후 포인터 누락·파손·초과·link를 실패 처리. 첫 포인터 쓰기 중단도 초기화 의도를 남기며 bootstrap:true만으로 다시 초기화하지 않음        |
| 안전한 오류                     | 고정 code만 노출하고 원시 예외·개인 경로·입력 bytes를 오류 원인으로 포함하지 않음                                                                           |

### 동시 읽기에서 발견한 오판과 수정

처음에는 rename과 실제 읽기를 겹친 회귀가 unsafe-file로 실패했다. 이전 포인터를 열어 둔 뒤 교체하면
이전 inode가 연결 해제되어 nlink=0이 될 수 있는데, 단일 link만 허용한 검사가 이를 훼손으로 오판했다.
pointer-opened barrier로 `이전 파일 open → 새 포인터 rename → 이전 fd stat/read` 순서를 고정했고 수정 전 실패를 재현했다.

fd stat만 보완한 뒤에도 반복 3회 중 마지막 실행에서 path stat 단계가 같은 이유로 실패했다.
최종적으로 **포인터 읽기에만** 두 stat 단계의 nlink=0을 허용했다. O_NOFOLLOW·일반 파일 검사·byte 상한·strict JSON은 유지하며
nlink>1은 포인터에서도 계속 거절한다. 불변 release 파일은 nlink=1 조건을 유지한다.
열린 이전 pointer는 완전한 V1 읽기로 마무리하고, 새 current 요청은 V2를 읽는 계약이다.

최종 집중 35개 × 5회 = 175회 실행이 모두 통과했다. 이는 고유 테스트 175개라는 뜻이 아니다.
최종 전체 backend 단위66개(신규35개+기존31개)·타입·lint·Nest build가 통과했다.
실험 root 잔여 수는 0개였으며 인덱스는 비어 있다. 실제 NAS·HTTP·Next 앱 동선 E2E를 새로 실행한 결과는 아니다.
실험 오류를 모두 정상 취소로 처리하거나 과거 CI의 최초 원인으로 확정하지 않았다.

이 동작의 API 근거는 [Node 24 파일 API](https://nodejs.org/download/release/v24.22.1/docs/api/fs.html#filehandlesync)와
[Linux rename의 열린 파일 설명](https://man7.org/linux/man-pages/man2/rename.2.html)이다. 로컬 회귀로 관측한 범위와 NAS 실제 볼륨 보장은 구분한다.
원시 로그·실제 응답·캡처·trace는 공개 문서나 artifact에 복사하지 않았다.

## 한계와 후속 작업

- 이 파일은 로컬 실험이며 NAS용 publisher가 아니다. 실제 NAS 파일시스템·volume·mount·전원 차단 내구성·권한 분리는 미검증이다.
- checkpoint 오류는 주입된 예외다. 실제 SIGKILL은 잠금 소유 프로세스에만 적용했으며 publisher의 모든 쓰기 경계에서 crash/reboot를 시험한 것은 아니다.
- readCurrent/reopen은 요청별 새 디스크 조회를 보여 주지만 네트워크 API·Next metadata/검색/본문 lease 공유·캐시 세대 전환을 검증하지 않는다.
- 일반 writer는 module의 잠금·불변 release 계약을 지킨다고 가정한다. 동일 OS 계정·관리자가 검증과 사용 사이에 디렉터리를 바꾸는 공격까지 방어하는 openat 기반 sandbox나 서명 검증은 아니다.
- stale lock·초기화 intent만 남은 경우는 fail-closed다. 자동 복구·owner 사망 판정·잠금 탈취·구세대 삭제·철회 정책은 구현하지 않았다.
- sync/rename 성공은 해당 OS 호출의 성공이다. 실제 NAS의 journal·전원 장애 내구성·분산 CAS 보장은 별도 시험이 필요하다.
- 최초 실험 종료 때는 코드·보고서·기록을 미커밋으로 보존했다. 이후의 공개 검수·커밋은 아래 후속 승인 범위로만 진행하며 공용 계약의 기존 승인을 자동 확대하지 않는다.
- 실제 NAS 설정·컨테이너·환경 변수·자격 증명·웹훅·푸시·배포는 변경하지 않았다.

### 후속 공개 검수·커밋 승인

사용자가 이 실험 구현·회귀와 정제 문서의 공개 검수·작업별 로컬 커밋을 명시 승인했다.
선행 미커밋 보존 결정은 아래 승인 범위에서만 갱신한다.

- 소스 2개는 합성 입력·격리 파일 조작·자체 작성 회귀이며 실제 문서·API 응답·계정 정보·비밀값을 포함하지 않는다.
- 문서 7개는 ADR·검증·작업 기록·목차·TODO다. 실패 이력·표본 수·미검증 경계·재현 명령은 유지하고 개인 경로·원시 로그·trace·녹화본은 제외한다.
- 최종 문서를 stage한 뒤 인덱스 bytes의 SHA-256을 검수 기록에 저장한다. 기존 경로는 항목을 갱신하고 중복 경로를 추가하지 않는다.
- `97709cc`와 동일 소스의 전체 backend66개·타입·lint·Nest build를 11-07 다시 통과했다. 이전 집중35개 5회 결과를 새 실행 횟수로 중복 합산하지 않는다.
- 실제 NAS 설정·컨테이너·웹훅·자격 증명·푸시·PR·배포는 이번 승인 범위가 아니다. 최종 로컬 커밋 SHA와 범위 검사 결과는 기존 Jira·Confluence 댓글에 추가한다.

[KAN-58 댓글](https://web-tech-service.atlassian.net/browse/KAN-58?focusedCommentId=10085)과
[Confluence 댓글 v7](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817?focusedCommentId=14581761)에
로컬 커밋과 미커밋 실험·실패/성공·남은 NAS 범위를 추가하고 실제 3열 표와 기존 이력 보존을 재조회했다.
Confluence 페이지 본문의 미게시 편집은 변경하지 않았다.

## 관련 문서

- [ADR-0028](../../architecture/adr-0028-nas-content-revision-snapshots.md)
- [공용 계약 검증](2026-11-06-publication-integrity-contract.md)
- [작업 기록](../../worklog/2026-11/2026-11-07-snapshot-pointer-lab.md)
