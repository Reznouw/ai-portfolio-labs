import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8"
};

export function createTopicServer() {
  return createServer((request, response) => {
    const requestedUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    const requestedPath = requestedUrl.pathname === "/" ? "index.html" : decodeURIComponent(requestedUrl.pathname).replace(/^[/\\]+/, "");
    const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = join(root, safePath);

    if (!filePath.startsWith(root) || !existsSync(filePath) || !statSync(filePath).isFile()) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "content-type": contentTypes[extname(filePath)] || "application/octet-stream" });
    createReadStream(filePath).pipe(response);
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  createTopicServer().listen(port, () => {
    console.log(`Topic Modeling Explorer running at http://localhost:${port}`);
  });
}
