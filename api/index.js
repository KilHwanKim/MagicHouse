import app from "../server.js";

/**
 * Vercel rewrite 시 원본 경로 복원.
 * destination /api?path=$1 로 path가 전달되므로 req.url 을 복원해 Express가 정적 파일을 서빙하도록 함.
 */
export default function handler(req, res) {
  const path = req.query.path;
  if (path !== undefined) {
    req.url = "/" + (Array.isArray(path) ? path[0] : path);
  }
  return app(req, res);
}
