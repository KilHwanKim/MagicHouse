# MagicHouse TODO

## 지금 바로

- [x] 환경변수 예시와 로컬 테스트 정리
- [x] 민감 로그 기본 비활성화
- [x] 공유 저장소 미설정 UX 개선
- [x] API/브라우저 스모크 테스트 추가
- [x] Next.js 이관용 초기 골격 생성
- [x] 프로모션 배너 설정 구조 추가

## 다음 우선순위

- [x] TMDB 검색을 `next-app`으로 이관
- [x] AI 질문 생성 API를 `next-app` Route Handler로 이관
- [x] 작품/질문/답변 데이터 모델을 `title` 기반에서 `workId` 기반으로 변경
- [x] 공유 링크를 slug 기반 공개 페이지로 변경
- [ ] 로그인 구조를 카카오 의존형에서 이메일/Google 중심으로 재설계

## 광고/프로모션

- [ ] `AD_BANNER_*` 환경변수에 실제 광고 문구 입력
- [ ] 광고 클릭 시 이동할 랜딩 페이지 준비
- [ ] 광고 배너 A/B 테스트용 문구 2종 준비
- [ ] 광고 노출 위치 추가 검토 (홈 상단 / 공유 페이지 / Next 랜딩)
- [ ] 추후 Google AdSense 또는 보상형 광고 적용 여부 결정

## 사업화 준비

- [ ] 무료/광고형/유료형 플랜 정의
- [ ] 개인정보처리방침/이용약관 초안 작성
- [ ] 피드백 폼과 운영 지표 연결
- [ ] 첫 유입 채널(커뮤니티, SNS, SEO) 1차 실험

## 사용자가 준비해야 하는 것

- [ ] 광고 문구: `AD_BANNER_TITLE`
- [ ] 광고 설명문: `AD_BANNER_BODY`
- [ ] 버튼 문구: `AD_BANNER_CTA`
- [ ] 이동 링크: `AD_BANNER_URL`
- [ ] 제품 소개/결제/문의용 외부 랜딩 페이지 또는 노션 페이지
- [ ] 실제 서비스용 API 키와 배포 환경변수

## 실행 명령

```bash
npm test
npm run test:ui
cd next-app
npm run lint
npm run build
```
