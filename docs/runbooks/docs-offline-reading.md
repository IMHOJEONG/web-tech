# Docs 오프라인 저장과 네트워크 장애 점검

## 목적과 준비 조건

인터넷이 없는 상태에서 **미리 직접 저장한 공개 글**을 읽고 삭제하는 절차다. 인터넷이 연결된 HTTPS 사이트 또는 localhost, Service Worker·CacheStorage를 허용한 브라우저가 필요하다. 알림 권한과 로그인은 필요하지 않다. 글 저장은 서버/NAS 콘텐츠를 수정하지 않는다.

## 실행 순서

1. 공개 글 본문 끝의 ‘오프라인 저장’을 누른다. 성공 안내 또는 누락 이미지 수를 확인한다. 버튼이 있다는 사실만으로 저장이 끝난 것은 아니다. 본문이 로딩 중이라는 안내가 나오면 내용 표시 후 다시 누른다. 로딩 placeholder는 저장하지 않는다.
2. ‘저장한 글’을 열어 목록을 확인한다. 같은 출처의 `/offline.html?lang=ko`를 북마크하면 전체 인터넷 차단 후에도 접근할 수 있다.
3. DevTools Network를 Offline으로 바꾸거나 연결을 끊는다. 저장한 글 목록에서 제목을 누른다. 또는 저장한 상세 주소를 직접 열거나 새로고침한다. Next 앱 안의 모든 클라이언트 링크 이동이 오프라인으로 보장되는 것은 아니다.
4. 저장본 안내·본문·코드·저장 시각을 확인한다. 이미지는 빠질 수 있다. 저장하지 않은 글 주소를 직접 열면 저장한 글 목록이 나타난다.
5. 다시 온라인으로 바꾼다. 최신 내용이 필요하면 원문을 열고 ‘저장본 업데이트’를 누른다. 자동 동기화하지 않는다.
6. 저장소에서 글별 삭제 또는 ‘전체 삭제’를 누른다. 전체 삭제는 확인창을 승인해야 실행된다.

저장소는 브라우저 프로필별로 분리된다. 시크릿 모드, 다른 기기, `localhost`와 `127.0.0.1`, Preview와 Production 사이에는 공유되지 않는다.

### 자동 회귀 검사

저장소 루트에서 프로젝트 Node.js 24를 사용한다. 포트 3018과 앱의 Next 개발 캐시를 사용하므로 같은 앱의 dev/build를 동시에 실행하지 않는다. Playwright가 개발 서버를 시작하고 종료한다. 외부 콘텐츠 API와 푸시는 테스트 환경에서 비활성화한다.

```bash
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs test:offline
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter docs lint
```

production도 같은 브라우저 검사를 실행할 수 있다. 먼저 원격 콘텐츠를 끈 상태로 빌드한 후 아래 명령을 실행한다. 기존 dev/start와 동시에 실행하지 않는다.

```bash
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false BLOG_CONTENT_API_BASE_URL= BLOG_CONTENT_API_BASE_URL_INTERNAL= BLOG_CONTENT_API_BASE_URL_PUBLIC= BLOG_PUSH_ENABLED=false mise exec -- pnpm --filter docs build
NODE_ENV=production mise exec -- pnpm --filter docs test:offline
```

최초 환경은 `pnpm --filter docs exec playwright install chromium`이 필요할 수 있다. CI는 독립 `Docs Offline Reading` job에서 `test:offline`을 실행하고 기존 lib job에서 네트워크·Worker 단위 검사를 실행한다.

## 기대 결과

- 저장 전에는 글 본문을 자동 보관하지 않는다. 저장 성공 뒤에만 저장한 글 목록에 나타난다.
- 연결 오류·HTTP 오류에 대한 원격 콘텐츠 자동 retry는 없다. 서버의 헤더·본문이 지연되면 deadline 이후 로컬로 대체한다. 원격 전용 글의 실제 오류는 오류 UI를 유지한다.
- 카드 이미지가 실패하면 로컬 대체 이미지, 그것도 실패하면 동일 영역의 배경으로 끝난다. 카드 제목·링크는 계속 동작하며 무한 재요청하지 않는다.
- 네트워크 전체 차단 후에도 저장본과 reader 자원만으로 글을 읽고 삭제할 수 있다. 정상 서버 404와 연결 실패는 구분한다.
- 저장 실패·공간 한도는 성공으로 표시하지 않는다. 기존 저장본을 먼저 지우지 않는다.

## 실패 대응과 복구

- 저장 실패: 연결·저장 권한·HTTPS·Application → Service Workers 상태를 확인한다. 정상 연결 후 명시적으로 다시 저장한다. 원문 서버 장애와 브라우저 오프라인은 서로 다른 원인이다.
- 10개 한도: 목록에서 불필요한 저장본을 지운 뒤 다시 저장한다. 공간 부족은 브라우저가 앱 한도 이전에 거부할 수도 있다.
- 저장본 누락: 출처·프로필과 사이트 데이터 삭제 여부를 확인한다. 서버 백업에서 복구하는 기능은 없으므로 온라인 원문에서 다시 저장한다.
- Worker 설치 실패: `/push-sw.js`와 `/offline-worker.js`가 JS로 응답하는지, reader 파일 3개가 같은 출처에서 200인지, CSP가 같은 출처 연결을 허용하는지 확인한다.
- 오래된 저장본: 오류가 아니라 명시적 갱신 정책이다. 원문에서 업데이트한다. 원문이 삭제·비공개가 되어도 기존 저장본을 원격 회수할 수는 없다.
- 앱 기능을 되돌릴 때는 저장 UI와 오프라인 확장을 제거한 동일 URL의 Worker를 배포하는 방식을 검토한다. `/push-sw.js`를 임의로 unregister하면 푸시 구독에도 영향을 줄 수 있다. 모든 출처 캐시를 일괄 삭제하지 않는다. 개발 점검에서 글만 정리할 때는 reader의 삭제 기능을 사용한다.

## 관련 검증

- [실제 실행 결과와 한계](../verification/resilience/2026-10-17-content-network-offline.md)
- [저장·보안 경계 결정](../architecture/adr-0015-explicit-offline-article-snapshots.md)
