import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  Bell,
  Cat,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  LayoutDashboard,
  LogOut,
  Moon,
  Palette,
  Search,
  Settings2,
  Sun,
  UserRound,
  X,
} from 'lucide-react'
import { buttonVariants } from '../../components/ui/button'
import { useLocale, useSession } from '../context'
import { OutcomeFeedback } from '../feedback/outcome-feedback'
import { LocaleSelect } from './locale-select'

type Panel = 'notifications' | 'appearance' | 'profile' | null
type PaletteName = 'neutral' | 'blue' | 'green' | 'amber' | 'rose'
type FontName = 'system' | 'serif' | 'mono'
type ScaleName = 's' | 'm' | 'l' | 'xl'

const palettes: Record<PaletteName, { swatch: string; light: string; dark: string; lightText: string; darkText: string }> = {
  neutral: { swatch: 'oklch(0.30 0 0)', light: 'oklch(0.205 0 0)', dark: 'oklch(0.92 0 0)', lightText: 'oklch(0.985 0 0)', darkText: 'oklch(0.205 0 0)' },
  blue: { swatch: 'oklch(0.55 0.20 255)', light: 'oklch(0.52 0.20 255)', dark: 'oklch(0.72 0.15 255)', lightText: 'oklch(0.985 0 0)', darkText: 'oklch(0.16 0.03 255)' },
  green: { swatch: 'oklch(0.56 0.16 155)', light: 'oklch(0.48 0.15 155)', dark: 'oklch(0.72 0.13 155)', lightText: 'oklch(0.985 0 0)', darkText: 'oklch(0.16 0.03 155)' },
  amber: { swatch: 'oklch(0.72 0.16 80)', light: 'oklch(0.62 0.16 70)', dark: 'oklch(0.78 0.15 80)', lightText: 'oklch(0.17 0.02 70)', darkText: 'oklch(0.17 0.02 70)' },
  rose: { swatch: 'oklch(0.58 0.21 20)', light: 'oklch(0.54 0.21 20)', dark: 'oklch(0.72 0.16 20)', lightText: 'oklch(0.985 0 0)', darkText: 'oklch(0.18 0.03 20)' },
}

const fonts: Record<FontName, string> = {
  system: 'ui-sans-serif, system-ui, sans-serif',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
}

const scales: Record<ScaleName, string> = { s: '16px', m: '17px', l: '18.5px', xl: '20px' }

const theme = {
  light: {
    '--background': 'oklch(1 0 0)', '--foreground': 'oklch(0.145 0 0)', '--card': 'oklch(1 0 0)', '--card-foreground': 'oklch(0.145 0 0)',
    '--popover': 'oklch(1 0 0)', '--popover-foreground': 'oklch(0.145 0 0)', '--secondary': 'oklch(0.97 0 0)', '--secondary-foreground': 'oklch(0.205 0 0)',
    '--muted': 'oklch(0.97 0 0)', '--muted-foreground': 'oklch(0.48 0 0)', '--accent': 'oklch(0.97 0 0)', '--accent-foreground': 'oklch(0.205 0 0)',
    '--border': 'oklch(0.922 0 0)', '--input': 'oklch(0.70 0 0)', '--sidebar': 'oklch(0.985 0 0)', '--sidebar-foreground': 'oklch(0.145 0 0)',
  },
  dark: {
    '--background': 'oklch(0.145 0 0)', '--foreground': 'oklch(0.96 0 0)', '--card': 'oklch(0.185 0 0)', '--card-foreground': 'oklch(0.96 0 0)',
    '--popover': 'oklch(0.19 0 0)', '--popover-foreground': 'oklch(0.96 0 0)', '--secondary': 'oklch(0.25 0 0)', '--secondary-foreground': 'oklch(0.96 0 0)',
    '--muted': 'oklch(0.235 0 0)', '--muted-foreground': 'oklch(0.70 0 0)', '--accent': 'oklch(0.255 0 0)', '--accent-foreground': 'oklch(0.96 0 0)',
    '--border': 'oklch(0.30 0 0)', '--input': 'oklch(0.38 0 0)', '--sidebar': 'oklch(0.17 0 0)', '--sidebar-foreground': 'oklch(0.96 0 0)',
  },
} as const

