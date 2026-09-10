export interface Root { readonly id: string; readonly name: string }

// A selected ID is navigation context, never a grant of authority.
export function activeRoot(roots: readonly Root[], selected: string | null): Root | null {
  return roots.find(root => root.id === selected) ?? (roots.length === 1 ? roots[0]! : null)
}
