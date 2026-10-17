# Node.js 소켓 끝점과 운영체제 상태 관측

## 대상과 조건

- 날짜: 2026-10-10 Asia/Seoul. 정확한 UTC 관측 시각은 원본 로그·JSON에 기록했습니다.
- 환경: macOS, Node.js v24.12.0, 설치된 TypeScript 6.0.3, IPv4 루프백 단일 연결.
- 대상: 미커밋 `tcp-socket-endpoints-lab.mdx`와 연결된 로컬 실험실.
- 표본: fixture 3회 + 실제 MDX 3회. strict 타입은 두 코드 각각 검사.
- 화면: 기존 개발 서버 3001의 draft preview. production·배포는 검사하지 않았습니다.

## 재현 방법

[소켓·선택적 패킷 관측 절차](../../runbooks/node-tcp-local-observation.md)를 따릅니다.
실험실에서 `node --test scripts/socket-article-source.test.mts`를 실행했습니다.
원문 코드 바인딩은 기존 HTTP 글과 분리해 `socket-article-source.json`으로 추가했습니다.
패킷 gate는 `node scripts/socket-packet-capture.mts --auto-release`로 시험했습니다.

## 결과와 증거

| 항목                                                | 결과                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 실제 MDX 5개 블록 조합과 fixture 일치               | 통과. 초기 빈 줄 차이는 동기화 후 재검사했습니다.                                   |
| strict 타입, 양쪽 끝점 대응, HTTP 200·본문·complete | 통과. 원문·fixture 각각 3회입니다.                                                  |
| 운영체제 소켓 snapshot                              | 매회 같은 프로세스에서 LISTEN 1개·ESTABLISHED 2개, 동일 끝점 확인.                  |
| 틀린 포트·누락 소켓·본문 훼손·불완전 완료 판정      | 음성 검사 통과. 조건 위반을 실패로 처리합니다.                                      |
| 전체 새 글 검사                                     | 11개 통과, 실패·skip 없음.                                                          |
| 개발 서버 화면                                      | 1280·670·390px에서 HTTP 200, 제목 하나, 그림 decode, 5개 코드 단계, 관측 한계 확인. |
| 패킷 캡처 접근                                      | 실패. BPF permission denied, sudo 관리자 비밀번호 필요.                             |
| 캡처 연결 대기 도구                                 | 캡처 없는 smoke 통과. listen 뒤 연결 대기, 해제 후 정상 HTTP와 정리 확인.           |
| SYN·ACK·커널 버퍼 크기·내부 함수                    | 미관측·미검증.                                                                      |

- [최종 집계와 SHA 대조](../artifacts/2026-10-10-tcp-socket-summary.json)
- [최종 원문·타입·반복 검사](../artifacts/2026-10-10-tcp-socket-tests.txt)
- [본문에 인용한 첫 통과 실행](../artifacts/2026-10-10-tcp-socket-first-pass.txt): 실제 MDX 1회 포트 55546/55547. 최종 원문 SHA 증거와 구분합니다.
- [캡처 없는 gate smoke](../artifacts/2026-10-10-tcp-capture-gate-smoke.txt)
- [권한 점검 결과](../artifacts/2026-10-10-tcp-capture-access.json)
- [개발 서버 화면 검사](../artifacts/2026-10-10-tcp-socket-preview.json),
  [모바일 화면](../artifacts/2026-10-10-tcp-socket-preview-390.jpg),
  [데스크톱 화면](../artifacts/2026-10-10-tcp-socket-preview-1280.jpg)

기술·독자·존댓말 세 에이전트의 검토를 반영했습니다. 요청/응답 그림 방향,
JSON과 재배열한 출력 요약의 구분, local/remote·임시 포트 설명을 보강했습니다.
게시되지 않은 선행 글 링크는 제거하고 다음 질문은 타이머·수신 콜백 영향으로 좁혔습니다.

