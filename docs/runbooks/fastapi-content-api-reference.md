# FastAPI Content API Reference

## Purpose

`apps/docs`가 읽는 원격 콘텐츠 서버를 `FastAPI + markdown files` 기반으로 운영할 때 필요한 최소 구성을 정리한다.

이 문서는 아래를 한 번에 다룬다.

- `requirements.txt`
- `docker-compose.yml`
- 예시 `posts/` 폴더 구조
- `FastAPI` 앱 예시
- `curl` 검증 포인트

## Related Architecture

현재 문서는 `FastAPI 단독` 기준의 최소 운영 예시를 설명한다.

다만 코드 블록 품질을 로컬 MDX와 같은 계열로 맞추고 싶다면, 별도 `Node sidecar + Shiki` 구조를 함께 검토하는 것이 좋다.

관련 기준 문서:

- `docs/architecture/docs-remote-code-highlighting-sidecar.md`

sidecar 구조를 쓰는 경우에는:

- `FastAPI`는 파일 IO, 인증, 메타데이터, renderer 호출만 담당
- markdown -> HTML + Shiki highlighting은 `renderer` 컨테이너가 담당

하는 방식이 권장된다.

또한 프론트에서는 계약 문서만 신뢰하지 말고, 원격 payload를 받을 때 `zod` 같은 런타임 검증으로:

- `markdownPath`가 `feed/pna` 형태인지
- `slug`가 leaf slug인지
- `title`이 비어 있지 않은지

를 한 번 더 확인하는 편이 안전하다.

실제 예시 파일 세트는 아래 경로에 정리되어 있다.

- `docs/examples/remote-content-sidecar/`

## Recommended Directory Layout

```txt
blog-content/
  app/
    assets.py
    auth.py
    config.py
    content.py
    main.py
    renderer.py
  renderer/
    package.json
    server.mjs
    Dockerfile
  content/
    assets/
      web/
        rendering-pipeline/
          hero.webp
      feed/
        weekly-note-001/
          hero.webp
    posts/
      web/
        rendering-pipeline.md
      feed/
        weekly-note-001.md
      ui-ux/
        blocked-aria-hidden.md
      mobile/
        touch-targets.md
  Dockerfile
  docker-compose.yml
  requirements.txt
  .env
```

## Example `posts/` Structure

```txt
content/posts/
  web/
    rendering-pipeline.md
    nextjs-routing.md
  feed/
    weekly-note-001.md
  ui-ux/
    blocked-aria-hidden.md
    readable-interfaces.md
  mobile/
    touch-targets.md
```

예시 asset 구조:

```txt
content/assets/
  web/
    rendering-pipeline/
      hero.webp
      diagram-01.png
  feed/
    weekly-note-001/
      hero.webp
```

## File Naming Policy

`posts`와 `assets`는 같은 규칙을 쓰지 않는 편이 더 낫다.

권장 기준:

- `posts`
  - `content/posts/{channel}/{article-slug}.md`
- `assets`
  - `content/assets/{channel}/{article-slug}/...`

예:

```txt
content/posts/feed/pna.md
content/assets/feed/pna/hero.webp
content/assets/feed/pna/permissions.png
```

즉 아래 구조는 피한다.

```txt
content/posts/feed/pna/pna.md
```

대신 아래 구조를 기준으로 본다.

```txt
content/posts/feed/pna.md
```

### Markdown File Name Rule

`posts` 아래의 markdown 파일 이름은 곧 leaf slug가 된다.

권장 규칙:

- 소문자만 사용
- 단어 구분은 `-`만 사용
- 공백 금지
- `_` 금지
- 대문자 금지
- 확장자는 `.md`

정규식 기준:

```txt
^[a-z0-9]+(?:-[a-z0-9]+)*\.md$
```

좋은 예:

- `pna.md`
- `rendering-pipeline.md`
- `blocked-aria-hidden.md`

피해야 할 예:

- `PNA.md`
- `feed-pna.md`
- `pna_test.md`
- `pna final.md`

### Why Posts And Assets Differ

`posts`는 API 계약과 공개 URL을 단순하게 유지하는 것이 더 중요하다.

그래서:

- `content/posts/feed/pna.md`
- `markdownPath: "feed/pna"`
- `slug: "pna"`
- `id: "feed/pna"`

처럼 바로 대응되는 구조가 더 적합하다.

반면 `assets`는 문서 하나에 여러 파일이 종속될 수 있으므로, slug 폴더를 두는 편이 더 자연스럽다.

권장 규칙:

- 공개 문서 URL은 `/docs/{channel}/{articleSlug}` 형태로 고정한다.
  - `feed/weekly-note-001` -> `/docs/feed/weekly-note-001`
  - `web/rendering-pipeline` -> `/docs/web/rendering-pipeline`
  - `ui-ux/blocked-aria-hidden` -> `/docs/ui-ux/blocked-aria-hidden`
- `markdownPath`는 확장자 없는 상대 경로로 반환
  - `web/rendering-pipeline`
  - `feed/weekly-note-001`
  - `ui-ux/blocked-aria-hidden`
  - `mobile/touch-targets`
