# Docs Content Asset Exposure Strategy

## Purpose

이 문서는 `apps/docs`에서 원격 콘텐츠 이미지를 어떤 URL로 노출할지, 그리고 왜 그 방식을 선택하는지 정리한다.

핵심 질문은 이것이다.

1. 브라우저 개발자 도구에 원본 스토리지 주소가 보이는 것이 괜찮은가
2. 그렇지 않다면 어떤 계층에서 주소를 감추는 것이 가장 현실적인가
3. 현재 `HeapForge` 구조에서는 어떤 방식이 운영과 UX의 균형이 가장 좋은가

## Current Situation

현재 구조에서는 문서 본문 안의 이미지가 예를 들어 아래처럼 직접 노출될 수 있다.

```html
<img
  src="https://public-content.example.com/feed/pna/permissions.png"
  alt="test_img"
/>
```

이 경우 사용자는 개발자 도구에서:

- NAS 또는 스토리지 실주소
- 포트 정보
- 내부 운영 구조를 유추할 수 있는 path

를 그대로 보게 된다.

중요한 점은, 브라우저가 이미지를 렌더하려면 **어떤 형태로든 최종 요청 URL은 보인다**는 것이다.  
즉 목표는 “URL을 완전히 숨기는 것”이 아니라, **원본 저장소 주소 대신 canonical asset URL만 보이게 하는 것**이다.

## What We Want

현재 구조에서 원하는 방향은 아래에 가깝다.

- 원본 스토리지 경로는 사용자에게 직접 보이지 않는다
- 사용자는 `HeapForge` 기준의 canonical URL만 본다
- 스토리지 위치가 바뀌어도 프론트가 참조하는 URL은 유지된다
- 이미지 ownership은 콘텐츠 저장소 쪽에 남기되, 외부 노출 경로는 앱 기준으로 통제한다

즉:

- storage ownership
  - content repo / backend storage
- public exposure
  - `heap-forge` 도메인 기준 canonical path

로 나누는 것이 핵심이다.

## Options We Considered

### Option 1. 스토리지/NAS URL 직접 노출

예:

```txt
https://public-content.example.com/feed/pna/permissions.png
```

장점:

- 구현이 가장 단순하다
- markdown 본문 안에 바로 절대 URL을 적으면 된다
- 별도 프록시 계층이 필요 없다

단점:

- NAS/스토리지 실주소가 사용자에게 노출된다
- 포트/호스트 구조가 그대로 드러난다
- 스토리지 위치가 바뀌면 markdown 자산 URL도 같이 바꿔야 할 수 있다
- 제품 도메인 관점에서 URL 일관성이 약하다

판단:

- 초기 실험 단계에서는 가능
- 운영 기준 canonical path로는 비권장

### Option 2. 앱 또는 assets 도메인 기준 reverse proxy

예:

```txt
https://heap-forge.io/media/feed/pna/permissions.png
https://assets.example.com/feed/pna/permissions.png
```

실제 내부에서는:

- NAS reverse proxy
- CDN
- FastAPI/static server

중 하나가 원본 스토리지로 요청을 전달한다.

장점:

- 사용자에게는 canonical URL만 보인다
- 스토리지 실주소를 감출 수 있다
- 저장소 위치가 바뀌어도 public path 계약은 유지된다
- 브랜드/제품 관점에서 더 자연스럽다

단점:

- reverse proxy 또는 CDN 구성이 필요하다
- 캐시 정책과 경로 정책을 따로 관리해야 한다

판단:

- 가장 균형이 좋다
- 현재 레포에서 권장 기본안

### Option 3. 앱 서버(Next.js/FastAPI) 이미지 프록시 엔드포인트

예:

```txt
/media/feed/pna/permissions.png
/api/assets/feed/pna/permissions.png
```

장점:

- 구현 제어권이 높다
- 권한, 로깅, 캐시, 차단 정책을 앱 계층에서 직접 줄 수 있다
- 원본 주소를 숨기기 쉽다

단점:

- 앱 서버를 한 번 더 타게 된다
- 공개 이미지가 많아질수록 성능/캐시 전략을 더 고민해야 한다
- reverse proxy보다 서버 부하가 커질 수 있다

판단:

- 빠른 첫 구현에는 현실적
- 장기적으로는 CDN/NAS reverse proxy가 더 적합할 수 있다

### Option 4. 서명 URL / 만료 URL

장점:

- 임시 접근 제어에는 좋다
- 링크 재사용을 줄일 수 있다

단점:

- 공개 블로그 이미지에는 보통 과하다
- devtools에서 URL이 보이는 사실 자체는 바뀌지 않는다
- 구현 복잡도가 높다

판단:

