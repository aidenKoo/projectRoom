# 배포 가이드

## 사전 준비

### 1. 환경 변수 설정

프로덕션 환경 변수 파일을 생성합니다:

```bash
cp .env.production.example .env.production
```

`.env.production` 파일을 열어 다음 항목들을 실제 값으로 변경하세요:

#### 필수 변경 항목
- `DB_ROOT_PASSWORD`: MariaDB root 비밀번호 (강력한 암호로 변경)
- `DATABASE_PASSWORD`: 애플리케이션 DB 비밀번호 (강력한 암호로 변경)
- `REDIS_PASSWORD`: Redis 비밀번호 (강력한 암호로 변경)
- `FIREBASE_PROJECT_ID`: Firebase 프로젝트 ID
- `FIREBASE_PRIVATE_KEY`: Firebase 서비스 계정 Private Key
- `FIREBASE_CLIENT_EMAIL`: Firebase 서비스 계정 이메일
- `FIREBASE_STORAGE_BUCKET`: Firebase Storage 버킷 이름
- `CORS_ORIGIN`: 프로덕션 프론트엔드 도메인 (쉼표로 구분)

### 2. Firebase 서비스 계정 설정

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 설정 > 서비스 계정 탭
3. "새 비공개 키 생성" 클릭하여 JSON 파일 다운로드
4. JSON 파일의 내용을 `.env.production`의 Firebase 관련 변수에 입력:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (개행 문자 \n 유지)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

## 배포 방법

### Docker Compose를 사용한 배포

#### 1. 프로덕션 빌드 및 실행

```bash
# 환경변수 파일 지정하여 실행
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

#### 2. 로그 확인

```bash
# 모든 서비스 로그
docker-compose -f docker-compose.prod.yml logs -f

# NestJS 서비스만
docker-compose -f docker-compose.prod.yml logs -f nestjs

# MariaDB 서비스만
docker-compose -f docker-compose.prod.yml logs -f mariadb
```

#### 3. 서비스 상태 확인

```bash
docker-compose -f docker-compose.prod.yml ps
```

#### 4. 헬스체크 확인

```bash
curl http://localhost:3001/health
```

#### 5. 중지 및 삭제

```bash
# 중지
docker-compose -f docker-compose.prod.yml stop

# 삭제 (볼륨 제외)
docker-compose -f docker-compose.prod.yml down

# 삭제 (볼륨 포함 - 주의: 데이터 삭제됨)
docker-compose -f docker-compose.prod.yml down -v
```

### 개별 서비스 재시작

```bash
# NestJS만 재시작
docker-compose -f docker-compose.prod.yml restart nestjs

# 이미지 재빌드 후 재시작
docker-compose -f docker-compose.prod.yml up -d --build nestjs
```

## 데이터베이스 마이그레이션

### 초기 설정
컨테이너가 처음 시작될 때 `docker/mariadb/init.sql`이 자동으로 실행됩니다.

### 추가 마이그레이션 적용

```bash
# MariaDB 컨테이너에 접속
docker exec -it projectroom-mariadb-prod mysql -u projectroom -p

# 또는 SQL 파일 직접 실행
docker exec -i projectroom-mariadb-prod mysql -u projectroom -p projectroom < docker/mariadb/migration-v13.sql
```

## 포트 구성

기본 포트 설정:
- API: 3001 (외부) → 3000 (컨테이너 내부)
- MariaDB: 3306
- Redis: 6379

포트 변경이 필요한 경우 `.env.production` 파일의 다음 변수를 수정하세요:
- `API_PORT`: API 외부 포트
- `DB_PORT`: MariaDB 외부 포트
- `REDIS_PORT`: Redis 외부 포트

## 보안 체크리스트

- [ ] 모든 기본 비밀번호 변경 (DB_ROOT_PASSWORD, DATABASE_PASSWORD, REDIS_PASSWORD)
- [ ] Firebase 서비스 계정 키 올바르게 설정
- [ ] CORS_ORIGIN을 실제 프로덕션 도메인으로 설정
- [ ] .env.production 파일이 .gitignore에 포함되어 있는지 확인
- [ ] 로그 레벨을 'info' 또는 'warn'으로 설정 (디버그 로그 비활성화)
- [ ] 컨테이너가 non-root 유저로 실행되는지 확인 (Dockerfile에 이미 설정됨)

## 모니터링

### 컨테이너 리소스 사용량

```bash
docker stats
```

### 애플리케이션 로그

로그는 JSON 형식으로 저장되며, 최대 10MB 크기로 3개 파일까지 로테이션됩니다.

```bash
# 실시간 로그
docker-compose -f docker-compose.prod.yml logs -f nestjs

