import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { outcomeFrom, type Outcome } from '../../domain/outcome'
import { reverseSale } from '../../application/sales/reverse-sale'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useLocale } from '../context'
import { useWorkspacePorts } from '../workspace-ports'
import { OutcomeFeedback } from '../feedback/outcome-feedback'

export function SalePage({ rootId }: { rootId: string }) {
  const { saleId } = useParams()
  const { sales } = useWorkspacePorts()
  const { t, locale } = useLocale()
  const sale = useQuery({ queryKey: ['root-scoped', rootId, 'sale', saleId], queryFn: () => sales.get(rootId, saleId!), staleTime: 0 })
  const [reason, setReason] = useState('')
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<Outcome | null>(null)
  const [uncertain, setUncertain] = useState(false)
  const busy = useRef(false)
  const live = useRef(true)
  useEffect(() => { live.current = true; return () => { live.current = false } }, [])
  const money = (amount: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
  async function reverse(event: React.FormEvent) {
    event.preventDefault()
    if (busy.current) return
    busy.current = true; setPending(true); setNotice(null)
    try {
      await reverseSale(sales, rootId, saleId!, reason)
      if (live.current) await sale.refetch()
    } catch (error) {
      if (live.current) { setNotice(outcomeFrom(error)); setUncertain(true) }
    } finally { busy.current = false; if (live.current) setPending(false) }
  }
  return <section className="space-y-5 border-t pt-6">
    <h2 className="text-xl font-semibold">{t('sale.detail')}</h2>
    {sale.isFetching ? <p role="status">{t('sale.loading')}</p> : sale.isError ? <><OutcomeFeedback value={outcomeFrom(sale.error)} /><Button onClick={() => { void sale.refetch() }}>{t('action.retry')}</Button></> : sale.data ? <>
      <p role="status" className="font-semibold">{t(sale.data.status === 'REVERSED' ? 'sale.reversed' : 'sale.posted')}</p>
      <p className="break-all text-xs text-muted-foreground">{t('sale.reference')}: {sale.data.id}</p>
      <ul className="divide-y">{sale.data.lines.map((line, index) => <li key={index} className="flex flex-wrap justify-between gap-3 py-3"><span className="min-w-0 break-words">{line.name} × {line.quantity}</span><span className="min-w-0 break-words tabular-nums">{money(line.totalRupiah)}</span></li>)}</ul>
      <dl className="grid grid-cols-2 gap-3 border-t pt-4 break-words tabular-nums"><dt>{t('sale.total')}</dt><dd className="text-right font-semibold">{money(sale.data.totalRupiah)}</dd><dt>{t('sale.tender')}</dt><dd className="text-right">{money(sale.data.tenderedRupiah)}</dd><dt>{t('sale.change')}</dt><dd className="text-right">{money(sale.data.changeRupiah)}</dd></dl>
      {sale.data.reversal ? <div className="space-y-2 border-t pt-4 break-words"><p>{t('sale.refund')}: <strong className="tabular-nums">{money(sale.data.reversal.refundRupiah)}</strong></p><p>{sale.data.reversal.reason}</p></div> : <form className="space-y-4 border-t pt-6" onSubmit={event => { void reverse(event) }}>
        <h3 className="font-semibold">{t('sale.reverse')}</h3><p className="text-sm text-muted-foreground">{t('sale.reverseBody')}</p>
        <label htmlFor="reversal-reason">{t('sale.reason')}</label><Input id="reversal-reason" value={reason} required disabled={pending || uncertain} onChange={event => setReason(event.target.value)} />
        <Button type="submit" variant="destructive" disabled={pending || uncertain} className="h-auto whitespace-normal px-4 py-3">{t(pending ? 'sale.reversing' : 'sale.reverseConfirm')}</Button>
      </form>}
      <OutcomeFeedback value={notice} />
      <Button variant="outline" disabled={pending} className="px-4" onClick={() => { void sale.refetch().then(result => { if (live.current && !result.isError) { setUncertain(false); setNotice(null) } }) }}>{t('sale.refresh')}</Button>
    </> : null}
  </section>
}
