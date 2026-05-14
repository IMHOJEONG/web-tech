# Remote Code Highlighting Sidecar

## 목적

이 문서는 원격 콘텐츠를 읽는 `apps/docs`에서, 코드 블록 품질을 로컬 MDX와 비슷한 수준으로 맞추기 위한 `Shiki sidecar` 구조를 정리한다.

핵심 목표는 두 가지다.

1. 로컬 MDX와 원격 문서가 같은 계열의 코드 블록 경험을 제공해야 한다.
2. 원격 문서 코드 블록도 light/dark theme 기준이 프론트와 일관되어야 한다.

## 현재 문제

현재 코드 블록 렌더링 경로는 둘로 나뉜다.

- 로컬 문서
  - Next.js MDX 파이프라인
  - `@shikijs/rehype`
- 원격 문서
  - FastAPI가 HTML을 반환
  - 프론트는 `dangerouslySetInnerHTML`로 그대로 렌더

즉 `apps/docs/lib/shiki-options.js`의 변경은 로컬 MDX에는 영향을 주지만, 원격 HTML 코드 블록에는 영향을 주지 않는다.

이 상태에서는:

- 로컬 문서 코드 블록 품질
- 원격 문서 코드 블록 품질

이 쉽게 벌어질 수 있다.

## 결정

원격 문서 코드 블록 품질이 중요하다면, 원격 문서도 `Shiki` 계열 렌더링을 사용하는 것이 맞다.

다만 FastAPI 안에서 직접 Shiki를 쓰기보다, 역할을 아래처럼 나누는 구조를 기본안으로 본다.

- `FastAPI`
  - 인증
  - frontmatter 읽기
  - 목록 메타데이터 제공
  - markdown 파일 읽기
  - sidecar 호출 orchestration
- `Node sidecar`
  - markdown -> HTML 렌더링
  - Shiki syntax highlighting
  - light/dark dual theme 마크업 생성

## 왜 Sidecar인가

### 1. Shiki와 현재 프론트 방향을 그대로 재사용할 수 있다

로컬 MDX는 이미 `Shiki`를 기준으로 정리되어 있다.

따라서 원격 문서도:

- 같은 theme 이름
- 같은 `.shiki` class 기반 스타일
- 같은 token 계열

을 쓰는 편이 전체 경험이 자연스럽다.

### 2. Python only 대안보다 결과 품질이 더 잘 맞는다

`Pygments`는 FastAPI 안에서 바로 쓸 수 있는 현실적인 대안이지만:

- 결과 톤이 달라질 수 있고
- 프론트 Shiki 스타일과 1:1로 맞추기 어렵다

반면 sidecar는 원격 문서도 로컬 MDX와 같은 계열로 끌어올리기 쉽다.

### 3. 렌더링 책임을 명확히 분리할 수 있다

`FastAPI`는 파일 IO와 인증, 메타데이터에 집중하고:

- markdown parsing
- code highlighting
- HTML generation

은 sidecar가 맡는다.

즉 서비스 책임이 더 분명해진다.

## 권장 아키텍처

### 런타임 구성

1. `apps/docs`
   - `/api/posts` 또는 `/posts/{markdownPath}`를 FastAPI에 요청
2. `FastAPI`
   - markdown 파일 읽기
   - sidecar에 markdown 본문 전달
3. `Node sidecar`
   - markdown 전체를 HTML로 변환
   - fenced code block에 Shiki 적용
   - HTML 반환
4. `FastAPI`
   - sidecar 응답 HTML을 그대로 본문 응답으로 전달

### 권장 책임 분리

#### FastAPI

- `GET /api/posts`
- `GET /posts/{markdownPath}`
- token 인증
- frontmatter 파싱
- 콘텐츠 경로 해석
- HTML sanitize 직전 또는 직후 보조 처리

#### Node sidecar

- markdown parsing
- `remark-gfm`
- `remark-rehype`
- `@shikijs/rehype`
- `rehype-stringify`

## Remote HTML Sanitize Policy

원격 HTML에 Shiki가 적용되더라도, 프론트에서는 sanitize를 완전히 풀지 않는 편이 맞다.

이유:

