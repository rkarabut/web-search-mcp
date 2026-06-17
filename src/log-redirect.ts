// MCP stdio servers must keep stdout exclusively for JSON-RPC messages; any
// stray text on stdout corrupts the protocol stream (a strict client, including
// the official @modelcontextprotocol/sdk Client, will fail to parse it).
//
// This codebase logs diagnostics with console.log (-> stdout by default), so we
// redirect console.log/info/debug to stderr. Imported first in index.ts, before
// anything logs. console.warn/error already go to stderr.
const toStderr = (...args: unknown[]): void => {
  console.error(...args);
};
console.log = toStderr;
console.info = toStderr;
console.debug = toStderr;

export {};
