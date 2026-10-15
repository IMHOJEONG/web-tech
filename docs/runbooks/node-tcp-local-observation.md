# Node.js 로컬 TCP 소켓과 패킷 관측

## 목적과 준비 조건

macOS의 한 Node.js 프로세스에서 HTTP 클라이언트·서버 소켓 끝점을 읽고
운영체제 소켓 목록과 대조합니다. Node.js v24.12.0, 로컬 실험실의 TypeScript와
`/usr/sbin/lsof`가 필요합니다. 패킷 캡처만 관리자 인증이 필요합니다.
보안 설정이나 BPF 장치 권한은 변경하지 않습니다.

## 실행 순서

로컬 실험실 `/Users/coder/Desktop/project/labs/streaming-backpressure-lab`에서 실행합니다.

```sh
node --test scripts/socket-article-source.test.mts
```

`socket-article-source.json`이 새 소켓 MDX를 가리킵니다. 원문의 5개 코드 블록을
순서대로 조합하고 fixture와 대조합니다. 두 코드의 strict 타입과 각각 3회 연결을
검사합니다. 기존 HTTP 글은 기존 `article-source.json`과 검사 명령을 유지합니다.

### 실험실 화면에서 실행

```sh
pnpm dev
```

`http://127.0.0.1:3100/sockets`의 실행 버튼은 같은 고정 `.mts`를 별도 Node.js
프로세스로 실행합니다. 화면에 표시되는 client/accepted는 그 프로세스 안의
HTTP 연결입니다. 브라우저→Next.js 연결은 관측 대상이 아닙니다.
응답 이후 소켓이 닫힌다는 설명과 local/remote 대응 관계도 화면에 표시합니다.

```sh
# 서버를 켠 상태에서 실행합니다.
pnpm test:sockets:ui
```

화면 자동 검사는 형제 블로그 저장소의 설치된 Playwright·Chromium을 사용합니다.
원문 CLI 검사는 이 브라우저 도구 없이 실행할 수 있습니다. 화면 검사 증거는
실험실 `docs/verification/artifacts`가 기본이며 `SOCKET_UI_ARTIFACT_DIR`로 바꿀 수 있습니다.
운영 API가 아니라 loopback으로 구동하는 로컬 실험실입니다.

### 선택적 패킷 캡처

첫 터미널에서 다음 도구를 실행합니다.

```sh
node scripts/socket-packet-capture.mts | tee /tmp/heapforge-socket-run.txt
```

도구는 원문을 추출한 임시 `.mts`에 서버 listen 이후의 입력 대기를 삽입합니다.
출력된 포트는 이 실행에서 열린 실제 서버 포트입니다. 아직 클라이언트는 연결하지
않습니다. 다른 터미널에서 **출력된 명령 그대로** `sudo tcpdump`를 실행합니다.
명령은 `lo0`와 `127.0.0.1`, 해당 포트로 제한됩니다. `-A`, `-X`로 본문을 출력하지 않습니다.
현재 출력 명령은 `-l`과 `2>&1 | tee -i /tmp/heapforge-tcp-capture.txt`까지 포함합니다.
명령 뒤에 다른 `tee`를 덧붙이지 말고 전체를 그대로 실행합니다.
`-l`은 파이프로 전달할 패킷 텍스트를 줄마다 출력하고, `2>&1`은 시작·종료 집계도
저장합니다. `tee -i`는 Ctrl+C 때 tcpdump의 종료 출력을 받기 전에 종료되는 것을 방지합니다.
두 로그는 같은 이름으로 덮어쓰므로 재실행 전 보존할 실행은 별도 파일로 옮깁니다.

아래는 **형식 예시**입니다. `SERVER_PORT`는 설명용 변수이며 도구가 출력하는
명령에서는 그 자리에 이번 실행의 실제 포트 숫자가 들어갑니다.

```sh
sudo /usr/sbin/tcpdump -i lo0 -nn -S -tttt -l \
  "tcp and host 127.0.0.1 and port $SERVER_PORT" \
  2>&1 | tee -i /tmp/heapforge-tcp-capture.txt
```

`lo0`: 로컬 루프백, `-nn`: 주소·포트를 이름으로 변환하지 않음,
`-S`: 절대 TCP 순서 번호, `-tttt`: 날짜와 시각을 출력하는 옵션입니다.