- `style`을 전부 허용하면 원격 문서가 레이아웃을 깨뜨릴 수 있다.
- `position`, `z-index`, `transform`, `width` 같은 값이 페이지 전체 UX를 오염시킬 수 있다.
- 원격 콘텐츠는 로컬 MDX보다 신뢰 경계가 약하므로, 허용 범위는 더 좁게 가져가야 한다.

현재 기준으로는:

- `pre`
- `code`
- `span`

정도에만 제한적으로 `style`을 허용하는 편이 현실적이다.

즉 목표는 `Shiki 토큰 스타일 보존`이지, `원격 HTML 전체에 임의 스타일 허용`이 아니다.

### 왜 이렇게 좁게 열어야 하는가

Shiki는 보통 아래 정보를 코드 블록 HTML에 싣는다.

- `pre.shiki`의 배경색과 기본 글자색
- 내부 `span`의 token 색상
- 필요할 때만 `font-style`, `font-weight`, `text-decoration`

따라서 코드 하이라이팅을 살리려면:

- `.shiki`
- `span[style]`

같은 최소 범위만 보존해도 충분한 경우가 많다.

## Why Italic Appears

코드 블록에서 일부 토큰이 약간 기울어져 보이는 것은 이상 동작이 아니라, 대개 theme가 의도적으로 준 token 스타일이다.

예를 들면:

- comment
- emphasis 성격의 토큰
- 일부 language grammar token

은 theme에 따라 `font-style: italic`이 들어갈 수 있다.

즉 기울임체의 원인은 보통 아래 둘 중 하나다.

1. `github-dark` 같은 theme가 특정 토큰에 italic을 부여함
2. Shiki가 해당 token span에 `--shiki-*-font-style` 값을 실어 내려줌

반대로, 모든 token에 항상 italic 변수가 있는 것은 아니다.

그래서 프론트 CSS는:

- 값이 있으면 그 italic을 사용하고
- 값이 없으면 `inherit`

으로 fallback 하는 편이 안전하다.

## Compose 기준 운영안

실무적으로는 `renderer`도 별도 Dockerfile을 두는 편이 더 낫다.

이유:

- 컨테이너 시작 때마다 `npm install`을 다시 하지 않아도 된다.
- 이미지 레이어 캐시를 활용할 수 있다.
- sidecar 재시작 속도와 배포 재현성이 더 좋아진다.
- `api`와 `renderer`의 런타임 책임이 더 명확해진다.

권장 `docker-compose.yml` 예시는 아래와 같다.

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

이 구조에서는:

- `renderer`는 외부에 직접 공개하지 않는다.
- `api`만 외부에서 받고, `renderer`는 compose 내부 네트워크에서만 통신한다.
- FastAPI는 `SHIKI_RENDERER_URL=http://renderer:3000/render`로 sidecar를 호출한다.

## 구현 초안

아래 4개 코드는 `FastAPI + Node sidecar + Shiki` 구조를 바로 시작할 수 있는 최소 기준 예시다.

### 1. `renderer/package.json`

```json
{
  "name": "heapforge-shiki-renderer",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch server.mjs",
    "start": "node server.mjs"
  },
  "dependencies": {
    "@shikijs/rehype": "^3.14.0",
    "fastify": "^5.3.3",
    "rehype-raw": "^7.0.0",
    "rehype-stringify": "^10.0.1",
    "remark-gfm": "^4.0.1",
    "remark-parse": "^11.0.0",
    "remark-rehype": "^11.1.2",
    "unified": "^11.0.5"
  }
}
```

### 2. `renderer/server.mjs`

```js
import Fastify from "fastify";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";

const app = Fastify({
  logger: true,
});

const shikiOptions = {
  themes: {
    light: "github-light",
    dark: "github-dark",
  },
};

app.get("/health", async () => {
  return { ok: true };
});

app.post("/render", async (request, reply) => {
  const body = request.body ?? {};
  const markdown = typeof body.markdown === "string" ? body.markdown : "";

  if (!markdown.trim()) {
    reply.code(400);
    return { message: "markdown is required" };
  }

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeShiki, shikiOptions)
    .use(rehypeStringify)
    .process(markdown);

  return {
    html: String(file),
  };
});

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

await app.listen({ host, port });
```

