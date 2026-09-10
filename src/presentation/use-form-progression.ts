import { useCallback, type KeyboardEvent } from 'react'

const singleLineTypes = new Set(['text', 'search', 'email', 'url', 'tel', 'password', 'number'])

function meaningfulFields(form: HTMLFormElement) {
  return Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select')).filter(field => {
    if (field.form !== form || field.matches(':disabled, [readonly], [aria-disabled="true"], [aria-readonly="true"], [role="presentation"], [role="none"]')) return false
    if (field instanceof HTMLInputElement && ['hidden', 'button', 'submit', 'reset', 'image'].includes(field.type)) return false
    for (let node: HTMLElement | null = field; node; node = node.parentElement) {
      if (node.hidden || node.hasAttribute('inert') || node.getAttribute('aria-hidden') === 'true') return false
      const style = getComputedStyle(node)
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false
    }
    return true
  })
}

/** Attach to the active task's form. DOM order stays authoritative; submit stays native. */
export function useFormProgression() {
  // A callback ref also covers forms mounted after asynchronous task data arrives.
  const ref = useCallback((form: HTMLFormElement | null) => {
    if (form) meaningfulFields(form)[0]?.focus()
  }, [])

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLFormElement>) => {
    const field = event.target
    if (event.defaultPrevented || event.key !== 'Enter' || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229 ||
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
      !(field instanceof HTMLInputElement) || !singleLineTypes.has(field.type) || field.hasAttribute('role') || field.hasAttribute('list')) return
    const fields = meaningfulFields(event.currentTarget)
    const index = fields.indexOf(field)
    if (index < 0) return
    // Holding Enter must not advance through several fields and then submit.
    if (event.repeat) { event.preventDefault(); return }
    const next = fields[index + 1]
    if (next) {
      event.preventDefault()
      next.focus()
    }
    // Final Enter uses implicit submission: native constraint validation, disabled
    // submit buttons and the existing onSubmit/pending/idempotency guards all apply.
  }, [])

  return { ref, onKeyDown }
}
