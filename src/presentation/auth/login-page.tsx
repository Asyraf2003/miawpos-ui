import { outcome } from '../../domain/outcome'
import { useSearchParams } from 'react-router'
import { buttonVariants } from '../../components/ui/button'
import { Card, CardContent, CardHeader } from '../../components/ui/card'
import { useLocale, useSession } from '../context'
import { OutcomeFeedback } from '../feedback/outcome-feedback'
import { Brand } from '../shell/brand'
import { LocaleSelect } from '../shell/locale-select'

export function LoginPage() {
  const { t } = useLocale()
  const { notice, googleLoginURL } = useSession()
  const [params] = useSearchParams()
  const feedback = params.get('auth') === 'failed' ? outcome('auth.login_required') : notice

  return <div className="flex min-h-dvh flex-col bg-muted/30">
    <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8"><Brand /><LocaleSelect /></header>
    <main id="main" className="flex flex-1 items-center justify-center px-5 py-10 sm:py-16">
      <div className="w-full max-w-[420px]">
        <Card className="gap-6 p-6 shadow-sm sm:p-8">
          <CardHeader className="px-0 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{t('login.title')}</h1>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 px-0">
            <a data-slot="button" href={googleLoginURL} className={buttonVariants({ variant: 'outline', className: 'h-12 w-full gap-3 rounded-xl border-foreground/15 shadow-xs hover:border-foreground/25' })}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none">
                <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
                <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.59A10 10 0 0 0 12 22Z" />
                <path fill="#FBBC05" d="M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.05a10 10 0 0 0 0 9.02l3.35-2.59Z" />
                <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.49l3.35 2.59C7.19 7.72 9.4 5.96 12 5.96Z" />
              </svg>
              {t('login.google')}
            </a>
            <OutcomeFeedback value={feedback} />
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
}
