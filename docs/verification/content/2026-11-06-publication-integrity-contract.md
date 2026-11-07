# 게시 revision·manifest 무결성 계약 검증

## 대상과 조건

- 검증일: 2026-11-06 KST. 기준 HEAD `fa583dd49eb0f53d569b66741b09e78ee5a8fa3f` 위 미커밋 구현.
- Node 24.22.1·pnpm 12.14.0. `@web-tech/docs-content-contract/publication`만 추가하고 기존 root 계약은 유지했다.
- 합성 metadata·HTML·메모리 bytes만 사용했다. 실제 NAS·토큰·원격 API·배포 설정은 조회하거나 변경하지 않았다.
- 해시 기대값은 테스트의 Node `createHash`로 독립 계산하고 구현의 Web Crypto 결과와 대조한다.

## 재현 방법

아래 명령은 저장소 루트에서 프로젝트 Node·pnpm을 선택한 뒤 실행한다. 앱 서버는 필요하지 않다.

```sh
pnpm --filter @web-tech/docs-content-contract test
pnpm --filter @web-tech/docs-content-contract lint
pnpm --filter @web-tech/docs-content-contract typecheck
pnpm --filter @web-tech/docs-content-contract build
pnpm --filter @web-tech/docs-content-contract exec tsc --ignoreConfig --noEmit --skipLibCheck false --module NodeNext --moduleResolution NodeNext --target es2022 dist/esm/publication.d.ts
pnpm --filter docs test:lib
pnpm --filter docs-backend test --runInBand
```

빌드 후 `apps/docs`에서 ESM import, `apps/docs-backend`에서 CommonJS require로 같은
`createPublicationManifest`·`verifyPublicationManifest` 왕복을 실제 실행했다.
패키지 로컬 `rewriteRelativeImportExtensions`는 native TS 테스트의 `.ts` import를
배포 JS의 `.js`로 바꾸며 루트 tsconfig는 바꾸지 않는다.

## 결과와 증거

[회귀 소스](../../../packages/docs-content-contract/src/publication.test.ts)는 실제 응답 복제본이 아닌 합성 fixture다.
raw 로그·trace·개인 파일을 이 보고서로 복사하지 않았다.

| 검사               | 기대 조건과 관측                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 식별자·스키마      | 소문자 64자리 revision·소문자 UUIDv4·지원 버전·필수 필드만 허용. 알 수 없는 URL·필드·자기 세대 재사용 거절                               |
| canonical manifest | 독립 SHA-256과 동일. 공백·개행·필드 순서·중복 key가 바뀌면 해시가 맞아도 canonical 검사에서 거절                                         |
| 변조·혼합          | 같은 길이의 변조는 hash-mismatch, 잘린 HTML은 size-mismatch. 다른 manifest·다른 본문과 혼합한 묶음 거절                                  |
| 누락·집합          | 필드 누락·null bytes·본문 누락·중복·추가 파일, index/manifest의 경로 불일치와 draft 거절                                                 |
| byte 경계          | pointer 4KiB 허용·+1 거절. manifest 1MiB까지 byte 단계 진행·비정규 JSON 거절, +1은 digest 전 거절. index·HTML은 정확히 1MiB 허용·+1 거절 |
| 선언 budget        | 문서 4,096개 허용·4,097개 거절. index+HTML 정확히 64MiB 선언 허용·초과 거절. 이 검사는 대용량 본문을 실제 로드하지 않음                  |
| 디코딩·소유권      | UTF-8 한글·emoji의 byte 길이, 잘못된 UTF-8 거절, subview와 비동기 hash 중 원본 배열 변경에 대한 검증 bytes 보존                          |
| 전체 체인          | 정상 문서·빈 게시본·같은 revision/새 generation의 형식 검사, 256개 문서 전체 체인 통과. 실제 rollback 작업을 수행한 것은 아님            |
| 안전한 실패        | 오류는 ok·code·artifact만 포함. 원문·경로·getter 예외 내용을 노출하지 않으며 hash 제공자 실패도 거절                                     |

공용 83개·기존 프론트 라이브러리 354개·backend 단위 31개가 통과했다. 새 subpath의 ESM·CommonJS 실행,
공용 dual build·생성 declaration 검사·공용/backend 타입·lint도 통과했다.
문서 검사기의 `validate`에 HEAD와 작업 트리의 읽기 전용 view를 전달해 미커밋 15개 변경의
역할·상태·상대 링크·목차를 검사했고 새 위반은 0개였다. 실제 인덱스는 변경하지 않았다.
이는 `--staged` 검사가 미스테이징 문서를 읽었다는 뜻이 아니다.

최초 공용 실행은 77개 중 1개가 실패했다. 빠진 `body` 필드를 Zod가 필수 스키마 오류로 거절했지만
테스트는 파일 bytes 누락 오류를 기대한 차이였다. 필드 누락은 invalid-schema, 명시적인 null bytes는
missing-artifact로 각각 검사했고, 혼합 본문 변조 fixture는 같은 byte 길이로 맞춰 크기 검사와 분리했다.

## 한계와 후속 작업

검증 함수는 FS·네트워크·환경 변수·현재 시각·로그에 접근하지 않는다. 바이트 배열을 이미 받은 뒤의
제한이므로 실제 stream reader·파일 안전 접근·전송/압축 계층의 제한은 소비자가 별도로 구현해야 한다.
선언 budget은 실제 peak 메모리·동시 부하 성능의 보장이 아니다. 256개 검사는 성능 SLO 측정이 아니다.

해시는 인증·서명·공개 승인·HTML sanitizer가 아니다. pointer와 모든 응답이 함께 변경되면 이 검사만으로
공격을 구분하지 못한다. 개별 artifact 검증은 전달받은 manifest를 기준으로 하며 신뢰 경계의 manifest 검증이 선행돼야 한다.
generation의 실제 전환·최초 초기화·CAS·최신성·재시도·철회·보관·캐시는 구현하지 않았다.
과거 CI 간헐 실패의 최초 원인을 새로 확정하지 않는다. 실제 NAS·운영 API·브라우저/Edge에서의 실행은 미검증이다.
후속 사용자 승인으로 동일 구현을 `cdf47ec`에 로컬 커밋하고 공용 83개를 다시 통과했다.
정제 ADR·보고서·기록·목차만 별도 공개 검수·해시 기록 후 커밋한다. 원시 자료·푸시·배포는 제외한다.

[KAN-58 댓글](https://web-tech-service.atlassian.net/browse/KAN-58?focusedCommentId=10085)과
[Confluence 댓글 v6](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817?focusedCommentId=14581761)에
로컬 검증·남은 NAS 작업을 3열 표로 추가하고 기존 댓글 이력 보존을 재조회했다.
Confluence 페이지 본문의 미게시 편집은 건드리지 않았다. KAN-58의 과거 원인 조사 완료로 처리하지 않는다.

## 관련 문서

- [설계 ADR](../../architecture/adr-0028-nas-content-revision-snapshots.md)
- [공용 API와 신뢰 경계](../../../packages/docs-content-contract/README.md#publication-integrity)
- [작업 기록](../../worklog/2026-11/2026-11-06-publication-integrity-contract.md)
- [선행 세대 실험](../cache/2026-11-06-publication-generation-experiment.md)
