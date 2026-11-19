# 비공개 Git 콘텐츠 전환과 복구

## 목적과 준비 조건

공개 코드와 비공개 원문을 분리하고 승인된 발행본만 빌드에 공급한다. Node·pnpm은 저장소 pin을 사용한다. 콘텐츠 저장소는 비공개이며 `data/`, `category/`, `public/` 구조를 유지한다. 토큰·개인키·원시 응답을 명령 인수·콘솔·공개 CI artifact에 넣지 않는다.

이 문서는 운영 설정을 자동 변경하지 않는다. 운영 활성화 전에 [검증 보고서](../verification/content/2026-11-17-private-git-content.md)의 누락·미검증 항목을 확인한다.

## 실행 순서

### 1. 원문과 공개 검수 준비

1. 비공개 원문에 `status: published`를 지정하고 사람이 공개할 파일·자산을 검토한다. draft는 빌드에 포함하지 않는다.
2. [기존 공개 검수 형식](../process/publication-review.md)의 `.publication-review.json`을 비공개 콘텐츠 저장소 루트에 둔다. 경로는 `apps/docs/data/...`, `apps/docs/category/...`, `apps/docs/public/...`라는 논리 경로를 사용한다. 원문의 실제 저장 위치에 `apps/docs`를 추가하는 것은 아니다.
3. 정확한 파일 bytes의 SHA-256, 종류, 검토일, 공개 결정과 체크를 기록한다. 에이전트가 임의 승인하지 않는다. 원문이 바뀌면 재검토한다. 기존 검수 목록에 같은 경로가 있으면 중복 추가하지 않는다.
4. 검수 목록까지 포함한 콘텐츠 커밋을 만든 뒤 앱의 `content-release.lock.json`을 그 40자리 SHA와 정확한 URL 집합으로 갱신한다. 검수 목록은 원문 bytes를 묶으며 자기 자신을 해시하지 않는다.

기존 공개 저장소의 검수 목록은 동일 bytes의 이전을 위한 임시 호환 경로다. 오래된 공개 글에 검수 해시가 없으면 빌드가 실패한다. 이미 공개됐다는 이유만으로 새 승인 항목을 자동 생성하지 않는다.

### 2. 로컬 준비 검사

콘텐츠 저장소의 별도 로컬 Git 사본과 승인받은 검수 파일을 준비한다. 실제 위치는 공개 문서나 PR에 기록하지 않는다. 저장소 루트에서 실행한다.

```sh
pnpm --filter @web-tech/docs-content-contract build
DOCS_PRIVATE_CONTENT_LOCAL_GIT="$CONTENT_GIT_DIRECTORY" \
DOCS_PRIVATE_CONTENT_REVIEW_FILE="$CONTENT_REVIEW_FILE" \
pnpm --filter docs verify:content-release
```

이 도구는 네트워크 인증·원격 쓰기를 하지 않는다. 고정 SHA의 원문을 검증해 앱의 Git ignore 대상 `.generated-content/<SHA>/`에 준비한다. 승인 파일이 아직 비공개 Git 커밋에 없을 때도 로컬 검토가 가능하지만, 이 성공을 운영 deploy-key 경로의 성공으로 간주하지 않는다.

준비한 입력으로 Next 출력만 검사할 때 앱 디렉터리에서 실행한다.

```sh
DOCS_CONTENT_SOURCE=private-git pnpm exec next build
DOCS_CONTENT_SOURCE=private-git pnpm exec next start --port 3047
```

직접 `next build`는 위 로컬 검증 뒤의 출력 검사 전용이다. 배포 Build Command는 다음 절차의 workspace `build`를 사용해야 한다.

### 3. 인증된 Preview 빌드

기존 작업 트리가 수정 중이면 원본 파일·인덱스·stash를 보존하고 별도 검증 사본을 만든다. 사본에는 공개 코드와 필요한 workspace manifest를 유지하되 `.env`·키·Git 객체·원시 자료·기존 `data/category` 원문을 포함하지 않는다. pnpm의 frozen lockfile은 다른 workspace의 `package.json`도 요구하며, 기존 E2E가 참조하는 공개 예제 코드도 타입 검사 입력이다. 사본을 줄이려고 lockfile을 다시 생성하거나 타입 검사를 끄지 않는다.

콘텐츠 저장소에 한정된 읽기 전용 deploy key를 별도로 발급하고 Preview의 `DOCS_PRIVATE_CONTENT_SSH_KEY`로 설정한다. 공개 키만 콘텐츠 저장소에 등록한다. 키를 채팅에 전달하거나 공개 코드 저장소에 복사하지 않는다.

