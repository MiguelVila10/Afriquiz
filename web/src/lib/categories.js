import { useEffect, useState } from 'react'
import { supabase } from './supabase'

let cache = null

export function useCategories() {
  const [categories, setCategories] = useState(cache ?? [])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cache) return
    supabase
      .from('categories')
      .select('id, slug, name, description, sort_order')
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) return setError(error)
        cache = data
        setCategories(data)
      })
  }, [])

  return { categories, error }
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
}
