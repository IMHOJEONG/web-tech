# 2026-05-25 pnpm lockfile-only 재검증

## Summary

- `pnpm` catalog 도입 이후 워크스페이스 루트에서 `pnpm install --lockfile-only`를 다시 실행해 lockfile-only 경로를 재검증했다.
- 로컬 제한 환경에서는 `registry.npmjs.org/pnpm` 메타 조회가 실패했지만, 명령 자체는 성공했다.
- 외부 네트워크가 가능한 환경으로 같은 명령을 다시 실행했고, 최종적으로 오류 없이 정상 종료되는 것을 확인했다.

## Command

```bash
pnpm install --lockfile-only
```

## Result

- scope: `all 10 workspace projects`
- result: `Already up to date`
- toolchain: `pnpm v11.0.4`

## Notes

- 이번 검증으로 catalog/reference 해석 자체는 현재 lockfile-only 경로에서 문제 없이 동작하는 상태로 본다.
- 출력된 `Update available` 안내는 설치 검증 실패가 아니라 `pnpm` 최신 버전 안내 메시지다.
