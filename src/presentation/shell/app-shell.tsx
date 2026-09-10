import { useEffect, useState, type ReactNode } from 'react'
import { Link, Outlet } from 'react-router'
import {
  Bell,
  Cat,
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Palette,
  RotateCcw,
  Search,
  Settings2,
  Sun,
  UserRound,
  X,
} from 'lucide-react'
import { useLocale, useSession } from '../context'
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
type Columns = 2 | 3 | 4 | 5

type HintProps = {
  label: string
  side?: 'right' | 'bottom'
  align?: 'start' | 'center' | 'end'
  children: ReactNode
}

function HoverHint({ label, side = 'bottom', align = 'center', children }: HintProps) {
  const position = side === 'right'
    ? 'left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2'
    : align === 'end'
      ? 'right-0 top-[calc(100%+0.375rem)]'
      : align === 'start'
        ? 'left-0 top-[calc(100%+0.375rem)]'
        : 'left-1/2 top-[calc(100%+0.375rem)] -translate-x-1/2'

  return <div className="group relative flex">
    {children}
    <span aria-hidden="true" className={`pointer-events-none absolute z-[70] hidden whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[0.6875rem] font-medium text-popover-foreground shadow-sm md:group-hover:block ${position}`}>
      {label}
    </span>
  </div>
}

function HeaderPanel({ title, children }: { title: string; children: ReactNode }) {
  return <div className="absolute right-0 top-[calc(100%+0.5rem)] w-[min(var(--shell-popover-width),calc(100vw-1rem))] overflow-hidden rounded-lg border bg-popover shadow-lg">
    <div className="px-3 py-2 text-sm font-semibold">{title}</div>
    <div className="border-t">{children}</div>
  </div>
}