# 최근 100줄
docker-compose -f docker-compose.prod.yml logs --tail=100 nestjs
```

## 백업

### 데이터베이스 백업

```bash
# 백업 생성
docker exec projectroom-mariadb-prod mysqldump -u root -p projectroom > backup_$(date +%Y%m%d_%H%M%S).sql

# 백업 복원
docker exec -i projectroom-mariadb-prod mysql -u root -p projectroom < backup_20250101_120000.sql
```

### Redis 백업

```bash
# Redis는 appendonly 모드로 실행되어 자동으로 데이터 영속화됩니다
# 볼륨 위치: redis-data

# 수동 저장 명령
docker exec projectroom-redis-prod redis-cli -a ${REDIS_PASSWORD} SAVE
```

## 트러블슈팅

### 컨테이너가 시작되지 않을 때

```bash
# 로그 확인
docker-compose -f docker-compose.prod.yml logs

# 특정 서비스 로그
docker-compose -f docker-compose.prod.yml logs nestjs
```

### 데이터베이스 연결 실패

1. MariaDB가 healthy 상태인지 확인:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

2. 환경변수 확인:
   ```bash
   docker-compose -f docker-compose.prod.yml exec nestjs env | grep DATABASE
   ```

3. 네트워크 연결 테스트:
   ```bash
   docker-compose -f docker-compose.prod.yml exec nestjs ping mariadb
   ```

### Redis 연결 실패

```bash
# Redis 연결 테스트
docker-compose -f docker-compose.prod.yml exec nestjs sh -c 'redis-cli -h redis -a $REDIS_PASSWORD ping'
```

### Firebase 인증 실패

1. 환경변수가 올바르게 설정되었는지 확인
2. Private Key의 개행 문자(\n)가 올바르게 포함되어 있는지 확인
3. Service Account에 필요한 권한이 있는지 Firebase Console에서 확인

## 성능 최적화

### 프로덕션 설정
현재 프로덕션 Dockerfile은 다음 최적화를 포함합니다:
- 멀티스테이지 빌드로 이미지 크기 최소화
- production 의존성만 포함
- Non-root 유저로 실행 (보안)
- npm cache 정리
- Health check 설정

### 추가 최적화 옵션

1. **데이터베이스 커넥션 풀 설정** (필요시)
2. **Redis 메모리 제한 설정** (필요시)
3. **로드 밸런서 추가** (대규모 트래픽 대비)
4. **CDN 연동** (정적 파일 제공)

## 업데이트

### 애플리케이션 업데이트

```bash
# 1. 코드 풀
git pull origin main

# 2. 재빌드 및 재시작
docker-compose -f docker-compose.prod.yml up -d --build nestjs

# 3. 확인
docker-compose -f docker-compose.prod.yml logs -f nestjs
```

### 데이터베이스 스키마 업데이트

```bash
# 새 마이그레이션 파일 적용
docker exec -i projectroom-mariadb-prod mysql -u projectroom -p projectroom < docker/mariadb/migration-vXX.sql
```

## 개발 환경과의 차이점

| 항목 | 개발 환경 | 프로덕션 환경 |
|------|----------|-------------|
| Docker Compose 파일 | docker-compose.yml | docker-compose.prod.yml |
| NODE_ENV | development | production |
| 볼륨 마운트 | 소스코드 마운트 (hot reload) | 이미지에 빌드됨 |
| 로그 레벨 | debug | info |
| 재시작 정책 | 없음 | always |
| Redis 비밀번호 | 없음 | 있음 |
| 관리 도구 (Adminer, RedisInsight) | 포함 | 미포함 (별도 배포 권장) |
