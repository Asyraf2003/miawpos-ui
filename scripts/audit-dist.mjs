import { readdirSync, readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const files = readdirSync('dist', { recursive: true, withFileTypes: true }).filter(file => file.isFile())
assert.ok(files.length > 0)
for (const file of files) {
  assert.ok(!/\.map$|^\.env(?:\.|$)|\.(?:pem|key|p12|pfx)$|credentials|secrets|private.config/i.test(file.name), `Private artifact: ${file.name}`)
  const text = readFileSync(`${file.parentPath}/${file.name}`, 'utf8')
  assert.ok(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|postgres(?:ql)?:\/\/|AUTH_JWT_SECRET\s*[=:]|AIza[0-9A-Za-z_-]{35}|AKIA[0-9A-Z]{16}/.test(text), `Credential material: ${file.name}`)
  assert.ok(!/sourceMappingURL=/.test(text), `Source map reference: ${file.name}`)
}
console.log(`PASS dist audit (${files.length} public files; no source maps or private configuration)`)
