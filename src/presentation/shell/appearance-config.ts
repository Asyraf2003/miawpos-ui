export type PaletteName = 'neutral' | 'violet' | 'blue' | 'green' | 'amber' | 'rose'
export type FontName = 'system' | 'serif' | 'mono'
export type ScaleName = 's' | 'm' | 'l' | 'xl'

export const palettes: Record<PaletteName, {
  swatch: string
  light: string
  dark: string
  lightText: string
  darkText: string
}> = {
  neutral: { swatch: '#18181b', light: '#18181b', dark: '#f4f4f5', lightText: '#ffffff', darkText: '#18181b' },
  violet: { swatch: '#7c3aed', light: '#7c3aed', dark: '#a78bfa', lightText: '#ffffff', darkText: '#1f1638' },
  blue: { swatch: '#2563eb', light: '#2563eb', dark: '#60a5fa', lightText: '#ffffff', darkText: '#10233f' },
  green: { swatch: '#16a34a', light: '#15803d', dark: '#4ade80', lightText: '#ffffff', darkText: '#102719' },
  amber: { swatch: '#d97706', light: '#b45309', dark: '#fbbf24', lightText: '#ffffff', darkText: '#2b1b02' },
  rose: { swatch: '#e11d48', light: '#e11d48', dark: '#fb7185', lightText: '#ffffff', darkText: '#3a1219' },
}

export const fonts: Record<FontName, string> = {
  system: 'ui-sans-serif, system-ui, sans-serif',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
}

// Deliberately wide jumps: this control is for density/readability, not a decorative 1px nudge.
export const scales: Record<ScaleName, string> = {
  s: '13px',
  m: '16px',
  l: '19px',
  xl: '22px',
}

export const themes = {
  light: {
    '--background': '#ffffff',
    '--foreground': '#18181b',
    '--card': '#ffffff',
    '--card-foreground': '#18181b',
    '--popover': '#ffffff',
    '--popover-foreground': '#18181b',
    '--secondary': '#f4f4f5',
    '--secondary-foreground': '#27272a',
    '--muted': '#f4f4f5',
    '--muted-foreground': '#71717a',
    '--accent': '#f4f4f5',
    '--accent-foreground': '#18181b',
    '--border': '#e4e4e7',
    '--input': '#d4d4d8',
    '--sidebar': '#fafafa',
    '--sidebar-foreground': '#18181b',
  },
  dark: {
    '--background': '#09090b',
    '--foreground': '#fafafa',
    '--card': '#18181b',
    '--card-foreground': '#fafafa',
    '--popover': '#18181b',
    '--popover-foreground': '#fafafa',
    '--secondary': '#27272a',
    '--secondary-foreground': '#fafafa',
    '--muted': '#27272a',
    '--muted-foreground': '#a1a1aa',
    '--accent': '#27272a',
    '--accent-foreground': '#fafafa',
    '--border': '#3f3f46',
    '--input': '#52525b',
    '--sidebar': '#111113',
    '--sidebar-foreground': '#fafafa',
  },
} as const
