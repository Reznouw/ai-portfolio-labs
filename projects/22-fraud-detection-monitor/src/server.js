import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runMonitor } from "./monitor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT ?? 4222);

const routes = new Map([
  ["/", path.join(__dirname, "index.html")],
  ["/app.js", path.join(__dirname, "app.js")],
  ["/styles.css", path.join(__dirname, "styles.css")],
  ["/report.json", path.join(root, "reports", "report.json")],
  ["/report.md", path.join(root, "reports", "report.md")]
]);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"]
]);

await runMonitor();

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  const filePath = routes.get(pathname);

  if (!filePath) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  try {
    await access(filePath);
    response.writeHead(200, { "content-type": contentTypes.get(path.extname(filePath)) ?? "text/plain; charset=utf-8" });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end("Unable to read dashboard asset");
  }
});

server.listen(port, () => {
  console.log(`Fraud Detection Monitor running at http://localhost:${port}`);
});
