"use client"

import { useEffect, useState } from "react"

interface UseDebouncedValueOptions {
  enabled: boolean
}

export function useDebounce<T>(value: T, delay: number, options?: UseDebouncedValueOptions): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const isEnabled = options?.enabled !== false

  useEffect(() => {
    if (!isEnabled) {
      setDebouncedValue(value)
      return
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay, isEnabled])

  return debouncedValue
}
