# Locale 인자 기반 캐시 분리 시험 결과

## Summary

locale을 명시적 함수 인자로 넘기는 격리 fixture에서 캐시 키 분리와
언어별 선택적 만료를 검증했다. 전체 시험 종료 코드 0을 확인했다.

## Changed

- `--locale-cache-key` 옵션 추가. 기존 locale 경계 모드를 포함한다.
- `locale-cache-probe.ts`와 `assert-locale-cache-key.mjs` 추가.
- 독립 재현 가이드 추가 및 기존 runbook에 연결.

## Notes

실행 환경: Node.js v24.12.0, Next.js 16.3.4.

```bash
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs --locale-cache-key
```

실제 출력의 핵심:

```text
[PASS] Locale cache: separate keys and sequential warm reuse
[PASS] Locale cache: concurrent warm requests remain isolated
[PASS] Locale cache: rejected invalidation preserves both entries
[PASS] Locale cache: selective ko/en invalidation and renewed warm reuse
[locale-cache-evidence] {
  koInitial: 'a3ac7ef9-21cb-494c-8925-48e8d4db791b',
  enInitial: '47f8ff0c-719b-49dd-b5ae-e683aca4c463',
  koRenewed: 'b53d8f30-8b33-46e8-9680-30e50e69ea79',
  enRenewed: '143159f7-590e-431a-b737-2b335c2e037b'
}
[PASS] Article renders V3 { minimal: false }
[cache-test] All checks passed
```

중간 재조회가 동일 UUID였다는 사실과 반대 언어의 UUID가 유지됐다는 사실은
검증 모듈의 deepEqual assertion으로 검사했다. 위 로그는 최종 요약이며 모든 응답 덤프는 아니다.
UUID는 시험용 실행 식별자이며 인증 토큰이 아니다.
기존 locale 10개 사례와 원격 콘텐츠 V1/V2/V3 캐시·상세 검증도 함께 통과했다.

이는 실제 JSON 메시지를 인자로 선택하는 함수 캐시 실험이다.
운영 코드에 locale 캐시를 도입하거나 next-intl 자체를 캐시 함수 안에서 호출한 시험은 아니다.
루트 instant=false, fetch TTL=0은 임시 앱에만 적용했고 운영 설정과 파일은 유지했다.

## Open Questions

- 브라우저 탐색과 다중 인스턴스에서도 기대하는 언어 분리가 유지되는가?
- 정적 셸 검증을 완화하지 않는 구조에서는 locale을 어디서 결정할 것인가?

## Next

[재현 가이드](../runbooks/docs-locale-cache-key-test.md)에 따라 독립 재실행할 수 있다.
다음 시험은 브라우저 언어 전환 또는 정적 셸 경계 중 하나로 범위를 좁힌다.
이번 작업에서는 커밋/배포하지 않았다.
