export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization");
  
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization header required" });
    }
    
    const accessToken = authHeader.substring(7);
    
    // 카카오 사용자 정보 조회
    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });
    
    if (!userResponse.ok) {
      const errorData = await userResponse.json().catch(() => ({}));
      return res.status(userResponse.status).json({ 
        error: "Failed to get user info", 
        details: errorData 
      });
    }
    
    const userData = await userResponse.json();
    res.json({
      id: userData.id,
    });
  } catch (err) {
    console.error("카카오 사용자 정보 조회 오류:", err);
    res.status(500).json({ error: err.message });
  }
}
