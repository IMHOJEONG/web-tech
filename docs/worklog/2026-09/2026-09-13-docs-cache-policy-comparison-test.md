# 기존 모델의 재검증 정책 비교 테스트

## Summary

권고한 실험 순서에 따라 Cache Components 전환 전에 기존 모델의
`max`와 `{ expire: 0 }`을 실제 Next production 서버에서 비교했다.
운영 코드, 캐시 설정, NAS 데이터는 변경하지 않았다.

## Changed

- `apps/docs/scripts/fixtures/cache-probe.ts`: 임시 앱 전용 인증된 max 재검증 POST 추가.
- `apps/docs/scripts/test-content-cache-prod.mjs`: 원본 응답 보류 장치와 두 정책 assertion 추가.
- production 테스트 runbook과 캐시 모델 비교 문서에 실험 연결.

## Notes

저장소 루트에서 실행한 명령:

```bash
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs
```

내부적으로 격리 복사본에 `next build --webpack`, `next start`를 실행한다.
매번 임시 인증값을 생성하며 `.env`와 운영 `.next`는 사용하지 않는다.
기존 공용 패키지 빌드와 설치된 의존성을 이용했다.

실행 출력 (종료 코드 0):

```text
[PASS] Cold read and Data Cache reuse { index: 1, body: 1 }
[PASS] expire: 0 waited for origin and returned V2 { elapsedMs: 117 }
[PASS] Authentication, lazy invalidation, refreshed index/body, article rendering { index: 2, body: 2 }
[PASS] max returned stale V2 while origin was held { elapsedMs: 4 }
[PASS] max background refresh and warm V3 reuse { index: 4, body: 4 }
[cache-test] All checks passed
```

검증한 사실:

- expire: 0은 원본 요청이 도착한 뒤 100ms 더 보류해도 응답이 완료되지 않았다. 원본을 풀자 최신 V2를 반환했다.
- max는 원본 응답을 보류한 상태에서도 기존 V2를 반환했다. 원본을 풀고 조회하자 목록과 본문 모두 V3가 되었다.
- 갱신 완료 후 반복 조회는 원본 호출을 추가하지 않았다.
- 두 재검증 경로의 인증 실패를 검사했고, 실제 운영 웹훅의 인증 실패가 캐시를 만료시키지 않는지도 확인했다.
- 정상 재검증 호출 자체는 원본을 선제 조회하지 않았다.

117ms와 4ms는 인위적 보류를 포함한 단일 실행 관측값이다. 성능 배수나 운영 지연 예측으로 쓰면 안 된다.
max 단계에서 목록/본문 호출이 각각 2회 늘었다. probe 내부 반복 조회와 갱신 관측용 polling이 있으므로,
이 실험은 백그라운드 요청이 정확히 1회로 합쳐진다는 증거가 아니다. 중복 억제 성능은 별도 계측이 필요하다.

## Open Questions

- Vercel Preview에서도 stale 응답과 백그라운드 갱신이 같은 순서로 관측되는가?
- NAS 장애와 동시 요청에서는 갱신 횟수와 정상 데이터 보존이 어떻게 달라지는가?
- 실제 독자 경험에서는 발행 즉시 최신성보다 빠른 기존 응답이 더 적절한가?

## Next

운영 정책은 expire: 0을 유지한다. 별도 승인 후 Preview에서 비교하거나,
다음 단계인 Cache Components 모델 전환 실험을 분리해서 진행한다.
이번 결과는 Cache Components 도입 효과를 입증하지 않는다.
