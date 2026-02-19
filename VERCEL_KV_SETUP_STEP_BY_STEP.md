# Vercel KV 설정 단계별 가이드

## 🎯 목표
Upstash Redis를 사용하여 공유 기록을 저장할 수 있도록 설정합니다.

---

## 📋 단계별 가이드

### 1단계: Vercel에 프로젝트 배포 (아직 안 했다면)

**사이트:** https://vercel.com

**해야 할 일:**
1. Vercel.com에 로그인 (GitHub 계정으로 로그인 가능)
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 선택 (또는 Git 저장소 연결)
4. 프로젝트 설정 후 "Deploy" 클릭

**완료 확인:** 프로젝트가 배포되어 URL이 생성되면 완료

---

### 2단계: Vercel 대시보드에서 Storage 생성

**사이트:** https://vercel.com/dashboard

**해야 할 일:**
1. 로그인 후 대시보드 접속
2. 왼쪽 사이드바에서 **"Storage"** 클릭
   - 또는 프로젝트 선택 → 상단 탭에서 **"Storage"** 클릭
3. **"Create Database"** 버튼 클릭
4. **"Upstash"** 선택 → **"Upstash Redis"** 선택
5. Upstash 계정이 없다면:
   - "Sign up with Upstash" 클릭
   - https://upstash.com 에서 계정 생성
   - GitHub로 가입 가능
6. 데이터베이스 이름 입력 (예: `magic-house-redis`)
7. Region 선택 (한국: `ap-northeast-1` 또는 `ap-northeast-2`)
8. **"Create"** 클릭

**완료 확인:** 데이터베이스가 생성되고 목록에 표시되면 완료

---

### 3단계: 프로젝트에 Storage 연결

**사이트:** https://vercel.com/dashboard (같은 페이지)

**해야 할 일:**
1. 생성한 Redis 데이터베이스 옆에 **"Link"** 버튼 클릭
2. 연결할 프로젝트 선택 (magic-house 프로젝트)
3. **"Link"** 확인

**완료 확인:** 프로젝트에 연결되었다는 메시지가 표시되면 완료

---

### 4단계: 환경 변수 확인 (자동 설정됨)

**사이트:** https://vercel.com/dashboard → 프로젝트 → Settings → Environment Variables

**해야 할 일:**
1. 프로젝트 선택 → **"Settings"** 탭
2. 왼쪽 메뉴에서 **"Environment Variables"** 클릭
3. 다음 변수들이 자동으로 추가되어 있는지 확인:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN` (선택사항)

**완료 확인:** 위 변수들이 보이면 완료 (자동으로 설정됨)

---

### 5단계: 로컬 개발용 환경 변수 설정 (선택사항)

**사이트:** https://console.upstash.com/redis

**해야 할 일:**
1. Upstash 콘솔 접속 (https://console.upstash.com)
2. 생성한 Redis 데이터베이스 클릭
3. 상단 탭에서 **"REST API"** 클릭
4. 다음 정보 복사:
   - **UPSTASH_REDIS_REST_URL** (또는 REST API URL)
   - **UPSTASH_REDIS_REST_TOKEN** (또는 REST API Token)
5. 프로젝트 루트의 `.env` 파일에 추가:
   ```
   KV_REST_API_URL=복사한_URL
   KV_REST_API_TOKEN=복사한_TOKEN
   ```

**완료 확인:** `.env` 파일에 변수가 추가되면 완료

---

### 6단계: 재배포 (환경 변수 추가 후)

**사이트:** https://vercel.com/dashboard → 프로젝트

**해야 할 일:**
1. 프로젝트 페이지에서 **"Redeploy"** 클릭
2. 또는 Git에 push하면 자동 재배포

**완료 확인:** 배포가 완료되면 완료

---

### 7단계: 테스트

**사이트:** 
- 로컬: http://localhost:3000/tests/vercel-kv-shared-records.html
- 배포된 사이트: https://your-project.vercel.app/tests/vercel-kv-shared-records.html

**해야 할 일:**
1. 테스트 페이지 접속
2. "공유 기록 추가" 섹션에서 데이터 입력
3. "공유 기록 추가 (KV)" 버튼 클릭
4. "KV 연결 상태"가 "연결됨 ✓"로 표시되면 성공!

**완료 확인:** 공유 기록이 저장되고 목록에 표시되면 완료

---

## 🔗 주요 사이트 정리

| 단계 | 사이트 | 용도 |
|------|--------|------|
| 1 | https://vercel.com | 프로젝트 배포 |
| 2-3 | https://vercel.com/dashboard | Storage 생성 및 연결 |
| 4 | https://vercel.com/dashboard → Settings | 환경 변수 확인 |
| 5 | https://console.upstash.com | 로컬 개발용 토큰 복사 |
| 6 | https://vercel.com/dashboard | 재배포 |
| 7 | 로컬/배포 URL | 테스트 |

---

## ❓ 문제 해결

### "KV 연결 실패" 에러가 나는 경우:
1. 환경 변수가 제대로 설정되었는지 확인
2. Vercel에서 재배포했는지 확인
3. Upstash 데이터베이스가 활성화되어 있는지 확인

### 로컬에서 테스트하려면:
- `.env` 파일에 `KV_REST_API_URL`과 `KV_REST_API_TOKEN`을 추가해야 합니다.
- Upstash 콘솔에서 REST API 정보를 복사하세요.

---

## ✅ 체크리스트

- [ ] Vercel에 프로젝트 배포 완료
- [ ] Vercel Storage에서 Upstash Redis 생성 완료
- [ ] 프로젝트에 Storage 연결 완료
- [ ] 환경 변수 자동 설정 확인 완료
- [ ] (선택) 로컬 개발용 `.env` 파일 설정 완료
- [ ] 재배포 완료
- [ ] 테스트 페이지에서 연결 확인 완료
