# 서비스 복구 리허설

## 목적과 준비 조건

[복구 정책](../architecture/platform-recovery-policy.md)의 목표를 실제로 측정한다. 이 절차는 아직 NAS·관리형 DB에서 실행하지 않았다. 운영자 승인, 분리된 테스트 호스트/DB, 백업 읽기 권한, 복구용 도구와 암호화 키를 준비한다. 운영 DB나 콘텐츠 볼륨을 복원 대상으로 사용하지 않는다.

기록할 항목: 기준 커밋, 이전 deployment ID/이미지 digest, 백업 생성 시각(UTC), 장애 시작·감지·복구 시각, 콘텐츠/DB 스키마 버전. 로그에는 연결 문자열·토큰·개인 데이터·dump를 남기지 않는다.

## 실행 순서

### 1. 배포 전 확인

저장소 루트에서 실행한다. 운영 NAS용 env 파일은 출력하거나 문서에 복사하지 않는다.

```bash
git rev-parse HEAD
docker compose --env-file apps/docs-backend/.env.nas -f apps/docs-backend/docker-compose.yml config --quiet
docker compose --env-file apps/docs-backend/.env.nas -f apps/docs-backend/docker-compose.yml ps docs-backend
```

마지막 정상 deployment와 image digest가 실제로 복구 가능한지 확인한다. 새 코드·이전 코드가 현재 콘텐츠 계약과 DB 스키마를 모두 읽을 수 없는 경우 배포를 중단한다.

### 2. 코드·이미지 복귀 연습

- 프론트는 Preview/격리 프로젝트에서 이전 검증 deployment로 복귀해 목록·검색·상세와 locale을 확인한다. Production 롤백은 실제 장애 또는 별도 승인된 유지보수에서만 한다.
- NAS는 별도 Compose project, 포트, 복사된 콘텐츠 디렉터리와 테스트용 token file을 사용한다. 기존 [NAS 업데이트·롤백 명령](docs-backend-nas-deployment.md#update-and-rollback)을 테스트 env 파일로 실행한다. 같은 이름의 운영 컨테이너나 볼륨을 재사용하지 않는다.
- `/health`와 인증된 목록·상세, 대표 이미지, 토큰 없는 요청의 401을 검사한다. health만 성공하고 콘텐츠가 없는 경우 실패로 기록한다. 테스트 토큰을 curl 명령 이력·디버그 출력에 노출하지 않는다.

### 3. 콘텐츠 복원 연습

백업 manifest와 checksum을 확인하고 새 디렉터리에만 복원한다. Markdown과 이미지의 게시 버전, 문서 수, 대표 상세·이미지 경로를 원본 manifest와 비교한다. 심볼릭 링크와 archive 경로를 점검하고 운영 디렉터리 위에 압축을 풀지 않는다. 콘텐츠 검증기를 통과한 복원본으로 격리 API를 실행한다.

캐시 갱신 webhook은 API 복원·검증 이후에만 호출한다. 캐시 만료를 콘텐츠 복구로 간주하지 않는다.

### 4. PostgreSQL 백업·격리 복원 연습

운영 DB 버전과 호환되는 `pg_dump`/`pg_restore`를 사용한다. 아래 service 이름은 예시이며 로컬 libpq service 파일에 실제 권한과 호스트를 등록한다. 비밀번호는 권한 제한된 password 파일/비밀 저장소로 공급한다. `radar-drill`이 비운영 호스트의 빈 연습용 DB인지 사람이 먼저 확인한다.

```bash
umask 077
pg_dump --dbname='service=radar-backup' --format=custom --file="$BACKUP_FILE"
pg_restore --list "$BACKUP_FILE"
psql --dbname='service=radar-drill' --no-psqlrc --command='SELECT current_database(), inet_server_addr(), version();'
pg_restore --dbname='service=radar-drill' --exit-on-error --single-transaction --no-owner --no-privileges "$BACKUP_FILE"
```

`BACKUP_FILE`은 사전에 정한 새 파일 경로다. 기존 백업을 덮어쓰지 않는다. `--list` 성공은 실제 복원 성공을 증명하지 않는다. `--no-owner --no-privileges`는 격리 연습용 설정이며 운영 role/grant 복구를 대신하지 않는다. 운영 권한 재구성은 별도 검증한다.

복원 후 스키마 버전, 기준 manifest의 핵심 테이블 row count, 관심 목록·매칭 관계를 확인한다. 연습용 DB에만 연결한 backend에서 API 읽기와 임시 데이터 쓰기/삭제를 검사하고 외부 알림·수집 작업은 비활성화한다. 운영 `DATABASE_URL`/`DIRECT_URL`을 복사해 사용하지 않는다.

### 5. 결과 기록

백업 시점과 장애 시점의 차이로 실제 데이터 손실 범위를 계산한다. 복구 완료 시각은 API뿐 아니라 주요 사용자 동작이 정상인 시각이다. `docs/verification/`에 [검증 템플릿](../process/documentation-templates.md)을 따라 결과를 작성한다. 정제된 시간·건수·checksum만 artifact로 남기며 백업 자체는 저장하지 않는다.

## 기대 결과

- 이전 코드·이미지 복귀와 데이터 복원을 각각 성공/실패로 판정한다.
- 권한·데이터·사용자 동작 검사가 통과하고 정책의 RTO/RPO 초안과 실제 시간을 비교한다.
- 15분 관찰 중 오류 증가나 재시작이 없고 미복원 항목이 명시된다.

## 실패 대응과 복구

대상이 운영 DB/볼륨이거나 host가 불명확하면 즉시 중단한다. 백업 checksum 불일치, 불완전 복원, 권한·스키마 불일치는 성공으로 처리하지 않는다. 연습 환경을 외부 트래픽에서 격리하고 운영 연결 정보가 없는지 확인한 뒤 원인을 조사한다. 실패를 숨기기 위해 운영 데이터 삭제·자동 스키마 downgrade를 수행하지 않는다.

## 관련 검증

실제 복구 검증은 미실행이다. 문서 검사만으로 백업 스케줄·RTO/RPO 달성을 보장하지 않는다. [후속 작업](../todo/todo.md)과 [작업 기록](../worklog/2026-09/2026-09-30-platform-recovery-policy.md)을 참고한다.
