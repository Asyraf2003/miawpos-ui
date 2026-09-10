import { useEffect, useState, type ReactNode } from 'react'
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
  Menu,
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
import {
  fonts,
  palettes,
  scales,
  themes,
  type FontName,
  type PaletteName,
  type ScaleName,
} from './appearance-config'

type Panel = 'notifications' | 'appearance' | 'profile' | 'settings' | null

type HintProps = {
  label: string
  children: ReactNode
}

function HeaderActionHint({ label, children }: HintProps) {
  return <div className="group relative flex">
    {children}
    <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-[70] hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[11px] font-medium text-popover-foreground shadow-sm md:group-hover:block">
      {label}
    </span>
  </div>
}

export function AccountPage() {
  const { locale, t } = useLocale()
  const { principal, logout, notice, pending } = useSession()
  const id = locale === 'id-ID'
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [palette, setPalette] = useState<PaletteName>('violet')
  const [font, setFont] = useState<FontName>('system')
  const [scale, setScale] = useState<ScaleName>('m')

  const text = {
    search: id ? 'Cari' : 'Search',
    dashboard: 'Dashboard',
    dashboards: 'Dashboards',
    notifications: id ? 'Notifikasi' : 'Notifications',
    appearance: id ? 'Kustomisasi' : 'Customize',
    appearanceBody: id ? 'Atur tampilan dashboard.' : 'Adjust the look and feel of the dashboard.',
    profile: id ? 'Menu pengguna' : 'User menu',
    welcome: id ? 'Selamat datang di MiawPOS' : 'Welcome to MiawPOS',
    welcomeBody: id ? 'Shell dashboard siap untuk iterasi visual berikutnya.' : 'The dashboard shell is ready for the next visual iteration.',
    palette: id ? 'Warna tema' : 'Theme color',
    font: 'Font',
    scale: id ? 'Skala' : 'Scale',
    colorScheme: id ? 'Skema warna' : 'Color scheme',
    settings: id ? 'Pengaturan' : 'Settings',
    connected: id ? 'Terhubung' : 'Connected',
    account: id ? 'Akun' : 'Account',
    workspace: id ? 'Ruang usaha' : 'Workspace',
    slot: id ? 'Slot dashboard' : 'Dashboard slot',
    empty: id ? 'Siap untuk data berikutnya' : 'Ready for the next data block',
    searchTitle: id ? 'Cari di MiawPOS' : 'Search MiawPOS',
    searchPlaceholder: id ? 'Ketik perintah atau cari…' : 'Type a command or search…',
    searchBody: id ? 'Search masih shell presentasi pada pass ini.' : 'Search is still a presentation shell in this pass.',
    collapse: id ? 'Padatkan sidebar' : 'Collapse sidebar',
    expand: id ? 'Lebarkan sidebar' : 'Expand sidebar',
    close: id ? 'Tutup' : 'Close',
    navigation: id ? 'Navigasi' : 'Navigation',
    back: id ? 'Kembali ke akun' : 'Back to account',
    language: id ? 'Bahasa' : 'Language',
    settingsBody: id ? 'Preferensi aplikasi di luar tema.' : 'Application preferences outside the theme.',
    darkMode: id ? 'Tema gelap' : 'Dark mode',
    lightMode: id ? 'Tema terang' : 'Light mode',
    session: id ? 'Sesi' : 'Session',
    identity: id ? 'Identitas akun' : 'Account identity',
    openWorkspace: t('root.open'),
  }

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setPanel(null)
      setSearchOpen(false)
      setMobileOpen(false)
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const base = themes[mode]
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

  const compactLabelClass = collapsed ? 'md:hidden' : ''
  const iconButton = 'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground'

  const toggleNavigation = () => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setMobileOpen(value => !value)
      return
    }
    setCollapsed(value => !value)
  }

  const togglePanel = (next: Exclude<Panel, null>) => {
    setPanel(current => current === next ? null : next)
  }

  return <div className="min-h-dvh bg-background">
    <a href="#main" className="sr-only z-[80] rounded bg-background p-3 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">{t('nav.skip')}</a>

    {mobileOpen && <button type="button" aria-label={text.close} className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] md:hidden" onClick={() => setMobileOpen(false)} />}

    <aside id="primary-sidebar" className={`fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r bg-sidebar text-sidebar-foreground transition-[transform,width] duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${collapsed ? 'md:w-[52px]' : 'md:w-[220px]'}`}>
      <div className={`flex h-14 items-center px-2 ${collapsed ? 'md:justify-center' : ''}`}>
        <Link
          to="/account"
          aria-label="MiawPOS"
          title={collapsed ? 'MiawPOS' : undefined}
          onClick={() => setMobileOpen(false)}
          className={`flex min-h-[44px] w-full items-center gap-2 rounded-md px-1.5 hover:bg-accent ${collapsed ? 'md:w-[44px] md:justify-center md:gap-0 md:px-0' : ''}`}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><Cat className="size-4" aria-hidden="true" /></span>
          <span className={`truncate text-sm font-semibold tracking-tight ${compactLabelClass}`}>MiawPOS</span>
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 py-2">
        <button
          type="button"
          aria-label={text.search}
          title={collapsed ? text.search : undefined}
          onClick={() => { setSearchOpen(true); setPanel(null); setMobileOpen(false) }}
          className={`flex min-h-[44px] items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${collapsed ? 'md:justify-center md:gap-0 md:px-0' : ''}`}
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className={compactLabelClass}>{text.search}</span>
        </button>

        <nav aria-label={t('nav.label')}>
          <p className={`mb-1 px-2 text-[10px] font-medium text-muted-foreground ${compactLabelClass}`}>{text.dashboards}</p>
          <Link
            to="/account"
            aria-current="page"
            title={collapsed ? text.dashboard : undefined}
            onClick={() => setMobileOpen(false)}
            className={`flex min-h-[44px] items-center gap-2 rounded-md bg-primary/10 px-2 text-sm font-medium text-foreground ${collapsed ? 'md:justify-center md:gap-0 md:px-0' : ''}`}
          >
            <LayoutDashboard className="size-4 shrink-0" aria-hidden="true" />
            <span className={compactLabelClass}>{text.dashboard}</span>
          </Link>
        </nav>
      </div>
    </aside>

    <div className={`min-h-dvh transition-[padding] duration-200 ${collapsed ? 'md:pl-[52px]' : 'md:pl-[220px]'}`}>
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="flex min-h-14 items-center gap-1 px-2 sm:px-4">
          <HeaderActionHint label={collapsed ? text.expand : text.collapse}>
            <button type="button" aria-label={text.navigation} onClick={toggleNavigation} className={iconButton}>
              <Menu className="size-4 lg:hidden" aria-hidden="true" />
              {collapsed ? <ChevronRight className="hidden size-4 lg:block" aria-hidden="true" /> : <ChevronLeft className="hidden size-4 lg:block" aria-hidden="true" />}
            </button>
          </HeaderActionHint>
          <div className="flex-1" />

          <div className="relative flex items-center gap-0.5">
            <HeaderActionHint label={text.notifications}>
              <button type="button" aria-label={text.notifications} aria-expanded={panel === 'notifications'} onClick={() => togglePanel('notifications')} className={`${iconButton} relative`}>
                <Bell className="size-4" aria-hidden="true" />
                <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-primary" />
              </button>
            </HeaderActionHint>
            <HeaderActionHint label={mode === 'light' ? text.darkMode : text.lightMode}>
              <button type="button" aria-label={mode === 'light' ? text.darkMode : text.lightMode} onClick={() => setMode(value => value === 'light' ? 'dark' : 'light')} className={iconButton}>
                {mode === 'light' ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
              </button>
            </HeaderActionHint>
            <HeaderActionHint label={text.appearance}>
              <button type="button" aria-label={text.appearance} aria-expanded={panel === 'appearance'} onClick={() => togglePanel('appearance')} className={iconButton}><Palette className="size-4" aria-hidden="true" /></button>
            </HeaderActionHint>
            <HeaderActionHint label={text.profile}>
              <button type="button" aria-label={text.profile} aria-expanded={panel === 'profile' || panel === 'settings'} onClick={() => togglePanel('profile')} className="ml-1 flex size-9 items-center justify-center rounded-full border bg-muted transition-colors hover:bg-accent"><UserRound className="size-4" aria-hidden="true" /></button>
            </HeaderActionHint>

            {panel === 'notifications' && <div className="absolute right-0 top-[calc(100%+8px)] w-[min(320px,calc(100vw-16px))] rounded-lg border bg-popover p-2 shadow-lg">
              <div className="flex items-center justify-between px-2 py-1.5"><p className="text-sm font-semibold">{text.notifications}</p><button type="button" aria-label={text.close} onClick={() => setPanel(null)} className="flex size-8 items-center justify-center rounded-md hover:bg-accent"><X className="size-4" /></button></div>
              <div className="flex gap-3 rounded-md bg-muted/60 p-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><Cat className="size-4" /></span><div><p className="text-sm font-medium">{text.welcome}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{text.welcomeBody}</p></div></div>
            </div>}

            {panel === 'profile' && <div className="absolute right-0 top-[calc(100%+8px)] w-[min(280px,calc(100vw-16px))] rounded-lg border bg-popover p-1.5 shadow-lg">
              <div className="px-3 py-2.5"><p className="text-sm font-semibold">{text.account}</p><p className="mt-1 break-all font-mono text-[11px] leading-5 text-muted-foreground">{principal.accountId}</p></div>
              <div className="border-t pt-1.5">
                <Link to="/app" onClick={() => setPanel(null)} className="flex min-h-[44px] items-center gap-2 rounded-md px-3 text-sm hover:bg-accent"><LayoutDashboard className="size-4 text-muted-foreground" />{text.openWorkspace}</Link>
                <button type="button" onClick={() => setPanel('settings')} className="flex min-h-[44px] w-full items-center gap-2 rounded-md px-3 text-left text-sm hover:bg-accent"><Settings2 className="size-4 text-muted-foreground" />{text.settings}</button>
                <button type="button" disabled={pending} onClick={() => { void logout() }} className="flex min-h-[44px] w-full items-center gap-2 rounded-md px-3 text-left text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"><LogOut className="size-4" />{t(pending ? 'session.loggingOut' : 'session.logout')}</button>
              </div>
            </div>}

            {panel === 'settings' && <div className="absolute right-0 top-[calc(100%+8px)] w-[min(320px,calc(100vw-16px))] rounded-lg border bg-popover p-2 shadow-lg">
              <div className="flex items-center gap-2 px-1 pb-2">
                <button type="button" aria-label={text.back} onClick={() => setPanel('profile')} className="flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-accent"><ChevronLeft className="size-4" /></button>
                <div className="min-w-0"><p className="text-sm font-semibold">{text.settings}</p><p className="truncate text-xs text-muted-foreground">{text.settingsBody}</p></div>
                <button type="button" aria-label={text.close} onClick={() => setPanel(null)} className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-accent"><X className="size-4" /></button>
              </div>
              <div className="rounded-md border bg-background p-3"><p className="mb-2 text-xs font-medium text-muted-foreground">{text.language}</p><LocaleSelect /></div>
            </div>}
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="sr-only">{t('session.title')}</h1>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div><h2 className="text-xl font-semibold tracking-tight">{text.dashboard}</h2><p className="mt-1 text-xs text-muted-foreground">{t('session.description')}</p></div>
          <span className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border bg-background px-3 text-xs font-medium text-muted-foreground"><CircleCheck className="size-3.5 text-success-foreground" />{t('session.active')}</span>
        </div>
        <OutcomeFeedback value={notice} />

        <section aria-label={text.dashboard} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex min-h-[150px] flex-col rounded-lg border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">{text.session}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{text.connected}</p>
            <p className="mt-auto pt-5 text-xs leading-5 text-muted-foreground">{t('session.description')}</p>
          </div>
          <div className="flex min-h-[150px] flex-col rounded-lg border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">{text.identity}</p>
            <p className="mt-3 text-xl font-semibold">{text.account}</p>
            <p className="mt-auto break-all pt-5 font-mono text-[11px] leading-5 text-muted-foreground">{principal.accountId}</p>
          </div>
          <div className="flex min-h-[150px] flex-col rounded-lg border bg-card p-4 sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-medium text-muted-foreground">{text.workspace}</p>
            <p className="mt-3 text-xl font-semibold">{t('root.workspace')}</p>
            <div className="mt-auto pt-5"><Link to="/app" className={buttonVariants({ className: 'min-h-[44px] px-4' })}>{text.openWorkspace}</Link></div>
          </div>
          {[0, 1, 2].map(slot => <div key={slot} className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/15 px-5 text-center"><div className="mb-3 size-7 rounded-md border bg-muted/50" /><p className="text-xs font-medium text-muted-foreground">{text.slot}</p><p className="mt-1 text-[11px] text-muted-foreground/70">{text.empty}</p></div>)}
        </section>
      </main>
    </div>

    {panel === 'appearance' && <aside aria-label={text.appearance} className="fixed inset-y-0 right-0 z-50 w-[min(340px,100vw)] overflow-y-auto border-l bg-popover shadow-xl">
      <div className="flex items-start justify-between border-b px-4 py-4"><div><h2 className="text-base font-semibold">{text.appearance}</h2><p className="mt-1 text-xs text-muted-foreground">{text.appearanceBody}</p></div><button type="button" aria-label={text.close} onClick={() => setPanel(null)} className="flex size-9 items-center justify-center rounded-md hover:bg-accent"><X className="size-4" /></button></div>
      <div className="space-y-5 p-4">
        <section><p className="mb-2 text-xs font-medium">{text.palette}</p><div className="grid grid-cols-6 gap-2">{(Object.keys(palettes) as PaletteName[]).map(value => <button key={value} type="button" aria-label={value} aria-pressed={palette === value} onClick={() => setPalette(value)} className="relative flex min-h-[44px] items-center justify-center rounded-md border bg-background"><span className="size-4 rounded-full border border-black/10" style={{ backgroundColor: palettes[value].swatch }} />{palette === value && <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-foreground text-background"><Check className="size-2.5" /></span>}</button>)}</div></section>
        <section><p className="mb-2 text-xs font-medium">{text.font}</p><div className="grid grid-cols-3 gap-2">{(['system', 'serif', 'mono'] as FontName[]).map(value => <button key={value} type="button" aria-pressed={font === value} onClick={() => setFont(value)} className={`min-h-[44px] rounded-md border px-2 text-xs font-medium ${font === value ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>{value}</button>)}</div></section>
        <section><div className="mb-2 flex items-center justify-between"><p className="text-xs font-medium">{text.scale}</p><span className="text-[11px] text-muted-foreground">13 · 16 · 19 · 22px</span></div><div className="grid grid-cols-4 gap-2">{(['s', 'm', 'l', 'xl'] as ScaleName[]).map(value => <button key={value} type="button" aria-pressed={scale === value} onClick={() => setScale(value)} className={`min-h-[44px] rounded-md border text-xs font-semibold uppercase ${scale === value ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>{value}</button>)}</div></section>
        <section><p className="mb-2 text-xs font-medium">{text.colorScheme}</p><div className="grid grid-cols-2 gap-2"><button type="button" aria-pressed={mode === 'light'} onClick={() => setMode('light')} className={`min-h-[44px] rounded-md border text-xs font-medium ${mode === 'light' ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>{id ? 'Terang' : 'Light'}</button><button type="button" aria-pressed={mode === 'dark'} onClick={() => setMode('dark')} className={`min-h-[44px] rounded-md border text-xs font-medium ${mode === 'dark' ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>{id ? 'Gelap' : 'Dark'}</button></div></section>
      </div>
    </aside>}

    {searchOpen && <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/20 px-4 pt-[16vh] backdrop-blur-[3px]" role="dialog" aria-modal="true" aria-labelledby="miawpos-search-title">
      <div className="w-full max-w-[520px] overflow-hidden rounded-lg border bg-popover shadow-xl">
        <div className="flex items-center gap-2 border-b px-3"><Search className="size-4 text-muted-foreground" /><input autoFocus aria-label={text.searchTitle} placeholder={text.searchPlaceholder} className="min-h-[48px] min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /><button type="button" aria-label={text.close} onClick={() => setSearchOpen(false)} className="flex size-9 items-center justify-center rounded-md hover:bg-accent"><X className="size-4" /></button></div>
        <button type="button" onClick={() => setSearchOpen(false)} className="flex min-h-[44px] w-full items-center gap-2 px-3 text-left text-sm hover:bg-accent"><LayoutDashboard className="size-4 text-muted-foreground" /><span>{text.dashboard}</span></button>
        <p id="miawpos-search-title" className="border-t px-3 py-2 text-[11px] text-muted-foreground">{text.searchBody}</p>
      </div>
    </div>}
  </div>
}
