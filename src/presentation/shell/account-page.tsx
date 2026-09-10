import type { ReactNode } from 'react'
import { CircleCheck } from 'lucide-react'
import { Link } from 'react-router'
import { buttonVariants } from '../../components/ui/button'
import { useLocale, useSession } from '../context'
import { OutcomeFeedback } from '../feedback/outcome-feedback'

function DashboardCard({ title, children }: { title: string; children: ReactNode }) {
  return <section className="flex min-h-[var(--shell-card-min)] flex-col overflow-hidden rounded-lg border bg-card">
    <header className="border-b bg-[var(--panel-tint)] px-4 py-3">
      <p className="text-xs font-medium">{title}</p>
    </header>
    <div className="flex min-h-0 flex-1 flex-col p-4">{children}</div>
  </section>
}

export function AccountPage() {
  const { locale, t } = useLocale()
  const { principal, notice } = useSession()
  const id = locale === 'id-ID'
  if (!principal) return null

  const text = {
    dashboard: 'Dashboard',
    session: id ? 'Sesi' : 'Session',
    connected: id ? 'Terhubung' : 'Connected',
    identity: id ? 'Identitas akun' : 'Account identity',
    account: id ? 'Akun' : 'Account',
    workspace: id ? 'Ruang usaha' : 'Workspace',
    slot: id ? 'Slot dashboard' : 'Dashboard slot',
    empty: id ? 'Siap untuk data berikutnya' : 'Ready for the next data block',
  }

  return <>
    <h1 className="sr-only">{t('session.title')}</h1>
    <div className="mb-5 flex items-center justify-between gap-4">
      <div><h2 className="text-xl font-semibold tracking-tight">{text.dashboard}</h2><p className="mt-1 text-xs text-muted-foreground">{t('session.description')}</p></div>
      <span className="inline-flex min-h-[var(--ui-control)] items-center gap-1.5 rounded-md border bg-background px-3 text-xs font-medium text-muted-foreground"><CircleCheck className="size-[var(--ui-icon)] text-success-foreground" />{t('session.active')}</span>
    </div>
    <OutcomeFeedback value={notice} />

    <div aria-label={text.dashboard} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(var(--dashboard-columns),minmax(0,1fr))]">
      <DashboardCard title={text.session}>
        <p className="text-2xl font-semibold tracking-tight">{text.connected}</p>
        <p className="mt-auto pt-5 text-xs leading-5 text-muted-foreground">{t('session.description')}</p>
      </DashboardCard>

      <DashboardCard title={text.identity}>
        <p className="text-xl font-semibold">{text.account}</p>
        <p className="mt-auto break-all pt-5 font-mono text-[0.6875rem] leading-5 text-muted-foreground">{principal.accountId}</p>
      </DashboardCard>

      <DashboardCard title={text.workspace}>
        <p className="text-xl font-semibold">{t('root.workspace')}</p>
        <div className="mt-auto pt-5"><Link to="/app" className={buttonVariants({ className: 'min-h-[var(--ui-control)] px-4' })}>{t('root.open')}</Link></div>
      </DashboardCard>

      {[0, 1, 2].map(slot => <section key={slot} className="flex min-h-[var(--shell-card-ghost-min)] flex-col overflow-hidden rounded-lg border border-dashed bg-card">
        <header className="border-b border-dashed bg-[var(--panel-tint)] px-4 py-3"><p className="text-xs font-medium text-muted-foreground">{text.slot}</p></header>
        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center"><div className="mb-3 size-7 rounded-md border bg-muted/50" /><p className="text-[0.6875rem] text-muted-foreground/70">{text.empty}</p></div>
      </section>)}
    </div>
  </>
}
