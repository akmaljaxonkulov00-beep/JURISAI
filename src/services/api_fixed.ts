// API Service - Frontend API Integration
import { toast } from '@/components/ui/Toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  error?: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // AI Service API
  async analyzeText(text: string, type: string) {
    return this.request('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ text, type }),
    });
  }

  async generateAIDocument(template: string, data: Record<string, any>) {
    return this.request('/api/ai/generate-document', {
      method: 'POST',
      body: JSON.stringify({ template, data }),
    });
  }

  async detectAIWeaknesses(argument: string, argumentType: string) {
    return this.request('/api/ai/detect-weaknesses', {
      method: 'POST',
      body: JSON.stringify({ argument, argument_type: argumentType }),
    });
  }

  async generateAIScenario(scenarioType: string, difficulty: string, complexity: string) {
    return this.request('/api/ai/generate-scenario', {
      method: 'POST',
      body: JSON.stringify({ 
        scenario_type: scenarioType, 
        difficulty, 
        complexity 
      }),
    });
  }

  // IRAC Solver API
  async analyzeIRAC(caseText: string, difficulty: string): Promise<ApiResponse<any>> {
    return this.request('/irac/analyze', {
      method: 'POST',
      body: JSON.stringify({ case_text: caseText, difficulty_level: difficulty }),
    });
  }

  async updateIRAC(analysisId: string, component: string, content: string): Promise<ApiResponse<any>> {
    return this.request(`/irac/analysis/${analysisId}`, {
      method: 'PUT',
      body: JSON.stringify({ component, content }),
    });
  }

  async getIRACAnalyses(): Promise<ApiResponse<any>> {
    return this.request('/irac/analyses', {
      method: 'GET',
    });
  }

  async getIRACAnalysis(analysisId: string): Promise<ApiResponse<any>> {
    return this.request(`/irac/analysis/${analysisId}`, {
      method: 'GET',
    });
  }

  async deleteIRACAnalysis(analysisId: string): Promise<ApiResponse<any>> {
    return this.request(`/irac/analysis/${analysisId}`, {
      method: 'DELETE',
    });
  }

  async evaluateIRAC(analysisId: string) {
    return this.request(`/irac/analysis/${analysisId}/evaluate`, {
      method: 'POST',
    });
  }

  // Legal Database API
  async searchLegalDocuments(query: string, category?: string, type?: string) {
    const params = new URLSearchParams({ query });
    if (category) params.append('category', category);
    if (type) params.append('type', type);
    
    return this.request(`/legal/database/search?${params}`);
  }

  async getLegalDocument(id: string) {
    return this.request(`/legal/database/documents/${id}`);
  }

  async getLegalCategories() {
    return this.request('/legal/database/categories');
  }

  // Court Simulator API
  async startCourtSession(userRole: string, scenarioType: string) {
    return this.request('/court/simulator/start', {
      method: 'POST',
      body: JSON.stringify({ user_role: userRole, scenario_type: scenarioType }),
    });
  }

  async submitCourtArgument(sessionId: string, argument: string) {
    return this.request(`/court/simulator/session/${sessionId}/argument`, {
      method: 'POST',
      body: JSON.stringify({ argument }),
    });
  }

  async getCourtSession(sessionId: string) {
    return this.request(`/court/simulator/session/${sessionId}`);
  }

  // Decision Tree API
  async analyzeDecisionPath(scenario: string, caseType: string, decisions: Record<string, any>) {
    return this.request('/decision-tree/analyze', {
      method: 'POST',
      body: JSON.stringify({ scenario_title: scenario, scenario_description: scenario, case_type: caseType, initial_decisions: decisions }),
    });
  }

  async updateDecisionTree(treeId: string, nodeId: string, decision: string, confidence: number) {
    return this.request(`/decision-tree/tree/${treeId}/update`, {
      method: 'PUT',
      body: JSON.stringify({ node_id: nodeId, decision: decision, confidence: confidence }),
    });
  }

  async getDecisionTrees() {
    return this.request('/decision-tree/trees', {
      method: 'GET',
    });
  }

  async getDecisionTreeNodes(scenario: string) {
    return this.request(`/decision-tree/nodes?scenario=${scenario}`, {
      method: 'GET',
    });
  }

  // Legal Forms API
  async submitLegalForm(formId: string, formData: Record<string, any>) {
    return this.request('/legal/forms/submit', {
      method: 'POST',
      body: JSON.stringify({ form_id: formId, form_data: formData }),
    });
  }

  async getFormTemplates() {
    return this.request('/legal/forms/templates');
  }

  async getFormTemplate(templateId: string) {
    return this.request(`/legal/forms/templates/${templateId}`);
  }

  async getSubmittedForms() {
    return this.request('/legal/forms/submitted');
  }

  // User Management API
  async getUserProfile() {
    return this.request('/api/user/profile');
  }

  async updateUserProfile(profileData: Record<string, any>) {
    return this.request('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getUserStats() {
    return this.request('/api/user/stats');
  }

  async getUserActivity() {
    return this.request('/api/user/activity');
  }

  // Authentication API
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
        name: string;
        email: string;
        password: string;
        phone?: string;
      }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken() {
    return this.request('/api/auth/refresh', {
      method: 'POST',
    });
  }

  // System API
  async healthCheck() {
    return this.request('/api/health');
  }

  async getSystemStats() {
    return this.request('/api/system/stats');
  }

  async getIRACStats() {
    return this.request('/irac/stats');
  }

  // Scenario Generator API
  async generateScenario(scenarioType: string, difficultyLevel: string, complexity: string, participantsCount: number, focusAreas: string[], durationMinutes: number) {
    return this.request('/scenario-generator/generate', {
      method: 'POST',
      body: JSON.stringify({ 
        scenario_type: scenarioType,
        difficulty_level: difficultyLevel,
        complexity: complexity,
        participants_count: participantsCount,
        focus_areas: focusAreas,
        duration_minutes: durationMinutes
      }),
    });
  }

  async getScenarios() {
    return this.request('/scenario-generator/scenarios', {
      method: 'GET',
    });
  }

  async getScenarioTemplates() {
    return this.request('/scenario-generator/templates', {
      method: 'GET',
    });
  }

  // Weakness Detector API
  async detectWeaknesses(argumentText: string, argumentType: string, context?: string, targetAudience?: string, analysisDepth?: string) {
    return this.request('/weakness-detector/detect', {
      method: 'POST',
      body: JSON.stringify({ 
        argument_text: argumentText,
        argument_type: argumentType,
        context: context,
        target_audience: targetAudience,
        analysis_depth: analysisDepth || 'standard'
      }),
    });
  }

  async improveArgument(originalArgument: string, weaknessPoints: string[], improvementStyle: string) {
    return this.request('/weakness-detector/improve', {
      method: 'POST',
      body: JSON.stringify({ 
        original_argument: originalArgument,
        weakness_points: weaknessPoints,
        improvement_style: improvementStyle
      }),
    });
  }

  async getWeaknessAnalyses() {
    return this.request('/weakness-detector/analyses', {
      method: 'GET',
    });
  }

  async getWeaknessTypes() {
    return this.request('/weakness-detector/weakness-types', {
      method: 'GET',
    });
  }

  // Document Generator API
  async generateDocument(templateId: string, documentData: Record<string, any>, outputFormat: string, language: string, customFields?: Record<string, any>) {
    return this.request('/document-generator/generate', {
      method: 'POST',
      body: JSON.stringify({ 
        template_id: templateId,
        document_data: documentData,
        output_format: outputFormat,
        language: language,
        custom_fields: customFields || {}
      }),
    });
  }

  async getDocumentTemplates(category?: string) {
    const url = category ? `/document-generator/templates?category=${category}` : '/document-generator/templates';
    return this.request(url, {
      method: 'GET',
    });
  }

  async getDocumentTemplate(templateId: string) {
    return this.request(`/document-generator/template/${templateId}`, {
      method: 'GET',
    });
  }

  async getDocuments() {
    return this.request('/document-generator/documents', {
      method: 'GET',
    });
  }

  async previewTemplate(templateId: string, documentData: Record<string, any>) {
    return this.request('/document-generator/template/preview', {
      method: 'POST',
      body: JSON.stringify({ 
        template_id: templateId,
        document_data: documentData
      }),
    });
  }

  async getDocumentCategories() {
    return this.request('/document-generator/categories', {
      method: 'GET',
    });
  }
}

export const api = new ApiService();
export type { ApiResponse };
