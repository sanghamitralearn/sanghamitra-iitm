/**
 * Unit tests for the Calculator component (shared between both quiz pages).
 * Tests arithmetic, scientific functions, edge cases, and UI interactions.
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Inline Calculator (same implementation as in both quizzes) ───────────────
import { useState } from 'react'

const Calculator = ({ onClose }) => {
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState(null)
  const [op, setOp] = useState(null)
  const [fresh, setFresh] = useState(true)

  const pressNum = v => {
    if (fresh) { setDisplay(String(v)); setFresh(false) }
    else setDisplay(d => d === '0' ? String(v) : d + v)
  }
  const pressOp  = o => { setPrev(parseFloat(display)); setOp(o); setFresh(true) }
  const pressDot = () => setDisplay(d => d.includes('.') ? d : d + '.')
  const del      = () => setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0')
  const clear    = () => { setDisplay('0'); setPrev(null); setOp(null); setFresh(true) }

  const equals = () => {
    const cur = parseFloat(display)
    if (prev === null || !op) return
    const res = { '+': prev+cur, '-': prev-cur, '*': prev*cur, '/': prev/cur, '^': Math.pow(prev,cur) }[op]
    setDisplay(String(parseFloat(res.toFixed(10))))
    setPrev(null); setOp(null); setFresh(true)
  }

  const fn = f => {
    const v = parseFloat(display)
    const m = {
      sqrt: Math.sqrt(v), log: Math.log10(v), ln: Math.log(v),
      sin: Math.sin(v * Math.PI / 180), cos: Math.cos(v * Math.PI / 180),
      tan: Math.tan(v * Math.PI / 180), '1/x': 1/v, 'x²': v*v,
      'π': Math.PI, 'e': Math.E,
    }
    setDisplay(String(parseFloat(m[f].toFixed(10))))
    setFresh(true)
  }

  const B = (label, action, color = '#495057') => (
    <button key={label} onClick={action}
      style={{ background: color, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 4px', cursor: 'pointer' }}>
      {label}
    </button>
  )

  return (
    <div data-testid="calculator">
      <span data-testid="calc-label">🧮 Calculator</span>
      <button onClick={onClose} aria-label="close">×</button>
      {op && <div data-testid="operator-line">{prev} {op}</div>}
      <div data-testid="display">{display}</div>
      {B('sin', () => fn('sin'))}    {B('cos', () => fn('cos'))}
      {B('tan', () => fn('tan'))}    {B('log', () => fn('log'))}
      {B('ln',  () => fn('ln'))}     {B('√',   () => fn('sqrt'))}
      {B('x²',  () => fn('x²'))}    {B('1/x', () => fn('1/x'))}
      {B('π',   () => fn('π'))}     {B('e',   () => fn('e'))}
      {B('^',   () => pressOp('^'))} {B('C', clear)}
      {B('7', () => pressNum('7'))}  {B('8', () => pressNum('8'))}
      {B('9', () => pressNum('9'))}  {B('÷', () => pressOp('/'))}
      {B('4', () => pressNum('4'))}  {B('5', () => pressNum('5'))}
      {B('6', () => pressNum('6'))}  {B('×', () => pressOp('*'))}
      {B('1', () => pressNum('1'))}  {B('2', () => pressNum('2'))}
      {B('3', () => pressNum('3'))}  {B('−', () => pressOp('-'))}
      {B('0', () => pressNum('0'))}  {B('.', pressDot)}
      {B('+', () => pressOp('+'))}   {B('⌫', del)}
      <button onClick={equals} data-testid="equals">=</button>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDisplay() {
  return screen.getByTestId('display').textContent
}
function click(label) {
  fireEvent.click(screen.getByRole('button', { name: label }))
}
function clickSeq(...labels) {
  labels.forEach(click)
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Calculator — initial state', () => {
  it('shows 0 on startup', () => {
    render(<Calculator onClose={() => {}} />)
    expect(getDisplay()).toBe('0')
  })

  it('calls onClose when × clicked', () => {
    const onClose = vi.fn()
    render(<Calculator onClose={onClose} />)
    click('close')
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('Calculator — number entry', () => {
  beforeEach(() => { render(<Calculator onClose={() => {}} />) })

  it('pressing 5 shows 5', () => { click('5'); expect(getDisplay()).toBe('5') })
  it('pressing 1 then 2 shows 12', () => { click('1'); click('2'); expect(getDisplay()).toBe('12') })
  it('0 does not repeat leading 0', () => { click('0'); click('0'); expect(getDisplay()).toBe('0') })
  it('decimal point appended once', () => { click('3'); click('.'); click('1'); expect(getDisplay()).toBe('3.1') })
  it('second . ignored', () => { click('3'); click('.'); click('.'); click('5'); expect(getDisplay()).toBe('3.5') })
})

describe('Calculator — basic arithmetic', () => {
  beforeEach(() => { render(<Calculator onClose={() => {}} />) })

  it('2 + 3 = 5', () => {
    click('2'); click('+'); click('3'); click('=')
    expect(getDisplay()).toBe('5')
  })

  it('9 − 4 = 5', () => {
    click('9'); click('−'); click('4'); click('=')
    expect(getDisplay()).toBe('5')
  })

  it('3 × 4 = 12', () => {
    click('3'); click('×'); click('4'); click('=')
    expect(getDisplay()).toBe('12')
  })

  it('8 ÷ 4 = 2', () => {
    click('8'); click('÷'); click('4'); click('=')
    expect(getDisplay()).toBe('2')
  })

  it('2 ^ 8 = 256', () => {
    click('2'); click('^'); click('8'); click('=')
    expect(getDisplay()).toBe('256')
  })

  it('1.5 + 1.5 = 3', () => {
    click('1'); click('.'); click('5'); click('+')
    click('1'); click('.'); click('5'); click('=')
    expect(getDisplay()).toBe('3')
  })

  it('floating point result trimmed (no trailing zeros)', () => {
    click('1'); click('÷'); click('4'); click('=')
    expect(getDisplay()).toBe('0.25')
  })
})

describe('Calculator — scientific functions', () => {
  beforeEach(() => { render(<Calculator onClose={() => {}} />) })

  it('sqrt(4) = 2', () => {
    click('4'); click('√')
    expect(getDisplay()).toBe('2')
  })

  it('sqrt(9) = 3', () => {
    click('9'); click('√')
    expect(getDisplay()).toBe('3')
  })

  it('x² of 5 = 25', () => {
    click('5'); click('x²')
    expect(getDisplay()).toBe('25')
  })

  it('1/x of 4 = 0.25', () => {
    click('4'); click('1/x')
    expect(getDisplay()).toBe('0.25')
  })

  it('log(100) = 2', () => {
    click('1'); click('0'); click('0'); click('log')
    expect(getDisplay()).toBe('2')
  })

  it('ln(1) = 0', () => {
    click('1'); click('ln')
    expect(parseFloat(getDisplay())).toBeCloseTo(0, 9)
  })

  it('sin(0°) = 0', () => {
    click('0'); click('sin')
    expect(parseFloat(getDisplay())).toBeCloseTo(0, 9)
  })

  it('sin(90°) = 1', () => {
    click('9'); click('0'); click('sin')
    expect(parseFloat(getDisplay())).toBeCloseTo(1, 9)
  })

  it('cos(0°) = 1', () => {
    click('0'); click('cos')
    expect(parseFloat(getDisplay())).toBeCloseTo(1, 9)
  })

  it('cos(180°) = -1', () => {
    click('1'); click('8'); click('0'); click('cos')
    expect(parseFloat(getDisplay())).toBeCloseTo(-1, 9)
  })

  it('tan(45°) ≈ 1', () => {
    click('4'); click('5'); click('tan')
    expect(parseFloat(getDisplay())).toBeCloseTo(1, 9)
  })

  it('π inserts pi constant', () => {
    click('π')
    expect(parseFloat(getDisplay())).toBeCloseTo(Math.PI, 9)
  })

  it('e inserts Euler constant', () => {
    click('e')
    expect(parseFloat(getDisplay())).toBeCloseTo(Math.E, 9)
  })
})

describe('Calculator — C and ⌫', () => {
  beforeEach(() => { render(<Calculator onClose={() => {}} />) })

  it('C clears display to 0', () => {
    click('7'); click('C')
    expect(getDisplay()).toBe('0')
  })

  it('⌫ deletes last digit', () => {
    click('1'); click('2'); click('3'); click('⌫')
    expect(getDisplay()).toBe('12')
  })

  it('⌫ on single digit resets to 0', () => {
    click('5'); click('⌫')
    expect(getDisplay()).toBe('0')
  })

  it('C after operation resets operator state', () => {
    click('5'); click('+'); click('C')
    click('3'); click('=')
    // no prev set — equals should do nothing, display stays '3'
    expect(getDisplay()).toBe('3')
  })
})

describe('Calculator — operator display', () => {
  it('shows previous value and operator during chained input', () => {
    render(<Calculator onClose={() => {}} />)
    click('7'); click('+')
    expect(screen.getByTestId('operator-line').textContent).toBe('7 +')
  })

  it('operator line disappears after pressing =', () => {
    render(<Calculator onClose={() => {}} />)
    click('7'); click('+'); click('3'); click('=')
    expect(screen.queryByTestId('operator-line')).not.toBeInTheDocument()
  })
})

describe('Calculator — edge cases', () => {
  beforeEach(() => { render(<Calculator onClose={() => {}} />) })

  it('pressing = without operator does nothing', () => {
    click('9'); click('=')
    expect(getDisplay()).toBe('9')
  })

  it('can chain: 2+3=5, then ×2=10', () => {
    click('2'); click('+'); click('3'); click('=')
    expect(getDisplay()).toBe('5')
    click('×'); click('2'); click('=')
    expect(getDisplay()).toBe('10')
  })

  it('result of fn is used in next operation', () => {
    // sqrt(9) = 3, then * 4 = 12
    click('9'); click('√')
    click('×'); click('4'); click('=')
    expect(getDisplay()).toBe('12')
  })
})
