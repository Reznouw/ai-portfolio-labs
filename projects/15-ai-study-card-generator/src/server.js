import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd());
const publicRoot = join(root, "public");
const port = Number(process.env.PORT || 4173);

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".png", "image/png"]
]);

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const filePath = resolvePath(url.pathname);

  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("Not a file");
    response.writeHead(200, { "Content-Type": mimeTypes.get(extname(filePath)) || "text/plain; charset=utf-8" });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`Study card browser running at http://localhost:${port}`);
});

function resolvePath(pathname) {
  const cleanPath = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, "");
  const target = cleanPath === "" ? join(publicRoot, "index.html") : join(root, cleanPath);
  const resolved = resolve(target);
  if (!resolved.startsWith(root)) return null;
  if (pathname.startsWith("/reports/") || pathname.startsWith("/assets/")) return resolved;
  if (resolved.startsWith(publicRoot)) return resolved;
  return null;
}
