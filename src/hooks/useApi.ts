// API Hook - Custom hook for API calls with loading and error handling
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/services/api'

interface UseApiOptions<T> {
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseApiResult<T, A extends unknown[] = unknown[]> {
  data: T | null
  loading: boolean
  error: Error | null
  execute: (...args: A) => Promise<T | null>
  reset: () => void
  refetch: () => Promise<T | null>
}

export function useApi<T, A extends unknown[] = unknown[]>(
  apiCall: (...args: A) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T, A> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastArgs, setLastArgs] = useState<A>([] as unknown as A)

  const { immediate = false, onSuccess, onError } = options

  const execute = useCallback(
    async (...args: A): Promise<T | null> => {
      setLoading(true)
      setError(null)
      setLastArgs(args)

      try {
        const result = await apiCall(...args)

        if (result !== null && result !== undefined) {
          setData(result as T)
          onSuccess?.(result as T)
          return result as T
        } else {
          const error = new Error('API call failed')
          setError(error)
          onError?.(error)
          return null
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        onError?.(error)
        return null
      } finally {
        setLoading(false)
      }
    },
    [apiCall, onSuccess, onError]
  )

  const refetch = useCallback(async () => {
    if (lastArgs.length > 0) {
      return await execute(...lastArgs)
    }
    return null
  }, [execute, lastArgs])

  const reset = useCallback(() => {
    setData(null)
    setLoading(false)
    setError(null)
    setLastArgs([] as unknown as A)
  }, [])

  useEffect(() => {
    if (immediate) {
      ;(execute as (...args: unknown[]) => Promise<T | null>)()
    }
  }, [immediate, execute])

  return {
    data,
    loading,
    error,
    execute,
    reset,
    refetch,
  }
}

// Specific hooks for common API calls
export function useIRACAnalysis() {
  return useApi((caseText: string, difficulty: string) => api.analyzeIRAC(caseText, difficulty))
}

export function useLegalSearch() {
  return useApi((query: string, category?: string, type?: string) =>
    api.searchLegalDocuments(query, category, type)
  )
}

export function useCourtSession() {
  return useApi((scenarioType: string, userRole: string) =>
    api.startCourtSession(scenarioType, userRole)
  )
}

export function useDocumentGeneration() {
  return useApi(
    (
      template: string,
      data: Record<string, unknown>,
      outputFormat: string = 'pdf',
      language: string = 'uz'
    ) => api.generateDocument(template, data, outputFormat, language)
  )
}

export function useScenarioGeneration() {
  return useApi(
    (
      scenarioType: string,
      difficulty: string,
      complexity: string,
      participantsCount: number = 2,
      focusAreas: string[] = [],
      durationMinutes: number = 30
    ) =>
      api.generateScenario(
        scenarioType,
        difficulty,
        complexity,
        participantsCount,
        focusAreas,
        durationMinutes
      )
  )
}

export function useDecisionAnalysis() {
  return useApi((scenario: string, caseType: string, decisions: Record<string, unknown>) =>
    api.analyzeDecisionPath(scenario, caseType, decisions)
  )
}

// Hook for polling (real-time updates)
export function usePolling<T>(
  apiCall: () => Promise<T>,
  interval: number = 5000,
  options: UseApiOptions<T> = {}
) {
  const { data, loading, error, execute, reset } = useApi(apiCall, options)

  useEffect(() => {
    const intervalId = setInterval(() => {
      execute()
    }, interval)

    return () => clearInterval(intervalId)
  }, [interval, execute])

  return { data, loading, error, execute, reset }
}

// Hook for debounced API calls
export function useDebouncedApi<T>(
  apiCall: (...args: unknown[]) => Promise<T>,
  delay: number = 300
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const debouncedExecute = useCallback(
    debounce(async (...args: unknown[]) => {
      setLoading(true)
      setError(null)

      try {
        const result = await apiCall(...args)
        if (result !== null && result !== undefined) {
          setData(result as T)
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
      } finally {
        setLoading(false)
      }
    }, delay),
    [apiCall, delay]
  )

  return {
    data,
    loading,
    error,
    execute: debouncedExecute,
  }
}

// Debounce utility function
function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export default useApi