기존 HTTP 초안의 후속 상태 문장도 갱신했습니다.
[HTTP 원문 회귀 검사](../artifacts/2026-10-10-http-socket-followup-source-tests.txt) 14개가 통과했습니다.
이 검사는 기존 별도 fixture suite 전체 재실행과 구분합니다.
콘텐츠 19개 검사, 문서 구조·링크 검사도 통과했습니다. 인덱스는 변경하지 않았습니다.

## 로컬 실험실 화면 연결 후 확인

사용자 요청으로 실험실 `/sockets` 화면과 `POST /api/socket-endpoints`를 추가했습니다.
실행 예제는 새로 복제하지 않고 기존 `.mts`를 고정 경로로 실행합니다.
실험실 메인 화면에서 이동할 수 있으며 README·코드 해설·재사용 가능한 UI 검사를 연결했습니다.

- [실험실 원문 재검사](../artifacts/2026-10-10-tcp-lab-source-tests.txt): 11개 통과, 원문 SHA 일치.
- 전체 실험실 TypeScript 검사 통과. `.mts` import를 위해 `allowImportingTsExtensions`를 명시했습니다.
- [실제 API·화면 검사](../artifacts/2026-10-10-tcp-lab-ui.json): 1280·670·390px 각 1회 실제 POST 200,
  양쪽 포트·OS 소켓·HTTP 본문 확인. 총 3회이며 브라우저 오류와 페이지 가로 넘침 없음.
- 반환 키와 정리된 TCP 행을 검사해 PID·사용자명·OS 내부 식별자가 화면 JSON에 없는 것을 확인했습니다.
- 다른 Origin 403·GET 405 확인. Origin 없는 CLI 요청은 허용하며 엄격한 same-origin 전용 API라고 주장하지 않습니다.
- 모의 500 응답에서 오류 표시·이전 결과 제거·재실행 버튼 복구 확인. 실제 서버 장애와 non-macOS 501은 미검증입니다.
- [초회 오류와 수정](../artifacts/2026-10-10-tcp-lab-initial-failure.json): Next 내부 URL과 접속 Host 차이로
  정상 요청도 403이었습니다. 실제 Host 기준으로 수정 후 재검사했습니다.
  Next route announcer와 충돌한 검사 alert 선택자도 실험 영역으로 제한했습니다.
- [실험실 데스크톱 결과](../artifacts/2026-10-10-tcp-lab-1280.jpg),
  [모바일 결과](../artifacts/2026-10-10-tcp-lab-390.jpg).

기술·독자 검토에서 실행기와 관측 연결을 구분했습니다. API·화면 검사를 추가하고
양쪽 포트 대응 문장과 정리한 JSON 표현을 반영했습니다. 이번 확인은 개발 서버이며
운영 빌드·원격 배포·패킷 캡처를 수행한 것은 아닙니다.

## 한계와 후속 작업

`lsof`는 운영체제가 노출한 소켓 상태의 한 순간을 조회합니다. 커널 내부 함수·
메모리 복사 횟수·큐 크기·TCP 패킷·ACK 시각을 직접 추적한 결과가 아닙니다.
동기 조회가 실행을 멈추므로 이 결과를 네트워크 성능으로 일반화하지 않습니다.
브라우저·TLS·CDN·외부 인터넷은 실험 밖입니다.

실제 패킷 확인은 사용자의 로컬 관리자 인증이 필요합니다. 준비된 gate 절차로
캡처 시작 후 연결을 만들고 로그에서 확인한 신호만 기록합니다.
4단계 이벤트 루프 실험은 아직 실행하지 않았습니다. 새 초안의 사용자 검토를 기다립니다.
커밋·스테이징·푸시·원격 게시를 수행하지 않았습니다.

## 관련 문서

- [10-11 관리자 캡처 재실행의 후속 결과](2026-10-11-node-tcp-packet-capture.md): 당시 실패는 유지하고 후속 로그를 따로 대조합니다.

- [학습 문서](../../knowledge/infra-tooling/node-http-kernel-path.md)
- [단계별 로드맵](../../todo/todo.md#nodejs에서-운영-인프라까지-학습-로드맵)
- [작업 기록](../../worklog/2026-10/2026-10-10-tcp-socket-learning-experiment.md)
