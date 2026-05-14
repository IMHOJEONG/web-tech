# 2026-05-14 원격 코드 하이라이팅 sidecar 설계

## 요약

- 원격 문서 코드 블록 품질을 높이기 위해 `FastAPI + Node sidecar + Shiki` 구조를 기준안으로 정리했다.
- Python only 대안인 `Pygments`보다, 현재 프론트의 Shiki 방향과 더 잘 맞는 구성을 우선 추천하기로 했다.
- 핵심은 FastAPI가 파일 IO와 인증, 메타를 맡고, markdown -> HTML + syntax highlighting은 sidecar가 맡는 분리 구조다.

## 이유

- 로컬 MDX는 이미 Shiki 기반으로 움직이고 있다.
- 원격 문서는 HTML 그대로 내려오므로, 현재 `shiki-options.js` 변경이 직접 반영되지 않는다.
- 코드 블록 퀄리티가 중요하다면 로컬/원격의 결과물이 같은 계열로 보이는 쪽이 더 적합하다.

## 산출물

- `docs/architecture/docs-remote-code-highlighting-sidecar.md`

## 메모

- 이번 단계는 구현이 아니라 아키텍처 기준 확정에 가깝다.
- 후속 구현 기준으로 아래 예시까지 문서에 추가했다.
  - `docker-compose.yml`
  - `renderer/package.json`
  - `renderer/server.mjs`
  - `renderer/Dockerfile`
  - `FastAPI` sidecar 호출 코드
  - `FastAPI` 파일 분리 기준
    - `config.py`
    - `auth.py`
    - `content.py`
    - `renderer.py`
    - `main.py`
- 실제 복사 가능한 reference scaffold도 추가했다.
  - `docs/examples/remote-content-sidecar/`
- 실제 운영에 들어갈 때는:
  - sidecar timeout
  - health check
  - 실패 시 fallback 정책
  - theme 동기화 기준
    을 더 구체화해야 한다.
