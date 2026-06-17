// Optional outbound proxy for all search engines, configured via SEARCH_PROXY.
//
//   SEARCH_PROXY=http://user:pass@host:port   (http/https/socks proxy URL)
//
// Browsers (Playwright) and the axios HTTP client need the proxy wired
// separately, so this module exposes one config for each. When SEARCH_PROXY is
// unset, both helpers return undefined and behaviour is unchanged.
import { HttpsProxyAgent } from 'https-proxy-agent';

export function getProxyUrl(): string | undefined {
  const p = process.env.SEARCH_PROXY;
  return p && p.trim() ? p.trim() : undefined;
}

// axios needs an httpsAgent that performs CONNECT tunnelling; axios' built-in
// `proxy` option does NOT tunnel HTTPS through an HTTP proxy (returns 400).
let _agent: HttpsProxyAgent<string> | undefined;
let _agentResolved = false;
export function getAxiosProxyAgent(): HttpsProxyAgent<string> | undefined {
  if (!_agentResolved) {
    const url = getProxyUrl();
    _agent = url ? new HttpsProxyAgent(url) : undefined;
    _agentResolved = true;
  }
  return _agent;
}

// Spread into an axios request config: routes via the proxy agent and disables
// axios' (broken-for-HTTPS) built-in proxy. No-op when SEARCH_PROXY is unset.
export function axiosProxyConfig(): Record<string, unknown> {
  const agent = getAxiosProxyAgent();
  return agent ? { httpsAgent: agent, proxy: false } : {};
}

// Playwright wants the server without credentials, plus separate user/pass.
export function getPlaywrightProxy():
  | { server: string; username?: string; password?: string }
  | undefined {
  const url = getProxyUrl();
  if (!url) return undefined;
  try {
    const u = new URL(url);
    const proxy: { server: string; username?: string; password?: string } = {
      server: `${u.protocol}//${u.host}`,
    };
    if (u.username) proxy.username = decodeURIComponent(u.username);
    if (u.password) proxy.password = decodeURIComponent(u.password);
    return proxy;
  } catch {
    return undefined;
  }
}
