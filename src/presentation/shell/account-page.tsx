import { useRef, useState } from 'react'
import { NavLink } from 'react-router'
import { CircleCheck, LogOut, Menu, UserRound, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '../../components/ui/card'
import { useLocale, useSession } from '../context'
import { OutcomeFeedback } from '../feedback/outcome-feedback'
import { Brand } from './brand'
import { LocaleSelect } from './locale-select'

export function AccountPage() {
  const { t } = useLocale()
  const { principal, logout, notice, pending } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  if (!principal) return null
  const accountLink = <NavLink to="/account" onClick={() => setMenuOpen(false)}
    className="flex min-h-11 items-center gap-2.5 rounded-lg bg-accent px-3 text-sm font-medium">
    <UserRound className="size-4" aria-hidden="true" />{t('nav.account')}
  </NavLink>

  return <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
    <a href="#main" className="sr-only z-50 rounded bg-background p-3 focus:not-sr-only focus:fixed focus:top-3 focus:left-3">{t('nav.skip')}</a>
    <aside className="hidden border-r bg-sidebar lg:flex lg:flex-col">
      <div className="flex h-20 items-center px-6"><Brand /></div>
      <nav aria-label={t('nav.label')} className="px-3 py-5">{accountLink}</nav>
      <p className="mt-auto px-6 py-6 text-xs text-muted-foreground">{t('app.caption')}</p>
    </aside>
    <div className="min-w-0">
      <header className="border-b bg-background">
        <div className="flex min-h-20 items-center justify-between gap-3 px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Button ref={menuButton} variant="ghost" size="icon" className="lg:hidden" aria-expanded={menuOpen} aria-controls="mobile-nav"
              aria-label={t(menuOpen ? 'nav.close' : 'nav.menu')} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </Button>
            <div className="hidden text-sm font-medium text-muted-foreground sm:block">{t('nav.account')}</div>
            <span className="text-sm font-semibold sm:hidden">MiawPOS</span>
          </div>
          <LocaleSelect />
        </div>
        <nav id="mobile-nav" hidden={!menuOpen} aria-label={t('nav.label')} className="border-t p-3 lg:hidden"
          onKeyDown={event => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus() } }}>
          {accountLink}
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-5xl space-y-7 px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="text-2xl font-semibold tracking-tight">{t('session.title')}</h1><p className="mt-2 text-sm text-muted-foreground">{t('session.description')}</p></div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-xs font-medium text-success-foreground"><CircleCheck className="size-3.5" aria-hidden="true" />{t('session.active')}</span>
        </div>
        <OutcomeFeedback value={notice} />
        <Card className="gap-6 p-6 shadow-none">
          <CardHeader className="gap-1.5 px-0">
            <h2 className="font-semibold">{t('session.details')}</h2>
            <CardDescription>{t('session.detailsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <dl className="border-t pt-5 text-sm sm:grid sm:grid-cols-[180px_1fr] sm:gap-6">
              <dt className="text-muted-foreground">{t('session.accountId')}</dt>
              <dd className="mt-2 break-all font-mono text-xs leading-6 sm:mt-0">{principal.accountId}</dd>
            </dl>
          </CardContent>
        </Card>
        <section className="flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl border bg-muted/50"><UserRound className="size-5" aria-hidden="true" /></div>
          <h2 className="text-sm font-semibold">{t('session.placeholderTitle')}</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{t('session.placeholderBody')}</p>
        </section>
        <div className="flex flex-col items-start justify-between gap-4 border-t pt-6 sm:flex-row sm:items-center">
          <p className="max-w-md text-sm leading-6 text-muted-foreground">{t('session.sharedDevice')}</p>
          <Button variant="outline" disabled={pending} onClick={() => { void logout() }} className="gap-2 px-4"><LogOut aria-hidden="true" />{t(pending ? 'session.loggingOut' : 'session.logout')}</Button>
        </div>
      </main>
    </div>
  </div>
}
