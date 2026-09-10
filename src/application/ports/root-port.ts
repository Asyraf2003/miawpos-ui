import type { Root } from '../../domain/root'

export interface RootPort {
  list(): Promise<readonly Root[]>
  create(name: string): Promise<Root>
}
