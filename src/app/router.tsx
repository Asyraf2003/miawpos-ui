import { useEffect } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router'
import { LoaderCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useLocale, useSession } from '../presentation/context'
import { LoginPage } from '../presentation/auth/login-page'
import { AccountPage } from '../presentation/shell/account-page'
import { LocaleSelect } from '../presentation/shell/locale-select'
import { OutcomeFeedback } from '../presentation/feedback/outcome-feedback'
import { RootPage } from '../presentation/root/root-page'

export function AppRouter() {
  const { principal, bootstrapping, bootstrapError, retryBootstrap } = useSession()
  const { t } = useLocale()
  const location = useLocation()
  useEffect(() => {
    document.title = `${t(location.pathname === '/login' ? 'login.title' : location.pathname === '/account' ? 'session.title' : 'app.name')} · MiawPOS`
  }, [location.pathname, t])

  if (bootstrapping) return <main className="flex min-h-dvh items-center justify-center gap-3 px-5" role="status">
    <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /><p className="text-sm">{t('session.loading')}</p>
  </main>
  if (bootstrapError && !principal) return <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-5 px-5">
    <LocaleSelect /><OutcomeFeedback value={bootstrapError} /><Button onClick={retryBootstrap}>{t('action.retry')}</Button>
  </main>

  return <Routes>
    <Route path="/" element={<Navigate to={principal ? '/account' : '/login'} replace />} />
    <Route path="/login" element={principal ? <Navigate to="/account" replace /> : <LoginPage />} />
    <Route path="/account" element={principal ? <AccountPage /> : <Navigate to="/login" replace />} />
    {['/root/new', '/root/select', '/app', '/app/catalog/new', '/app/catalog/:itemId', '/app/sales/:saleId'].map(path => <Route key={path} path={path} element={principal ? <RootPage /> : <Navigate to="/login" replace />} />)}
    <Route path="*" element={<main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-5 px-5">
      <h1 className="text-2xl font-semibold">{t('notFound.title')}</h1><p className="text-muted-foreground">{t('notFound.body')}</p>
      <Link className="flex min-h-11 items-center text-sm underline underline-offset-4" to={principal ? '/account' : '/login'}>{t('notFound.back')}</Link>
    </main>} />
  </Routes>
}
