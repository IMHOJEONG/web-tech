# Docs Resource Content Foundations

## Summary

HeapForge의 category를 실제 published 문서가 있는 학습 축으로 정리하고, 첫 번째 고품질 기준 문서 묶음을 추가한다.

## Changed

- 빈 상태였던 React Router, Svelte, Astro, Rust category 노출을 보류했다.
- `FE / Browser`, `Computer Science / Network`, `Infrastructure / Containers`를 추가했다.
- category card가 고정 이미지 목록 대신 category model의 icon과 설명을 사용하도록 정리했다.
- `/docs` 검색과 section filter에 `Infrastructure` 분류를 추가했다.
- 브라우저 렌더링, 네트워크 요청 경로, 컨테이너 health 경계 문서를 추가했다.
- 품질 기준과 Phase 1~3 확장 순서를 resource content roadmap으로 고정했다.
- 반복되는 가이드형 제목과 고정 목차를 걷어내고, 각 주제의 질문에서 시작하는 문체로 다듬었다.

## Notes

- `apps/docs/category/fe/browser/critical-rendering-path-diagnosis.mdx`
- `apps/docs/category/computer-science/network/dns-tcp-tls-http-request-flow.mdx`
- `apps/docs/category/infra/containers/health-readiness-boundary.mdx`

## Open Questions

각 문서의 설명과 재현 절차는 후속 검수로 공개 여부를 결정한다. 결과는 [CRP 실험 기록](2026-09-13-critical-rendering-path-lab.md)에 이어서 남겼다.

## Next

1. Testing boundary: unit, integration, contract, E2E
2. Observability foundation: log, metric, trace
3. Security foundation: SSRF와 outbound request policy
4. API design: idempotency와 retry-safe request

새 category를 먼저 만들지 않고 문서를 준비한 뒤 노출하는 순서를 유지한다.