기존 키로 일회성 CLI Preview를 검증할 때에는 `--build-env DOCS_PRIVATE_CONTENT_SSH_KEY`처럼 이름만 인수에 주고 값은 제한된 부모 프로세스의 환경으로 전달할 수 있다. 실제 키를 `KEY=value` 인수·셸 이력·배포 설정 파일에 넣지 않는다. 이 방식은 영구 Preview 환경 변수를 수정하지 않지만 플랫폼 내부의 자격 증명 접근 권한 분리를 보장하는 것은 아니다. `--prod`·운영 도메인 승격은 사용하지 않는다.

`DOCS_CONTENT_SOURCE=private-git`를 Preview에 설정하고 표준 명령을 사용한다.

```sh
pnpm --filter docs build
```

빌드는 고정 SHA fetch → 공개 검수 → 원문/자산 준비 → 작성 규칙 검사 → Next build 순서다. 다음 조건을 확인한다.

- 목록·검색·사이트맵·상세의 canonical URL이 전환 전 목록과 일치한다.
- Git 또는 NAS 네트워크 없이 실행 중인 페이지의 원문을 읽을 수 있다.
- draft·미참조 자산·Git 객체·개인키·기존 원문 디렉터리가 Next trace에 없다.
- 리비전을 바꾼 재빌드와 이전 리비전 재빌드가 각각 예상 본문·검색 결과를 반환한다.
- NAS에만 있는 글과 외부 이미지 의존성을 대조한다. 이번에는 사용자가 기존 승인된 17개 글·15개 자산만 운영 대상으로 확정했고 NAS 전용 글은 수동 이전으로 남겼다. 이 승인을 다른 누락·새 원문·외부 자산의 자동 허용으로 확대하지 않는다.

배포 준비 성공과 독자 동작 성공도 구분한다. 먼저 인증 없는 요청이 보호 화면으로 차단되는지 확인하고, 기존 Vercel 인증으로 한·영 전체 페이지네이션·본문 검색·상세의 실제 MDX·사이트맵·승인 자산 해시를 대조한다. 브라우저에서는 데스크톱·모바일에서 검색 제출 후 실제 카드 Link로 상세에 이동한다. 인증은 Preview의 동일 origin 요청에만 붙이고 다른 자산 호스트로 전달하지 않는다. 검증 때문에 보호 설정을 끄거나 새로운 bypass를 자동 생성하지 않는다.

마지막으로 Production 배포 ID·Production 브랜치·보호 설정·영구 환경 변수 메타데이터를 시작 시점과 대조한다. 정제 결과만 보고서에 기록하고 원시 응답·화면·인증 상태 파일·빌드/런타임 로그는 Git 밖에 둔다. 검증 Preview의 성공만으로 운영 전환이나 글 누락 문제가 해결됐다고 간주하지 않는다.

`DOCS_PRIVATE_CONTENT_REVISION`은 빌드가 설정하는 내부 값이다. 사용자가 별도 값을 주면 lock과 다른 경우 실패한다. 런타임과 로컬 `next start`는 고정 lock의 SHA를 사용한다. deploy key는 `next.config`의 `env`나 `NEXT_PUBLIC_` 변수에 넣지 않는다. 플랫폼의 환경 변수 접근 권한·적용 범위는 별도로 제한해야 하며, 빌드 자식 프로세스에서 키를 제거했다고 플랫폼 런타임의 권한 분리가 끝난 것은 아니다.

### 4. 운영 전환

사용자 승인 후 코드·검수된 콘텐츠·배포 설정을 전환한다. 이 단계 전에 공개 원문 파일을 일괄 삭제하지 않는다. 기존 문서에 직접 의존하는 테스트를 합성 fixture 또는 인증된 별도 콘텐츠 검증으로 옮기고 CI 인증 경계도 검증해야 한다.

공개 저장소의 fork PR에는 private Git 키를 제공하지 않는다. 비밀정보 없는 합성 검사와, 신뢰된 커밋만 대상으로 하는 인증된 콘텐츠 검사를 분리한다. 공개 원문을 제거한 뒤 기존 CI가 어떻게 빌드할지 결정하지 않은 채 운영 모드를 기본값으로 바꾸지 않는다.

공개 Git의 기존 파일을 삭제해도 과거 커밋은 남는다. 과거 이력 재작성이나 이미 배포된 공개 파일의 회수는 이번 전환에 포함하지 않는다. 글 수정은 콘텐츠 커밋·검수·lock 갱신·새 배포로 반영하며 NAS revalidation webhook만으로 반영되지 않는다.

