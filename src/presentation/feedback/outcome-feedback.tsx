import { CircleAlert, CircleCheck } from 'lucide-react'
import type { Outcome } from '../../domain/outcome'
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert'
import { useLocale } from '../context'
import { presentationCatalog } from './catalog'

export function OutcomeFeedback({ value }: { value: Outcome | null }) {
  const { t } = useLocale()
  if (!value) return null
  const entry = presentationCatalog[value.code]
  const success = value.severity === 'success'
  const showReference = (entry.allowedParams as readonly string[]).includes('requestId') && value.requestId
  return <Alert role={success ? 'status' : 'alert'} variant={success ? 'default' : 'destructive'}
    className={success ? 'border-success-foreground/20 bg-success text-success-foreground' : 'p-4'}>
    {success ? <CircleCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
    <AlertTitle>{t(entry.titleKey)}</AlertTitle>
    <AlertDescription className={success ? 'text-success-foreground' : ''}>
      <p>{t(entry.bodyKey)}</p>
      {showReference && <p className="mt-2 break-all font-mono text-xs">{t('feedback.reference', { requestId: value.requestId! })}</p>}
    </AlertDescription>
  </Alert>
}