- `slug`는 leaf slug만 쓴다.
  - 예: `rendering-pipeline`
  - 예: `blocked-aria-hidden`
- `slug`에 channel prefix를 다시 넣지 않는다.
  - 나쁜 예: `feed-pna`
  - 좋은 예: `slug: "pna"` + `markdownPath: "feed/pna"`
- `id`는 전역에서 유일하게 만든다.
  - 예: `web/rendering-pipeline`
  - 예: `ui-ux/blocked-aria-hidden`

## Route And Metadata Policy

FastAPI는 아래 의미를 기준으로 응답 값을 만든다.

- `markdownPath`
  - 실제 본문 파일 위치를 나타내는 상대 경로
  - 예: `feed/pna`
- `slug`
  - 채널을 제외한 leaf slug
  - 예: `pna`
- `id`
  - 전역 유일 식별자
  - `markdownPath` 그대로 쓰는 방식을 권장
  - 예: `feed/pna`

즉 아래처럼 정리하는 것이 권장이다.

```json
{
  "id": "feed/pna",
  "slug": "pna",
  "markdownPath": "feed/pna"
}
```

이 구조를 쓰면:

- 본문 API는 `/posts/feed/pna`
- 공개 상세 URL은 `/docs/feed/pna`

로 자연스럽게 이어진다.

## Example Frontmatter

```md
---
title: "ARIA에 대해 깊게 알아봅시다"
slug: "blocked-aria-hidden"
date: "2025-12-30"
summary: "Shadcn Drawer 컴포넌트 사용 시, ARIA Warning"
thumbnail: "ui-ux/blocked-aria-hidden/hero.webp"
authorName: "HoJeong Im"
authorRole: "Frontend Engineer"
readMinutes: 8
topicLabel: "ACCESSIBILITY"
---

## ARIA란?

...
```

`thumbnail`은 절대 URL이어도 되고, `ui-ux/blocked-aria-hidden/hero.webp`처럼
`content source` 기준 상대 경로여도 된다. 다만 운영 안정성을 위해서는 backend가
목록 응답에서 이미 절대 URL로 정규화해 내려주는 편이 더 좋다.

## `requirements.txt`

```txt
fastapi
uvicorn[standard]
mistune
PyYAML
httpx
```

설명:

- `fastapi`
  - API 서버
- `uvicorn[standard]`
  - 실행 서버
- `mistune`
  - markdown -> HTML 렌더링
- `PyYAML`
  - frontmatter 파싱
- `httpx`
  - sidecar 호출

## Example `docker-compose.yml`

비밀값을 compose 파일에 직접 적지 않고 `.env`를 참조하는 쪽을 권장한다.

```yaml
services:
  api:
    build: .
    ports:
      - "8000:80"
    volumes:
      - ./app:/code/app
      - /volume1/data/blog/content:/app/content
    env_file:
      - .env
    environment:
      - SHIKI_RENDERER_URL=http://renderer:3000/render
    command: uvicorn app.main:app --host 0.0.0.0 --port 80
    depends_on:
      - renderer

  renderer:
    build:
      context: ./renderer
    expose:
      - "3000"
```

같은 디렉터리의 `.env` 예시:

```env
CONTENT_API_TOKEN=replace-with-shared-secret
SHIKI_RENDERER_URL=http://renderer:3000/render
```

## Example `Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY content ./content

EXPOSE 80

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]
```

## Example `app/main.py`

```python
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.responses import HTMLResponse
from pathlib import Path
import hmac
import logging
import mistune
import os
import re
import yaml

app = FastAPI()
logger = logging.getLogger(__name__)

CONTENT_DIR = Path("/app/content/posts").resolve()
CONTENT_API_TOKEN = os.getenv("CONTENT_API_TOKEN", "")

markdown = mistune.create_markdown(
    renderer="html",
    plugins=["strikethrough", "table", "task_lists"],
)

def verify_content_token(authorization: str | None = Header(default=None)):
    if not CONTENT_API_TOKEN:
        logger.error("CONTENT_API_TOKEN is not configured")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )

    scheme, _, token = (authorization or "").partition(" ")
    is_valid = (
        scheme.lower() == "bearer"
        and bool(token)
        and hmac.compare_digest(token, CONTENT_API_TOKEN)
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )

def parse_frontmatter(raw_text: str) -> tuple[dict, str]:
    if not raw_text.startswith("---"):
        return {}, raw_text

    parts = raw_text.split("---", 2)
    if len(parts) < 3:
        return {}, raw_text

    _, frontmatter_text, body = parts

    try:
        data = yaml.safe_load(frontmatter_text) or {}
    except Exception:
        data = {}

    return data, body.strip()

def infer_title(markdown_path: str) -> str:
    leaf = markdown_path.split("/")[-1]
    spaced = re.sub(r"[-_]+", " ", leaf).strip()
    return spaced.title()

