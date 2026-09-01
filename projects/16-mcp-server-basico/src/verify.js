import { spawn } from "node:child_process";
import { once } from "node:events";
import { createInterface } from "node:readline";

const child = spawn(process.execPath, ["src/server.js"], {
  cwd: new URL("..", import.meta.url),
  stdio: ["pipe", "pipe", "pipe"]
});

const rl = createInterface({ input: child.stdout, crlfDelay: Infinity });
const errors = [];

child.stderr.on("data", (chunk) => errors.push(chunk.toString()));

try {
  const init = await send({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
  assert(init.result?.capabilities?.tools === true, "initialize exposes tool capability");

  const list = await send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  assert(list.result.tools.length === 2, "tools/list returns two tools");
  assert(list.result.tools.some((tool) => tool.name === "search_terms"), "search_terms is listed");
  assert(list.result.tools.some((tool) => tool.name === "get_term"), "get_term is listed");

  const search = await send({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "search_terms", arguments: { query: "retrieval", limit: 3 } }
  });
  const matches = search.result.content[0].json.matches;
  assert(matches.some((item) => item.id === "rag"), "search finds RAG for retrieval query");

  const term = await send({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: { name: "get_term", arguments: { id: "prompt-injection" } }
  });
  assert(term.result.content[0].json.category === "security", "get_term returns prompt injection entry");

  child.kill();
  console.log("verify ok: initialize, tools/list, search_terms, and get_term passed");
} catch (error) {
  child.kill();
  console.error(`verify failed: ${error.message}`);
  if (errors.length) console.error(errors.join(""));
  process.exitCode = 1;
}

async function send(message) {
  child.stdin.write(`${JSON.stringify(message)}\n`);
  const [line] = await once(rl, "line");
  return JSON.parse(line);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
