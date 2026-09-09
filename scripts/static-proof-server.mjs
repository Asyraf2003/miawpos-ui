// Test-only static HTTPS host. Production uses an ordinary static reverse proxy.
import https from 'node:https'
import http from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve, extname } from 'node:path'

const dist = resolve('dist')
const headers = {
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000',
}
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' }
const server = https.createServer({ key: readFileSync(process.env.PROOF_TLS_KEY), cert: readFileSync(process.env.PROOF_TLS_CERT) }, (req, res) => {
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value)
  if (req.url === '/api' || req.url?.startsWith('/api/')) {
    const upstream = http.request({ hostname: '127.0.0.1', port: 8081, path: req.url, method: req.method,
      headers: { ...req.headers, 'x-forwarded-proto': 'https' } }, reply => {
      res.writeHead(reply.statusCode ?? 502, reply.headers)
      reply.pipe(res)
    })
    upstream.on('error', () => { res.writeHead(502, { 'Content-Type': 'application/json' }); res.end('{"error":{"code":"upstream_unavailable"}}') })
    req.pipe(upstream)
    return
  }
  const pathname = new URL(req.url ?? '/', 'https://localhost').pathname
  let file = resolve(dist, `.${pathname}`)
  if (!file.startsWith(`${dist}/`) && file !== dist) { res.writeHead(404); res.end(); return }
  if (!existsSync(file) || !statSync(file).isFile()) {
    if (extname(pathname)) { res.writeHead(404); res.end(); return }
    file = resolve(dist, 'index.html')
  }
  res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream')
  res.setHeader('Cache-Control', extname(file) === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable')
  res.end(readFileSync(file))
})
server.listen(4173, '127.0.0.1', () => console.log('Static HTTPS proof host ready on https://localhost:4173'))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close())