관리자 비밀번호는 사용자가 자기 터미널에 입력합니다. 채팅·문서에 기록하지 않습니다.
두 번째 터미널에 `listening on lo0`가 보이면 첫 터미널에서 Enter를 눌러 연결을
시작합니다. 먼저 캡처 필터의 포트와 A에서 출력된 이번 서버 포트가 같은지 확인합니다.
소켓 JSON 출력 후 약 2초 기다리고 캡처 터미널에서 Ctrl+C로 종료합니다.
패킷 행과 `packets captured`, `packets received by filter`, `packets dropped by kernel`가
파일 끝에 남았는지 확인합니다. 2초 대기는 종료 패킷을 더 받을 기회이며 완전 수집의 보장은 아닙니다.
첫 도구도 Ctrl+C로 취소할 수 있으며 120초 제한 후 자식 프로세스를 종료합니다.
두 번째 터미널의 `sudo tcpdump`는 별도 프로세스이므로 자동 종료되지 않습니다.
정상 완료·취소·timeout 모두에서 **캡처 터미널에서도 Ctrl+C**를 눌러 종료하고
종료/drop 요약을 확인합니다.

```sh
# 관리자 인증 없이 gate·연결·종료만 시험합니다. 패킷을 수집하지 않습니다.
node scripts/socket-packet-capture.mts --auto-release
```

## 기대 결과

- 원문 검사: 양쪽 local/remote 주소·포트 대응, LISTEN 1개와 ESTABLISHED 2개,
  HTTP 200, 본문 `hello from TCP\n`, `complete: true`, 연결 1개가 확인됩니다.
- 실제 캡처 시: 동일 끝점의 `[S]`, `[S.]`, ACK 필드와 요청·응답 방향을 대조합니다.
  SYN/SYN-ACK/ACK는 표준 개념이며 실제 로그에서 확인한 뒤에만 관측 결과로 기록합니다.
  ACK가 데이터와 함께 표시될 수 있으므로 독립 ACK 패킷 개수를 고정하지 않습니다.
- 캡처 종료의 drop 집계도 보관합니다. 패킷 누락이나 캡처 시작 지연이 있으면
  연결 전체를 관측했다고 판정하지 않습니다.

## 실패 대응과 복구

`Permission denied` 또는 `sudo: a password is required`이면 패킷 관측은 미완료로
남깁니다. 장치 권한·SIP 변경으로 우회하지 않습니다. 소켓·HTTP 검사와 별개로
판정합니다. 포트가 바뀌거나 도구가 timeout이면 처음부터 새 명령을 사용합니다.
다시 시작하기 전에 이전 캡처 터미널의 `tcpdump`를 반드시 종료합니다.

`listening on lo0`만 남고 패킷 행이 없다면 성공으로 처리하지 않습니다. 특히
이전 실행의 포트를 복사하면 새 소켓 연결이 필터에 잡히지 않습니다.
현재 소켓 JSON과 캡처 명령의 포트, 연결 시작 전에 캡처가 준비됐는지, `-l`과
로그 경로를 차례로 확인합니다. 종료 집계가 없다면 아직 실행 중인지도 확인합니다.
패킷이 없는 파일만으로 실제 통신이 없었다거나 어떤 신호도 발생하지 않았다고 단정하지 않습니다.

캡처 로그를 저장소 증거로 반영할 때는 같은 실행의 소켓 JSON과 함께 검토합니다.
원본 소켓 출력의 PID·사용자명·커널 식별자는 저장소 사본에서 제거하며,
패킷의 포트·순서 번호·방향과 종료 집계는 판단에 필요한 증거로 남깁니다.

`lsof` 조회는 동기 호출이라 요청 처리를 잠시 멈춥니다. 성능 측정이나 운영 코드로
사용하지 않습니다. 종료 시 대기 소켓과 연결을 닫고 임시 파일을 제거합니다.
원문 바인딩 실패 시 fixture만 수정해 숨기지 말고 MDX와 함께 확인합니다.

## 관련 검증

- [10-11 캡처 재실행·포트 불일치 대조](../verification/content/2026-10-11-node-tcp-packet-capture.md)

- [10-10 소켓·커널 관측 보고서](../verification/content/2026-10-10-node-socket-kernel-observation.md)
- [HTTP 운영체제 학습 설명](../knowledge/infra-tooling/node-http-kernel-path.md)
- [블로그 원문·화면 검증](docs-article-rendering-regression.md)
