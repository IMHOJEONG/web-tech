# Docs Request Blocklist

## 목적

공개 웹사이트에는 정상 사용자 요청 외에도 존재하지 않는 경로를 훑는 자동화 요청이 들어온다. 예를 들면 `/2017`, `/wp-admin`, `/xmlrpc.php`, `/.env`, `/backup.zip` 같은 경로가 있다.

HeapForge docs 앱은 이러한 요청이 애플리케이션 라우팅이나 원격 콘텐츠 로딩으로 이어지지 않도록 앱 레벨 middleware에서 빠르게 차단한다.

## 현재 정책

- 루트 연도형 `HEAD` 요청은 차단한다.
  - 예: `HEAD /2017`
  - 정상 문서 경로인 `/docs/2026/...`는 차단하지 않는다.
- 워드프레스/저장소/비밀파일/백업파일 스캔 패턴은 차단한다.
  - 예: `/wp-admin`, `/wp-login.php`, `/xmlrpc.php`
  - 예: `/.env`, `/.git/config`, `/backup.zip`, `/db-backup.sql`
- 차단 응답은 `404`를 반환한다.
  - 외부 요청자에게 세부 차단 이유를 노출하지 않기 위함이다.
- 내부 로그에는 차단 이유를 남긴다.
  - Vercel Runtime 또는 Edge 로그에서 `[docs] Blocked suspicious request.`를 확인한다.

## 구현 위치

- 차단 판단 유틸: `apps/docs/lib/request-blocklist.ts`
- middleware 연결: `apps/docs/middleware.ts`
- 회귀 테스트: `apps/docs/lib/request-blocklist.test.ts`

## Vercel Firewall과의 관계

이 구현은 저장소에 남는 앱 레벨 방어선이다. 트래픽 자체를 더 앞단에서 막고 싶다면 Vercel Dashboard의 Firewall rule도 함께 설정한다.

권장 우선순위:

1. 반복되는 명확한 공격 패턴은 Vercel Firewall에서 먼저 차단한다.
2. 저장소에 남겨야 하는 공통 정책은 middleware blocklist에 추가한다.
3. 정상 라우트와 충돌 가능성이 있는 패턴은 테스트를 먼저 추가한 뒤 차단한다.
