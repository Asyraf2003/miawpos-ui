import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useFormProgression } from './use-form-progression'

function Form({ submit = () => {}, blocked = false }: { submit?: () => void; blocked?: boolean }) {
  const progression = useFormProgression()
  return <form {...progression} onSubmit={event => { event.preventDefault(); submit() }}>
    <input aria-label="Hidden" hidden />
    <input aria-label="Disabled" disabled />
    <fieldset disabled><input aria-label="Disabled group" /></fieldset>
    <input aria-label="Readonly" readOnly />
    <div style={{ display: 'none' }}><input aria-label="Invisible" /></div>
    <input aria-label="First" required />
    <input aria-label="Skipped" readOnly />
    <input aria-label="Last" required />
    <button disabled={blocked}>Save</button>
  </form>
}

describe('form keyboard progression', () => {
  it('focuses the first meaningful field, advances without submission, then submits exactly once', async () => {
    const submit = vi.fn()
    render(<Form submit={submit} />)
    const user = userEvent.setup()
    expect(screen.getByLabelText('First')).toHaveFocus()
    await user.keyboard('Name{Enter}')
    expect(screen.getByLabelText('Last')).toHaveFocus()
    expect(submit).not.toHaveBeenCalled()
    await user.keyboard('Price{Enter}')
    expect(submit).toHaveBeenCalledTimes(1)
  })

  it('retains native required validation and disabled submit guards', async () => {
    const submit = vi.fn()
    const { rerender } = render(<Form submit={submit} />)
    const user = userEvent.setup()
    await user.keyboard('{Enter}{Enter}')
    expect(submit).not.toHaveBeenCalled()
    expect(screen.getByLabelText('First')).toBeInvalid()
    await user.type(screen.getByLabelText('First'), 'Name')
    await user.type(screen.getByLabelText('Last'), 'Price')
    rerender(<Form submit={submit} blocked />)
    await user.keyboard('{Enter}')
    expect(submit).not.toHaveBeenCalled()
  })

  it('focuses newly mounted tasks without stealing focus on ordinary rerenders', async () => {
    function Tasks() {
      const [task, setTask] = useState(0)
      return <><button onClick={() => setTask(task + 1)}>Next task</button>{task > 0 && <Form key={task} />}</>
    }
    render(<Tasks />)
    const user = userEvent.setup()
    await user.click(screen.getByText('Next task'))
    expect(screen.getByLabelText('First')).toHaveFocus()
    await user.keyboard('Name{Tab}')
    expect(screen.getByLabelText('Skipped')).toHaveFocus() // Native Tab order is untouched.
    await user.click(screen.getByText('Next task'))
    expect(screen.getByLabelText('First')).toHaveFocus()
  })

  it('preserves textarea and special-control keys and stays local to its form', async () => {
    const submit = vi.fn()
    function SpecialForm() {
      const progression = useFormProgression()
      return <><input aria-label="Outside" /><form {...progression} onSubmit={event => { event.preventDefault(); submit() }}>
        <input aria-label="Name" /><textarea aria-label="Notes" />
        <input type="checkbox" aria-label="Checked" /><input type="radio" aria-label="Choice" />
        <select aria-label="Select"><option>One</option><option>Two</option></select>
        <input role="combobox" aria-label="Combo" />
        <input aria-label="Last" /><button>Save</button>
      </form></>
    }
    render(<SpecialForm />)
    const user = userEvent.setup()
    await user.keyboard('{Enter}')
    expect(screen.getByLabelText('Notes')).toHaveFocus()
    await user.keyboard('One{Enter}Two')
    expect(screen.getByLabelText('Notes')).toHaveValue('One\nTwo')
    expect(submit).not.toHaveBeenCalled()
    for (const label of ['Checked', 'Choice', 'Select', 'Combo', 'Outside']) {
      const control = screen.getByLabelText(label)
      control.focus()
      expect(fireEvent.keyDown(control, { key: 'Enter' })).toBe(true)
      expect(control).toHaveFocus()
    }
    await user.click(screen.getByLabelText('Checked'))
    await user.keyboard(' ')
    expect(screen.getByLabelText('Checked')).not.toBeChecked()
  })

  it('does not consume composition or modified keys; suppresses held Enter', () => {
    render(<Form />)
    const first = screen.getByLabelText('First')
    expect(fireEvent.keyDown(first, { key: 'Enter', isComposing: true })).toBe(true)
    expect(fireEvent.keyDown(first, { key: 'Enter', ctrlKey: true })).toBe(true)
    expect(first).toHaveFocus()
    fireEvent.keyDown(first, { key: 'Enter' })
    const last = screen.getByLabelText('Last')
    expect(last).toHaveFocus()
    expect(fireEvent.keyDown(last, { key: 'Enter', repeat: true })).toBe(false)
  })
})
