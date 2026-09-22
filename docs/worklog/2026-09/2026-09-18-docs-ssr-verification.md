# docs 서버 렌더링 검증

## Summary

SSR 추가 적용 필요성을 검토했다. 이미 query 화면/상세는 동적 서버 렌더링되고 소개/허브는 정적으로 생성되어 전면 전환이 불필요하다.

## Changed

test-content-cache-prod.mjs에 빌드 경로 표 출력 및 script를 제외한 article 본문 검증을 추가했다.
정책/증거/재현 명령은 [서버 렌더링 검토](../../architecture/docs-server-rendering-assessment.md)에 기록했다.
부가 영역 분리의 [스트리밍 측정 절차](../../runbooks/docs-article-streaming-performance.md)를 함께 정리했다.
운영 렌더링 및 캐시 설정은 변경하지 않았다.

## Notes

격리된 운영 모델 전체 프로덕션 통합 테스트 통과. 실제 NAS/배포 성능 및 브라우저 JS 비활성 화면은 미검증이다.
2026-09-19 미커밋 변경 검토 중 Node.js 24에서 `pnpm --filter docs test:cache:prod`를
재실행했고 모든 검사를 통과했다. 다른 작업과 분리하여 커밋하며 push는 하지 않는다.

## Open Questions

상세 렌더 결과 캐시나 인기 글 정적 생성으로 얻을 실제 이점은 배포 환경 측정이 필요하다.

## Next

cold/warm TTFB와 LCP 및 원격 장애 복구를 측정한 뒤 병목 라우트만 최적화한다.
