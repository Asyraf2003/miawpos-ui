import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { Button, buttonVariants } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { outcomeFrom, type Outcome } from '../../domain/outcome'
import { useLocale } from '../context'
import { OutcomeFeedback } from '../feedback/outcome-feedback'
import { Brand } from '../shell/brand'
import { LocaleSelect } from '../shell/locale-select'
import { useRoots } from './context'
import { CatalogPage } from '../catalog/catalog-page'
import { SalePage } from '../sales/sale-page'
import { useWorkspacePorts } from '../workspace-ports'

export function RootPage() {
  const { t } = useLocale()
  const root = useRoots()
  const { cash } = useWorkspacePorts()
  const location = useLocation()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const live = useRef(true)
  useEffect(() => { live.current = true; return () => { live.current = false } }, [])
  const [notice, setNotice] = useState<Outcome | null>(null)
  const selecting = location.pathname === '/root/select'
  if (!root.loading && !root.error) {
    if (!root.roots.length && location.pathname !== '/root/new') return <Navigate to="/root/new" replace />
    if (root.roots.length && location.pathname === '/root/new') return <Navigate to="/app" replace />
    if (root.roots.length > 1 && !root.active && !selecting) return <Navigate to="/root/select" replace />
    if (root.active && selecting && root.roots.length === 1) return <Navigate to="/app" replace />
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy.current) return
    busy.current = true; setPending(true); setNotice(null)
    try { await root.create(name); if (live.current) navigate('/app', { replace: true }) }
    catch (error) { if (live.current) setNotice(outcomeFrom(error)) }
    finally { busy.current = false; if (live.current) setPending(false) }
  }
  return <div className="min-h-dvh bg-muted/30">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-background px-5 py-4 sm:px-8"><Brand /><LocaleSelect /></header>
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-10">
      <Link to="/account" className={buttonVariants({ variant: 'outline', className: 'px-4' })}>{t('nav.account')}</Link>
      {root.loading ? <p role="status">{t('root.loading')}</p> : root.error ? <><OutcomeFeedback value={root.error} /><Button onClick={root.refresh}>{t('action.retry')}</Button></> :
        !root.roots.length ? <section className="space-y-6 rounded-xl border bg-card p-6 sm:p-8">
          <div><h1 className="text-2xl font-semibold">{t('root.new')}</h1><p className="mt-2 text-sm text-muted-foreground">{t('root.newBody')}</p></div>
          <form onSubmit={event => { void submit(event) }} className="space-y-5">
            <div className="space-y-2"><label htmlFor="root-name" className="text-sm font-medium">{t('root.name')}</label><Input id="root-name" value={name} onChange={event => setName(event.target.value)} required disabled={pending} aria-describedby="root-name-help" /><p id="root-name-help" className="text-xs text-muted-foreground">{t('root.nameHelp')}</p></div>
            <OutcomeFeedback value={notice} />
            <Button type="submit" disabled={pending} className="px-4">{t(pending ? 'root.creating' : 'root.create')}</Button>
          </form>
          {notice && <Button variant="outline" onClick={root.refresh}>{t('root.check')}</Button>}
        </section> : selecting ? <section className="space-y-5">
          <h1 className="text-2xl font-semibold">{t('root.select')}</h1>
          <div className="grid gap-3 sm:grid-cols-2">{root.roots.map(item => <Button key={item.id} variant="outline" className="h-auto justify-start whitespace-normal break-words p-5 text-left" onClick={() => { root.select(item.id); navigate('/app', { replace: true }) }}>{item.name}</Button>)}</div>
        </section> : root.active ? <section className="space-y-5 rounded-xl border bg-card p-6 sm:p-8">
          <p className="text-sm text-muted-foreground">{t('root.workspace')}</p>
          <h1 className="break-words text-2xl font-semibold">{root.active.name}</h1>
          {root.roots.length > 1 && <Link to="/root/select" className={buttonVariants({ variant: 'outline', className: 'px-4' })}>{t('root.switch')}</Link>}
          {location.pathname.startsWith('/app/catalog/') ? <CatalogPage key={root.active.id + location.pathname} rootId={root.active.id} /> : location.pathname.startsWith('/app/sales/') ? <SalePage key={root.active.id + location.pathname} rootId={root.active.id} /> : <div className="flex flex-wrap gap-3"><Link to="/app/catalog/new" className={buttonVariants({ className: 'px-4' })}>{t('catalog.new')}</Link>{cash.pending(root.active.id) && <Link to={`/app/catalog/${encodeURIComponent(cash.pending(root.active.id)!.itemId)}`} className={buttonVariants({ variant: 'outline', className: 'px-4' })}>{t('sale.resume')}</Link>}</div>}
        </section> : null}
    </main>
  </div>
}
