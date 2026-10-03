# ADR-0011: 로컬 검색 인덱스를 별도 캐시로 재사용

## 상태와 범위

- 상태: 적용 중
- 대상: docs 로컬 검색 인덱스와 인증된 게시 갱신 웹훅
- 결정일: 2026-10-03
- 최종 검토: 2026-10-03
- 로컬 production 검증 완료. Vercel 배포·NAS 게시 검증은 미완료.

## 배경

[비용 점검](../verification/performance/2026-10-03-search-index-cost.md)에서 매 검색 요청의 로컬 읽기·파싱 비용을 확인했다. 전체 결과를 캐시하면 원격 장애 중의 로컬 전용 결과가 원격 복구 후에도 남거나 검색어별 캐시가 불필요하게 늘어날 수 있다.

## 결정

현재 Cache Components를 켜지 않은 Next 모델에서 `unstable_cache`로 로컬 파서 결과만 저장한다. 원격 목록은 기존 fetch 캐시를 유지한다. 병합·중복 제거·검색어별 순위 계산·요청 계측은 캐시 밖에서 수행한다. 요청 헤더·토큰·언어·검색어는 로컬 인덱스 캐시 키나 값에 넣지 않는다.

- 태그: `docs-content:local-search`. 원격의 `docs-content:remote`와 분리한다.
- 키: 버전 문자열·설정 로딩 시 계산한 문서 내용/경로 SHA-256·콘텐츠 루트 인자. Next config가 digest를 빌드 코드에 주입하므로 문서가 변경된 새 배포는 이전 인덱스를 재사용하지 않는다.
- `DOCS_LOCAL_SEARCH_REVISION`은 자동 생성하는 내부 빌드 상수다. 수동 환경 변수나 비밀값이 아니다. next.config env는 bundle에 들어갈 수 있으므로 이 자리에는 토큰·본문을 절대 넣지 않는다.
- Production만 재사용한다. 개발 환경 또는 digest 누락 시 기존 파일 로딩으로 우회한다.
- TTL은 300초이며 인증된 기존 웹훅이 두 태그 모두 `{ expire: 0 }`으로 만료한다. webhook 자체는 파일을 읽거나 원격 API를 미리 호출하지 않는다.
- draft/archived 제외는 기존 공용 파서 책임이다. 파싱 실패를 빈 인덱스로 바꿔 저장하지 않는다. 원격 실패 후 로컬 fallback도 병합 캐시로 저장하지 않는다.

TTL은 즉시 갱신 보장이 아니다. 시간 만료는 stale 응답 후 갱신할 수 있으므로 게시 시에는 웹훅을 호출한다. 실제 Vercel 로컬 파일은 배포 산출물이며 NAS 수정이나 웹훅으로 교체되지 않는다. 로컬 글 수정은 새 배포가 필요하고 NAS 글 수정은 기존 원격 게시 절차를 따른다.

## 대안과 영향

- React cache만 사용: 요청 내 중복은 줄이지만 요청 간 읽기·파싱은 남는다.
- 프로세스 메모리 캐시: 간단하지만 서버리스 인스턴스 간 무효화를 일관되게 전달하기 어렵다.
- 병합 인덱스 캐시: 원격 장애 fallback·복구와 게시 갱신의 일관성 위험이 커 이번에는 제외한다.
- Cache Components 전환: 기존 언어 경계 실험과 전체 앱 변경이 필요하므로 이번 검색 비용 개선에 묶지 않는다.
- 색인 엔진·본문 사전 정규화: 큰 corpus에서 재측정 후 검토한다. 현재 순위 점수나 공개 API 계약은 변경하지 않는다.

다른 캐시 모델로 전환하거나 실제 성능이 악화되면 재검토한다. 캐시 wrapper를 우회해도 순수 로컬 로더와 검색 계약을 유지할 수 있다.

## 관련 문서

- [콘텐츠 캐시 정책](docs-content-cache-revalidation-policy.md)
- [production 검사 절차](../runbooks/docs-content-cache-production-test.md)
- [검증 결과](../verification/cache/2026-10-03-local-search-index-cache.md)
- [작업 기록](../worklog/2026-10/2026-10-03-local-search-index-cache.md)
