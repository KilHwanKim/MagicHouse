# Vercel KV 설정 가이드

## ⚠️ 중요: Vercel KV는 Sunset되었습니다

Vercel KV는 더 이상 사용할 수 없습니다. 대신 다음 옵션을 사용하세요:

## 옵션 1: Upstash Redis (권장)

### 1. Upstash 계정 생성
- https://upstash.com 에서 무료 계정 생성

### 2. Redis 데이터베이스 생성
- Upstash 대시보드에서 "Create Database" 클릭
- Region 선택 (예: `ap-northeast-1` - 서울)
- "Create" 클릭

### 3. Vercel과 연결
- Vercel 대시보드 → 프로젝트 → Storage 탭
- "Create Database" → "Upstash" → "Upstash Redis" 선택
- Upstash 계정과 연결
- 프로젝트에 연결

### 4. 환경 변수 확인
Vercel이 자동으로 다음 환경 변수를 추가합니다:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 5. 로컬 개발용 환경 변수 설정
`.env` 파일에 추가:
```
KV_REST_API_URL=https://your-database.upstash.io
KV_REST_API_TOKEN=your-token-here
```

Upstash 대시보드에서 "REST API" 탭에서 URL과 Token을 복사하세요.

## 옵션 2: Redis Cloud (Vercel Marketplace)

### 1. Vercel 대시보드에서 설정
- Storage → Create Database → "View all partners"
- "Redis Cloud" 선택
- 계정 생성 및 데이터베이스 생성

### 2. 환경 변수 설정
Redis Cloud도 동일한 환경 변수를 사용합니다.

## 옵션 3: 로컬 테스트용 (Upstash 무료 계정)

로컬에서만 테스트하려면:

1. Upstash.com에서 무료 계정 생성
2. Redis 데이터베이스 생성
3. `.env` 파일에 REST API 정보 추가:
   ```
   KV_REST_API_URL=https://your-db.upstash.io
   KV_REST_API_TOKEN=your-token
   ```

## 코드 수정 필요사항

현재 코드는 `@vercel/kv` 패키지를 사용하고 있습니다. Upstash Redis도 동일한 패키지를 사용하므로 코드 변경이 필요 없습니다.

## 테스트

1. 환경 변수 설정 후 서버 재시작
2. 테스트 페이지 접속:
   ```
   http://localhost:3000/tests/vercel-kv-shared-records.html
   ```

## 참고

- Upstash 무료 플랜: 10,000 commands/day
- Vercel에 배포하면 환경 변수가 자동으로 설정됩니다
- 로컬 개발 시에는 `.env` 파일에 수동으로 설정해야 합니다
