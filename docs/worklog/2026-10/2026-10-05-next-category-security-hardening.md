# Next.js 패치와 카테고리 glob 입력 경계 보강

## Summary

잔여 보안 조사에 따라 Next.js 패치, 카테고리 입력 allowlist, brace-expansion 갱신을 순서대로 반영했다. 공개 URL을 glob 패턴에 직접 넣던 경로를 차단했다. 패치 미출시 상태인 braces 경고는 남는다.

## Changed

- docs catalog의 Next.js·MDX를 16.3.8로 정렬하고 brace-expansion override를 ^5.0.12로 갱신했다.
- taxonomy에 `getCategoryTopic`을 추가해 페이지·loader가 정확한 main/sub 조합을 공유 검증한다.
- 단위 검사와 production 카테고리 E2E를 추가했다. 기존 production article 명령과 CI의 테스트 탐색 범위에 들어간다.
- [라우팅 정책](../../architecture/docs-content-routing-policy.md#category-input-boundary)에 경계와 스트리밍 검사 기준을 기록했다. [검증 보고서](../../verification/security/2026-10-05-next-category-hardening.md)와 목차·TODO도 갱신했다.

## Notes

검사는 로컬 production 및 테스트 전용 원격 fixture에서 실행했다. 실제 NAS·Vercel로 공격 요청을 보내지 않았으며 비밀값은 기록하지 않았다. 빌드 동시 실행으로 발생한 공용 UI 출력물 경합과 E2E의 잘못된 noindex 개수 가정도 보고서에 남긴다.

기존 라우팅 계약의 입력 검증 보강과 패치 갱신이므로 새 ADR은 만들지 않았다. 기존 fast-uri·multer 수정은 유지하고 커밋·푸시는 하지 않았다.

## Open Questions

braces의 실제 패치가 출시되기 전 fast-glob 제거까지 진행할지, 상위 패치를 기다리면서 고정 입력만 허용할지는 별도 결정이 필요하다. 배포 브랜치의 OG 이미지 경로 정상 회귀도 남는다.

## Next

변경 단위별 커밋·PR과 원격 CI를 검토한다. main 병합 후 feature/docs 등 필요한 배포 브랜치에 전달하고 Dependabot·배포를 재검증한다. audit의 잔여 high 1개를 해결 전까지 추적한다.
