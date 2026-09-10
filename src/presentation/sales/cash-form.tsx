import { useFormProgression } from '../use-form-progression'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { CatalogItem } from '../../domain/catalog'
import { outcomeFrom, type Outcome } from '../../domain/outcome'
import { Button, buttonVariants } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useLocale } from '../context'
import { useWorkspacePorts } from '../workspace-ports'
import { OutcomeFeedback } from '../feedback/outcome-feedback'

export function CashForm({ item }: { item: CatalogItem }) {
  const progression = useFormProgression()
  const { cash } = useWorkspacePorts()
  const { t } = useLocale()
  const navigate = useNavigate()
  const attempt = cash.pending(item.rootId)
  const [quantity, setQuantity] = useState(String(attempt?.quantity ?? 1))
  const [tender, setTender] = useState(attempt ? String(attempt.tenderedRupiah) : '')
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<Outcome | null>(null)
  const busy = useRef(false)
  const live = useRef(true)
  useEffect(() => { live.current = true; return () => { live.current = false } }, [])
  if (attempt && attempt.itemId !== item.id) return <Link className={buttonVariants({ variant: 'outline', className: 'px-4' })} to={`/app/catalog/${encodeURIComponent(attempt.itemId)}`}>{t('sale.resume')}</Link>
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy.current) return
    busy.current = true; setPending(true); setNotice(null)
    try {
      const sale = await cash.execute(item.rootId, item.id, quantity, tender)
      if (live.current) navigate(`/app/sales/${encodeURIComponent(sale.id)}`)
    } catch (error) { if (live.current) setNotice(outcomeFrom(error)) }
    finally { busy.current = false; if (live.current) setPending(false) }
  }
  return <form {...progression} className="space-y-5 border-t pt-6" onSubmit={event => { void submit(event) }}>
    <h2 className="text-xl font-semibold">{t('sale.cash')}</h2>
    <div className="space-y-2"><label htmlFor="sale-quantity">{t('sale.quantity')}</label><Input id="sale-quantity" inputMode="numeric" required value={quantity} disabled={pending || !!attempt} onChange={event => setQuantity(event.target.value)} /></div>
    <div className="space-y-2"><label htmlFor="sale-tender">{t('sale.tender')}</label><Input id="sale-tender" inputMode="numeric" required value={tender} disabled={pending || !!attempt} onChange={event => setTender(event.target.value)} /></div>
    <p className="text-sm text-muted-foreground">{t('sale.confirmBody')}</p>
    <OutcomeFeedback value={notice} />
    {attempt && <p className="text-sm text-muted-foreground">{t('sale.pendingBody')}</p>}
    <Button type="submit" disabled={pending} className="h-auto whitespace-normal px-4 py-3">{t(pending ? 'sale.posting' : attempt ? 'sale.retry' : 'sale.post')}</Button>
  </form>
}
