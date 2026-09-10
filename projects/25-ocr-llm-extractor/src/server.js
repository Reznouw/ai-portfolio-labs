#!/usr/bin/env node
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { extractDocument } from "./extractor.js";

const port = Number(process.env.PORT || 4325);
const publicRoot = "public";

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === "/api/extract") {
      const fixture = url.searchParams.get("fixture") || "invoice-001.txt";
      const safeFixture = normalize(fixture).replace(/^([.][.][\\/])+/, "");
      const text = await readFile(join("fixtures", "data", safeFixture), "utf8");
      return send(response, 200, extractDocument(text, safeFixture), "application/json");
    }

    const filePath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const safePath = normalize(filePath).replace(/^([.][.][\\/])+/, "");
    const content = await readFile(join(publicRoot, safePath));
    return send(response, 200, content, contentType(filePath));
  } catch (error) {
    return send(response, 404, { error: error.message }, "application/json");
  }
});

server.listen(port, () => {
  process.stdout.write(`OCR extractor frontend running at http://localhost:${port}\n`);
});

function send(response, status, body, type) {
  response.writeHead(status, { "content-type": type });
  response.end(Buffer.isBuffer(body) || typeof body === "string" ? body : JSON.stringify(body, null, 2));
}

function contentType(filePath) {
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml"
  }[extname(filePath)] || "text/plain; charset=utf-8";
}
