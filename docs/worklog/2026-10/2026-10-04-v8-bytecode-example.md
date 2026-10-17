# V8 바이트코드 실험 분리

## Summary

V8 입문 글에 직접 싣기보다, 실제 실행 결과와 재현 스크립트를 별도의 로컬 실험실로 분리했다.

## Changed

- [V8 입문 글](../../../apps/docs/data/v8/bytecode.mdx)은 개념과 실험 시 주의점만 남겼다.
- `/Users/coder/Desktop/project/labs/v8-bytecode-lab`에 독립 실험 README와 실행 스크립트를 추가했다. 서비스 저장소의 V8 검증 보고서는 중복을 피하려고 제거했다.
- [TODO](../../todo/todo.md)에서 V8 실험 항목만 완료로 표시하고 ARIA 재현 과제는 남겼다.

## Notes

- 실험실 스크립트를 Node.js 24.12.0과 26.8.1에서 각각 실행해 핵심 명령 순서와 반환값을 확인했다. 재현 명령과 관찰값은 실험실 README에만 둔다.
- 분리 후 `mise exec -- pnpm --filter docs test:content`에서 단위 테스트 20개와 콘텐츠 메타데이터·스타일 검사 16개 파일이 통과했다. 바이트코드 관찰을 성능 비교로 확대 해석하지 않는다.

## Open Questions

- 없음. 실험은 로컬 전용으로 유지하며 원격 저장소 연결이나 배포를 하지 않는다. 필요하면 하위 프로젝트에서 로컬 Git 이력만 사용한다.

## Next

- ARIA 재현 환경과 수정 전후 결과는 별도 증거 확보 후 보완한다.