### 3. `renderer/Dockerfile`

```dockerfile
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* ./

RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; \
    else npm install; \
    fi

COPY . .

EXPOSE 3000

CMD ["node", "server.mjs"]
```

### 4. FastAPI에서 renderer 호출하는 코드

`FastAPI`는 markdown 파일을 직접 HTML로 렌더하지 않고, sidecar에 markdown를 넘긴 뒤 HTML만 받아 응답하는 구조를 권장한다.

```python
from fastapi import HTTPException
import httpx
import os

SHIKI_RENDERER_URL = os.getenv("SHIKI_RENDERER_URL", "http://renderer:3000/render")

def render_markdown_via_sidecar(markdown_text: str) -> str:
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                SHIKI_RENDERER_URL,
                json={"markdown": markdown_text},
            )
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Failed to render remote content") from exc

    payload = response.json()
    html = payload.get("html")

    if not isinstance(html, str) or not html.strip():
        raise HTTPException(status_code=502, detail="Failed to render remote content")

    return html
```

예를 들어 `/posts/{markdownPath}`에서는:

1. markdown 파일 읽기
2. frontmatter 제거
3. `render_markdown_via_sidecar(body)` 호출
4. 반환된 HTML을 `HTMLResponse`로 응답

순서로 연결하면 된다.

## FastAPI 파일 분리 권장안

실제 운영에서는 `main.py` 하나에 모든 로직을 넣기보다, 아래 정도로 나누는 편이 유지보수에 더 유리하다.

```txt
app/
  main.py
  config.py
  auth.py
  content.py
  renderer.py
```

역할은 이렇게 본다.

- `config.py`
  - env 읽기
  - 경로/URL 상수 정의
- `auth.py`
  - `Authorization` 검증
- `content.py`
  - frontmatter 파싱
  - slug/summary/topic 계산
  - markdown 파일 탐색
- `renderer.py`
  - sidecar 호출
- `main.py`
  - FastAPI 라우트 정의

### `app/config.py`

```python
from pathlib import Path
import os

CONTENT_DIR = Path("/app/content/posts").resolve()
CONTENT_API_TOKEN = os.getenv("CONTENT_API_TOKEN", "")
SHIKI_RENDERER_URL = os.getenv(
    "SHIKI_RENDERER_URL",
    "http://renderer:3000/render",
)
```

### `app/auth.py`

```python
import hmac
import logging

from fastapi import Header, HTTPException, status

from .config import CONTENT_API_TOKEN

logger = logging.getLogger(__name__)


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
```

### `app/content.py`

```python
from pathlib import Path
import re
import yaml

from .config import CONTENT_DIR


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


def resolve_markdown_file(markdown_path: str) -> Path:
    safe_path = markdown_path.strip("/")

    if not safe_path:
        raise FileNotFoundError("Empty markdown path")

    file_path = (CONTENT_DIR / f"{safe_path}.md").resolve()

    if CONTENT_DIR not in file_path.parents:
        raise FileNotFoundError("Invalid markdown path")

    if not file_path.exists():
        raise FileNotFoundError("Markdown file not found")

    return file_path


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
        "thumbnail": frontmatter.get("thumbnail"),
        "authorName": frontmatter.get("authorName") or frontmatter.get("author"),
        "authorRole": frontmatter.get("authorRole") or frontmatter.get("role"),
        "readMinutes": frontmatter.get("readMinutes") or frontmatter.get("readTime"),
        "topicLabel": frontmatter.get("topicLabel")
        or frontmatter.get("topic")
        or infer_topic_label(markdown_path),
    }
```

### `app/renderer.py`

```python
import logging

import httpx
from fastapi import HTTPException

from .config import SHIKI_RENDERER_URL

logger = logging.getLogger(__name__)


def render_markdown_via_sidecar(markdown_text: str) -> str:
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                SHIKI_RENDERER_URL,
                json={"markdown": markdown_text},
            )
            response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.exception("Failed to call renderer sidecar")
        raise HTTPException(
            status_code=502,
            detail="Failed to render remote content",
        ) from exc

    payload = response.json()
    html = payload.get("html")

    if not isinstance(html, str) or not html.strip():
        raise HTTPException(
            status_code=502,
            detail="Failed to render remote content",
        )

    return html
```

