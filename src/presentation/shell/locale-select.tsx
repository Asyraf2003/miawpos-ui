import { ChevronDown, Languages } from 'lucide-react'
import { useLocale } from '../context'

export function LocaleSelect() {
  const { locale, setLocale, t } = useLocale()
  return <label className="group relative flex min-h-11 items-center gap-2 rounded-xl border border-border/80 bg-background px-3 shadow-xs transition-colors hover:border-foreground/20 hover:bg-muted/40 has-[select:focus-visible]:border-ring has-[select:focus-visible]:ring-3 has-[select:focus-visible]:ring-ring/30">
    <Languages className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden="true" />
    <span className="hidden text-xs font-medium text-muted-foreground sm:inline">{t('locale.shortLabel')}</span>
    <span className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
    <select aria-label={t('locale.label')} className="min-h-11 min-w-11 appearance-none bg-transparent py-0 pr-6 text-sm font-semibold outline-none" value={locale}
      onChange={event => setLocale(event.target.value === 'en-US' ? 'en-US' : 'id-ID')}>
      <option value="id-ID">Indonesia</option>
      <option value="en-US">English</option>
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 size-3.5 text-muted-foreground" aria-hidden="true" />
  </label>
}
