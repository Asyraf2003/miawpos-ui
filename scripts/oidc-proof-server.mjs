// Test-only external OIDC boundary. The real backend still runs discovery,
// signature/audience/issuer/nonce verification, PKCE, GoogleFlow and PostgreSQL.
import http from 'node:http'
import { generateKeyPairSync, randomBytes, createHash, sign, timingSafeEqual } from 'node:crypto'

const issuer = 'http://127.0.0.1:4184'
const callback = 'https://localhost:4173/api/auth/browser/google/callback'
const clientID = process.env.AUTH_GOOGLE_CLIENT_ID
const clientSecret = process.env.AUTH_GOOGLE_CLIENT_SECRET
if (!clientID || !clientSecret) throw new Error('Proof client configuration required')
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'ephemeral-proof', alg: 'RS256', use: 'sig' }
const codes = new Map()
const pending = new Map()
const random = () => randomBytes(32).toString('base64url')
const json = (res, status, data) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)) }
const redirect = (res, url) => { res.writeHead(303, { Location: url, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }); res.end() }
function idToken(nonce) {
  const now = Math.floor(Date.now() / 1000)
  const encoded = [ { alg: 'RS256', kid: jwk.kid }, { iss: issuer, aud: clientID, sub: 'miawpos-oidc-proof-account', email: 'google-proof@example.test', email_verified: true, nonce, iat: now, exp: now + 300, auth_time: now } ].map(value => Buffer.from(JSON.stringify(value)).toString('base64url')).join('.')
  return `${encoded}.${sign('RSA-SHA256', Buffer.from(encoded), privateKey).toString('base64url')}`
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, issuer)
  if (url.pathname === '/.well-known/openid-configuration') return json(res, 200, {
    issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`, jwks_uri: `${issuer}/jwks`,
    response_types_supported: ['code'], subject_types_supported: ['public'], id_token_signing_alg_values_supported: ['RS256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic'],
  })
  if (url.pathname === '/jwks') return json(res, 200, { keys: [jwk] })
  if (url.pathname === '/authorize') {
    const p = url.searchParams
    if (p.get('client_id') !== clientID || p.get('redirect_uri') !== callback || p.get('response_type') !== 'code' || p.get('code_challenge_method') !== 'S256' || !p.get('nonce') || !p.get('state') || !p.get('code_challenge')) return json(res, 400, { error: 'invalid_request' })
    const ticket = random()
    pending.set(ticket, { state: p.get('state'), nonce: p.get('nonce'), challenge: p.get('code_challenge'), expires: Date.now() + 60000 })
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' })
    return res.end(`<!doctype html><html lang="en"><title>Deterministic OIDC proof</title><h1>External identity provider test seam</h1><a href="/consent?ticket=${ticket}">Authorize test account</a><br><a href="/consent?ticket=${ticket}&mode=deny">Cancel authorization</a><br><a href="/consent?ticket=${ticket}&mode=nonce">Reject invalid nonce</a></html>`)
  }
  if (url.pathname === '/consent') {
    const ticket = url.searchParams.get('ticket')
    const entry = pending.get(ticket)
    pending.delete(ticket)
    if (!entry || entry.expires < Date.now()) return json(res, 400, { error: 'expired_request' })
    const result = new URL(callback)
    result.searchParams.set('state', entry.state)
    if (url.searchParams.get('mode') === 'deny') result.searchParams.set('error', 'access_denied')
    else {
      const code = random()
      codes.set(code, { ...entry, nonce: url.searchParams.get('mode') === 'nonce' ? 'invalid-nonce' : entry.nonce })
      result.searchParams.set('code', code)
    }
    return redirect(res, result.href)
  }
  if (url.pathname === '/token' && req.method === 'POST') {
    let body = ''
    for await (const part of req) { body += part; if (body.length > 8192) return json(res, 400, { error: 'invalid_request' }) }
    const p = new URLSearchParams(body)
    const expected = Buffer.from(`Basic ${Buffer.from(`${clientID}:${clientSecret}`).toString('base64')}`)
    const received = Buffer.from(req.headers.authorization ?? '')
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return json(res, 401, { error: 'invalid_client' })
    const entry = codes.get(p.get('code'))
    codes.delete(p.get('code'))
    const challenge = createHash('sha256').update(p.get('code_verifier') ?? '').digest('base64url')
    if (!entry || entry.expires < Date.now() || entry.challenge !== challenge || p.get('redirect_uri') !== callback || p.get('grant_type') !== 'authorization_code') return json(res, 400, { error: 'invalid_grant' })
    return json(res, 200, { access_token: random(), token_type: 'Bearer', expires_in: 300, id_token: idToken(entry.nonce) })
  }
  json(res, 404, { error: 'not_found' })
})
server.listen(4184, '127.0.0.1', () => console.log('Deterministic external OIDC proof server ready'))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close())