export function AppShell() {
  const { locale, t } = useLocale()
  const { principal, logout, pending } = useSession()
  const id = locale === 'id-ID'
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [palette, setPalette] = useState<PaletteName>('violet')
  const [font, setFont] = useState<FontName>('system')
  const [scale, setScale] = useState<ScaleName>('m')
  const [columns, setColumns] = useState<Columns>(3)

  const text = {
    search: id ? 'Cari' : 'Search',
    dashboard: 'Dashboard',
    dashboards: 'Dashboards',
    notifications: id ? 'Notifikasi' : 'Notifications',
    customize: id ? 'Kustomisasi' : 'Customize',
    account: id ? 'Akun' : 'Account',
    settings: id ? 'Pengaturan' : 'Settings',
    language: id ? 'Bahasa' : 'Language',
    close: id ? 'Tutup' : 'Close',
    navigation: id ? 'Navigasi' : 'Navigation',
    collapse: id ? 'Padatkan sidebar' : 'Collapse sidebar',
    expand: id ? 'Lebarkan sidebar' : 'Expand sidebar',
    darkMode: id ? 'Tema gelap' : 'Dark mode',
    lightMode: id ? 'Tema terang' : 'Light mode',
    welcome: id ? 'Selamat datang di MiawPOS' : 'Welcome to MiawPOS',
    welcomeBody: id ? 'Shell aplikasi siap untuk iterasi visual berikutnya.' : 'The application shell is ready for the next visual iteration.',
    palette: id ? 'Warna tema' : 'Theme color',
    scale: id ? 'Skala' : 'Scale',
    scheme: id ? 'Skema warna' : 'Color scheme',
    layout: id ? 'Kolom dashboard' : 'Dashboard columns',
    default: id ? 'Bawaan' : 'Default',
    back: id ? 'Kembali ke akun' : 'Back to account',
    preferences: id ? 'Preferensi aplikasi di luar tema.' : 'Application preferences outside the theme.',
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
    root.style.setProperty('--panel-tint', mode === 'dark' ? accent.tintDark : accent.tintLight)
    root.style.setProperty('--font-sans', fonts[font])
    root.style.setProperty('--dashboard-columns', String(columns))
    root.style.fontSize = scales[scale].rootFontSize
    root.style.colorScheme = mode
    root.classList.toggle('dark', mode === 'dark')
  }, [columns, font, mode, palette, scale])

  if (!principal) return null

  const compact = collapsed ? 'md:hidden' : ''
  const collapsedSquare = collapsed ? 'md:size-[var(--ui-control)] md:justify-center md:px-0' : ''
  const controlClass = 'flex size-[var(--ui-control)] items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground'

  const toggleNavigation = () => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setMobileOpen(value => !value)
      return
    }
    setCollapsed(value => !value)
  }

  const resetAppearance = () => {
    setPalette('violet')
    setFont('system')
    setScale('m')
    setMode('light')
    setColumns(3)
  }

  return <div className="min-h-dvh bg-background">
    <a href="#main" className="sr-only z-[80] rounded bg-background p-3 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">{t('nav.skip')}</a>

    {mobileOpen && <button type="button" aria-label={text.close} className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[0.125rem] md:hidden" onClick={() => setMobileOpen(false)} />}

    <aside id="primary-sidebar" className={`fixed inset-y-0 left-0 z-40 flex w-[var(--shell-sidebar-expanded)] flex-col border-r bg-sidebar text-sidebar-foreground transition-[transform,width] duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${collapsed ? 'md:w-[var(--shell-sidebar-collapsed)]' : 'md:w-[var(--shell-sidebar-expanded)]'}`}>
      <div className="flex flex-col gap-2 p-2">
        <HoverHint label="MiawPOS" side="right">
          <Link to="/account" aria-label="MiawPOS" onClick={() => setMobileOpen(false)} className={`flex min-h-[var(--ui-control)] w-full items-center gap-2 rounded-md px-1 transition-colors hover:bg-accent ${collapsedSquare}`}>
            <span className="flex size-[var(--ui-logo)] shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><Cat className="size-[var(--ui-icon)]" aria-hidden="true" /></span>
            <span className={`truncate text-sm font-semibold tracking-tight ${compact}`}>MiawPOS</span>
          </Link>
        </HoverHint>

        <HoverHint label={text.search} side="right">
          <button type="button" aria-label={text.search} onClick={() => { setSearchOpen(true); setPanel(null); setMobileOpen(false) }} className={`flex min-h-[var(--ui-control)] w-full items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${collapsedSquare}`}>
            <Search className="size-[var(--ui-icon)] shrink-0" aria-hidden="true" />
            <span className={compact}>{text.search}</span>
          </button>
        </HoverHint>

        <p className={`px-2 text-[0.625rem] font-medium text-muted-foreground ${compact}`}>{text.dashboards}</p>

        <HoverHint label={text.dashboard} side="right">
          <Link to="/account" aria-current="page" onClick={() => setMobileOpen(false)} className={`flex min-h-[var(--ui-control)] w-full items-center gap-2 rounded-md bg-primary/10 px-2 text-sm font-medium text-foreground transition-colors hover:bg-accent ${collapsedSquare}`}>
            <LayoutDashboard className="size-[var(--ui-icon)] shrink-0" aria-hidden="true" />
            <span className={compact}>{text.dashboard}</span>
          </Link>
        </HoverHint>
      </div>
    </aside>

    <div className={`min-h-dvh transition-[padding] duration-200 ${collapsed ? 'md:pl-[var(--shell-sidebar-collapsed)]' : 'md:pl-[var(--shell-sidebar-expanded)]'}`}>
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="flex h-[var(--shell-header)] items-center gap-1 px-2 sm:px-4">
          <HoverHint label={collapsed ? text.expand : text.collapse} align="start">
            <button type="button" aria-label={text.navigation} onClick={toggleNavigation} className={controlClass}>
              <Menu className="size-[var(--ui-icon)] lg:hidden" aria-hidden="true" />
              {collapsed ? <ChevronRight className="hidden size-[var(--ui-icon)] lg:block" aria-hidden="true" /> : <ChevronLeft className="hidden size-[var(--ui-icon)] lg:block" aria-hidden="true" />}
            </button>
          </HoverHint>
          <div className="flex-1" />

          <div className="relative flex items-center gap-1">
            <HoverHint label={text.notifications} align="end">
              <button type="button" aria-label={text.notifications} aria-expanded={panel === 'notifications'} onClick={() => setPanel(value => value === 'notifications' ? null : 'notifications')} className={`${controlClass} relative`}>
                <Bell className="size-[var(--ui-icon)]" aria-hidden="true" />
                <span className="absolute right-[0.625rem] top-[0.625rem] size-1.5 rounded-full bg-primary" />
              </button>
            </HoverHint>
            <HoverHint label={mode === 'light' ? text.darkMode : text.lightMode} align="end">
              <button type="button" aria-label={mode === 'light' ? text.darkMode : text.lightMode} onClick={() => setMode(value => value === 'light' ? 'dark' : 'light')} className={controlClass}>
                {mode === 'light' ? <Sun className="size-[var(--ui-icon)]" aria-hidden="true" /> : <Moon className="size-[var(--ui-icon)]" aria-hidden="true" />}
              </button>
            </HoverHint>
            <HoverHint label={text.customize} align="end">
              <button type="button" aria-label={text.customize} aria-expanded={panel === 'appearance'} onClick={() => setPanel(value => value === 'appearance' ? null : 'appearance')} className={controlClass}><Palette className="size-[var(--ui-icon)]" aria-hidden="true" /></button>
            </HoverHint>
            <HoverHint label={text.account} align="end">
              <button type="button" aria-label={id ? 'Menu pengguna' : 'User menu'} aria-expanded={panel === 'profile' || panel === 'settings'} onClick={() => setPanel(value => value === 'profile' ? null : 'profile')} className={controlClass}><span className="flex size-[var(--ui-logo)] items-center justify-center rounded-full border bg-muted"><UserRound className="size-[var(--ui-icon)]" aria-hidden="true" /></span></button>
            </HoverHint>

            {panel === 'notifications' && <HeaderPanel title={text.notifications}>
              <div className="flex min-h-[var(--ui-row)] items-start gap-3 px-3 py-3">
                <span className="flex size-[var(--ui-logo)] shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><Cat className="size-[var(--ui-icon)]" /></span>
                <div className="min-w-0"><p className="text-sm font-medium">{text.welcome}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{text.welcomeBody}</p></div>
              </div>
            </HeaderPanel>}

            {panel === 'profile' && <HeaderPanel title={text.account}>
              <div className="px-3 py-3"><p className="break-all font-mono text-[0.6875rem] leading-5 text-muted-foreground">{principal.accountId}</p></div>
              <Link to="/app" onClick={() => setPanel(null)} className="flex min-h-[var(--ui-row)] items-center gap-2 border-t px-3 text-sm transition-colors hover:bg-accent"><LayoutDashboard className="size-[var(--ui-icon)] text-muted-foreground" />{t('root.open')}</Link>
              <button type="button" onClick={() => setPanel('settings')} className="flex min-h-[var(--ui-row)] w-full items-center gap-2 border-t px-3 text-left text-sm transition-colors hover:bg-accent"><Settings2 className="size-[var(--ui-icon)] text-muted-foreground" />{text.settings}</button>
              <button type="button" disabled={pending} onClick={() => { void logout() }} className="flex min-h-[var(--ui-row)] w-full items-center gap-2 border-t px-3 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"><LogOut className="size-[var(--ui-icon)]" />{t(pending ? 'session.loggingOut' : 'session.logout')}</button>
            </HeaderPanel>}

            {panel === 'settings' && <HeaderPanel title={text.settings}>
              <div className="flex items-center gap-2 px-2 py-2">
                <button type="button" aria-label={text.back} onClick={() => setPanel('profile')} className={controlClass}><ChevronLeft className="size-[var(--ui-icon)]" /></button>
                <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{text.preferences}</p>
                <button type="button" aria-label={text.close} onClick={() => setPanel(null)} className={controlClass}><X className="size-[var(--ui-icon)]" /></button>
              </div>
              <div className="border-t px-3 py-3"><p className="mb-2 text-xs font-medium text-muted-foreground">{text.language}</p><LocaleSelect /></div>
            </HeaderPanel>}
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[var(--shell-content-max)] px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>

    {panel === 'appearance' && <aside aria-label={text.customize} className="fixed inset-y-0 right-0 z-50 w-[min(var(--shell-drawer-width),100vw)] border-l bg-sidebar text-sidebar-foreground">
      <div className="flex h-[var(--shell-header)] items-center gap-2 px-3">
        <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">{text.customize}</h2></div>
        <button type="button" onClick={resetAppearance} className="flex min-h-[var(--ui-control)] items-center gap-2 rounded-md px-2 text-xs transition-colors hover:bg-accent"><RotateCcw className="size-[var(--ui-icon)]" />{text.default}</button>
        <button type="button" aria-label={text.close} onClick={() => setPanel(null)} className={controlClass}><X className="size-[var(--ui-icon)]" /></button>
      </div>
      <div className="flex flex-col gap-4 px-3 py-2">
        <section><p className="mb-2 text-xs font-medium text-muted-foreground">{text.palette}</p><div className="grid grid-cols-6 gap-2">{(Object.keys(palettes) as PaletteName[]).map(value => <button key={value} type="button" aria-label={value} aria-pressed={palette === value} onClick={() => setPalette(value)} className="relative flex aspect-square w-full items-center justify-center rounded-md border transition-colors hover:bg-accent"><span className="size-[var(--ui-icon)] rounded-full border border-black/10" style={{ backgroundColor: palettes[value].swatch }} />{palette === value && <span className="absolute -right-1 -top-1 flex size-[var(--ui-icon)] items-center justify-center rounded-full bg-foreground text-background"><Check className="size-[0.625rem]" /></span>}</button>)}</div></section>
        <section><p className="mb-2 text-xs font-medium text-muted-foreground">Font</p><div className="grid grid-cols-3 gap-2">{(['system', 'serif', 'mono'] as FontName[]).map(value => <button key={value} type="button" aria-pressed={font === value} onClick={() => setFont(value)} className={`min-h-[var(--ui-control)] rounded-md border px-2 text-xs font-medium transition-colors ${font === value ? 'bg-foreground text-background' : 'hover:bg-accent'}`}>{value}</button>)}</div></section>
        <section><div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{text.scale}</p><span className="text-[0.6875rem] text-muted-foreground">{(['s', 'm', 'l', 'xl'] as ScaleName[]).map(value => scales[value].label).join(' · ')}</span></div><div className="grid grid-cols-4 gap-2">{(['s', 'm', 'l', 'xl'] as ScaleName[]).map(value => <button key={value} type="button" aria-pressed={scale === value} onClick={() => setScale(value)} className={`min-h-[var(--ui-control)] rounded-md border text-xs font-semibold uppercase transition-colors ${scale === value ? 'bg-foreground text-background' : 'hover:bg-accent'}`}>{value}</button>)}</div></section>
        <section><p className="mb-2 text-xs font-medium text-muted-foreground">{text.layout}</p><div className="grid grid-cols-4 gap-2">{([2, 3, 4, 5] as Columns[]).map(value => <button key={value} type="button" aria-pressed={columns === value} onClick={() => setColumns(value)} className={`min-h-[var(--ui-control)] rounded-md border text-xs font-semibold transition-colors ${columns === value ? 'bg-foreground text-background' : 'hover:bg-accent'}`}>{value}</button>)}</div></section>
        <section><p className="mb-2 text-xs font-medium text-muted-foreground">{text.scheme}</p><div className="grid grid-cols-2 gap-2"><button type="button" aria-pressed={mode === 'light'} onClick={() => setMode('light')} className={`min-h-[var(--ui-control)] rounded-md border text-xs font-medium transition-colors ${mode === 'light' ? 'bg-foreground text-background' : 'hover:bg-accent'}`}>{id ? 'Terang' : 'Light'}</button><button type="button" aria-pressed={mode === 'dark'} onClick={() => setMode('dark')} className={`min-h-[var(--ui-control)] rounded-md border text-xs font-medium transition-colors ${mode === 'dark' ? 'bg-foreground text-background' : 'hover:bg-accent'}`}>{id ? 'Gelap' : 'Dark'}</button></div></section>
      </div>
    </aside>}

    {searchOpen && <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/20 px-4 pt-[16vh] backdrop-blur-[0.1875rem]" role="dialog" aria-modal="true" aria-labelledby="miawpos-search-title">
      <div className="w-full max-w-[var(--shell-command-width)] overflow-hidden rounded-lg border bg-popover shadow-xl">
        <div className="flex items-center gap-2 border-b px-3"><Search className="size-[var(--ui-icon)] text-muted-foreground" /><input autoFocus aria-label={id ? 'Cari di MiawPOS' : 'Search MiawPOS'} placeholder={id ? 'Ketik perintah atau cari…' : 'Type a command or search…'} className="min-h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /><button type="button" aria-label={text.close} onClick={() => setSearchOpen(false)} className={controlClass}><X className="size-[var(--ui-icon)]" /></button></div>
        <Link to="/account" onClick={() => setSearchOpen(false)} className="flex min-h-[var(--ui-row)] items-center gap-2 px-3 text-left text-sm transition-colors hover:bg-accent"><LayoutDashboard className="size-[var(--ui-icon)] text-muted-foreground" /><span>{text.dashboard}</span></Link>
        <p id="miawpos-search-title" className="border-t px-3 py-2 text-[0.6875rem] text-muted-foreground">{id ? 'Search masih shell presentasi pada pass ini.' : 'Search is still a presentation shell in this pass.'}</p>
      </div>
    </div>}
  </div>
}
