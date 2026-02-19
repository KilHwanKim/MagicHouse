# KOE010 에러 체크리스트

## 현재 상태
- ✅ REST API 키 로드됨: `bec86a01...`
- ✅ Redirect URI 올바름: `http://localhost:3000`
- ✅ 인가 코드 수신됨
- ❌ 토큰 교환 실패: KOE010 (Bad client credentials)

## 확인해야 할 사항

### 1. JavaScript 키와 REST API 키가 같은 앱인지 확인

**중요**: JavaScript 키와 REST API 키가 **같은 앱**의 것이어야 합니다!

- JavaScript 키: `565745e8bea5623d9bb958af626f4cb4`
- REST API 키: `bec86a0152235484912ff8cc174fa8da`

**확인 방법**:
1. 카카오 개발자 콘솔 → 내 애플리케이션
2. JavaScript 키가 있는 앱 선택
3. 그 앱의 REST API 키 확인
4. REST API 키가 `bec86a0152235484912ff8cc174fa8da`와 일치하는지 확인

### 2. 카카오 로그인 활성화 확인

1. 카카오 개발자 콘솔 → **제품 설정**
2. **카카오 로그인** 섹션 확인
3. **활성화 설정**이 **"활성화"**로 되어 있는지 확인
4. 활성화되어 있지 않으면 활성화하고 저장

### 3. 플랫폼 설정 확인

1. 카카오 개발자 콘솔 → **앱 설정** → **플랫폼**
2. **Web 플랫폼** 등록 확인
3. 사이트 도메인에 `http://localhost:3000` 등록 확인
4. 등록되어 있지 않으면 추가

### 4. Redirect URI 재확인

1. 카카오 개발자 콘솔 → **카카오 로그인** → **Redirect URI**
2. `http://localhost:3000`이 정확히 등록되어 있는지 확인
3. 슬래시 없이 정확히 `http://localhost:3000`이어야 함
4. 다른 URI가 있으면 삭제하거나, 모두 정확히 일치하는지 확인

### 5. REST API 키 재확인

1. 카카오 개발자 콘솔 → **앱 설정** → **앱 키**
2. **REST API 키** 값 확인
3. 스크린샷에서 본 값과 정확히 일치하는지 확인
4. 복사해서 `.env` 파일에 다시 입력

## 디버깅 방법

서버 콘솔에서 다음을 확인하세요:

```javascript
// 서버 코드에 추가하여 실제 값 확인
console.log("실제 REST API 키:", process.env.KAKAO_REST_API_KEY);
console.log("실제 Redirect URI:", finalRedirectUri);
```

## 가능한 원인

1. **JavaScript 키와 REST API 키가 다른 앱의 것**: 가장 흔한 원인
2. **카카오 로그인 미활성화**: 제품 설정에서 활성화 필요
3. **플랫폼 미등록**: Web 플랫폼 등록 필요
4. **설정 반영 지연**: 설정 변경 후 몇 분 대기 필요

## 해결 순서

1. ✅ JavaScript 키와 REST API 키가 같은 앱인지 확인
2. ✅ 카카오 로그인 활성화 확인
3. ✅ 플랫폼 설정 확인
4. ✅ Redirect URI 재확인
5. ✅ 서버 재시작
6. ✅ 다시 테스트

## 여전히 안 되면

카카오 개발자 콘솔에서:
1. **앱 키 재발급** 고려
2. 카카오 고객센터 문의: https://developers.kakao.com/support
