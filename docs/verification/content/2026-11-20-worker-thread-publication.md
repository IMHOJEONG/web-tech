# 워커 스레드 글의 운영 발행 검증

2026-11-21 기록 정리: 아래 초안 상태·실행·서버 유지·발행 결과는 11-20 당시 관측이다. 이번에는 정제 기록만 대조하며 원문·원시 자료를 복사하거나 실험·브라우저·게시·배포를 다시 실행하지 않는다.

## 대상과 조건

2026-11-20 KST, [KAN-63](https://web-tech-service.atlassian.net/browse/KAN-63). 콘텐츠 `f30b4e3a8877554d502bdc7846df29e883d83a59`, 앱 main `2cf837f04954d05d5ff409bdec6794ec28fd7f07`, [PR #105](https://github.com/IMHOJEONG/web-tech/pull/105). 본문·기존27회 관측은 유지하고 published·발행일만 변경했다. 최초 공개 HTTP 관측은20:22:34–35 KST이며 전체 본문 해시 대조를 후속 수행했다. 정제 자료에 각 관측 UTC를 별도로 기록한다.

## 재현 방법

별도 작업 트리와 비공개 콘텐츠 사본을 사용했다. MDX6개 코드 조각의 복제본 대조·strict 타입·별도 TCP 실행, legacy 환경의 합성 콘텐츠 회귀와 private-git 환경의 실제 발행 준비·Production 빌드를 분리했다. 출처·저작권·도식·관측 한계는 다중 검토한다.

## 결과와 증거

- 원문2개·콘텐츠/템플릿51개·목차10개·앱 타입 통과.
- 실제 발행본19편·검수 자산15개 준비와 Production 빌드 통과. 기존 두 글의 placeholder warning은 이 원고와 구분했다.
- 로컬 Production HTML에 새 관측값과 두 도식이 표시됐다.
- 배포 전 당시 Production은 READY였다. main·앱 root와 리비전 변수 미설정을 대조했다. 키·환경·보호 설정은 미변경이다.
- PR 모든 검사·CodeRabbit 리뷰 확인 후 설명 템플릿 지적을 반영했다. 미해결 코드 스레드0개, squash 최종 메시지 사전검사 후 같은 head로 병합했다. 코드 내용에 대한 새 차단 지적은 없었다.
- 해당 main SHA의 당시 Production은 READY·target production이며 heap-forge.app alias를 inspect로 대조했다. 병합 후 [CI](https://github.com/IMHOJEONG/web-tech/actions/runs/44726843375)·[CodeQL](https://github.com/IMHOJEONG/web-tech/actions/runs/44726843588)·[Documentation](https://github.com/IMHOJEONG/web-tech/actions/runs/44726843362) 모두 success다. 일반 합성 CI와 비공개 콘텐츠 인증 CI 활성화는 구분한다.
- [공개 글](https://heap-forge.app/ko/docs/category/be/node-js/worker-thread-tcp-delay)과 en 경로 모두 HTTP200, 각 canonical·설명·BlogPosting·H1 한 개·색인 허용을 확인했다. 실제 MDX의 시작·마지막 문장과 전체 정규화 본문 해시가 로컬 Production 빌드와 일치했다. 192.1→42.1ms 관측표·구성도·비교 흐름도2개가 표시됐다.
- [사이트맵](https://heap-forge.app/sitemap.xml)은 HTTP200, 전체60개 URL 중 새 ko/en URL이 각각 정확히 한 번 포함됐다. 한국어 목록에서도 새 글을 확인했다.
- Chromium1280×900·390×844에서 가로 넘침0, 목차 대상 누락0을 확인했다. 결과 절 실제 클릭 후 상단 약96px로 이동했다. 모바일 목차가 접히고 대상 heading으로 포커스가 갔으며 코드23줄 펼침도 확인했다. 두 도식은 데스크톱784px·모바일334px로 들어갔고 표는332px 영역 안에서576px 내용을 내부 스크롤한다.
- [정제 관측 자료](../artifacts/2026-11-21-worker-thread-publication-summary.json)

## 한계와 후속 작업

공용 계약 dist 생성 전 직접 메타 검사는 실패했고 표준 빌드 뒤 같은 원고 검사를 통과했다. 검토 agent의 별도 실행은 샌드박스 EPERM·승인 재시도 중단으로 완료하지 못했으며 부모의 원문2개 실행 성공과 구분한다. 새 서비스 부하 측정이 아니며 실기기·외부망은 미검증이다. 렌더러·heading 구현은 미변경이고 전체 test:article:prod의 로컬 재실행은 없었으나 동일 PR와 main CI의 article-production 검사가 통과했다. 원시 로그·화면은 Git 밖에 보관했다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-20-worker-thread-publication.md)
- [직전 초안 검토](2026-11-20-worker-thread-draft-review.md)
- [발행 절차](../../runbooks/docs-private-git-content.md)
