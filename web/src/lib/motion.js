import { useEffect, useState } from 'react'

// Preferência do próprio site. 'on' força o movimento mesmo com "reduzir movimento" no sistema;
// 'off' desliga-o; sem escolha guardada segue o sistema. Tudo em try/catch (armazenamento pode estar bloqueado).
const KEY = 'afriquiz.motion'

function storedPref() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

// Estado real das animações (é o que o botão do menu mostra)
export function getMotionPref() {
  const s = storedPref()
  if (s === 'on') return true
  if (s === 'off') return false
  return !systemReducesMotion()
}

export function setMotionPref(on) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    /* sem armazenamento: a escolha dura só até recarregar */
  }
  applyMotionPref()
}

export function applyMotionPref() {
  if (typeof document === 'undefined') return
  const s = storedPref()
  const root = document.documentElement.classList
  root.toggle('motion-on', s === 'on')
  root.toggle('motion-off', s === 'off')
}

function systemReducesMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function prefersReducedMotion() {
  if (typeof document === 'undefined') return false
  const root = document.documentElement.classList
  if (root.contains('motion-on')) return false
  if (root.contains('motion-off')) return true
  return systemReducesMotion()
}

// Aplica a escolha guardada logo ao carregar o módulo
applyMotionPref()

// Conta de 0 até `target` (easing ease-out). Sem animação se o utilizador pediu menos movimento.
export function useCountUp(target, { duration = 1100, delay = 0, decimals = 0 } = {}) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target)
      return
    }
    let raf
    let start
    const timer = setTimeout(() => {
      const step = (t) => {
        if (start === undefined) start = t
        const p = Math.min(1, (t - start) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        setValue(Number((target * eased).toFixed(decimals)))
        if (p < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, delay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [target, duration, delay, decimals])

  return value
}

// Atraso de animação em cascata (o CSS lê a variável --d)
export const stagger = (i, base = 0, step = 70) => ({ '--d': `${base + i * step}ms` })
