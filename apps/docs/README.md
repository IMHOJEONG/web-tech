- Target 설정

```js
---
title: JS Memory
slug: js-memory
date: 2024-11-30 18:00:00
---
```

## DOCS - 블로그 문서

- 폴더 별 mdx-bundler의 사용이 다름

docs 폴더

- https://github.com/ipikuka/next-mdx-remote-client

architectures 폴더

- https://github.com/kentcdodds/mdx-bundler

### 사용한 패키지 분석

- fast-glob
    - https://www.npmjs.com/package/fast-glob

- vfile-matter
    - https://github.com/vfile/vfile-matter

    - 추가로, to-vfile을 같이 사용
        - https://www.npmjs.com/package/to-vfile

- npm outdated를 통한 패키지 업데이트
    - https://stackoverflow.com/questions/35236735/npm-warn-message-about-deprecated-package

### volta -> mise-en-place

    - https://mise.jdx.dev/getting-started.html

    - nvm에서 변경함 (여러 패키지들을 한 번에 관리할 수 있는 mise-en-place)

        - https://github.com/nvm-sh/nvm

    - https://nextjs.org/docs/app/api-reference/file-conventions/not-found

    - 여러 분석 점들이 있는 듯

### Better-Auth

- https://www.better-auth.com/docs/installation

### MDX

- gray-matter에 보안취약점이 존재

- remark 플러그인도 사용함

### Spec kit

- https://github.com/github/spec-kit
