import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { Providers } from '../../app/providers'
import { AppRouter } from '../../app/router'
import { createRuntime } from '../../app/runtime'
import { authDto, meDto, json, failure } from '../../test/fixtures'

const one = { id: 'one', name: 'Toko Satu', primary_owner_account_id: 'owner', created_at: '2026-09-10T00:00:00Z' }
function app(roots: unknown[], fail = false, lostCreate = false) {
  localStorage.setItem('miawpos.locale', 'id-ID')
  let created = false
  const runtime = createRuntime(async (path, init) => {
    if (String(path).endsWith('/roots')) {
      if (fail) return failure(403, 'root_access_denied')
      if (init?.method === 'POST' && lostCreate) { created = true; throw new TypeError('lost response') }
      return json({ success: true, data: init?.method === 'POST' ? one : created ? [one] : roots, meta: {} })
    }
    return json(String(path).endsWith('/me') ? meDto : authDto)
  })
  render(<Providers runtime={runtime}><MemoryRouter initialEntries={['/app']}><AppRouter /></MemoryRouter></Providers>)
  return { runtime, user: userEvent.setup() }
}
describe('human ROOT context', () => {
  it('requires a list read after uncertain creation instead of allowing a duplicate first ROOT', async () => {
    const { user } = app([], false, true)
    await user.type(await screen.findByLabelText('Nama ruang usaha'), 'Toko Satu')
    await user.click(screen.getByRole('button', { name: 'Buat ruang usaha' }))
    expect(await screen.findByText('Tidak dapat terhubung')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Buat ruang usaha' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Periksa ruang usaha yang sudah dibuat' }))
    expect(await screen.findByRole('heading', { name: 'Toko Satu' })).toBeVisible()
  })
  it('creates the first ROOT and opens the returned context', async () => {
    const { user } = app([])
    await screen.findByRole('heading', { name: 'Buat ruang usaha pertama' })
    await user.type(screen.getByLabelText('Nama ruang usaha'), 'Toko Satu')
    await user.click(screen.getByRole('button', { name: 'Buat ruang usaha' }))
    expect(await screen.findByRole('heading', { name: 'Toko Satu' })).toBeVisible()
    expect(Object.keys(localStorage)).toEqual(['miawpos.locale'])
  })
  it('automatically uses the only accessible ROOT', async () => {
    app([one])
    expect(await screen.findByRole('heading', { name: 'Toko Satu' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Pilih ruang usaha' })).not.toBeInTheDocument()
  })
  it('requires selection for multiple ROOTs and clears scoped cache on switch', async () => {
    const { user, runtime } = app([one, { ...one, id: 'two', name: 'Toko Dua' }])
    await screen.findByRole('heading', { name: 'Pilih ruang usaha' })
    runtime.queryClient.setQueryData(['root-scoped', 'one', 'private'], 'private')
    await user.click(screen.getByRole('button', { name: 'Toko Dua' }))
    expect(await screen.findByRole('heading', { name: 'Toko Dua' })).toBeVisible()
    expect(runtime.queryClient.getQueryData(['root-scoped', 'one', 'private'])).toBeUndefined()
  })
  it('fails closed without exposing a workspace on denial', async () => {
    app([one], true)
    expect(await screen.findByText('Akses tidak diizinkan')).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Toko Satu' })).not.toBeInTheDocument()
  })
})
