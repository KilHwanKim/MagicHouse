export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code, redirectUri } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: "code is required" });
    }
    
    const kakaoRestKey = process.env.KAKAO_REST_API_KEY;
    if (!kakaoRestKey) {
      return res.status(500).json({ error: "KAKAO_REST_API_KEY is not configured" });
    }
    
    // 클라이언트 시크릿 (선택사항, 활성화된 경우 필요)
    const kakaoClientSecret = process.env.KAKAO_CLIENT_SECRET;
    
    // Redirect URI 정확히 일치해야 함 (슬래시 없이)
    const host = req.headers.host || "";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const finalRedirectUri = redirectUri || `${protocol}://${host}`;
    
    console.log("[카카오 토큰 교환] 요청 정보:", {
      redirectUri: finalRedirectUri,
      hasCode: !!code,
      restKeyPrefix: kakaoRestKey.substring(0, 8) + "...",
      restKeyLength: kakaoRestKey.length,
      codeLength: code.length,
      hasClientSecret: !!kakaoClientSecret
    });
    
    // 카카오 토큰 교환 API 호출
    const requestParams = {
      grant_type: "authorization_code",
      client_id: kakaoRestKey,
      redirect_uri: finalRedirectUri,
      code: code,
    };
    
    // 클라이언트 시크릿이 있으면 추가 (카카오 개발자 콘솔에서 활성화된 경우)
    if (kakaoClientSecret) {
      requestParams.client_secret = kakaoClientSecret;
    }
    
    const requestBody = new URLSearchParams(requestParams);
    
    console.log("[카카오 토큰 교환] 요청 본문:", {
      grant_type: "authorization_code",
      client_id: kakaoRestKey.substring(0, 8) + "...",
      redirect_uri: finalRedirectUri,
      code: code.substring(0, 10) + "..."
    });
    
    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: requestBody,
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error("카카오 토큰 교환 실패:", errorData);
      console.error("사용된 Redirect URI:", finalRedirectUri);
      console.error("REST API 키 확인 필요:", kakaoRestKey ? "설정됨" : "없음");
      
      // KOE010 에러인 경우 상세 안내
      if (errorData.error_code === 'KOE010') {
        return res.status(tokenResponse.status).json({ 
          error: "invalid_client",
          error_description: "REST API 키가 잘못되었거나 카카오 개발자 콘솔 설정을 확인해주세요.",
          error_code: "KOE010",
          details: {
            message: "카카오 개발자 콘솔에서 다음을 확인하세요:",
            checks: [
              "1. 앱 설정 → 앱 키에서 REST API 키가 올바른지 확인",
              "2. 카카오 로그인 → Redirect URI에 정확히 일치하는 URI가 등록되어 있는지 확인",
              `3. 현재 사용된 Redirect URI: ${finalRedirectUri}`,
              "4. 플랫폼 → Web 플랫폼이 등록되어 있는지 확인"
            ]
          }
        });
      }
      
      return res.status(tokenResponse.status).json({ 
        error: "Failed to exchange token", 
        details: errorData 
      });
    }
    
    const tokenData = await tokenResponse.json();
    res.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
    });
  } catch (err) {
    console.error("카카오 토큰 교환 오류:", err);
    res.status(500).json({ error: err.message });
  }
}
