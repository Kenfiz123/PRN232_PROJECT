import { useState, useCallback } from 'react'

export function useApi(apiCall, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiCall(...args)
      setData(response.data)
      return response.data
    } catch (err) {
      setError(err)
      if (options.onError) {
        options.onError(err)
      }
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiCall, options.onError])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, execute, reset }
}

export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

import { useState, useEffect } from 'react'
