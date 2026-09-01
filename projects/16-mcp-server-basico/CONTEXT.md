# Context

## Goal

Build mini-project 16: MCP Server Basico. The project demonstrates a minimal MCP-like tool server over JSON-RPC stdio using only Node built-in modules.

## Architecture

- `src/server.js`: newline-delimited JSON-RPC stdio server.
- `src/glossary.js`: offline AI glossary loader, search, and lookup logic.
- `src/verify.js`: end-to-end verifier that spawns the server and sends JSON-RPC messages.
- `data/glossary.json`: small public AI glossary dataset.
- `sample/`: request and response examples.

## Protocol Surface

- `initialize`: reports server information and tool support.
- `tools/list`: returns `search_terms` and `get_term` schemas.
- `tools/call`: executes a named tool with JSON arguments.

## Constraints

- ASCII-only content.
- No runtime dependencies.
- All files are contained under `staging/16-mcp-server-basico`.
- This is MCP-like for learning, not a complete implementation of the official MCP specification.

## Verification

- Run `npm run verify` from this directory.
- Verification checks initialization, tool listing, glossary search, and direct term lookup.