### `app/main.py`

```python
from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import HTMLResponse

from .auth import verify_content_token
from .config import CONTENT_DIR
from .content import build_post_meta, parse_frontmatter, resolve_markdown_file
from .renderer import render_markdown_via_sidecar

app = FastAPI()


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
    try:
        file_path = resolve_markdown_file(markdown_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Post not found")

    raw_text = file_path.read_text(encoding="utf-8")
    _, body = parse_frontmatter(raw_text)
    html = render_markdown_via_sidecar(body)

    return f"""
    <!doctype html>
    <html>
      <body>
        <article>
          {html}
        </article>
      </body>
    </html>
    """
```

위 구조 기준이면, 질문하셨던 `render_markdown_via_sidecar(body)` 호출 위치는:

- `app/renderer.py`에 helper 함수 정의
- `app/main.py`의 `get_post()` 내부에서 호출

로 정리된다.

## 왜 markdown 전체 렌더를 맡기는가

sidecar에 `code fence만 따로` 보내는 방식도 가능하지만, 현재 기준으로는 `markdown 전체 -> HTML` 렌더가 더 적합하다.

이유:

- code block만 후처리하면 문단/리스트/헤딩/이미지와 다시 합치는 로직이 복잡해진다.
- caption, inline code, heading anchor 같은 후속 규칙도 한 곳에서 맞추기 어렵다.
- 전체 markdown을 한 번에 HTML로 만들면 렌더링 규칙이 더 일관된다.

## 권장 sidecar 스택

- `unified`
- `remark-parse`
- `remark-gfm`
- `remark-rehype`
- `@shikijs/rehype`
- `rehype-stringify`

theme는 현재 `apps/docs/lib/shiki-options.js`와 같은 기준을 우선한다.

예:

- light: `github-light`
- dark: `github-dark`

## 데이터 흐름 예시

### 목록 API

FastAPI:

- `content/posts/**` 탐색
- frontmatter 메타 반환
- 본문 전체 HTML은 아직 포함하지 않음

### 본문 API

1. FastAPI가 `content/posts/feed/pna.md` 읽기
2. markdown 문자열을 sidecar로 전달
3. sidecar가 HTML 반환
4. FastAPI가 그 HTML을 `/posts/feed/pna` 응답으로 전달

## 운영 고려 사항

### 장점

- 코드 블록 품질이 높다
- 로컬/원격 코드 경험을 통일하기 쉽다
- light/dark theme를 같은 기준으로 관리할 수 있다

### 단점

- Node 런타임이 하나 더 필요하다
- 도커 compose와 헬스체크 구성이 조금 더 복잡해진다
- sidecar 장애 시 본문 렌더 실패 경로를 따로 고려해야 한다

## 실패 처리 권장안

- sidecar 실패 시:
  - 원문 markdown을 그대로 노출하지는 않는다
  - fallback HTML 렌더 또는 명시적 오류 응답을 선택한다
- 운영 초기에는 FastAPI 쪽에서:
  - sidecar timeout
  - 재시도 여부
  - fallback policy
    를 명확히 둔다

## 현재 추천

현재 프로젝트 기준으로는:

- 로컬 MDX: Shiki 유지
- 원격 문서: `FastAPI + Node sidecar + Shiki`

구조가 가장 적합하다.

즉 `원격 문서도 코드 블록만큼은 로컬과 같은 품질 계열로 맞추는 것`을 기본 목표로 본다.

## Reference Scaffold

바로 복사해 사용할 수 있는 예시 파일 세트는 아래 경로에 둔다.

- `docs/examples/remote-content-sidecar/`

포함 파일:

- `docker-compose.yml`
- `Dockerfile`
- `requirements.txt`
- `app/config.py`
- `app/auth.py`
- `app/content.py`
- `app/renderer.py`
- `app/main.py`
- `renderer/package.json`
- `renderer/server.mjs`
- `renderer/Dockerfile`
