# main CI 브라우저 의존성 DNS 실패 보완

## Summary

PR #89의 운영 배포 성공과 main CI 준비 단계 실패를 분리해 기록했다. 성공·실패 실행의 이미지가 같음을 확인하고, 브라우저 작업의 apt 설치 의존 경로를 공식 이미지로 격리했다. 사용자 승인 범위는 커밋·푸시·별도 PR·자동 Preview이며 main 병합·운영 배포는 하지 않는다.

## Changed

- 기존 미커밋 Feed 배포 기록을 보존·정리하고 ADR-0029·목차의 운영 미배포 표기를 실제 증거에 맞췄다. CI 구현과 별도 문서 커밋으로 구분한다.
- shared-ui·offline-reading·docs-browser에 버전·digest 고정 공식 이미지를 사용한다. 매 실행의 apt 설치 대신 실제 Chromium 렌더링 사전 검사를 넣었다.
- 이미지 버전 일치·사전 검사 순서와 실행/렌더/정리 오류 전파 회귀를 test:repo에 포함했다. 신규 TypeScript도 기존 toolchain 타입 검사 범위에 넣었다.
- 기존 8개 suite·실패 집계·Node 보안 하한·공개 증거 제한과 pnpm·lockfile은 유지했다. 운영·호스트 네임서버·mirror·TLS 설정은 변경하지 않았다.
- 첫 원격 실행에서 오프라인 증거 검사만 `unzip` 누락으로 실패했다. 고정 이미지의 Python 3 표준 ZIP·CRC 검사로 외부 명령 의존을 보완하고 손상·누락을 거부하는 6개 회귀를 추가했다. 새 패키지·apt 설치·검사 생략은 없다.

## Notes

확인된 오류와 더 깊은 DNS 원인의 미확정을 [검증 보고서](../../verification/resilience/2026-11-11-ci-browser-runtime.md)에 구분했다. 로컬 회귀 245개·타입 검사·네트워크 차단 Linux의 실제 렌더링 및 누락 시 실패를 확인했다. 최초 sandbox의 EPERM 실패도 보존한다. 이미지 선택·갱신 책임은 [ADR-0030](../../architecture/adr-0030-browser-ci-runtime-image.md)에 기록했다.

추적은 [KAN-67](https://web-tech-service.atlassian.net/browse/KAN-67) 댓글 10102와 [Confluence 후속](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira?focusedCommentId=17334273)을 재사용한다. 원시 로그·응답·캡처·다른 작업 트리 및 기존 백업은 공개·삭제하지 않는다.

2026-11-12 원격 후속: `e033dc5`로 기존 배포 기록, `8e4e2c3`으로 CI 격리·회귀·문서를 분리해 푸시하고 [PR #90](https://github.com/IMHOJEONG/web-tech/pull/90)을 생성했다. 같은 head의 원격 브라우저 사전 검사·제품 suite 8개는 모두 성공했지만 오프라인 증거의 `unzip` 누락 때문에 [전체 CI](https://github.com/IMHOJEONG/web-tech/actions/runs/43045882622)는 실패했다. 실패 원인을 숨기지 않고 ZIP 검사 보완 후 저장소 251개·타입·ESLint·network-none Linux ZIP 회귀 6개·실제 증거 검사를 통과했다. 후속 head 원격 CI는 다음 단계로 구분한다.

## Open Questions

당시 resolver 설정·패킷이 없어 upstream DNS의 더 깊은 실패 원인은 미확정이다. 공식 이미지 격리는 모든 네트워크 의존을 없애는 해결책이 아니며 MCR 접근과 불변 이미지의 보안 갱신을 관리해야 한다.

## Next

승인된 별도 PR에서 같은 head의 CI·CodeQL을 확인하고 결과를 연결한다. main의 이전 실패 run은 성공으로 바꾸지 않는다. 병합·운영 배포는 별도 승인 전까지 하지 않는다.