2026-11-19 승인 범위에서는 다음 순서로 전환한다. 아직 실행하지 않은 항목은 검증 보고서에서 미완료로 표시한다.

1. PR #97의 합성 CI를 먼저 main에 반영한다. 기존 콘텐츠 전환 미커밋은 보존하고 최신 main에 로더·회귀·정제 문서만 별도 PR로 옮긴다. 원문·자산·NAS·Git 과거 이력은 삭제하지 않는다.
2. 별도 PR의 공개 검수·일반 CI·리뷰·최종 메시지 사전검사 후 main에 병합한다. 이때 기본 `legacy` 모드는 그대로라 코드 병합만으로 공급원이 바뀌지 않는다. 병합 SHA와 같은 main CI·기존 모드 배포를 구분한다.
3. 현재 정상 Production 배포 ID·브랜치·환경 변수 메타데이터를 저장소 밖에 보관한다. 콘텐츠 저장소에서 기존 키가 읽기 전용인지와 lock SHA 존재를 확인한다. 실제 키를 인수·로그·파일 업로드에 넣지 않는다.
4. Vercel의 Production 범위에만 `DOCS_CONTENT_SOURCE=private-git`와 콘텐츠 전용 읽기 키를 설정한다. 키는 sensitive로 등록하고 일반 PR/Preview에 확장하지 않는다. 기존 branch 전용 Preview 변수·GitHub 보호 설정·NAS 토큰은 변경하지 않는다. Vercel 변수는 빌드뿐 아니라 플랫폼 런타임 권한 경계도 가지므로 완전한 자격 증명 격리를 의미하지 않는다.
5. 승인된 main의 정확한 SHA에서 Production 후보를 빌드한다. 플랫폼의 staged/skip-domain 절차로 가능하면 검증 전에 운영 도메인을 이동하지 않는다. 생성된 배포의 코드 SHA·고정 콘텐츠 revision·상태를 대조하고 원시 빌드 출력은 비공개로 관리한다.
6. 후보 URL에서 한·영 전체 목록·본문 검색·34개 상세·사이트맵·승인 자산 15개·직접 비공개 경로 거절·클라이언트 key 미노출을 확인한다. 두 폭의 실제 검색→카드 Link 이동과 NAS 요청 여부를 관측한다. 통과 후 도메인에 반영하고 공개 도메인에서 같은 검사를 다시 확인한다. 보호 설정은 끄지 않는다.
7. 실패하면 이전 정상 배포를 재빌드 없이 복구 대상으로 사용한다. 새로운 환경 변수도 이번에 추가한 Production 범위만 되돌리고 기존 환경·원문·NAS를 건드리지 않는다. 이전 리비전 빌드는 별도 복구 수단이며 존재하지 않는 원문을 legacy 모드로 되살린다고 가정하지 않는다.

사용자는 인증 CI 활성화를 후속으로 남기고 승인된 main의 Vercel 빌드·검증으로 전환하는 경로를 선택했다. 이는 GitHub의 승인 보호를 완화하거나 PR 코드에 키를 주는 예외가 아니다. 실제 GitHub 인증 workflow 성공과 Vercel 배포 검증을 별도로 기록한다.

### CI 승인과 권한 설정

[ADR-0033](../architecture/adr-0033-content-ci-trust-boundary.md)의 일반 CI는 비공개 키를 요구하지 않는다. hosted runner가 checkout한 원문 디렉터리는 테스트 전에 runner 임시 공간으로 옮기고 별도 합성 corpus를 사용한다. 로컬 원본에서 `prepare-ci-docs-content.mts`를 실행하지 않는다. NAS 전용 글은 사용자가 수동 이전하며 이 합성 입력의 일부로 복사하지 않는다.

인증 workflow를 활성화할 때에는 다음을 별도로 준비한다. 이 절차는 설정을 자동 생성·변경하지 않는다.

