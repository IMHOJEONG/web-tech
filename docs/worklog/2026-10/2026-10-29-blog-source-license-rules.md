# 블로그 출처·저작권 작성 지침 분리

## Summary

[KAN-44](https://web-tech-service.atlassian.net/browse/KAN-44)의 기고 검토에서 준비한 작성 지침을 사용자 승인으로 별도 로컬 커밋에 분리한다. 글 초안·미디어·운영 배포는 이 커밋에 포함하지 않는다.

## Changed

`apps/docs/AGENTS.md`에 참고자료의 근거 구분, 외부 코드·이미지의 라이선스와 변경 표시, 직접 만든 도식과 제3자 자료의 경계를 명시한다. 기존 Next.js 자동 지침과 기고 검증 규칙은 유지한다. 새 라이선스나 소유권을 임의 부여하지 않는다.

## Notes

원본 작업 공간의 미커밋 지침만 최신 main `0da7979`로 옮긴다. 내용이 동일한지 diff로 대조하고 staged 포맷·문서·commitlint 검사를 유지한다. 코드·런타임·공개 계약 변경이 없어 별도 ADR을 추가하지 않는다. [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817)와 기존 Jira 검증 표에 로컬 커밋 결과만 연결한다.

후속 [KAN-51](https://web-tech-service.atlassian.net/browse/KAN-51) 전체 작업 트리 정리에서는 보존 커밋 `7f3c1cd`의 이 지침만 main `42e48b42` 위로 분리했다. 기존 main의 Next.js 생성 제목 수준과 다른 기고 규칙을 유지하고 출처·저작권 12줄만 추가했다. 원래 초안이나 오래된 목차 전체를 덮어쓰지 않는다.

## Open Questions

이 지침 추가는 개별 외부 저작물의 권리 확인 완료를 뜻하지 않는다. 글마다 출처·라이선스를 확인해야 한다.

## Next

새 Brotli 초안과 해당 라이선스·검증 기록은 별도 기고 커밋으로 묶는다. 원격 푸시·게시 상태 변경은 이번 승인 범위가 아니다.
