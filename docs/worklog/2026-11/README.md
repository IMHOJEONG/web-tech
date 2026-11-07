# 2026-11 작업 기록

- [11-07 snapshot·포인터 임시 실험](2026-11-07-snapshot-pointer-lab.md): 새 임시 root의 파일 승격·실패·동시 읽기 검증 후 사용자 승인으로 구현·정제 문서를 분리 커밋. 원시 자료 제외·NAS 미변경·미푸시.

- [11-06 공용 게시 무결성 계약](2026-11-06-publication-integrity-contract.md): revision·manifest·포인터 스키마와 순수 SHA-256 검증·경계 회귀. 사용자 승인 후 구현·정제 문서를 분리 커밋하며 실제 NAS·API·배포는 미변경.

- [11-06 NAS revision 검증 설계](2026-11-06-nas-revision-design.md): 불변 스냅샷·현재 포인터·원본 bytes 검증의 제안 ADR. 실험 공개 커밋과 분리하고 공용 계약의 근거로 후속 검수하며 운영 미적용.

- [11-06 게시 revision·캐시 세대 실험](2026-11-06-publication-generation-experiment.md): test-only 키 격리·이전 쓰기 거절·실제 Next 대조 검사. 사용자 승인 후 실험·정제 문서만 공개 검수·로컬 커밋하며 NAS 후속 설계·운영 반영과 분리.

- [11-03 캐시 만료 시각 경계](2026-11-03-cache-expiry-boundary-audit.md): PR #83 병합 후 읽기 전용 시각 관측·엄격 비교 회귀. 11-06 정제본 공개 검수·로컬 커밋과 원격 반영을 구분하며 실제 최초 원인은 미확정.

- [11-03 순차 개선 후속](2026-11-03-docs-sequential-followups.md): in-flight 캐시 진단·안전한 원격 오류·브라우저 점검·macOS 계정 준비. 로컬 검증과 후속 공개·병합 승인을 구분하며 운영 설정은 미변경.

- [11-01 PR #81 운영 배포·캐시 검사 분리](2026-11-01-pr81-deploy-cache-diagnostics.md): main·Production 검증 후 KAN-58 분리, stale 정상 본문과 로그 누락 구분. 최초 간헐 원인은 미확정.