1. workflow와 검증 코드를 검토해 main에 반영한다. `approved_sha`는 그때 검토한 main의 정확한 40자리 SHA다. 일반 PR 코드·artifact를 secret job에서 실행하지 않는다.
2. GitHub의 `docs-private-content` Environment에 required reviewer를 지정한다. 자기 승인 금지와 관리자 bypass 금지를 켜고 custom deployment branch를 정확히 main 하나로 제한한다. 태그·와일드카드·다른 branch는 허용하지 않는다. 누락·조회 실패는 선행 authorize job에서 거절한다.
3. 실행자와 reviewer를 분리한다. 같은 개인 계정으로 수동 실행하면 그 계정은 자기 실행을 승인할 수 없다. 제한된 실행 신원이나 별도 reviewer가 준비되기 전에는 대기하며 보호를 완화하지 않는다. 사용자와 AI가 소유자 계정 권한을 공유하는 문제도 별도 해결한다.
4. 콘텐츠 저장소 한 곳의 읽기 전용 CI deploy key를 해당 Environment의 `DOCS_PRIVATE_CONTENT_SSH_KEY` secret으로 등록한다. 일반 repo secret·조직 secret·PR workflow·Vercel Production에는 추가하지 않는다. 기존 Preview 키를 이 작업에서 읽어 올리거나 회전하지 않는다.
5. `Approved private content verification`을 main에서 수동 실행하고 `approved_sha`를 지정한다. authorize는 Environment metadata와 SHA만 읽으며 콘텐츠 키가 없다. 보호 승인이 끝나야 content job이 시작된다.
6. 인증 job은 설치를 `--frozen-lockfile --ignore-scripts`로 수행하고, 키는 마지막 검증 step에만 전달한다. 고정 콘텐츠 SHA fetch·공개 검수·빌드 뒤 키를 제거한 로컬 서버에서 전체 검색 URL·페이지네이션·한/영 상세를 확인한다. 성공은 정제 개수만 출력하며 로그·원문·화면·빌드 artifact·공유 캐시는 게시하지 않는다.

인증 workflow는 Vercel 배포·Production 승격·NAS 변경을 하지 않는다. 원격 보호 설정이 없으면 workflow에 Environment 이름을 적었다는 이유만으로 승인 경계가 생겼다고 간주하지 않는다. 로컬 검증과 실제 원격 승인·실행 결과는 [CI 검증 보고서](../verification/content/2026-11-18-content-ci-isolation.md)에서 분리한다. 기존 Vercel Preview의 환경 변수·자동 배포 권한은 이번 GitHub CI 설정과 별도다.

## 기대 결과

독자는 배포에 포함된 승인 글을 읽는다. 원문 저장소 장애는 새 빌드를 막지만 이미 배포된 콘텐츠를 바꾸지 않는다. 없는 글의 요청은 NAS 조회로 우회하지 않는다. 모드·리비전·글/자산 개수만 정제 로그로 남기고 원문·인증 오류 응답은 출력하지 않는다.

## 실패 대응과 복구

검수 실패, SHA 불일치, URL 중복·누락, 자산 충돌, 상한 초과는 새 빌드를 중단한다. 잘못된 입력을 수정하거나 이전 검수된 콘텐츠 리비전으로 lock을 돌려 재빌드한다. 앞선 정상 배포로의 플랫폼 rollback도 별도 승인 후 수행할 수 있다.

Git이 실패했을 때 NAS·공개 로컬 원문을 조용히 섞는 자동 fallback은 없다. 운영 전환 전에는 `DOCS_CONTENT_SOURCE=legacy`로 기존 경로를 선택할 수 있지만, 원문 제거 이후에는 예전 정상 배포가 복구 단위다. 현재 코드 트리에 원문이 없는데 모드만 legacy로 바꾸면 복구된다고 가정하지 않는다.

참조 자산은 기존 application public 파일과 bytes가 다르면 거절한다. 생성한 자산 소유 기록으로 이전 빌드가 생성한 파일만 제거하며 앱의 원래 자산은 지우지 않는다. 경로를 재사용해 이미 있는 자산을 교체하지 말고 버전이 다른 파일명을 사용한다. 공개 자산을 다시 비공개로 돌릴 때에는 이미 내려받은 파일·CDN 캐시까지 회수할 수 있다고 보장하지 않는다.

SSH는 고정 GitHub 호스트키·엄격 검증을 사용한다. 공식 키가 바뀌면 검증을 끄지 말고 [GitHub SSH over 443 안내](https://docs.github.com/en/authentication/troubleshooting-ssh/using-ssh-over-the-https-port)와 [공식 메타데이터](https://api.github.com/meta)를 대조하고 코드를 검토한다.

## 관련 검증

- [ADR-0032](../architecture/adr-0032-private-git-build-content.md)
- [실행 결과와 미검증 범위](../verification/content/2026-11-17-private-git-content.md)
- [작업 기록](../worklog/2026-11/2026-11-17-private-git-content.md)
