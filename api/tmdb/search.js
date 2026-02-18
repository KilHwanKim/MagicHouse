const TMDB_BASE = "https://api.themoviedb.org/3";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "TMDB_API_KEY is not set in .env" });
  }
  const q = (req.query.q || "").trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const url = `${TMDB_BASE}/search/multi?api_key=${key}&query=${encodeURIComponent(q)}&language=ko-KR&page=${page}&include_adult=false`;
  try {
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json(data);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
