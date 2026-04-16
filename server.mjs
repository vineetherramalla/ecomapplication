/* global Buffer, URL, console, process */
import { createServer } from 'node:http';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { createReadStream } from 'node:fs';
import { access, readFile, stat } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist');
const indexFile = join(distDir, 'index.html');
const DEFAULT_API_PROXY_TARGET = 'http://192.168.0.113:8000';

const loadDotEnv = async () => {
  const envFile = join(__dirname, '.env');

  try {
    const contents = await readFile(envFile, 'utf8');
    contents.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (key && process.env[key] === undefined) {
        process.env[key] = value.replace(/^['"]|['"]$/g, '');
      }
    });
  } catch {
    // No local .env file is required in production.
  }
};

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const fileExists = async (filePath) => {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const getContentType = (filePath) =>
  MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';

const getCacheControl = (pathname) =>
  pathname.startsWith('/assets/')
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=3600';

const getDefaultHeaders = () => ({
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
});

const sendJson = (response, statusCode, payload) => {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    ...getDefaultHeaders(),
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(body);
};

const serveFile = async (filePath, requestPath, response) => {
  const fileStats = await stat(filePath);
  response.writeHead(200, {
    ...getDefaultHeaders(),
    'Cache-Control': filePath === indexFile ? 'no-store' : getCacheControl(requestPath),
    'Content-Length': fileStats.size,
    'Content-Type': getContentType(filePath),
  });
  createReadStream(filePath).pipe(response);
};

const proxyRequest = (request, response, requestUrl, upstreamOrigin) => {
  if (!upstreamOrigin) {
    sendJson(response, 503, {
      error: 'API proxy target is not configured.',
      detail: 'Set API_PROXY_TARGET to your backend origin before starting the server.',
    });
    return;
  }

  const upstreamUrl = new URL(`${requestUrl.pathname}${requestUrl.search}`, `${upstreamOrigin}/`);
  const proxyTransport = upstreamUrl.protocol === 'https:' ? httpsRequest : httpRequest;
  const headers = { ...request.headers, host: upstreamUrl.host };

  Object.keys(headers).forEach((header) => {
    if (HOP_BY_HOP_HEADERS.has(header.toLowerCase())) {
      delete headers[header];
    }
  });

  headers['x-forwarded-host'] = request.headers.host || '';
  headers['x-forwarded-proto'] = request.headers['x-forwarded-proto'] || 'https';
  headers['x-forwarded-for'] = request.socket.remoteAddress || '';
  headers['cache-control'] = 'no-cache';
  headers.pragma = 'no-cache';

  const proxy = proxyTransport(
    upstreamUrl,
    {
      headers,
      method: request.method,
    },
    (proxyResponse) => {
      const responseHeaders = { ...proxyResponse.headers, ...getDefaultHeaders() };
      Object.keys(responseHeaders).forEach((header) => {
        if (HOP_BY_HOP_HEADERS.has(header.toLowerCase())) {
          delete responseHeaders[header];
        }
      });

      if (requestUrl.pathname.startsWith('/api/')) {
        responseHeaders['Cache-Control'] = 'no-store';
        responseHeaders.Pragma = 'no-cache';
      }

      response.writeHead(proxyResponse.statusCode || 502, responseHeaders);
      proxyResponse.pipe(response);
    },
  );

  proxy.on('error', (error) => {
    sendJson(response, 502, {
      error: 'Upstream proxy request failed.',
      detail: error.message,
    });
  });

  request.pipe(proxy);
};

const start = async () => {
  await loadDotEnv();

  const host = process.env.HOST || '0.0.0.0';
  const port = Number(process.env.PORT || 3000);
  const upstreamOrigin = (
    process.env.API_PROXY_TARGET ||
    process.env.VITE_API_URL ||
    process.env.VITE_API_PROXY_TARGET ||
    DEFAULT_API_PROXY_TARGET
  ).replace(/\/$/, '');

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'frontend.internal'}`);

    if (requestUrl.pathname === '/healthz') {
      sendJson(response, 200, {
        ok: true,
        proxyTarget: upstreamOrigin || null,
      });
      return;
    }

    if (requestUrl.pathname.startsWith('/api/') || requestUrl.pathname.startsWith('/media/')) {
      proxyRequest(request, response, requestUrl, upstreamOrigin);
      return;
    }

    const safePath = normalize(decodeURIComponent(requestUrl.pathname)).replace(/^(\.\.[/\\])+/, '');
    const candidatePath = safePath === '/' ? indexFile : join(distDir, safePath);

    try {
      if (await fileExists(candidatePath)) {
        const fileStats = await stat(candidatePath);
        if (fileStats.isFile()) {
          await serveFile(candidatePath, requestUrl.pathname, response);
          return;
        }
      }
  
      await serveFile(indexFile, requestUrl.pathname, response);
    } catch (error) {
      sendJson(response, 500, {
        error: 'Failed to serve frontend asset.',
        detail: error.message,
      });
    }
  });

  server.listen(port, host, () => {
    console.log(`Frontend server listening on http://${host}:${port}`);
  });
};

start();
