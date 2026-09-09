import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { createRuntime } from '../../app/runtime'
import { Providers } from '../../app/providers'
import { AppRouter } from '../../app/router'
import { authDto, meDto, json, failure } from '../../test/fixtures'
import type { Fetch } from '../../adapters/api/http-client'

function renderApp(options: { loggedOut?: boolean; path?: string; failLogout?: boolean; refreshFails?: boolean } = {}) {
  localStorage.setItem('miawpos.locale', 'id-ID')
  let active = !options.loggedOut
  let refreshFails = false
  const fetcher = vi.fn<Fetch>(async path => {
    if (String(path).endsWith('/me')) return json(meDto)
    if (String(path).endsWith('/logout')) {
      if (options.failLogout) return failure(500, 'internal_server_error')
      if (options.refreshFails) { refreshFails = true; return failure() }
      active = false
      return new Response(null, { status: 204 })
    }
    return active && !refreshFails ? json(authDto) : failure()
  })
  const runtime = createRuntime(fetcher)
  render(<StrictMode><Providers runtime={runtime}><MemoryRouter initialEntries={[options.path ?? '/account']}><AppRouter /></MemoryRouter></Providers></StrictMode>)
  return { runtime, fetcher }
}

async function recoveredSession() {
  await screen.findByRole('heading', { name: 'Akun Anda' })
  return userEvent.setup()
}

describe('Google login and session presentation', () => {
  it('offers only Google navigation, with localized accessible text and no password lifecycle', async () => {
    const { fetcher } = renderApp({ loggedOut: true })
    await screen.findByRole('heading', { name: 'Masuk ke MiawPOS' })
    const google = screen.getByRole('link', { name: 'Lanjutkan dengan Google' })
    expect(google).toHaveAttribute('href', '/api/auth/browser/google/start')
    expect(document.querySelector('form')).toBeNull()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(document.querySelector('input[type="email"], input[type="password"]')).toBeNull()
    expect(screen.queryByText('Gunakan akun Anda untuk melanjutkan.')).not.toBeInTheDocument()
    expect(screen.queryByText('Akses akun · MiawPOS')).not.toBeInTheDocument()
    expect(screen.queryByText(/password|kata sandi|forgot|daftar|sign up/i)).not.toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Bahasa / Language'))
    await user.click(screen.getByRole('option', { name: 'English' }))
    expect(screen.getByRole('link', { name: 'Continue with Google' })).toHaveAttribute('href', '/api/auth/browser/google/start')
    expect(screen.queryByText('Use your account to continue.')).not.toBeInTheDocument()
    expect(screen.queryByText('Account access · MiawPOS')).not.toBeInTheDocument()
    expect(fetcher.mock.calls.some(([path]) => String(path).includes('/manual/'))).toBe(false)
  })
  it('maps only the fixed callback failure marker to safe localized feedback', async () => {
    renderApp({ loggedOut: true, path: '/login?auth=failed&error_description=PRIVATE%20SERVER%20DETAIL' })
    expect(await screen.findByText('Belum dapat masuk')).toBeVisible()
    expect(screen.queryByText('PRIVATE SERVER DETAIL')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lanjutkan dengan Google' })).toBeVisible()
  })
  it('renders /me identity, switches locale without new auth requests, and clears cache on logout', async () => {
    const { runtime, fetcher } = renderApp()
    const user = await recoveredSession()
    expect(await screen.findByRole('heading', { name: 'Akun Anda' })).toBeVisible()
    expect(screen.getByText(meDto.account_id)).toBeVisible()
    runtime.queryClient.setQueryData(['protected-example'], { private: 'remove-me' })
    const count = fetcher.mock.calls.length
    await user.click(screen.getByLabelText('Bahasa / Language'))
    await user.click(screen.getByRole('option', { name: 'English' }))
    expect(screen.getByRole('heading', { name: 'Your account' })).toBeVisible()
    expect(fetcher).toHaveBeenCalledTimes(count)
    expect(document.documentElement.lang).toBe('en-US')
    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(await screen.findByRole('heading', { name: 'Sign in to MiawPOS' })).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('You have signed out')
    expect(runtime.queryClient.getQueryData(['protected-example'])).toBeUndefined()
    expect(JSON.stringify(runtime.queryClient.getQueryCache().getAll())).not.toContain(authDto.access_token)
    expect(Object.keys(localStorage)).toEqual(['miawpos.locale'])
  })
  it('keeps the account visible and does not report success when revocation fails', async () => {
    renderApp({ failLogout: true })
    const user = await recoveredSession()
    await screen.findByRole('heading', { name: 'Akun Anda' })
    await user.click(screen.getByRole('button', { name: 'Keluar' }))
    expect(await screen.findByText('Terjadi gangguan')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Akun Anda' })).toBeVisible()
    expect(screen.queryByText('Anda telah keluar')).not.toBeInTheDocument()
  })
  it('returns to login with expiration feedback and clears protected queries on refresh failure', async () => {
    const { runtime } = renderApp({ refreshFails: true })
    const user = await recoveredSession()
    await screen.findByRole('heading', { name: 'Akun Anda' })
    runtime.queryClient.setQueryData(['protected-example'], { private: 'remove-me' })
    await user.click(screen.getByRole('button', { name: 'Keluar' }))
    expect(await screen.findByRole('heading', { name: 'Masuk ke MiawPOS' })).toBeVisible()
    expect(screen.getByText('Sesi telah berakhir')).toBeVisible()
    await waitFor(() => expect(runtime.queryClient.getQueryData(['protected-example'])).toBeUndefined())
  })
})
