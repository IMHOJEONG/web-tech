# 문서 인덱스 보조 탐색 밀도 검증

## 대상과 조건

- 검증일: 2026-11-20 KST. 기준 main `2cf837f04954d05d5ff409bdec6794ec28fd7f07`, `codex/docs-index-discovery-20261120`의 미커밋 수정본이다.
- 추적: [KAN-87](https://web-tech-service.atlassian.net/browse/KAN-87). TODO의 목록 우선 배치 다음 2단계이며 운영 배포 검증과 구분한다.
- 환경: Node 24.22.1·pnpm 12.14.0, Next 16.4.6 development·Playwright Chromium. 기본 390×844·768×1024·1280×800, 추가 320px·root 24px·라이트/다크·reduced-motion 조건을 검사했다. 실제 기기·브라우저 자체 확대 검사는 아니다.
- 기존 합성 입력 생성기의 문서 17개와 새로 필요한 이미지 5개만 로컬 생성했다. 기존 문서·앱 자산을 덮어쓰지 않았으며 비공개 Git·NAS·키를 사용하지 않았다. 원시 로그·캡처는 저장소 밖 임시 공간에 보관한다.

## 재현 방법

기존 사용자 파일이 없는 별도 작업 트리에서 고정 도구 버전과 의존성을 준비한다. 전체 CI 준비기는 로컬 디렉터리 대체를 거부하므로 CI 환경을 가장해 실행하지 않는다. 아래는 기존 생성기의 입력을 재사용하되 기존 문서를 덮어쓰지 않는 로컬 준비 방식이다.

```sh
pnpm install --frozen-lockfile --ignore-scripts
node --input-type=module <<'NODE'
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { syntheticDocuments, syntheticDocumentSource } from './scripts/prepare-ci-docs-content.mts'
import { assertSyntheticImageTargets, syntheticImages, syntheticPng } from './scripts/synthetic-docs-media.mts'
const root = path.resolve('apps/docs')
for (const [file] of syntheticDocuments) assert.equal(fs.existsSync(path.join(root, file)), false)
assertSyntheticImageTargets(root, true)
const created = []
for (const image of syntheticImages) {
  const file = path.join(root, 'public', image.pathname)
  if (fs.existsSync(file)) continue
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, syntheticPng(image.width, image.height), { flag: 'wx' })
  created.push(image.pathname)
}
for (const [file] of syntheticDocuments) {
  const target = path.join(root, file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, syntheticDocumentSource(file), { flag: 'wx' })
}
console.log({ generatedImages: created })
NODE
DOCS_E2E_PORT=3077 DOCS_CONTENT_SOURCE=legacy pnpm --filter docs test:e2e docs-index-discovery.spec.ts docs-index-order.spec.ts content-discovery.spec.ts docs-index-navigation.spec.ts docs-index-pagination.spec.ts docs-touch-target.spec.ts horizontal-overflow.spec.ts --workers=2 --retries=0 --output=/private/tmp/docs-index-discovery-results-v3-20261120
pnpm --filter docs test:lib
pnpm --filter docs typecheck
pnpm --filter docs exec eslint widgets/docs-index/ui/docs-index.tsx widgets/docs-index/ui/docs-index-discovery.tsx widgets/docs-index/ui/docs-index-stats.tsx widgets/docs-index/ui/docs-index-sections.tsx widgets/docs-index/model/docs-index-summary.ts widgets/docs-index/model/docs-index-summary.test.ts e2e/helpers/docs-index.ts e2e/content-discovery.spec.ts e2e/docs-index-discovery.spec.ts --max-warnings 0
```

Playwright의 기존 서버 설정은 원격 인덱스·API 주소를 비활성화한다. 검사 뒤 생성한 문서는 `syntheticDocumentSource`, 출력된 신규 이미지 경로는 `syntheticPng`의 bytes와 대조한 후 해당 파일만 정리한다. 처음부터 존재하던 파일·이미지를 삭제하지 않는다. 실제 실행에서도 문서 17개·신규 이미지 5개만 정리했다.

## 결과와 증거

| 검사                          | 결과                                   | 구분                                                                                                            |
| ----------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 최초 모델 실행                | 13개 통과·1개 파일 로드 실패           | 새 작업 트리의 공용 계약 build 전 실행이었다. 계약 build 후 같은 대상 17개 통과                                 |
| 최초 브라우저 실행            | 77개 통과·9개 실패·10개 기존 조건 제외 | 외부 접기와 내부 태그 더 보기의 `summary`를 새 helper가 모두 선택한 strict-mode 오류                            |
| 직접 자식 summary 지정 후     | 83개 통과·6개 실패·10개 기존 조건 제외 | 마지막 태그 해제 후 기본 접힘으로 돌아가 숨겨진 링크를 찾던 기존 검사 순서 문제. 라이트/다크 3개 조건 추가 포함 |
| 재열기 후 기존 선택 검사 유지 | 89개 통과·10개 기존 조건 제외·실패 0   | 99개, workers 2·retries 0, 약 1.6분. timeout·기존 assertion은 유지                                              |
| 라이브러리 전체               | 375/375 통과                           | Node 테스트 타입 검사 포함. 수정 날짜 계산·invalid 대체·입력 불변성 추가                                        |
| 타입·변경 코드 lint           | 통과                                   | docs 전체 타입 검사, 변경 코드 lint 경고 0개                                                                    |

제외 10개는 모바일 전용 navigation 3개·touch target 2개를 태블릿/데스크톱에서 실행하지 않는 기존 조건이다. 새 접힘·선택 유지·큰 글자 검사는 세 프로젝트에서 모두 실행했다. 접힘 helper는 직접 자식 `summary` 하나만 선택하며, 조건 해제 뒤 다시 펼쳐 **보이는** 전체 태그의 선택을 검사한다. 숨긴 링크를 `includeHidden`으로 통과시키거나 기대값·retry를 완화하지 않았다.

같은 수정본·같은 합성 입력에서 DOM과 화면을 별도로 확인했다. 기본 접힘의 높이는 390·768·1280px 모두 70px, 펼침은 각각 1,173·777·673px였고 가로 넘침은 모두 0px였다. 접힘·펼침의 상태 비교이며 이전 배포 대비 개선율이나 production 성능 수치가 아니다. 첫 목록 제목의 기존 위치 상한도 기존 회귀에서 유지됐다.

## 한계와 후속 작업

- 기본 접힘·태그/모음 선택 시 펼침, 영역 밖 선택 해제, 검색 query·순서·페이지 규칙, Enter/Space·포커스·최소 높이·큰 글자·모션 감소를 확인했다.
- 초기에 전체 합성 미디어 생성은 기존 앱 자산 보호 검사에서 차단됐다. 보호를 끄지 않고 기존 regular file은 보존하며 누락 경로만 독점 생성했다. 일부 합성 이미지 404 관측은 누락 입력 준비로 보완했으며 운영 장애로 분류하지 않는다.
- 실제 비공개 글·NAS·운영·Safari/Firefox·실기기·스크린 리더·JS 비활성 앱 전체의 스트리밍 완결성은 미검증이다.
- 검증 당시에는 미커밋 수정본이었다. 이후 사용자가 코드·회귀 11개와 정제 문서 6개의 공개 검수·해시 등록·작업별 로컬 커밋을 승인했고, 코드 기준은 `64043e2f`다. 테스트 결과를 운영 검증으로 바꾸지 않으며 푸시·PR·배포는 수행하지 않는다. 원시 캡처·로그·다른 작업과 다음 카드 밀도 변경은 제외한다.

## 관련 문서

- [목록 순서와 밀도 정책](../../architecture/docs-search-experience-policy.md#문서-목록-순서와-밀도-보완-검토)
- [앞선 1단계 검증](2026-10-19-docs-index-order-local.md)
- [읽기 모음 계약](../../architecture/adr-0012-content-discovery-collections.md)
- [작업 기록](../../worklog/2026-11/2026-11-20-docs-index-discovery.md)
