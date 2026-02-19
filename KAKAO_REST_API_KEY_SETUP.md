# 카카오 REST API 키 설정 가이드

## 필요 사항

카카오 로그인 토큰 교환을 위해 **카카오 REST API 키**가 필요합니다.

## REST API 키 확인 방법

1. **카카오 개발자 콘솔** 접속: https://developers.kakao.com
2. **내 애플리케이션** 선택
3. **앱 설정** → **앱 키** 클릭
4. **REST API 키** 복사

## 환경 변수 설정

`.env` 파일에 다음을 추가하세요:

```env
KAKAO_REST_API_KEY=여기에_REST_API_키_입력
```

## 주의사항

- **JavaScript 키** (`KAKAO_JS_KEY`)와 **REST API 키** (`KAKAO_REST_API_KEY`)는 다릅니다
- JavaScript 키: 클라이언트 측에서 사용 (이미 설정됨)
- REST API 키: 서버 측 토큰 교환에 사용 (새로 추가 필요)

## Vercel 배포 시

Vercel 대시보드에서도 환경 변수를 추가해야 합니다:

1. Vercel 프로젝트 → **Settings** → **Environment Variables**
2. `KAKAO_REST_API_KEY` 추가
3. 값 입력 후 저장
4. 재배포

## 테스트

설정 후 서버를 재시작하고 카카오 로그인을 테스트하세요.
