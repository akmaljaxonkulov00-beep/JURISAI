// API Service - Frontend API Integration
// Barcha yo'llar real mavjud endpoint'larga ishora qiladi (audit 2025-08-17).

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://www.juristiv.uz' // SSR fallback
}
const API_BASE_URL = getBaseUrl()

interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
  error?: string
}

type JsonObject = Record<string, unknown>

class ApiService {
  private baseURL: string

  constructor() {
    this.baseURL = API_BASE_URL
  }

  /**
   * Supabase session'dan access_token olish.
   * Yagona ishonchli manba — Supabase browser client getSession() API.
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      if (typeof window === 'undefined') return null
      const { supabase } = await import('@/lib/supabase-browser')
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.access_token) return session.access_token
    } catch {
      /* ignore */
    }
    return null
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`

      // Auth token olish (Supabase session'dan)
      const authToken = await this.getAuthToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      }
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const response = await fetch(url, {
        credentials: 'include',
        headers,
        ...options,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          (errorData as { message?: string }).message || `HTTP error! status: ${response.status}`
        )
      }

      const data = await response.json()
      return data as ApiResponse<T>
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  // ── AI — Hujjat generatsiyasi (real: /api/ai/document-generate) ──
  async generateAIDocument(template: string, data: JsonObject) {
    return this.request('/api/ai/document-generate', {
      method: 'POST',
      body: JSON.stringify({ templateId: template, documentData: data }),
    })
  }

  // ── IRAC ──
  async analyzeIRAC(caseText: string, difficulty: string): Promise<ApiResponse<unknown>> {
    return this.request('/api/ai/irac-analyze', {
      method: 'POST',
      body: JSON.stringify({ case_text: caseText, difficulty_level: difficulty }),
    })
  }

  // ── Legal Database ──
  async searchLegalDocuments(query: string, category?: string, type?: string) {
    const params = new URLSearchParams({ query })
    if (category) params.append('category', category)
    if (type) params.append('type', type)

    return this.request(`/api/legal/database/search?${params}`)
  }

  async getLegalDocument(id: string) {
    return this.request(`/api/legal/database/documents/${id}`)
  }

  async getLegalCategories() {
    return this.request('/api/legal/database/categories')
  }

  async getPopularDocuments(limit?: number, category?: string) {
    const params = new URLSearchParams({ limit: (limit || 10).toString() })
    if (category) params.append('category', category)

    return this.request(`/api/legal/database/popular?${params}`)
  }

  async bookmarkDocument(documentId: string) {
    return this.request(`/api/legal/database/bookmark/${documentId}`, {
      method: 'POST',
    })
  }

  async removeBookmark(documentId: string) {
    return this.request(`/api/legal/database/bookmark/${documentId}`, {
      method: 'DELETE',
    })
  }

  // ── Court Simulator (real: /api/court-simulator) ──
  async startCourtSession(userRole: string, scenarioType: string) {
    return this.request('/api/court-simulator', {
      method: 'POST',
      body: JSON.stringify({ user_role: userRole, scenario_type: scenarioType }),
    })
  }

  // ── Decision Tree ──
  async analyzeDecisionPath(scenario: string, caseType: string, decisions: JsonObject) {
    return this.request('/api/decision-tree/analyze', {
      method: 'POST',
      body: JSON.stringify({
        scenario_title: scenario,
        scenario_description: scenario,
        case_type: caseType,
        initial_decisions: decisions,
      }),
    })
  }

  async updateDecisionTree(treeId: string, nodeId: string, decision: string, confidence: number) {
    return this.request(`/api/decision-tree/tree/${treeId}/update`, {
      method: 'PUT',
      body: JSON.stringify({ node_id: nodeId, decision, confidence }),
    })
  }

  async getDecisionTrees() {
    return this.request('/api/decision-tree/trees', {
      method: 'GET',
    })
  }

  async getDecisionTreeNodes(scenario: string) {
    return this.request(`/api/decision-tree/nodes?scenario=${scenario}`, {
      method: 'GET',
    })
  }

  // ── Legal Forms ──
  async submitLegalForm(formId: string, formData: JsonObject) {
    return this.request('/api/legal-forms/submit', {
      method: 'POST',
      body: JSON.stringify({ form_id: formId, form_data: formData }),
    })
  }

  // ── User ──
  async getUserStats() {
    return this.request('/api/user/stats')
  }

  // ── Auth ──
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(userData: { name: string; email: string; password: string; phone?: string }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    })
  }

  // ── Scenario Generator ──
  async generateScenario(
    scenarioType: string,
    difficultyLevel: string,
    complexity: string,
    participantsCount: number,
    focusAreas: string[],
    durationMinutes: number
  ) {
    return this.request('/api/scenario-generator/generate', {
      method: 'POST',
      body: JSON.stringify({
        scenario_type: scenarioType,
        difficulty_level: difficultyLevel,
        complexity,
        participants_count: participantsCount,
        focus_areas: focusAreas,
        duration_minutes: durationMinutes,
      }),
    })
  }

  async getScenarios() {
    return this.request('/api/scenario-generator/scenarios', {
      method: 'GET',
    })
  }

  async getScenarioTemplates() {
    return this.request('/api/scenario-generator/templates', {
      method: 'GET',
    })
  }

  // ── Document Generator (real: /api/ai/document-generate + /api/templates) ──
  async generateDocument(
    templateId: string,
    documentData: JsonObject,
    outputFormat: string,
    language: string,
    customFields?: JsonObject
  ) {
    return this.request('/api/ai/document-generate', {
      method: 'POST',
      body: JSON.stringify({
        templateId,
        documentData,
        outputFormat,
        language,
        customFields: customFields || {},
      }),
    })
  }

  async getDocumentTemplates(category?: string) {
    const url = category
      ? `/api/templates?category=${encodeURIComponent(category)}`
      : '/api/templates'
    return this.request(url, {
      method: 'GET',
    })
  }
}

export const api = new ApiService()
export type { ApiResponse }
