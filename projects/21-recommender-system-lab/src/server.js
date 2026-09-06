import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { catalogStats, getUsers, loadDataset, profileForUser, recommendForUser } from "./recommender.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const port = Number(process.env.PORT || 42121);

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"]
]);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/api/recommendations") {
      await sendRecommendations(url, res);
      return;
    }

    if (url.pathname === "/api/catalog") {
      await sendCatalog(res);
      return;
    }

    await sendStatic(url.pathname, res);
  } catch (error) {
    res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(port, () => {
  console.log(`Recommender System Lab running at http://localhost:${port}`);
});

async function sendRecommendations(url, res) {
  const userId = url.searchParams.get("user") || "U1";
  const limit = Number(url.searchParams.get("limit") || 5);
  const { movies, ratings } = await loadDataset();

  sendJson(res, {
    profile: profileForUser(userId, movies, ratings),
    recommendations: recommendForUser(userId, movies, ratings, limit),
    stats: catalogStats(movies, ratings)
  });
}

async function sendCatalog(res) {
  const { movies, ratings } = await loadDataset();
  sendJson(res, {
    movies,
    users: getUsers(ratings),
    stats: catalogStats(movies, ratings)
  });
}

async function sendStatic(requestPath, res) {
  const cleanPath = requestPath === "/" ? "/index.html" : decodeURIComponent(requestPath);
  const filePath = path.normalize(path.join(publicDir, cleanPath));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const type = mimeTypes.get(path.extname(filePath)) || "application/octet-stream";
    res.writeHead(200, { "content-type": type });
    res.end(content);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

function sendJson(res, payload) {
  res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}
