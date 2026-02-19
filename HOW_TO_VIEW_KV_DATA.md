# Vercel KV (Upstash Redis) 저장된 값 확인 방법

## 방법 1: Vercel 대시보드에서 확인

### 1단계: Vercel 대시보드 접속
**사이트:** https://vercel.com/dashboard

### 2단계: Storage 탭으로 이동
1. 프로젝트 선택
2. 상단 탭에서 **"Storage"** 클릭
3. 생성한 Upstash Redis 데이터베이스 클릭

### 3단계: Upstash 콘솔로 이동
- 데이터베이스 상세 페이지에서 **"Open in Upstash Console"** 또는 **"View in Upstash"** 버튼 클릭
- 또는 데이터베이스 이름 옆의 링크 아이콘 클릭
- 자동으로 Upstash 콘솔로 리다이렉트됩니다

### 4단계: 데이터 확인
- Upstash 콘솔에서 **"Data Browser"** 또는 **"Redis CLI"** 탭 클릭
- 키 조회:
  ```
  KEYS shared_records:*
  ```
  또는
  ```
  GET shared_records:작품명
  ```

**참고:** Vercel 대시보드 자체에서는 데이터를 직접 조회할 수 없고, Upstash 콘솔로 이동해야 합니다.

---

## 방법 2: Vercel 배포된 앱의 API로 확인

### 1단계: 배포된 앱 URL 확인
**사이트:** https://vercel.com/dashboard → 프로젝트 → "Deployments"

### 2단계: API 엔드포인트 접속
브라우저에서:
```
https://your-project.vercel.app/api/shared-records
```
또는 특정 작품만:
```
https://your-project.vercel.app/api/shared-records?title=장송의 프리렌
```

### 3단계: 테스트 페이지 접속
```
https://your-project.vercel.app/tests/vercel-kv-shared-records.html
```

---

## 방법 3: Upstash 콘솔에서 직접 확인 (가장 쉬움)

### 1단계: Upstash 콘솔 접속
**사이트:** https://console.upstash.com

### 2단계: 데이터베이스 선택
- 생성한 Redis 데이터베이스 클릭

### 3단계: 데이터 확인
- 상단 탭에서 **"Data Browser"** 또는 **"Redis CLI"** 클릭
- 키를 입력하여 값 확인:
  ```
  shared_records:작품명
  ```
  예: `shared_records:장송의 프리렌`

### 4단계: 값 조회
- **"GET"** 명령어 사용:
  ```
  GET shared_records:장송의 프리렌
  ```
- 또는 **"Data Browser"**에서 키를 클릭하면 값이 표시됩니다

---

## 방법 4: 로컬 테스트 페이지에서 확인

**사이트:** http://localhost:3000/tests/vercel-kv-shared-records.html

### 확인 방법:
1. 테스트 페이지 접속
2. "공유 기록 목록" 섹션에서 저장된 기록 확인
3. "API 응답 (최근)" 섹션에서 JSON 데이터 확인

---

## 방법 5: 로컬 API 엔드포인트로 직접 확인

### 브라우저에서:
```
http://localhost:3000/api/shared-records
```
또는 특정 작품만:
```
http://localhost:3000/api/shared-records?title=장송의 프리렌
```

### curl 명령어로:
```bash
curl http://localhost:3000/api/shared-records
```

### JavaScript로:
```javascript
fetch('http://localhost:3000/api/shared-records')
  .then(r => r.json())
  .then(data => console.log(data));
```

---

## 방법 6: Upstash Redis CLI 사용

### 1단계: Redis CLI 접속
**사이트:** https://console.upstash.com → 데이터베이스 → "Redis CLI" 탭

### 2단계: 명령어 실행

**모든 키 조회:**
```
KEYS shared_records:*
```

**특정 작품의 기록 조회:**
```
GET shared_records:장송의 프리렌
```

**모든 작품 목록:**
```
KEYS shared_records:*
```
(결과에서 `shared_records:` 접두사를 제거하면 작품명 목록)

---

## 저장 형식

데이터는 다음과 같은 형식으로 저장됩니다:

**키:** `shared_records:작품명`
**값:** JSON 배열
```json
[
  {
    "id": "1234567890abc",
    "type": "qa",
    "sharedAt": "2026-02-18T12:00:00.000Z",
    "data": {
      "q": "질문 내용",
      "a": "답변 내용"
    },
    "shareMethod": "image",
    "preview": "질문 내용..."
  },
  {
    "id": "1234567890def",
    "type": "book",
    "sharedAt": "2026-02-18T13:00:00.000Z",
    "data": {
      "title": "작품명",
      "questions": [...],
      "overview": "줄거리"
    },
    "shareMethod": "link",
    "preview": "작품명 - 5개 질문"
  }
]
```

---

## 빠른 확인 방법 (추천)

### Vercel에서 확인하려면:
1. **Vercel 대시보드 → Storage → Upstash 콘솔로 이동**
   - https://vercel.com/dashboard → 프로젝트 → Storage
   - 데이터베이스 클릭 → "Open in Upstash Console" 클릭
   - Data Browser에서 키-값 확인

2. **배포된 앱의 API 엔드포인트 사용**
   - https://your-project.vercel.app/api/shared-records
   - 브라우저에서 JSON 데이터 확인

3. **배포된 앱의 테스트 페이지 사용**
   - https://your-project.vercel.app/tests/vercel-kv-shared-records.html
   - 시각적으로 모든 기록 확인 가능

### 로컬에서 확인하려면:
1. **로컬 테스트 페이지 사용** (가장 쉬움)
   - http://localhost:3000/tests/vercel-kv-shared-records.html
   - 저장된 모든 기록을 시각적으로 확인 가능

2. **로컬 API 엔드포인트 사용**
   - http://localhost:3000/api/shared-records
   - 브라우저에서 직접 접속하여 JSON 확인

---

## 문제 해결

### "값이 안 보여요"
- 데이터가 실제로 저장되었는지 확인
- 키 이름이 정확한지 확인 (`shared_records:작품명` 형식)
- 환경 변수가 올바르게 설정되었는지 확인

### "키를 모르겠어요"
- `KEYS shared_records:*` 명령어로 모든 키 조회
- 또는 테스트 페이지에서 작품 목록 확인
