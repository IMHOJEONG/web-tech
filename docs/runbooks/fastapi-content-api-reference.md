# FastAPI Content API Reference

## Purpose

`apps/docs`가 읽는 원격 콘텐츠 서버를 `FastAPI + markdown files` 기반으로 운영할 때 필요한 최소 구성을 정리한다.

이 문서는 아래를 한 번에 다룬다.

- `requirements.txt`
- `docker-compose.yml`
- 예시 `posts/` 폴더 구조
- `FastAPI` 앱 예시
- `curl` 검증 포인트

## Recommended Directory Layout

```txt
blog-content/
  app/
    main.py
  content/
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

권장 규칙:

- `markdownPath`는 확장자 없는 상대 경로로 반환
  - `web/rendering-pipeline`
  - `feed/weekly-note-001`
  - `ui-ux/blocked-aria-hidden`
  - `mobile/touch-targets`
- `slug`는 전역에서 유일하게 만든다.
  - 예: `web-rendering-pipeline`
  - 예: `uiux-blocked-aria-hidden`

## Example Frontmatter

```md
---
title: "ARIA에 대해 깊게 알아봅시다"
slug: "uiux-blocked-aria-hidden"
date: "2025-12-30"
summary: "Shadcn Drawer 컴포넌트 사용 시, ARIA Warning"
thumbnail: "shadcn/thumbnail.webp"
authorName: "HoJeong Im"
authorRole: "Frontend Engineer"
readMinutes: 8
topicLabel: "ACCESSIBILITY"
---

## ARIA란?

...
```

## `requirements.txt`

```txt
fastapi
uvicorn[standard]
mistune
PyYAML
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

## Example `docker-compose.yml`

비밀값을 compose 파일에 직접 적지 않고 `.env`를 참조하는 쪽을 권장한다.

```yaml
services:
  api:
    build: .
    ports:
      - "8000:80"
    environment:
      - ENV=development
      - CONTENT_API_TOKEN=${CONTENT_API_TOKEN}
    command: uvicorn app.main:app --host 0.0.0.0 --port 80
```

같은 디렉터리의 `.env` 예시:

```env
CONTENT_API_TOKEN=replace-with-shared-secret
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

def make_slug(markdown_path: str) -> str:
    return markdown_path.replace("/", "-").replace("_", "-").lower()

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

def build_post_meta(file_path: Path):
    relative = file_path.relative_to(CONTENT_DIR).with_suffix("")
    markdown_path = relative.as_posix()
    slug = make_slug(markdown_path)

    raw_text = file_path.read_text(encoding="utf-8")
    frontmatter, body = parse_frontmatter(raw_text)

    title = frontmatter.get("title") or infer_title(markdown_path)
    summary = frontmatter.get("summary") or infer_summary(body)

    return {
        "id": slug,
        "slug": frontmatter.get("slug") or slug,
        "title": title,
        "summary": summary,
        "date": frontmatter.get("date", ""),
        "markdownPath": markdown_path,
        "thumbnail": frontmatter.get("thumbnail"),
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

## Example Response

`GET /api/posts`

```json
{
  "results": [
    {
      "id": "web-rendering-pipeline",
      "slug": "web-rendering-pipeline",
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
- `slug`는 가능하면 채널 prefix를 포함해 전역 유일하게 유지한다.
- `CONTENT_API_TOKEN`은 compose 파일에 직접 적지 말고 `.env`나 secret store를 통해 주입한다.
