import { readFileSync, existsSync } from 'node:fs'
import assert from 'node:assert/strict'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
assert.equal(process.versions.node, pkg.engines.node, 'Use the pinned Node version')
for (const [name, version] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) {
  assert.match(version, /^\d+\.\d+\.\d+$/, `${name} must have an exact release version`)
}
assert.equal(pkg.packageManager, 'pnpm@12.3.4')
assert.ok(existsSync('pnpm-lock.yaml'))
for (const lock of ['package-lock.json', 'yarn.lock', 'bun.lock', 'bun.lockb']) assert.ok(!existsSync(lock), `Unexpected ${lock}`)
console.log('PASS exact dependencies and toolchain')
