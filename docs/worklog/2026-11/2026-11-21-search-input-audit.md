# 카드 모션 커밋과 검색 입력 접근성 점검

## Summary

사용자 요청으로 카드 모션 12파일을 `a2c6505e`에 로컬 커밋하고, 다음 한 주제인 검색 입력 접근성을 점검했다. 검색 코드는 편집하지 않았으며 실제 확인한 개선 후보와 적용 순서를 제안한다.

## Changed

- 카드 소스 5개·정제 기록 6개·manifest만 커밋했다. 공유 목차는 카드 행만 포함하고 다른 작업을 보존했다. 첫 메시지의 scope 오류를 `docs-ui`로 고친 뒤 실제 훅과 범위 publication·commitlint가 통과했다.
- [검색 점검 보고서](../../verification/accessibility/2026-11-21-search-input-audit.md)와 [정제 증거](../../verification/artifacts/2026-11-21-search-input-audit.json)·관련 목차를 추가했다.
- [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)에 카드 커밋을 연결하고 검색 점검은 기존 [KAN-6](https://web-tech-service.atlassian.net/browse/KAN-6)의 요약 댓글을 갱신한다. 실제 기기 검증을 포함한 이슈 전체를 완료 처리하지 않는다.

## Notes

- Modern Web Guidance 세 가이드 전문, 로컬 Next 접근성 문서, 기존 입력·Drawer ADR을 읽고 실제 경로를 확인했다. 검색 소스 편집·새 의존성·공통 지침 수정은 없다.
- 실제 앱의 세 엔진·두 폭·두 언어 12환경에서 IME 합성 차단·포커스·GET 계약·상태·명시 검색을 확인했다. 결과가 없는 로컬 데이터·초기 무기한 action 대기·0개 결과 확정 전 관측은 임시 환경을 보완해 재실행했다.
- 포커스 가드 직후의 일시적 배경 activeElement는 두 프레임 뒤 WebKit 36회에서 내부로 돌아와 결함 후보에서 제외했다. 실제 보조기술 검증은 남긴다.
- 지식 승격 판단: accessible name 존재와 레이블 품질, APG 패턴 불일치와 실제 사용 결함, 포커스 가드의 일시 상태를 구분하는 재사용 기준을 기존 Confluence 현대화 지식에 보완한다. 진행 댓글과 별도 본문 갱신을 구분한다.
- 마감: Jira KAN-6/83의 실제 3열 댓글과 링크를 재조회했다. Confluence 별도 지식 v10의 기존 본문 보존·원본·근거와 운영 댓글 v4·상위65817 경로를 확인했다. 새 검색 기록만 로컬 미커밋이고 공통 지침의 로컬/원격 반영은 없다. 임시 서버·브라우저를 종료했고 다른2,337파일·관련14소스 해시·빈 인덱스를 보존했다.

## Open Questions

결과 링크의 직접 탐색을 유지하는 일반 검색+링크 목록과 입력 포커스를 유지하는 combobox 중 후속 의미 구조를 확정해야 한다. 실제 OS IME·스크린리더·기기 검증은 미실행이다.

## Next

우선 두 입력의 레이블·입력 힌트를 작은 변경으로 적용하는 안을 제안한다. 이어 포커스 모델의 결정·ADR 갱신·회귀·실제 보조기술 검증을 진행한다. 이번에는 검색 코드 수정·문서 커밋·푸시·PR·배포를 수행하지 않는다.

## 후속 적용

사용자 요청으로 본문과 Drawer에 보이는 한·영 검색어 레이블을 붙이고 검색 키와 자동 교정 설정을 추가했다. 본문 글자 크기는 16px로 맞췄다. 기존 Drawer 대비 테스트는 새 접근성 이름으로 입력을 찾는다. 검색 계약과 공용 컴포넌트 책임이 유지돼 ADR 변경은 필요하지 않다. [구현 범위와 검증](../../verification/accessibility/2026-11-21-search-input-audit.md#후속-적용과-검증)

타입·린트와 세 엔진 12환경, 기존 Chromium 회귀 20개가 통과했다. 작업 기록은 기존 KAN-6 댓글과 Confluence 운영 댓글에서 이어 갔다. 별도 지식 본문 v11에는 동시 렌더 ID와 스트리밍 이후의 레이블 검사를 보완하고 근거와 탐색 경로를 재조회했다. 이번 변경은 로컬 미커밋이며 공통 지침 변경은 없다. [레이블 적용 기준](https://web-tech-service.atlassian.net/wiki/pages/19464193#레이블과-입력-힌트를-적용할-때)

## 레이블 커밋과 Drawer 포커스 제안

검증 해시가 일치한 레이블·힌트 코드와 테스트 6파일을 `f36db6de`에 로컬 커밋했다. 기록 문서는 후속 점검과 함께 로컬에 남겼다. 결과를 탐색한 뒤 입력에 돌아왔을 때 Enter 목적지가 바뀌는 동작을 점검하고, 기존 모달에서 검색 폼과 실제 문서 링크 목록을 사용하는 안을 제안했다. 적용은 별도 단계다. [포커스 점검과 제안](../../verification/accessibility/2026-11-21-search-input-audit.md#drawer-포커스-모델-후속-점검과-제안)

KAN-6 요약과 Confluence 운영 v6에 작업을 기록했다. 별도 지식 v12에 문서 링크와 가상 선택을 구분하는 기준을 보강하고 본문과 근거·상위 경로를 재조회했다. 공통 지침은 변경하지 않았다. [포커스 모델 판단 기준](https://web-tech-service.atlassian.net/wiki/pages/19464193#문서-이동-결과의-키보드-탐색)

## 실제 링크 포커스 적용

사용자 승인에 따라 결과 의미 구조와 키보드 동작을 로컬 ADR-0035 초안에 반영했다. 실제 링크의 Tab 순서와 방향키 이동을 유지하고, 입력 Enter로 전체 검색을 제출한다. 한국어·영어의 Tab 왕복과 Enter 목적지, 링크 포커스·순환, 합성 IME 및 닫기 복귀를 회귀 확인했다. 이번 변경은 로컬 미커밋이다. [적용과 검증](../../verification/accessibility/2026-11-21-search-input-audit.md#실제-링크-포커스-적용과-회귀)

KAN-6와 Confluence 운영 댓글 v7에 작업을 기록했다. 별도 지식 본문 v13에서 실제 링크 포커스와 Firefox 합성 조합의 확인 방법을 갱신하고 본문·근거·상위 경로를 재조회했다. 공통 지침 변경은 없다. [지식 문서](https://web-tech-service.atlassian.net/wiki/pages/19464193#실제-링크-포커스-적용)

## Drawer 커밋과 실제 Safari 점검

검증된 Drawer 구현·회귀 11파일을 `bbe6acae`에 로컬 커밋했다. 실제 Safari에서 한국어 합성 결과 세 개의 링크 역할, 방향키 포커스 이동과 Enter 문서 열기를 확인했다. 앱 입력 도구의 로터 단축키 전달 한계로 VoiceOver 로터·발화는 미검증이다. 테스트 탭을 닫고 VoiceOver가 시작 전과 같은 `off`임을 확인했다. [Safari 검증 범위](../../verification/accessibility/2026-11-21-search-input-audit.md#실제-safari와-voiceover-점검)

KAN-6의 3열 요약과 Confluence 운영 댓글 v8을 갱신하고 재조회했다. 별도 지식 v14에 Safari 접근성 트리와 VoiceOver 로터의 검증 기준을 보강하고 본문과 Apple 근거·상위 경로를 확인했다. 공통 지침 변경은 없다. [VoiceOver 검증 기준](https://web-tech-service.atlassian.net/wiki/pages/19464193#safari-접근성-트리와-voiceover-검증)

### VoiceOver 재검증

동일 커밋에서 VoiceOver 실행 앱과 환영 창·자막 옵션을 대조했다. 실제 키보드 조작 요청 뒤 세 번째 합성 문서의 상세 경로 도착을 확인했다. 로터로 열었는지와 발화 내용은 확인하지 못했다. 테스트 탭을 닫고 VoiceOver를 원래 꺼짐 상태로 되돌렸다. [재검증 기록](../../verification/accessibility/2026-11-21-search-input-audit.md#voiceover-재검증)

KAN-6의 재검증 결과와 Confluence 운영 댓글 v9를 확인했다. 별도 지식 v15에는 환영 창과 마지막 발화 확인 방법을 보강하고 본문과 Apple 근거를 재조회했다. 공통 지침 변경은 없다.

사용자는 로터가 `윈도우 스팟`으로 열렸고 해당 범주에서 항목을 선택하지 않았다고 확인했다. 세 번째 문서 상세 URL 관측은 링크 활성화 근거에서 제외했다. 같은 커밋에서 합성 결과 세 개를 다시 띄우고 `링크` 범주 전환, 발화 확인, 링크 열기 조작을 요청했다. 이번 확인 내용은 기존 검증의 관측 범위를 보정하는 실행 이력으로 기록한다.

KAN-6의 기존 검증 표와 Confluence 운영 댓글 v10을 갱신하고 재조회했다. 링크 목록·발화·활성화 확인은 남아 있다.

사용자 제공 Safari 캡처에서 UI/UX 결과의 VoiceOver 자막을 확인하고 제목·링크 역할 발화 한 건을 통과로 기록했다. 로터 `링크` 목록과 VoiceOver 명령으로 문서 열기는 추가 확인을 요청했다. KAN-6 검증 표와 Confluence 운영 댓글 v11을 갱신하고 재조회했다. 기존 자막 검증 기준을 이번 실행에 적용한 결과이므로 별도 지식 갱신은 필요하지 않았다. [자막 검증 결과](../../verification/accessibility/2026-11-21-search-input-audit.md#voiceover-재검증)

사용자가 로터 탐색과 링크 열기 조작을 완료했다. 사진에서 `링크` 목록의 합성 문서와 전체 검색 링크를 확인했고, Safari에서 Mobile 문서 상세의 URL과 제목을 대조했다. 로터, 발화, 상세 도착에 사용한 근거를 검증 보고서에 남겼다. KAN-6 검증 표와 Confluence 운영 댓글 v12를 갱신하고 재조회했다. 기존 검증 기준을 실행한 결과이며 별도 지식 갱신은 필요하지 않았다. [최종 VoiceOver 검증 결과](../../verification/accessibility/2026-11-21-search-input-audit.md#로터-링크-탐색과-문서-열기-확인)
