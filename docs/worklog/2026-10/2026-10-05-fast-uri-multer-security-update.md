# fast-uri·multer 보안 업데이트

## Summary

`origin/main`의 `2dde9133a766a08089bcaa5111d2db713dcfc9fa`에서 `codex/security-fast-uri-multer` 브랜치를 만들고, 두 전이 패키지의 override와 lockfile을 갱신했다. `feature/docs`의 별도 기능 변경은 포함하지 않았다. 현재 작업 트리에 반영된 상태이며 커밋·푸시·병합·배포는 수행하지 않았다.

## Changed

- `pnpm-workspace.yaml`: `fast-uri`를 `^4.1.5`, `multer`를 `^2.4.0`으로 변경했다. 보안 패치 최소값과 같은 major 범위를 함께 제한한다.
- `pnpm-lock.yaml`: 실제 해석 버전은 `fast-uri@4.2.1`, `multer@2.4.0`이다. Multer에서 더 이상 사용하지 않는 `concat-stream`·`typedarray`도 제거됐다. 다른 패키지 버전은 변경하지 않았다.
- [검증 보고서](../../verification/security/2026-10-05-fast-uri-multer.md)에 실행 명령, 회귀 검사, 잔여 audit 결과를 분리해 기록했다.
- [TODO](../../todo/todo.md)에 기본 브랜치 병합 후 재검증과 별도 취약점 후속 조치를 등록했다.

## Notes

lint·typecheck·기본 테스트, 두 백엔드 E2E·빌드, docs 라이브러리·콘텐츠 검사·production 빌드와 commitlint 동작을 확인했다. 최초 타입 검사는 브랜치 전환 전의 Next.js 생성 타입 때문에 실패했으며 현재 라우트로 재생성한 후 통과했다. 전체 audit은 다른 패키지의 취약점 5건 때문에 실패한다.

앱 구조·공개 계약을 바꾸지 않는 의존성 보안 갱신이므로 새 ADR은 만들지 않았다.

## Open Questions

- 잔여 Next.js critical 경고의 실제 운영 노출 범위와 배포 브랜치별 패치 범위를 후속 조사해야 한다.
- 현재 앱에 업로드 기능 사용처가 없으므로 Multer의 중단 업로드 정리 동작을 실제 서비스 경로로 시험하지 않았다.

## Next

리뷰와 커밋·푸시 후 `main` 대상 PR에서 CI를 확인한다. 병합 후 Dependabot 경고 종료를 재확인하고 필요한 feature 브랜치에 `main`을 동기화한다. NAS 이미지와 Vercel 배포 검증은 별도로 수행한다.