export function AccountPage() {
  const { locale, t } = useLocale()
  const { principal, logout, notice, pending } = useSession()
  const id = locale === 'id-ID'
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  const [panel, setPanel] = useState<Panel>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [palette, setPalette] = useState<PaletteName>('neutral')
  const [font, setFont] = useState<FontName>('system')
  const [scale, setScale] = useState<ScaleName>('m')

  const text = {
    search: id ? 'Cari' : 'Search', dashboard: 'Dashboard', dashboards: 'Dashboards',
    overview: id ? 'Ringkasan ruang kerja Anda' : 'A compact view of your workspace',
    notifications: id ? 'Notifikasi' : 'Notifications', appearance: id ? 'Tampilan' : 'Appearance', profile: id ? 'Menu pengguna' : 'User menu',
    welcome: id ? 'Selamat datang di MiawPOS' : 'Welcome to MiawPOS',
    welcomeBody: id ? 'UI ini masih dummy untuk tuning visual. Belum ada data bisnis baru di sini.' : 'This UI is still a dummy for visual tuning. No new business data is wired here.',
    palette: id ? 'Warna' : 'Color', font: 'Font', scale: id ? 'Skala' : 'Scale', settings: id ? 'Pengaturan' : 'Settings',
    connected: id ? 'Terhubung' : 'Connected', account: id ? 'Akun' : 'Account', slot: id ? 'Slot dashboard' : 'Dashboard slot',
    empty: id ? 'Kosong untuk eksperimen berikutnya' : 'Empty for the next experiment', continue: id ? 'Lanjut bekerja' : 'Continue working',
    continueBody: id ? 'Buka ruang usaha tanpa mengubah alur bisnis yang sudah terbukti.' : 'Open the workspace without changing the already-proven business flow.',
    searchTitle: id ? 'Cari di MiawPOS' : 'Search MiawPOS', searchPlaceholder: id ? 'Cari halaman atau fitur…' : 'Search pages or features…',
    searchBody: id ? 'Untuk pass ini, Search baru berupa shell presentasi.' : 'For this pass, Search is only a presentation shell.',
    collapse: id ? 'Padatkan sidebar' : 'Collapse sidebar', expand: id ? 'Lebarkan sidebar' : 'Expand sidebar', close: id ? 'Tutup' : 'Close',
  }

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setPanel(null)
      setSearchOpen(false)
      if (window.innerWidth < 768) setCollapsed(true)
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const base = theme[mode]
    const accent = palettes[palette]
    for (const [name, value] of Object.entries(base)) root.style.setProperty(name, value)
    root.style.setProperty('--primary', mode === 'dark' ? accent.dark : accent.light)
    root.style.setProperty('--primary-foreground', mode === 'dark' ? accent.darkText : accent.lightText)
    root.style.setProperty('--ring', mode === 'dark' ? accent.dark : accent.light)
    root.style.setProperty('--font-sans', fonts[font])
    root.style.fontSize = scales[scale]
    root.style.colorScheme = mode
    root.classList.toggle('dark', mode === 'dark')
  }, [font, mode, palette, scale])

  if (!principal) return null

  const togglePanel = (next: Exclude<Panel, null>) => setPanel(current => current === next ? null : next)
  const iconButton = 'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground'

  return <div className="min-h-dvh bg-muted/25">
    <a href="#main" className="sr-only z-50 rounded bg-background p-3 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">{t('nav.skip')}</a>
    {!collapsed && <button type="button" aria-label={text.close} className="fixed inset-0 z-30 bg-foreground/10 backdrop-blur-[1px] md:hidden" onClick={() => setCollapsed(true)} />}

    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-sidebar text-sidebar-foreground shadow-sm transition-[width] duration-200 ${collapsed ? 'w-[72px]' : 'w-[240px]'}`}>
      <div className={`flex h-[68px] items-center border-b ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
        <Link to="/account" aria-label="MiawPOS" className={`flex min-h-[44px] items-center rounded-xl hover:bg-accent ${collapsed ? 'w-[44px] justify-center' : 'w-full gap-3 px-2'}`}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Cat className="size-5" aria-hidden="true" /></span>
          {!collapsed && <span className="truncate text-[15px] font-semibold tracking-tight">MiawPOS</span>}
        </Link>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
        <button type="button" aria-label={text.search} onClick={() => { setSearchOpen(true); setPanel(null) }} className={`flex min-h-[44px] items-center rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}>
          <Search className="size-[18px] shrink-0" aria-hidden="true" />{!collapsed && <span>{text.search}</span>}
        </button>
        <nav aria-label={t('nav.label')}>
          {!collapsed && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{text.dashboards}</p>}
          <Link to="/account" aria-current="page" className={`flex min-h-[44px] items-center rounded-xl bg-accent text-sm font-semibold ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}>
            <LayoutDashboard className="size-[18px] shrink-0" aria-hidden="true" />{!collapsed && <span>{text.dashboard}</span>}
          </Link>
        </nav>
      </div>
    </aside>

    <div className={`min-h-dvh pl-[72px] transition-[padding] duration-200 ${collapsed ? 'md:pl-[72px]' : 'md:pl-[240px]'}`}>
      <header className="sticky top-0 z-20 border-b bg-background/92 backdrop-blur-xl">
        <div className="flex min-h-[68px] items-center gap-1.5 px-3 sm:px-5">
          <button type="button" aria-label={collapsed ? text.expand : text.collapse} onClick={() => setCollapsed(value => !value)} className={iconButton}>
            {collapsed ? <ChevronRight className="size-[18px]" aria-hidden="true" /> : <ChevronLeft className="size-[18px]" aria-hidden="true" />}
          </button>
          <div className="flex-1" />
          <div className="relative flex items-center gap-1">
            <button type="button" aria-label={text.notifications} aria-expanded={panel === 'notifications'} onClick={() => togglePanel('notifications')} className={`${iconButton} relative`}>
              <Bell className="size-[18px]" aria-hidden="true" /><span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-primary" />
            </button>
            <button type="button" aria-label={mode === 'light' ? 'Dark mode' : 'Light mode'} onClick={() => setMode(value => value === 'light' ? 'dark' : 'light')} className={iconButton}>
              {mode === 'light' ? <Sun className="size-[18px]" aria-hidden="true" /> : <Moon className="size-[18px]" aria-hidden="true" />}
            </button>
            <button type="button" aria-label={text.appearance} aria-expanded={panel === 'appearance'} onClick={() => togglePanel('appearance')} className={iconButton}><Palette className="size-[18px]" aria-hidden="true" /></button>
            <button type="button" aria-label={text.profile} aria-expanded={panel === 'profile'} onClick={() => togglePanel('profile')} className="ml-1 flex size-[40px] items-center justify-center rounded-full border bg-muted hover:bg-accent"><UserRound className="size-[18px]" aria-hidden="true" /></button>

            {panel === 'notifications' && <div className="absolute right-0 top-[calc(100%+0.65rem)] w-[min(350px,calc(100vw-96px))] rounded-2xl border bg-popover p-3 shadow-xl">
              <div className="flex items-center justify-between px-1 pb-2"><p className="text-sm font-semibold">{text.notifications}</p><button type="button" aria-label={text.close} onClick={() => setPanel(null)} className="flex size-8 items-center justify-center rounded-lg hover:bg-accent"><X className="size-4" /></button></div>
              <div className="flex gap-3 rounded-xl bg-muted/70 p-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Cat className="size-4" /></span><div><p className="text-sm font-semibold">{text.welcome}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{text.welcomeBody}</p></div></div>
            </div>}

            {panel === 'appearance' && <div className="absolute right-0 top-[calc(100%+0.65rem)] w-[min(380px,calc(100vw-96px))] rounded-2xl border bg-popover p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold">{text.appearance}</p><p className="text-xs text-muted-foreground">{text.palette} · {text.font} · {text.scale}</p></div><button type="button" aria-label={text.close} onClick={() => setPanel(null)} className="flex size-8 items-center justify-center rounded-lg hover:bg-accent"><X className="size-4" /></button></div>
              <div className="space-y-4">
                <div><p className="mb-2 text-xs font-medium text-muted-foreground">{text.palette}</p><div className="grid grid-cols-5 gap-2">{(Object.keys(palettes) as PaletteName[]).map(value => <button key={value} type="button" aria-label={value} aria-pressed={palette === value} onClick={() => setPalette(value)} className="relative flex min-h-[44px] items-center justify-center rounded-xl border bg-background"><span className="size-5 rounded-full border border-black/10" style={{ background: palettes[value].swatch }} />{palette === value && <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-foreground text-background"><Check className="size-2.5" /></span>}</button>)}</div></div>
                <div><p className="mb-2 text-xs font-medium text-muted-foreground">{text.font}</p><div className="grid grid-cols-3 gap-2">{(['system', 'serif', 'mono'] as FontName[]).map(value => <button key={value} type="button" aria-pressed={font === value} onClick={() => setFont(value)} className={`min-h-[44px] rounded-xl border text-xs font-medium ${font === value ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>{value}</button>)}</div></div>
                <div><p className="mb-2 text-xs font-medium text-muted-foreground">{text.scale}</p><div className="grid grid-cols-4 gap-2">{(['s', 'm', 'l', 'xl'] as ScaleName[]).map(value => <button key={value} type="button" aria-pressed={scale === value} onClick={() => setScale(value)} className={`min-h-[44px] rounded-xl border text-xs font-semibold uppercase ${scale === value ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>{value}</button>)}</div></div>
                <div className="border-t pt-4"><LocaleSelect /></div>
              </div>
            </div>}

            {panel === 'profile' && <div className="absolute right-0 top-[calc(100%+0.65rem)] w-[min(300px,calc(100vw-96px))] rounded-2xl border bg-popover p-2 shadow-xl">
              <div className="px-3 py-3"><p className="text-sm font-semibold">{text.account}</p><p className="mt-1 break-all font-mono text-[11px] leading-5 text-muted-foreground">{principal.accountId}</p></div>
              <div className="border-t p-1.5"><Link to="/app" onClick={() => setPanel(null)} className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium hover:bg-accent"><LayoutDashboard className="size-4 text-muted-foreground" />{t('root.open')}</Link><div aria-disabled="true" className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground/60"><Settings2 className="size-4" />{text.settings}</div><button type="button" disabled={pending} onClick={() => { void logout() }} className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"><LogOut className="size-4" />{t(pending ? 'session.loggingOut' : 'session.logout')}</button></div>
            </div>}
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{text.dashboard}</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('session.title')}</h1><p className="mt-2 text-sm text-muted-foreground">{text.overview}</p></div><span className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border bg-background px-3 text-xs font-medium text-muted-foreground"><CircleCheck className="size-3.5 text-success-foreground" />{t('session.active')}</span></div>
        <OutcomeFeedback value={notice} />
        <section aria-label={text.dashboard} className="mt-5 grid auto-rows-[minmax(150px,auto)] grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col rounded-2xl border bg-card p-5"><p className="text-xs text-muted-foreground">{id ? 'Sesi' : 'Session'}</p><div className="mt-2 flex items-center justify-between"><p className="text-xl font-semibold">{text.connected}</p><span className="size-2.5 rounded-full bg-success-foreground" /></div><p className="mt-auto pt-5 text-xs leading-5 text-muted-foreground">{t('session.description')}</p></div>
          <div className="flex flex-col rounded-2xl border bg-card p-5"><p className="text-xs text-muted-foreground">{id ? 'Identitas akun' : 'Account identity'}</p><p className="mt-2 text-xl font-semibold">{text.account}</p><p className="mt-auto break-all pt-5 font-mono text-[11px] leading-5 text-muted-foreground">{principal.accountId}</p></div>
          {[0, 1, 2, 3].map(slot => <div key={slot} className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed bg-background/35 px-5 text-center"><div className="mb-3 size-8 rounded-xl border bg-muted/45" /><p className="text-xs font-medium text-muted-foreground">{text.slot}</p><p className="mt-1 text-[11px] text-muted-foreground/70">{text.empty}</p></div>)}
          <div className="flex flex-col rounded-2xl border bg-card p-5 sm:col-span-2 xl:col-span-2"><p className="text-xs text-muted-foreground">{t('root.workspace')}</p><h2 className="mt-2 text-lg font-semibold">{text.continue}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{text.continueBody}</p><div className="mt-auto pt-5"><Link to="/app" className={buttonVariants({ className: 'min-h-[44px] px-4' })}>{t('root.open')}</Link></div></div>
          <div className="hidden min-h-[150px] rounded-2xl border border-dashed bg-background/25 xl:col-span-2 xl:block" aria-hidden="true" />
        </section>
      </main>
    </div>

    {searchOpen && <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/15 px-4 pt-[12vh] backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="miawpos-search-title"><div className="w-full max-w-2xl rounded-2xl border bg-popover p-3 shadow-2xl"><div className="flex items-center gap-2 rounded-xl border bg-background px-3"><Search className="size-[18px] text-muted-foreground" /><input autoFocus aria-label={text.searchTitle} placeholder={text.searchPlaceholder} className="min-h-[48px] min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /><button type="button" aria-label={text.close} onClick={() => setSearchOpen(false)} className="flex size-9 items-center justify-center rounded-lg hover:bg-accent"><X className="size-4" /></button></div><div className="px-3 py-5 text-center"><p id="miawpos-search-title" className="text-sm font-semibold">{text.searchTitle}</p><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">{text.searchBody}</p></div></div></div>}
  </div>
}
