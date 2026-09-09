import { Check, ChevronDown, Languages } from 'lucide-react'
import { Select } from '@base-ui/react/select'
import { useLocale } from '../context'

const localeOptions = [
  { value: 'id-ID', label: 'Indonesia' },
  { value: 'en-US', label: 'English' },
] as const

export function LocaleSelect() {
  const { locale, setLocale, t } = useLocale()

  return <Select.Root
    value={locale}
    items={localeOptions}
    onValueChange={value => setLocale(value === 'en-US' ? 'en-US' : 'id-ID')}
  >
    <Select.Trigger
      aria-label={t('locale.label')}
      className="group flex min-h-11 items-center gap-2 rounded-xl border border-border/80 bg-background px-3 text-sm font-semibold shadow-xs outline-none transition-colors hover:border-foreground/20 hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 data-[popup-open]:border-foreground/20 data-[popup-open]:bg-muted/40"
    >
      <Languages className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden="true" />
      <Select.Value />
      <Select.Icon className="ml-0.5 flex items-center text-muted-foreground">
        <ChevronDown className="size-3.5 transition-transform group-data-[popup-open]:rotate-180" aria-hidden="true" />
      </Select.Icon>
    </Select.Trigger>

    <Select.Portal>
      <Select.Positioner side="bottom" align="end" sideOffset={6} alignItemWithTrigger={false} className="z-50 outline-none">
        <Select.Popup className="min-w-[10rem] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none transition-[transform,opacity] duration-100 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
          <Select.List>
            {localeOptions.map(option => <Select.Item
              key={option.value}
              value={option.value}
              className="grid min-h-10 cursor-default grid-cols-[1fr_auto] items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[selected]:font-medium"
            >
              <Select.ItemText>{option.label}</Select.ItemText>
              <Select.ItemIndicator className="flex items-center text-foreground">
                <Check className="size-4" aria-hidden="true" />
              </Select.ItemIndicator>
            </Select.Item>)}
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </Select.Portal>
  </Select.Root>
}
