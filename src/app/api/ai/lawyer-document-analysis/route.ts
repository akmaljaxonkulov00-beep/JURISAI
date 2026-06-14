import { NextRequest, NextResponse } from 'next/server';
import { googleAIService, LegalAnalysisRequest } from '@/lib/google-ai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const lawyerId = formData.get('lawyerId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Hujjat fayli yuklanishi shart' },
        { status: 400 }
      );
    }

    // Read file content
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(buffer);

    // Enhanced legal analysis for lawyers
    const legalRequest: LegalAnalysisRequest = {
      type: 'document-analysis',
      query: text,
      context: `Professional legal document analysis for lawyer. Document type: ${documentType}. Provide comprehensive analysis including: legal compliance, risks, recommendations, relevant laws, and actionable insights.`,
      jurisdiction: 'uzbekistan',
      language: 'uz'
    };

    // Get AI analysis
    const aiResponse = await googleAIService.generateLegalResponse(legalRequest);

    if (!aiResponse.success) {
      return NextResponse.json(
        { error: 'Hujjatni tahlil qilishda xatolik yuz berdi: ' + aiResponse.error },
        { status: 500 }
      );
    }

    // Parse AI response into structured format
    const analysisResult = parseLawyerDocumentAnalysis(aiResponse.text);

    // Save analysis to database (in production)
    const analysisData = {
      lawyer_id: lawyerId,
      document_name: file.name,
      document_type: documentType,
      analysis_result: analysisResult,
      confidence: calculateConfidence(analysisResult),
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      documentName: file.name,
      documentType,
      analysisResult,
      confidence: calculateConfidence(analysisResult),
      rawAnalysis: aiResponse.text
    });

  } catch (error) {
    console.error('Lawyer document analysis error:', error);
    return NextResponse.json(
      { error: 'Server xatosi. Iltimos, qayta urinib ko\'ring.' },
      { status: 500 }
    );
  }
}

function parseLawyerDocumentAnalysis(analysisText: string) {
  // Parse AI response into structured format
  const sections = {
    summary: '',
    keyPoints: [] as string[],
    risks: [] as string[],
    recommendations: [] as string[],
    legalReferences: [] as string[],
    complianceIssues: [] as string[],
    actionableSteps: [] as string[],
    relevantArticles: [] as string[]
  };

  // Simple parsing logic (in production, use more sophisticated parsing)
  const lines = analysisText.split('\n');
  let currentSection = '';

  lines.forEach(line => {
    line = line.trim();
    
    if (line.toLowerCase().includes('xulosa') || line.toLowerCase().includes('summary')) {
      currentSection = 'summary';
    } else if (line.toLowerCase().includes('asosiy') || line.toLowerCase().includes('kalit') || line.toLowerCase().includes('key')) {
      currentSection = 'keyPoints';
    } else if (line.toLowerCase().includes('xavf') || line.toLowerCase().includes('risk')) {
      currentSection = 'risks';
    } else if (line.toLowerCase().includes('tavsiya') || line.toLowerCase().includes('recommendation')) {
      currentSection = 'recommendations';
    } else if (line.toLowerCase().includes('qonun') || line.toLowerCase().includes('legal') || line.toLowerCase().includes('reference')) {
      currentSection = 'legalReferences';
    } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
      const point = line.replace(/^[•\-\*]\s*/, '').trim();
      if (point && currentSection && sections[currentSection as keyof typeof sections] !== undefined) {
        if (Array.isArray(sections[currentSection as keyof typeof sections])) {
          (sections[currentSection as keyof typeof sections] as string[]).push(point);
        }
      }
    } else if (line && currentSection === 'summary') {
      sections.summary += line + ' ';
    }
  });

  return sections;
}

function calculateConfidence(analysisResult: any): number {
  // Calculate confidence based on analysis completeness
  let confidence = 70; // Base confidence
  
  if (analysisResult.summary.length > 50) confidence += 10;
  if (analysisResult.keyPoints.length > 0) confidence += 10;
  if (analysisResult.risks.length > 0) confidence += 5;
  if (analysisResult.recommendations.length > 0) confidence += 5;
  
  return Math.min(confidence, 95);
}
