import type { CatalogItem } from '../../domain/catalog'
export interface CatalogPort {
  create(rootId: string, name: string, priceRupiah: number | null): Promise<CatalogItem>
  get(rootId: string, itemId: string): Promise<CatalogItem>
}
