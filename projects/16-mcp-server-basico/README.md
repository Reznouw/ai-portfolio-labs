# MCP Server Basico

Minimal dependency-free JSON-RPC stdio server inspired by MCP tool servers. It exposes two tools over a small public AI glossary dataset:

- `search_terms`: search glossary entries by term, category, definition, or example.
- `get_term`: fetch one glossary entry by id or exact term name.

The project is intentionally small and offline. It uses newline-delimited JSON messages over standard input and standard output.

## Quick Start

```bash
npm run start
```

Then paste one JSON-RPC request per line, for example:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}
```

## Verify

```bash
npm run verify
```

The verifier starts the stdio server, sends `initialize`, `tools/list`, `search_terms`, and `get_term` requests, then checks the responses.

## Example Requests

Files under `sample/` contain one-line requests that can be copied into the running server:

- `sample/request.initialize.json`
- `sample/request.tools-list.json`
- `sample/request.search.json`
- `sample/request.get-term.json`
- `sample/response.search.json`

Example tool call:

```json
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_terms","arguments":{"query":"retrieval","limit":2}}}
```

Example response shape:

```json
{"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"json","json":{"matches":[{"id":"rag","term":"Retrieval Augmented Generation","category":"architecture","definition":"A pattern where a model retrieves relevant external context before generating an answer.","example":"A support bot retrieves product docs before writing a response."}]}}]}}
```

## Supported Methods

- `initialize`: returns server metadata and tool capability.
- `tools/list`: returns tool names, descriptions, and input schemas.
- `tools/call`: calls `search_terms` or `get_term` with structured arguments.

## Project Structure

```txt
data/glossary.json       Small offline AI glossary dataset
sample/                  JSON-RPC request and response examples
src/glossary.js          Dataset loading and search helpers
src/server.js            JSON-RPC stdio server
src/verify.js            End-to-end stdio verification script
```

## How This Maps To Real MCP

Real MCP also uses JSON-RPC messages and commonly runs over stdio. This project mirrors the core idea: a client initializes a server, lists available tools, and calls a named tool with JSON arguments.

This is not a full MCP implementation. It skips the official MCP SDK, protocol version negotiation details, resource and prompt capabilities, notifications, cancellation, and transport framing beyond newline-delimited JSON. It is meant as a readable protocol sketch before using a real MCP SDK.