def infer_summary(body: str) -> str:
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", body)
    text = re.sub(r"\[[^\]]+\]\([^)]+\)", "", text)
    text = re.sub(r"[#>*`-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:140]

def infer_topic_label(markdown_path: str) -> str:
    if markdown_path.startswith("web/"):
        return "WEB"
    if markdown_path.startswith("feed/"):
        return "ENGINEERING"
    if markdown_path.startswith("ui-ux/"):
        return "UI/UX"
    if markdown_path.startswith("mobile/"):
        return "MOBILE"
    return "ENGINEERING"

def normalize_thumbnail_url(thumbnail: str | None) -> str | None:
    if not thumbnail:
        return None

    value = thumbnail.strip()

    if not value:
        return None

    if value.startswith(("http://", "https://")):
        return value

    asset_base_url = os.getenv("ASSET_BASE_URL", "").strip()

    if not asset_base_url:
        return value

    return f"{asset_base_url.rstrip('/')}/{value.lstrip('/')}"

def build_post_meta(file_path: Path):
    relative = file_path.relative_to(CONTENT_DIR).with_suffix("")
    markdown_path = relative.as_posix()
    leaf_slug = markdown_path.split("/")[-1]

    raw_text = file_path.read_text(encoding="utf-8")
    frontmatter, body = parse_frontmatter(raw_text)

    title = frontmatter.get("title") or infer_title(markdown_path)
    summary = frontmatter.get("summary") or infer_summary(body)

    return {
        "id": markdown_path,
        "slug": frontmatter.get("slug") or leaf_slug,
        "title": title,
        "summary": summary,
        "date": frontmatter.get("date", ""),
        "markdownPath": markdown_path,
        "thumbnail": normalize_thumbnail_url(frontmatter.get("thumbnail")),
        "authorName": frontmatter.get("authorName") or frontmatter.get("author"),
        "authorRole": frontmatter.get("authorRole") or frontmatter.get("role"),
        "readMinutes": frontmatter.get("readMinutes") or frontmatter.get("readTime"),
        "topicLabel": frontmatter.get("topicLabel") or frontmatter.get("topic") or infer_topic_label(markdown_path),
    }

@app.get("/api/posts", dependencies=[Depends(verify_content_token)])
def read_posts():
    files = sorted(CONTENT_DIR.rglob("*.md"))
    results = [build_post_meta(file_path) for file_path in files]
    return {"results": results}

@app.get(
    "/posts/{markdown_path:path}",
    response_class=HTMLResponse,
    dependencies=[Depends(verify_content_token)],
)
def get_post(markdown_path: str):
    safe_path = markdown_path.strip("/")

    if not safe_path:
        raise HTTPException(status_code=404, detail="Post not found")

    file_path = (CONTENT_DIR / f"{safe_path}.md").resolve()

    if CONTENT_DIR not in file_path.parents:
        raise HTTPException(status_code=404, detail="Post not found")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Post not found")

    md = file_path.read_text(encoding="utf-8")
    _, body = parse_frontmatter(md)
    html = markdown(body)

    return f\"\"\"
    <!doctype html>
    <html>
      <body>
        <article>
          {html}
        </article>
      </body>
    </html>
    \"\"\"
```

위 `build_post_meta()`에서 중요한 점:

- `id`는 `markdown_path`를 그대로 쓴다.
- `slug`는 마지막 leaf segment만 쓴다.
- `feed-pna`처럼 channel이 포함된 slug는 만들지 않는다.

## Example Response

`GET /api/posts`

```json
{
  "results": [
    {
      "id": "web/rendering-pipeline",
      "slug": "rendering-pipeline",
      "title": "Rendering Pipeline",
      "summary": "브라우저 렌더링 파이프라인 정리",
      "date": "2026-05-08",
      "markdownPath": "web/rendering-pipeline",
      "authorName": "HoJeong Im",
      "authorRole": "Frontend Engineer",
      "readMinutes": 8,
      "topicLabel": "WEB"
    }
  ]
}
```

## Validation Commands

토큰 없이:

```bash
curl -i https://your-domain/api/posts
```

토큰 포함:

```bash
curl -i https://your-domain/api/posts \
  -H "Authorization: Bearer YOUR_CONTENT_API_TOKEN"
```

본문 endpoint 확인:

```bash
curl -i https://your-domain/posts/web/rendering-pipeline \
  -H "Authorization: Bearer YOUR_CONTENT_API_TOKEN"
```

내부망 주소 확인:

```bash
curl -i http://192.168.0.7:8000/api/posts \
  -H "Authorization: Bearer YOUR_CONTENT_API_TOKEN"
```

## Notes

- `apps/docs`는 `markdownPath`에 슬래시가 들어간 상대 경로를 지원한다.
- `slug`는 public URL 전체가 아니라 마지막 leaf segment라고 보는 편이 좋다.
- `id`는 전역 유일 값으로 유지하고, `markdownPath`를 그대로 쓰는 방식을 권장한다.
- `CONTENT_API_TOKEN`은 compose 파일에 직접 적지 말고 `.env`나 secret store를 통해 주입한다.
