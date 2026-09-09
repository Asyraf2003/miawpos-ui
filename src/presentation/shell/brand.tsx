import { Cat } from 'lucide-react'
import { useLocale } from '../context'

export function Brand() {
  const { t } = useLocale()
  return <div className="flex items-center gap-2.5">
    <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Cat className="size-5" aria-hidden="true" /></div>
    <span className="text-base font-semibold tracking-tight">{t('app.name')}</span>
  </div>
}