- 현재 공개 기술 블로그 이미지에는 비권장

## Recommendation For This Repo

현재 `HeapForge` 기준 추천은 다음과 같다.

### Core Decision

원본 자산은 `content/assets/...`에 저장하되, 외부 노출은 `heap-forge` 기준의 canonical asset path로 통일한다.

즉:

- 저장
  - `content/assets/{channel}/{slug}/...`
- 외부 노출
  - `/media/{channel}/{slug}/...`
  - 또는 `assets.example.com/{channel}/{slug}/...`

구조를 기본으로 본다.

### Why This Fits Best

1. 콘텐츠 ownership은 backend/content storage에 그대로 둘 수 있다
2. 프론트는 원본 스토리지 위치를 몰라도 된다
3. 사용자에게는 브랜드 기준 URL만 보인다
4. 스토리지 재배치 시에도 public URL 계약을 유지할 수 있다

## Recommended Path Policy

### Content Storage

```txt
content/assets/feed/pna/hero.webp
content/assets/feed/pna/permissions.png
```

### Public URL

```txt
https://assets.example.com/feed/pna/hero.webp
https://assets.example.com/feed/pna/permissions.png
```

또는:

```txt
/media/feed/pna/hero.webp
/media/feed/pna/permissions.png
```

### Posts vs Assets

- `posts`
  - `content/posts/{channel}/{slug}.md`
- `assets`
  - `content/assets/{channel}/{slug}/...`

즉 문서와 자산은 ownership은 연결되지만, 노출 경로는 다르게 관리한다.

## Which Layer Should Proxy

### Preferred Order

1. CDN 또는 reverse proxy
2. NAS reverse proxy
3. FastAPI / Next.js app route proxy

이 순서로 권장한다.

### Why

- 공개 이미지 자산은 정적 캐시 친화적이다
- 앱 서버를 굳이 매번 경유하지 않는 편이 성능상 유리하다
- reverse proxy 계층은 스토리지 숨김에 가장 적합하다

즉 현재 구조에서는 **NAS reverse proxy 또는 assets 도메인 프록시**가 가장 자연스럽다.

### Immediate Reality

다만 지금은 `assets.example.com` 같은 자산 전용 도메인이 아직 준비되지 않았으므로, **즉시 운영안은 기존 공개 도메인을 그대로 유지**하는 쪽이 더 현실적이다.

즉 현재 단계에서는:

```txt
https://public-content.example.com/feed/pna/permissions.png
```

를 canonical처럼 사용하고, 나중에만 asset 전용 도메인으로 전환한다.

### Important Note For This Repo

현재 `apps/docs`는 콘텐츠 저장소/NAS와 다른 곳에 배포될 수 있다.

이 경우에는 상대 경로:

```txt
/media/feed/pna/permissions.png
```

보다 **절대 canonical URL**이 더 현실적이다.

예:

```txt
https://assets.example.com/feed/pna/permissions.png
```

이유:

- 브라우저는 현재 페이지의 origin 기준으로 `/media/*`를 요청한다
- 하지만 docs 앱과 NAS가 다른 인프라에 있으면, `/media/*`를 현재 앱 서버가 받아버릴 수 있다
- 따라서 현재 구조에서는 `/media/*`보다 `assets.example.com/*` 같은 별도 asset origin이 더 명확하다

## Normalization Rule

프론트 또는 backend normalize 단계에서는 원본 절대 URL을 그대로 쓰지 않고, canonical media path로 변환하는 기준이 필요하다.

예:

```txt
https://public-content.example.com/feed/pna/permissions.png
-> https://public-content.example.com/feed/pna/permissions.png
```

또는:

```txt
https://public-content.example.com/feed/pna/permissions.png
-> https://assets.example.com/feed/pna/permissions.png
```

이 변환은 아래 중 한 곳에서 수행할 수 있다.

- FastAPI HTML 생성 단계
- renderer/HTML post-process 단계
- 프론트 `normalizeRemoteContent` 단계

권장 우선순위는:

1. backend에서 canonical URL로 내려주기
2. 프론트는 예외 fallback만 처리

이다.

## Recommended Configuration

현재 레포 기준 가장 추천하는 설정안은 아래다.

### Immediate Recommended

- canonical asset URL:
  - `https://public-content.example.com/{channel}/{slug}/{file}`
- backend:
  - 현재 공개 도메인을 그대로 유지하되, `ASSET_CANONICAL_PREFIX` 설정으로만 제어
- 프론트:
  - backend가 내려준 절대 URL을 그대로 렌더

### Future Recommended

- canonical asset URL:
  - `https://assets.example.com/{channel}/{slug}/{file}`
- backend:
  - 원본 NAS/스토리지 URL을 위 canonical URL로 변환
