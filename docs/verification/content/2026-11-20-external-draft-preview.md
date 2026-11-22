# 외부 콘텐츠 폴더의 개발 초안 미리보기 검증

## 대상과 조건

- 검증일: 2026-11-20 KST. 기준 main `2cf837f04954d05d5ff409bdec6794ec28fd7f07`, `codex/docs-external-draft-preview-20261120`의 별도 미커밋 변경이다. 추적은 [KAN-89](https://web-tech-service.atlassian.net/browse/KAN-89)다.
- Node24.22.1·pnpm12.14.0·Next16.4.6 development와 로컬 Playwright Chromium390×844에서 검사했다. 실제 비공개 콘텐츠·키·NAS·운영 설정을 사용하지 않았다.
- 원래 checkout의 코드·테스트·앱 지침·기고 가이드4개는 보존하고 최신 main 기반 새 작업 트리에 해당 변경만 재구성했다. 검증 당시에는 미커밋이었으며 이후 사용자 승인으로 코드·회귀를 `4b1a6b57`로 로컬 커밋했다. 푸시·원문 이동·운영 반영은 아니다.

## 재현 방법

새 작업 트리의 의존성과 공용 UI 빌드 산출물을 준비한 뒤 저장소 루트에서 실행한다.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @web-tech/ui build
pnpm --filter docs test:lib
pnpm --filter docs typecheck
pnpm --filter docs exec eslint lib/local-draft-preview.ts lib/local-draft-preview.test.ts --max-warnings 0
```

단위 회귀는 임시 폴더의 합성 draft·published·archived와 심볼릭 링크 파일을 생성하고 종료 시 정리한다. 실제 원문을 읽지 않는다. development의 외부 root 선택과 상대 root 거부, 명시적 인자 root 우선, 경로 순회·파일 상태·production/test 거부를 검사한다. 원래 경로·기본 root 동작도 유지한다.

브라우저 확인용으로는 저장소 밖 새 임시 root의 `category/synthetic.mdx`에 다음 합성 문서만 만들었다. 실제 초안이나 게시 대상이 아니다.

```md
---
status: draft
title: Synthetic external preview
slug: synthetic
summary: Authored browser verification fixture
date: 2026-11-20
---

## Synthetic heading

External fixture body without private content.
```

그 root를 로컬 변수 `SYNTHETIC_DRAFT_ROOT`로만 전달해 다음 조건으로 부팅했다. 실제 경로·환경 파일·응답 전문은 공개하지 않는다.

```sh
DOCS_CONTENT_SOURCE=legacy \
DOCS_LOCAL_DRAFT_ROOT="$SYNTHETIC_DRAFT_ROOT" \
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false \
BLOG_CONTENT_API_BASE_URL= \
BLOG_CONTENT_API_BASE_URL_INTERNAL= \
BLOG_CONTENT_API_BASE_URL_PUBLIC= \
pnpm --filter docs exec next dev --port 3078 --hostname 127.0.0.1
```

설치된 Playwright Chromium으로 `/ko/preview/category/synthetic`에 직접 접근해 합성 제목·본문 제목이 보이는지, `meta[name=robots]`가 `noindex, nofollow`인지, 클라이언트 오류가 없는지 확인했다. 실제 비공개 Git 인증·발행본 준비 경로를 실행한 검사는 아니다.

## 결과와 증거

| 검사                                 | 결과         | 구분                                                                                                                                     |
| ------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 새 작업 트리의 최초 오프라인 설치    | 실패         | 캐시 store에서 필요한 tarball을 찾지 못함. 동일 고정 lockfile·설치 스크립트 비활성 조건의 승인된 설치로 준비                             |
| 공용 UI 빌드 전 최초 라이브러리·타입 | 실패         | `@web-tech/ui` 산출물 누락으로 타입 단계에서 중단. 소스나 검사 기준을 바꾸지 않고 UI build 후 재실행                                     |
| 공용 UI build 후 라이브러리 전체     | 374/374 통과 | Node 테스트 타입 포함. 외부 root 회귀1개 추가, skip·취소0개                                                                              |
| 앱 타입·변경 코드 lint               | 통과         | docs 전체 타입·수정한 코드2개 lint 경고0개                                                                                               |
| 발행본 없는 private-git 서버         | 부팅 거부    | `Prepared private content is missing`. 이어진 화면 접근은 연결 거부. 초안 root로 앱 전체의 발행본 준비를 대체할 수 없다는 기존 보호 경계 |
| legacy 개발 모드 합성 화면           | 통과         | 제목·본문 제목 표시, robots `noindex, nofollow`, 클라이언트 오류0개                                                                      |

외부 초안 root가 있어도 `private-git` 앱 부팅의 발행본 검증은 유지된다. 처음의 서버 실패를 API 장애·문서 손실·운영 장애라고 분류하지 않는다. 합성 화면 검사를 위해 운영 모드·lock·Next 설정을 우회하지 않고 원래 지원하는 별도 legacy 개발 모드에서만 검사했다.

검사 후 포트3078의 테스트 서버를 종료하고 생성한 합성 파일은 예상 bytes와 대조한 뒤 해당 파일·빈 임시 디렉터리만 정리했다. 다른 파일·실제 초안·원래 checkout은 변경하지 않았다.

## 한계와 후속 작업

- 실제 비공개 저장소 인증·준비된 발행본을 사용하는 private-git 앱 전체·production build/start·Safari/Firefox·실기기는 미검증이다. 단위 검사의 production/test 거부를 운영 배포 검증으로 보고하지 않는다.
- draft 미리보기의 `noindex`는 접근 통제가 아니다. 개발 서버는 loopback으로만 실행하고 원시 자료·키·미승인 원문을 공개 경로에 복사하지 않는다.
- 공개 목록·검색·사이트맵·운영 발행 SHA와 인증 CI는 바꾸지 않았다. 공용 설정·발행본 준비 생략은 이번 범위가 아니다.
- 사용자가 코드·회귀2개와 앱 지침·정제 문서6개의 공개 검수·해시 등록·작업별 로컬 커밋을 승인했다. 커밋 전 라이브러리374개·타입·lint·포맷 재검사가 통과했다. 앞선 브라우저 결과를 재실행 또는 운영 검증으로 바꾸지 않으며 푸시·원시 로그·실제 경로·비공개 자료·다른 작업은 제외한다.

### 2026-11-22 최신 main 통합과 PR 준비

기준 main은567398255f3c00a35fc52432beb30a68e86ed2bb, 작업 브랜치는codex/docs-draft-pr-20261122다. 초안 미리보기2개 원본 커밋의 고유 변경만 통합했다. 앱 작성 지침·기고 절차는 승인된 기존 보완이며 root 공통 지침·운영 콘텐츠 공급 경로·키는 변경하지 않는다. 원본14개 로컬 커밋·기존 미커밋·stash·비공개 자료는 원래 위치에 보존하며 새 브랜치에서만 정리한다. 겹친 목차는 새 main의 링크를 유지해 합치고 이전 승인 기록은 동일 bytes에만 사용한다.

docs test:lib 374개와 node-test 타입 검사를 통과했다. development의 명시적 외부 root와 production/test의 조기 종료·경로/상태 제한을 원문 없는 합성 회귀로 검증한다. 전체 앱 타입·lint와 원격 CI는 각각 구분한다. 실행 환경은Node24.22.1·pnpm12.14.0이며 의존성은 frozen lockfile·ignore-scripts·offline으로 재사용했다. 설치 훅·dotenv skill은 승인하지 않았다.

사용자가 기존 목차4개와 관련 보고서/worklog6개의 정제 보완·재검수·해시 갱신을 승인했다. 최종 staged bytes의 공개·포맷·문서·메시지 검사 후 작업별 커밋과 푸시·main 대상 PR을 준비한다. 실제 원격 SHA·CI 결과는 같은 Jira/Confluence 추적 기록에 연결하며 로컬 통과를 원격 성공으로 바꾸지 않는다. main 병합·Production 배포·기존 PR 종료·브랜치/원본 삭제는 범위 밖이다.

## 관련 문서

- [기고 가이드](../../runbooks/docs-contributor-guide.md#저장소-밖-초안의-로컬-미리보기)
- [초안 작성 ADR-0036](../../architecture/adr-0036-private-git-draft-authoring.md)
- [작업 기록](../../worklog/2026-11/2026-11-20-external-draft-preview.md)
