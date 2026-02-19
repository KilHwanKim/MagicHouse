# 공유 기능 개선 제안

## 현재 구현된 기능

### ✅ 완료된 기능
1. **공유 기록 자동 저장**
   - Q&A 이미지 공유 시 Vercel KV에 저장
   - Q&A 링크 공유 시 Vercel KV에 저장
   - 공유 성공 여부와 관계없이 기록 저장 (공유 창이 열리면 저장)

2. **공유 방식**
   - 이미지 공유: html2canvas로 질문+답변을 이미지로 변환하여 카카오톡 공유
   - 링크 공유: URL 파라미터로 질문+답변을 포함한 링크 공유

---

## 개선 제안

### 1. 공유 성공 확인 후 저장 (권장)

**현재:** 공유 창이 열리면 무조건 저장
**개선:** 공유가 실제로 완료되었을 때만 저장

```javascript
// shareQuestionAnswerFeed 함수에서
const shareResult = window.Kakao.Share.sendDefault({...});

if (shareResult && typeof shareResult.then === "function") {
    shareResult
        .then(function () {
            // 공유 성공 시에만 저장
            saveSharedRecordToKV(currentOpenAnime, "qa", { q, a }, "image");
        })
        .catch(function (err) {
            // 공유 실패 시 저장하지 않음
            console.warn("공유 실패:", err);
        });
} else {
    // Promise가 없는 경우 (구버전 SDK) 공유 창이 열리면 저장
    saveSharedRecordToKV(currentOpenAnime, "qa", { q, a }, "image");
}
```

**장점:**
- 실제 공유된 기록만 저장
- 사용자가 공유를 취소한 경우 저장되지 않음

---

### 2. 공유 기록 조회 UI 추가

**현재:** 공유 기록 저장만 됨
**개선:** 저장된 공유 기록을 조회할 수 있는 UI 추가

**추가할 기능:**
- 책 모달에 "📋 공유 기록" 버튼 추가
- 공유 기록 모달에서 저장된 기록 확인
- 공유 기록 삭제 기능

**구현 위치:**
```html
<!-- 책 모달 내부에 추가 -->
<button onclick="openSharedRecordsModal()" class="gold-btn text-[10px] px-4 py-2">
    📋 공유 기록
</button>
```

---

### 3. 공유 피드백 개선

**현재:** 공유 버튼 클릭 시 별도 피드백 없음
**개선:** 공유 성공/실패 시 시각적 피드백 제공

**추가할 기능:**
- 공유 성공 시 토스트 메시지: "공유되었습니다! 📜"
- 공유 기록 저장 성공 시: "공유 기록에 저장되었습니다."
- 공유 실패 시: 에러 메시지 표시

**구현 예시:**
```javascript
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
```

---

### 4. 책 전체 공유 기능 추가

**현재:** Q&A만 공유 가능
**개선:** 책 전체(모든 질문+답변)를 공유하는 기능 추가

**구현 방법:**
```javascript
async function shareBookFeed() {
    if (!currentOpenAnime) return;
    const questions = getQuestionsForTitle(currentOpenAnime);
    const overview = workMetadata[currentOpenAnime]?.overview || "";
    
    // 책 전체를 이미지로 변환하여 공유
    // 공유 성공 시 저장
    await saveSharedRecordToKV(currentOpenAnime, "book", {
        title: currentOpenAnime,
        questions: questions,
        overview: overview
    }, "image");
}
```

---

### 5. 공유 기록 통계 표시

**추가할 기능:**
- 총 공유 횟수 표시
- 작품별 공유 횟수 표시
- 최근 공유 기록 표시

**구현 위치:**
- 메인 페이지 헤더에 공유 통계 표시
- 책 모달에 작품별 공유 횟수 표시

---

## 구현 우선순위

1. **높음:** 공유 성공 확인 후 저장 (현재는 공유 창만 열려도 저장됨)
2. **중간:** 공유 기록 조회 UI 추가
3. **중간:** 공유 피드백 개선
4. **낮음:** 책 전체 공유 기능 추가
5. **낮음:** 공유 기록 통계 표시

---

## 현재 코드 상태

### ✅ 구현 완료
- `saveSharedRecordToKV()` 함수 추가
- `shareQuestionAnswerFeed()`에서 공유 기록 저장
- `shareQuestionAnswerAsLink()`에서 공유 기록 저장

### ⚠️ 주의사항
- 공유 창이 열리면 무조건 저장됨 (사용자가 취소해도 저장)
- 공유 기록 조회 UI는 아직 없음
- 책 전체 공유 기능은 아직 없음

---

## 다음 단계

1. 공유 성공 확인 후 저장하도록 개선
2. 공유 기록 조회 모달 추가
3. 공유 피드백 개선