- NAS reverse proxy:
  - `assets.example.com/*` -> 실제 storage/NAS asset path
- 프론트:
  - 절대 canonical URL만 렌더

### Why Asset-Origin Is Better Than `/media/*`

- `apps/docs`가 다른 서버에 배포되어 있어도 동작이 명확하다
- 현재 페이지 origin에 의존하지 않는다
- CDN/캐시 계층을 붙이기 쉽다
- 이미지 요청이 docs 앱 서버를 다시 거치지 않아도 된다

## NAS Reverse Proxy Configuration

### Immediate

기존 공개 도메인을 그대로 운영한다.

예:

```txt
https://public-content.example.com/feed/pna/permissions.png
```

이 단계에서는 새 자산 전용 도메인을 아직 만들지 않아도 된다.

### Future

권장 host:

```txt
assets.example.com
```

권장 공개 URL 예:

```txt
https://assets.example.com/feed/pna/permissions.png
```

실제 내부 대상 예:

```txt
http://<nas-or-storage-host>:8082/feed/pna/permissions.png
```

즉 reverse proxy 계층에서:

- source host
  - `assets.example.com`
- source path
  - `/`
- destination host
  - NAS asset server
- destination path
  - `/`

형태로 맞춘다.

이 방식이면 backend는 단순히:

```txt
https://assets.example.com/feed/pna/permissions.png
```

를 만들어 내려주기만 하면 된다.

## FastAPI Fallback Configuration

reverse proxy를 아직 준비하지 못했다면, 임시로 FastAPI가 `/media/*`를 직접 서빙하는 fallback 안도 가능하다.

예:

```txt
GET /media/{asset_path:path}
```

역할:

- canonical asset URL을 받음
- 내부 storage 파일을 읽어 응답

장점:

- 구현 시작이 빠름

단점:

- 앱 서버를 계속 경유하게 됨
- 정적 자산 캐시/성능 면에서 reverse proxy보다 불리함

즉 FastAPI `/media/*`는 **임시 fallback**으로는 괜찮지만, 장기 기본안은 `assets.example.com` reverse proxy가 더 적합하다.

### Recommended Python Placement

현재 `FastAPI + renderer sidecar` 구조라면, Python 쪽 변환 위치는 아래가 가장 자연스럽다.

1. markdown 파일 읽기
2. sidecar로 HTML 렌더
3. FastAPI에서 HTML 안의 `img/src`, `source/srcset`을 canonical asset path로 변환
4. 최종 HTML 응답

즉:

- renderer
  - markdown -> HTML
- FastAPI
  - asset URL canonicalization

으로 나누는 편이 책임이 더 분명하다.

권장 파일 분리 예:

- `app/assets.py`
  - asset URL 변환 전담
- `app/main.py`
  - `render_markdown_via_sidecar(body)` 다음에 `normalize_asset_urls_in_html(html)` 호출

예를 들어:

```python
html = render_markdown_via_sidecar(body)
html = normalize_asset_urls_in_html(html)
```

처럼 연결한다.

## Security Notes

이 전략은 “이미지 URL을 숨긴다”기보다, “원본 저장소 주소를 감추고 canonical URL만 노출한다”에 가깝다.

즉 다음은 여전히 성립한다.

- 브라우저 개발자 도구에는 최종 요청 URL이 보인다
- 완전 비공개 자산이라면 공개 이미지 URL 전략만으로는 충분하지 않다

그래도 이 전략으로 얻는 이점은 크다.

- NAS 실주소 숨김
- 인프라 교체 유연성
- 브랜딩된 URL 구조
- 캐시/프록시 정책 일원화

## Recommended Next Step

현재 레포 기준 다음 단계는 아래가 자연스럽다.

1. 지금은 `ASSET_CANONICAL_PREFIX=https://public-content.example.com`로 운영
2. backend 또는 HTML normalize 단계에서 자산 URL 변환 책임을 분리
3. 추후 `assets.example.com` 준비 후 env만 교체
4. NAS reverse proxy에서 `assets.example.com/*`를 실제 storage path로 전달

즉 당장은 기존 공개 도메인을 유지하고, 장기적으로는 `assets.example.com/...` 같은 asset 전용 canonical URL로 전환하는 2단계 전략을 권장한다.

## Related Docs

- [docs-content-authoring-pipeline.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-authoring-pipeline.md)
- [fastapi-content-api-reference.md](/Users/coder/Desktop/project/web-tech/docs/runbooks/fastapi-content-api-reference.md)
- [nas-reverse-proxy-security-checklist.md](/Users/coder/Desktop/project/web-tech/docs/runbooks/nas-reverse-proxy-security-checklist.md)
