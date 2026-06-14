// API Hook - Custom hook for API calls with loading and error handling
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

interface UseApiOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  refetch: () => Promise<T | null>;
}

export function useApi<T>(
  apiCall: (...args: any[]) => Promise<any>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastArgs, setLastArgs] = useState<any[]>([]);

  const { immediate = false, onSuccess, onError } = options;

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setLoading(true);
      setError(null);
      setLastArgs(args);

      try {
        const result = await apiCall(...args);
        
        if (result !== null && result !== undefined) {
          setData(result as T);
          onSuccess?.(result as T);
          return result as T;
        } else {
          const error = new Error('API call failed');
          setError(error);
          onError?.(error);
          return null;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiCall, onSuccess, onError]
  );

  const refetch = useCallback(async () => {
    if (lastArgs.length > 0) {
      return await execute(...lastArgs);
    }
    return null;
  }, [execute, lastArgs]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    setLastArgs([]);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    refetch
  };
}

// Specific hooks for common API calls
export function useIRACAnalysis() {
  return useApi((caseText: string, difficulty: string) => 
    api.analyzeIRAC(caseText, difficulty)
  );
}

export function useLegalSearch() {
  return useApi((query: string, category?: string, type?: string) => 
    api.searchLegalDocuments(query, category, type)
  );
}

export function useCourtSession() {
  return useApi((scenarioType: string, userRole: string) => 
    api.startCourtSession(scenarioType, userRole)
  );
}

export function useDocumentGeneration() {
  return useApi((template: string, data: Record<string, any>, outputFormat: string = 'pdf', language: string = 'uz') => 
    api.generateDocument(template, data, outputFormat, language)
  );
}

export function useWeaknessDetection() {
  return useApi((argument: string, argumentType: string) => 
    api.detectWeaknesses(argument, argumentType)
  );
}

export function useScenarioGeneration() {
  return useApi((scenarioType: string, difficulty: string, complexity: string, participantsCount: number = 2, focusAreas: string[] = [], durationMinutes: number = 30) => 
    api.generateScenario(scenarioType, difficulty, complexity, participantsCount, focusAreas, durationMinutes)
  );
}

export function useDecisionAnalysis() {
  return useApi((scenario: string, caseType: string, decisions: Record<string, any>) => 
    api.analyzeDecisionPath(scenario, caseType, decisions)
  );
}

export function useLegalForms() {
  const getTemplates = useApi(() => api.getFormTemplates());
  const getTemplate = useApi((templateId: string) => api.getFormTemplate(templateId));
  const submitForm = useApi((formId: string, formData: Record<string, any>) => 
    api.submitLegalForm(formId, formData)
  );
  const getSubmitted = useApi(() => api.getSubmittedForms());

  return {
    getTemplates,
    getTemplate,
    submitForm,
    getSubmitted
  };
}

export function useUserProfile() {
  const getProfile = useApi(() => api.getUserProfile());
  const updateProfile = useApi((profileData: Record<string, any>) => 
    api.updateUserProfile(profileData)
  );
  const getStats = useApi(() => api.getUserStats());
  const getActivity = useApi(() => api.getUserActivity());

  return {
    getProfile,
    updateProfile,
    getStats,
    getActivity
  };
}

// Hook for polling (real-time updates)
export function usePolling<T>(
  apiCall: () => Promise<any>,
  interval: number = 5000,
  options: UseApiOptions<T> = {}
) {
  const { data, loading, error, execute, reset } = useApi(apiCall, options);

  useEffect(() => {
    const intervalId = setInterval(() => {
      execute();
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval, execute]);

  return { data, loading, error, execute, reset };
}

// Hook for debounced API calls
export function useDebouncedApi<T>(
  apiCall: (...args: any[]) => Promise<any>,
  delay: number = 300
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedExecute = useCallback(
    debounce(async (...args: any[]) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiCall(...args);
        if (result !== null && result !== undefined) {
          setData(result as T);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      } finally {
        setLoading(false);
      }
    }, delay),
    [apiCall, delay]
  );

  return {
    data,
    loading,
    error,
    execute: debouncedExecute
  };
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default useApi;
