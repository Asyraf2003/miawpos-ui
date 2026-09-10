import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router'
import { createItem } from '../../application/catalog/create-item'
import { outcomeFrom, type Outcome } from '../../domain/outcome'
import { Button, buttonVariants } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useLocale } from '../context'
import { useWorkspacePorts } from '../workspace-ports'
import { OutcomeFeedback } from '../feedback/outcome-feedback'
import { CashForm } from '../sales/cash-form'

export function CatalogPage({ rootId }: { rootId: string }) {
  const { t, locale } = useLocale()
  const { catalog } = useWorkspacePorts()
  const { itemId } = useParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const live = useRef(true)
  useEffect(() => { live.current = true; return () => { live.current = false } }, [])
  const [notice, setNotice] = useState<Outcome | null>(null)
  const item = useQuery({ queryKey: ['root-scoped', rootId, 'catalog', itemId], queryFn: () => catalog.get(rootId, itemId!), enabled: !!itemId, staleTime: 0 })
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy.current) return
    busy.current = true; setPending(true); setNotice(null)
    try {
      const created = await createItem(catalog, rootId, name, price)
      if (live.current) navigate(`/app/catalog/${encodeURIComponent(created.id)}`)
    } catch (error) { if (live.current) setNotice(outcomeFrom(error)) }
    finally { busy.current = false; if (live.current) setPending(false) }
  }
  if (itemId) return <section className="space-y-5 border-t pt-6">
    <h2 className="text-xl font-semibold">{t('catalog.detail')}</h2>
    {item.isFetching ? <p role="status">{t('catalog.loading')}</p> : item.isError ? <><OutcomeFeedback value={outcomeFrom(item.error)} /><Button onClick={() => { void item.refetch() }}>{t('action.retry')}</Button></> : item.data ? <>
      <h3 className="break-words text-lg font-medium">{item.data.name}</h3>
      <p className="break-words font-semibold tabular-nums">{item.data.priceRupiah === null ? t('catalog.unpriced') : new Intl.NumberFormat(locale, { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.data.priceRupiah)}</p>
      <Link to="/app/catalog/new" className={buttonVariants({ variant: 'outline', className: 'px-4' })}>{t('catalog.new')}</Link>
      {item.data.priceRupiah !== null && <CashForm key={item.data.id} item={item.data} />}
    </> : null}
  </section>
  return <section className="space-y-5 border-t pt-6">
    <h2 className="text-xl font-semibold">{t('catalog.new')}</h2>
    <form className="space-y-5" onSubmit={event => { void submit(event) }}>
      <div className="space-y-2"><label htmlFor="item-name">{t('catalog.name')}</label><Input id="item-name" value={name} required disabled={pending} onChange={event => setName(event.target.value)} /></div>
      <div className="space-y-2"><label htmlFor="item-price">{t('catalog.price')}</label><Input id="item-price" inputMode="numeric" value={price} disabled={pending} onChange={event => setPrice(event.target.value)} aria-describedby="price-help" /><p id="price-help" className="text-sm text-muted-foreground">{t('catalog.priceHelp')}</p></div>
      <OutcomeFeedback value={notice} />
      <Button type="submit" disabled={pending} className="px-4">{t(pending ? 'catalog.saving' : 'catalog.save')}</Button>
    </form>
  </section>
}
