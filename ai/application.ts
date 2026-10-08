import { chromium, type Browser, type BrowserContext, type Locator } from '@playwright/test';
import { lookup } from 'node:dns/promises';
import { createServer } from 'node:http';
import { connect, isIP } from 'node:net';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';

export interface ApplicationConfig {
  name: string;
  url: string;
  pomDirectory: string;
  allowLocal: boolean;
  storageState: string;
  approvedPages: string[];
}
export interface UiElement {
  pageUrl?: string;
  verifiedAt?: string;
  id: string;
  tag: string;
  inputType?: string;
  role: string;
  name: string;
  label: string;
  placeholder: string;
  testId: string;
  form: string;
  href: string;
  locator: string;
  verifiedLocators: string[];
  count: number;
  visible: boolean;
}
export interface Inspection {
  url: string;
  title: string;
  inspectedAt: string;
  elements: UiElement[];
  truncated: boolean;
}
export function canonicalUrl(value: string): string {
  if (value.length > 2048) throw new Error('URL too long');
  const url = new URL(value);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error('Use an HTTP(S) URL without credentials, query or fragment');
  return url.href;
}
export function applicationConfig(value: unknown): ApplicationConfig {
  if (!value || typeof value !== 'object') throw new Error('Application configuration required');
  const v = value as Record<string, unknown>;
  if (
    typeof v.name !== 'string' ||
    !v.name.trim() ||
    v.name.length > 100 ||
    typeof v.url !== 'string'
  )
    throw new Error('Application name and URL required');
  const url = canonicalUrl(v.url);
  const pages = v.approvedPages ?? [];
  if (!Array.isArray(pages) || pages.length > 4 || pages.some((p) => typeof p !== 'string'))
    throw new Error('Approve at most four additional pages');
  const approvedPages = pages.map((p) => canonicalUrl(p as string));
  if (approvedPages.some((p) => new URL(p).origin !== new URL(url).origin))
    throw new Error('Additional pages must share the application origin');
  for (const key of ['pomDirectory', 'storageState'])
    if (v[key] !== undefined && (typeof v[key] !== 'string' || (v[key] as string).length > 250))
      throw new Error('Invalid local path');
  return {
    name: v.name.trim(),
    url,
    pomDirectory: String(v.pomDirectory ?? ''),
    storageState: String(v.storageState ?? ''),
    allowLocal: v.allowLocal === true,
    approvedPages,
  };
}
export async function projectPath(root: string, requested: string): Promise<string> {
  if (!requested || isAbsolute(requested) || requested.split(/[\\/]/).includes('..'))
    throw new Error('Use a project-relative path without traversal');
  const base = await realpath(root);
  const target = await realpath(resolve(base, requested));
  const rel = relative(base, target);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Path escapes project');
  return target;
}
export function allowedAddress(address: string, allowLocal: boolean): boolean {
  // Fail closed for IPv6, including IPv4-mapped and transition addresses.
  if (isIP(address) !== 4) return false;
  const [a = 0, b = 0] = address.split('.').map(Number);
  if (a === 127) return allowLocal;
  return !(
    a === 0 ||
    a === 10 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0 || b === 2)) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0) ||
    a >= 224
  );
}
export async function resolveApplication(
  config: ApplicationConfig,
  resolver = (host: string) => lookup(host, { all: true, family: 4 }),
) {
  const url = new URL(canonicalUrl(config.url));
  if (isIP(url.hostname.replace('[', '').replace(']', '')) === 6)
    throw new Error('IPv6 targets are not supported');
  const addresses = await resolver(url.hostname);
  if (!addresses.length || addresses.some((a) => !allowedAddress(a.address, config.allowLocal)))
    throw new Error(
      'Application resolves to a restricted address; local opt-in permits loopback only',
    );
  return { url, address: addresses[0]!.address };
}
// A per-operation proxy connects to the validated IP, never resolving again. This prevents DNS
// rebinding and enforces the origin for redirects, scripts, WebSockets and subresources alike.
export async function pinnedProxy(config: ApplicationConfig) {
  const { url, address } = await resolveApplication(config);
  const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
  const sockets = new Set<import('node:net').Socket>();
  const proxy = createServer((req, res) => {
    let target: URL;
    try {
      target = new URL(req.url ?? '');
    } catch {
      res.writeHead(403).end();
      return;
    }
    if (target.origin !== url.origin || url.protocol !== 'http:') {
      res.writeHead(403).end();
      return;
    }
    const upstream = connect(port, address);
    sockets.add(upstream);
    upstream.setTimeout(30_000, () => upstream.destroy());
    upstream.on('error', () => {
      if (!res.headersSent) res.writeHead(502);
      res.end();
    });
    upstream.on('close', () => sockets.delete(upstream));
    upstream.on('connect', () => {
      // Use the fixed host; never forward proxy credentials or connection headers.
      const headers = Object.entries(req.headers).filter(
        ([k]) => !['proxy-authorization', 'proxy-connection', 'connection', 'host'].includes(k),
      );
      upstream.write(
        req.method +
          ' ' +
          target.pathname +
          target.search +
          ' HTTP/1.1\r\nHost: ' +
          url.host +
          '\r\nConnection: close\r\n' +
          headers.map(([k, v]) => k + ': ' + String(v)).join('\r\n') +
          '\r\n\r\n',
      );
      req.pipe(upstream);
    });
    // Forward raw upstream response to the client socket, preserving HTTP framing.
    upstream.pipe(res.socket!);
  });
  proxy.on('connect', (req, client, head) => {
    if (url.protocol !== 'https:' || req.url !== url.hostname + ':' + port) {
      client.end('HTTP/1.1 403 Forbidden\r\n\r\n');
      return;
    }
    const upstream = connect(port, address);
    sockets.add(upstream);
    upstream.setTimeout(30_000, () => upstream.destroy());
    upstream.on('error', () => client.destroy());
    upstream.on('close', () => sockets.delete(upstream));
    client.on('error', () => upstream.destroy());
    client.on('close', () => upstream.destroy());
    upstream.on('connect', () => {
      client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head.length) upstream.write(head);
      client.pipe(upstream);
      upstream.pipe(client);
    });
  });
  await new Promise<void>((r) => proxy.listen(0, '127.0.0.1', r));
  const endpoint = proxy.address();
  if (!endpoint || typeof endpoint === 'string') throw new Error('Proxy startup failed');
  return {
    server: 'http://127.0.0.1:' + endpoint.port,
    close: async () => {
      for (const socket of sockets) socket.destroy();
      proxy.closeAllConnections();
      await new Promise<void>((r) => proxy.close(() => r()));
    },
  };
}
export function permittedNavigation(config: ApplicationConfig, raw: string): boolean {
  try {
    return [config.url, ...config.approvedPages].includes(canonicalUrl(raw));
  } catch {
    return false;
  }
}
export async function restrictContext(context: BrowserContext, config: ApplicationConfig) {
  let navigations = 0;
  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const navigation = req.isNavigationRequest();
    if (
      url.origin !== new URL(config.url).origin ||
      !['GET', 'HEAD'].includes(req.method()) ||
      (navigation && (!permittedNavigation(config, req.url()) || ++navigations > 5))
    )
      return route.abort('blockedbyclient');
    await route.continue();
  });
}
export async function inspectApplication(
  config: ApplicationConfig,
  root: string,
): Promise<Inspection> {
  let storageState: string | undefined;
  if (config.storageState) {
    if (!/^\.local[\\/]auth[\\/][\w.-]+\.json$/.test(config.storageState))
      throw new Error('Storage state must be .local/auth/<name>.json');
    storageState = await projectPath(root, config.storageState);
    if ((await readFile(storageState)).length > 1_000_000)
      throw new Error('Storage state too large');
  }
  const proxy = await pinnedProxy(config);
  let browser: Browser | undefined;
  const deadline = setTimeout(() => {
    void browser?.close().catch(() => {});
  }, 30_000);
  try {
    browser = await chromium.launch({
      headless: true,
      proxy: { server: proxy.server, bypass: '<-loopback>' },
    });
    const context = await browser.newContext({ storageState, serviceWorkers: 'block' });
    await restrictContext(context, config);
    const page = await context.newPage();
    page.setDefaultTimeout(2000);
    await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    if (!permittedNavigation(config, page.url())) throw new Error('Unapproved redirect');
    const nodes = page.locator(
      'button,input:not([type=hidden]),a,select,textarea,[role=button],[role=link]',
    );
    const total = await nodes.count();
    const elements: UiElement[] = [];
    const quote = JSON.stringify;
    for (let index = 0; index < Math.min(total, 100); index++) {
      const node = nodes.nth(index);
      if (!(await node.isVisible())) continue;
      const data = await node.evaluate((el) => {
        const tag = el.tagName.toLowerCase();
        const input = el as HTMLInputElement;
        const label = (
          input.labels
            ? Array.from(input.labels)
                .map((l) => l.textContent ?? '')
                .join(' ')
            : ''
        ).trim();
        const labelled = (el.getAttribute('aria-labelledby') ?? '')
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent ?? '')
          .join(' ')
          .trim();
        const name =
          el.getAttribute('aria-label') ||
          labelled ||
          label ||
          (tag === 'input' && ['button', 'submit', 'reset'].includes(input.type)
            ? input.value
            : ['a', 'button'].includes(tag)
              ? el.textContent
              : '') ||
          '';
        const role =
          el.getAttribute('role') ||
          (tag === 'button'
            ? 'button'
            : tag === 'a' && el.hasAttribute('href')
              ? 'link'
              : tag === 'select'
                ? 'combobox'
                : ['textarea', 'input'].includes(tag) &&
                    !['password', 'checkbox', 'radio', 'submit', 'button'].includes(input.type)
                  ? 'textbox'
                  : input.type === 'checkbox'
                    ? 'checkbox'
                    : input.type === 'radio'
                      ? 'radio'
                      : ['submit', 'button'].includes(input.type)
                        ? 'button'
                        : '');
        let href = '';
        try {
          if (tag === 'a') {
            const u = new URL((el as HTMLAnchorElement).href);
            href = u.origin + u.pathname;
          }
        } catch {
          /* no URL */
        }
        return {
          tag,
          inputType: tag === 'input' ? input.type : '',
          role,
          name: name.trim().slice(0, 160),
          label: label.slice(0, 160),
          placeholder: (el.getAttribute('placeholder') ?? '').slice(0, 160),
          testId: (el.getAttribute('data-testid') ?? '').slice(0, 160),
          cssTest: (el.getAttribute('data-test') ?? '').slice(0, 160),
          form: el.closest('form')?.getAttribute('id')?.slice(0, 100) ?? '',
          href,
        };
      });
      const candidates: { expression: string; locator: Locator }[] = [];
      if (data.role && data.name)
        candidates.push({
          expression:
            'page.getByRole(' +
            quote(data.role) +
            ', { name: ' +
            quote(data.name) +
            ', exact: true })',
          locator: page.getByRole(data.role as Parameters<typeof page.getByRole>[0], {
            name: data.name,
            exact: true,
          }),
        });
      if (data.label)
        candidates.push({
          expression: 'page.getByLabel(' + quote(data.label) + ', { exact: true })',
          locator: page.getByLabel(data.label, { exact: true }),
        });
      if (data.testId)
        candidates.push({
          expression: 'page.getByTestId(' + quote(data.testId) + ')',
          locator: page.getByTestId(data.testId),
        });
      if (data.placeholder)
        candidates.push({
          expression: 'page.getByPlaceholder(' + quote(data.placeholder) + ', { exact: true })',
          locator: page.getByPlaceholder(data.placeholder, { exact: true }),
        });
      if (data.cssTest && /^[\w-]+$/.test(data.cssTest)) {
        const css = '[data-test="' + data.cssTest + '"]';
        candidates.push({
          expression: 'page.locator(' + quote(css) + ')',
          locator: page.locator(css),
        });
      }
      let locator = '',
        count = 0;
      const verifiedLocators: string[] = [];
      for (const candidate of candidates) {
        const n = await candidate.locator.count();
        if (
          n === 1 &&
          (await candidate.locator.isVisible()) &&
          (await candidate.locator.evaluate(
            (el, i) =>
              el ===
              document.querySelectorAll(
                'button,input:not([type=hidden]),a,select,textarea,[role=button],[role=link]',
              )[i],
            index,
          ))
        ) {
          verifiedLocators.push(candidate.expression);
          if (!locator) {
            locator = candidate.expression;
            count = n;
          }
        }
      }
      const { cssTest, ...safe } = data;
      void cssTest;
      elements.push({
        ...safe,
        pageUrl: page.url(),
        verifiedAt: new Date().toISOString(),
        id: 'UI-' + (index + 1),
        locator,
        verifiedLocators,
        count,
        visible: true,
      });
    }
    return {
      url: page.url(),
      title: (await page.title()).slice(0, 200),
      inspectedAt: new Date().toISOString(),
      elements,
      truncated: total > 100,
    };
  } finally {
    clearTimeout(deadline);
    await browser?.close();
    await proxy.close();
  }
}
