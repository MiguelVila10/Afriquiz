import { useEffect, useState } from 'react'

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

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
