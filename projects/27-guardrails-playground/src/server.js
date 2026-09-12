import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluatePrompt, expandSample } from "./guardrails.js";
import { loadSamples } from "./cli.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PUBLIC_DIR = join(ROOT, "public");
const PORT = Number(process.env.PORT ?? 4127);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png"
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

    if (url.pathname === "/api/samples") {
      const samples = (await loadSamples()).map(expandSample);
      sendJson(res, samples);
      return;
    }

    if (url.pathname === "/api/evaluate" && req.method === "POST") {
      const body = await readBody(req);
      const payload = JSON.parse(body || "{}");
      sendJson(res, evaluatePrompt(String(payload.prompt ?? ""), { id: payload.id ?? "browser" }));
      return;
    }

    await serveStatic(url.pathname, res);
  } catch (error) {
    sendJson(res, { error: error.message }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`Guardrails Playground running at http://localhost:${PORT}`);
});

async function serveStatic(pathname, res) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const safePath = normalize(requested).replace(/^([.][.][\\/])+/, "");
  const filePath = join(PUBLIC_DIR, safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendText(res, "Forbidden", 403);
    return;
  }
  const data = await readFile(filePath);
  res.writeHead(200, { "content-type": TYPES[extname(filePath)] ?? "application/octet-stream" });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100_000) req.destroy(new Error("Request body too large"));
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function sendJson(res, value, status = 200) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(value, null, 2));
}

function sendText(res, value, status = 200) {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(value);
}
