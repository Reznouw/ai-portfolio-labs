import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { getTerm, searchTerms } from "./glossary.js";

const tools = [
  {
    name: "search_terms",
    description: "Search the bundled AI glossary by term, category, definition, or example.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search phrase, for example 'security' or 'retrieval'." },
        limit: { type: "number", description: "Maximum number of matches to return." }
      },
      required: ["query"]
    }
  },
  {
    name: "get_term",
    description: "Return one glossary entry by id or exact term name.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Glossary id or exact term name, for example 'rag'." }
      },
      required: ["id"]
    }
  }
];

const rl = readline.createInterface({ input, crlfDelay: Infinity });

rl.on("line", async (line) => {
  if (!line.trim()) return;

  let request;
  try {
    request = JSON.parse(line);
  } catch (error) {
    writeResponse(null, null, jsonRpcError(-32700, "Parse error", error.message));
    return;
  }

  const { id = null, method, params = {} } = request;

  try {
    const result = await dispatch(method, params);
    writeResponse(id, result);
  } catch (error) {
    writeResponse(id, null, jsonRpcError(error.code || -32603, error.message || "Internal error"));
  }
});

async function dispatch(method, params) {
  if (method === "initialize") {
    return {
      protocolVersion: "mini-mcp-json-rpc-stdio-0.1",
      serverInfo: { name: "mcp-server-basico", version: "0.1.0" },
      capabilities: { tools: true }
    };
  }

  if (method === "tools/list") {
    return { tools };
  }

  if (method === "tools/call") {
    return callTool(params);
  }

  throw rpcError(-32601, `Method not found: ${method}`);
}

async function callTool(params) {
  const { name, arguments: args = {} } = params || {};

  if (name === "search_terms") {
    const matches = await searchTerms(args.query, Number(args.limit || 5));
    return {
      content: [
        {
          type: "json",
          json: { matches }
        }
      ]
    };
  }

  if (name === "get_term") {
    const term = await getTerm(args.id);
    if (!term) {
      throw rpcError(-32004, `Term not found: ${args.id}`);
    }

    return {
      content: [
        {
          type: "json",
          json: term
        }
      ]
    };
  }

  throw rpcError(-32602, `Unknown tool: ${name}`);
}

function writeResponse(id, result, error) {
  const response = error ? { jsonrpc: "2.0", id, error } : { jsonrpc: "2.0", id, result };
  output.write(`${JSON.stringify(response)}\n`);
}

function rpcError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function jsonRpcError(code, message, data) {
  return data ? { code, message, data } : { code, message };
}
