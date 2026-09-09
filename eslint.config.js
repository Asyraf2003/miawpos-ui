import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

const forbiddenLibraries = ['react', 'react-dom', 'react-router', '@tanstack/react-query', '@base-ui/react', 'lucide-react']
const boundary = (extra) => ['error', {
  patterns: [{ group: [...forbiddenLibraries.flatMap(name => [name, `${name}/**`]), '@/adapters/**', '**/adapters/**', '@/presentation/**', '**/presentation/**', '@/components/**', '**/components/**', '@/app/**', '**/app/**', ...extra], message: 'Domain/application code depends only on inward contracts; inject an application port.' }],
}]

export default [
  { ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**', '.proof/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['**/*.{js,mjs,ts,tsx}'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: { ...reactHooks.configs.recommended.rules, 'react-refresh/only-export-components': ['error', { allowConstantExport: true }] },
  },
  // Copied shadcn exports include their own variant helpers.
  { files: ['src/components/ui/*.tsx'], rules: { 'react-refresh/only-export-components': 'off' } },
  { files: ['src/domain/**/*.ts'], ignores: ['**/*.test.ts'], rules: { 'no-restricted-imports': boundary(['@/application/**', '**/application/**']), 'no-restricted-globals': ['error', 'fetch', 'window', 'document', 'localStorage', 'sessionStorage', 'indexedDB'] } },
  { files: ['src/application/**/*.ts'], ignores: ['**/*.test.ts'], rules: { 'no-restricted-imports': boundary([]), 'no-restricted-globals': ['error', 'fetch', 'window', 'document', 'localStorage', 'sessionStorage', 'indexedDB'] } },
]
