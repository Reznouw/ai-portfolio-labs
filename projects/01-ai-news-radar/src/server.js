import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const PORT = Number(process.env.PORT || 4173);
const root = process.cwd();
const publicDir = path.join(root, "public");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  const filePath = resolveFile(url.pathname);

  if (!filePath || !existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const extension = path.extname(filePath);
  response.writeHead(200, { "Content-Type": contentTypes[extension] || "application/octet-stream" });
  response.end(readFileSync(filePath));
});

server.listen(PORT, () => {
  console.log(`AI News Radar running at http://localhost:${PORT}`);
});

function resolveFile(pathname) {
  if (pathname === "/") return path.join(publicDir, "index.html");
  if (pathname === "/data/news.json") return path.join(root, "data", "news.json");

  const normalized = path.normalize(pathname).replace(/^([/\\])+/, "");
  const filePath = path.join(publicDir, normalized);
  return filePath.startsWith(publicDir) ? filePath : null;
}
