// Optional outbound proxy for all search engines, configured via SEARCH_PROXY.
//
//   SEARCH_PROXY=http://user:pass@host:port   (http/https/socks proxy URL)
//
// Browsers (Playwright) and the axios HTTP client need the proxy wired
// separately, so this module exposes one config for each. When SEARCH_PROXY is
// unset, both helpers return undefined/{} and behaviour is unchanged.
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';

export function getProxyUrl(): string | undefined {
  const p = process.env.SEARCH_PROXY;
  return p && p.trim() ? p.trim() : undefined;
}

// axios needs agents that perform CONNECT tunnelling; axios' built-in `proxy`
// option does NOT tunnel HTTPS through an HTTP proxy (returns 400). We provide
// an agent for each scheme so both https:// and http:// targets are proxied.
let _https: HttpsProxyAgent<string> | undefined;
let _http: HttpProxyAgent<string> | undefined;
let _resolved = false;
function build(): void {
  const url = getProxyUrl();
  if (url) {
    _https = new HttpsProxyAgent(url);
    _http = new HttpProxyAgent(url);
  }
  _resolved = true;
}

// Spread into an axios request config: routes both http and https targets via
// the proxy and disables axios' (broken-for-HTTPS) built-in proxy. axios picks
// httpAgent vs httpsAgent based on the target URL scheme (and across redirects).
// No-op when SEARCH_PROXY is unset.
export function axiosProxyConfig(): Record<string, unknown> {
  if (!_resolved) build();
  return _https ? { httpAgent: _http, httpsAgent: _https, proxy: false } : {};
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
