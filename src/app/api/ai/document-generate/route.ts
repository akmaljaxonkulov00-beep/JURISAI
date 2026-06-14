import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { googleAIService } from '@/lib/google-ai';

export async function POST(request: NextRequest) {
  try {
    const { templateId, documentData, outputFormat, language, customFields } = await request.json();

    if (!templateId || !documentData) {
      return NextResponse.json(
        { error: 'Template ID and document data are required' },
        { status: 400 }
      );
    }

    if (!templateId || !documentData) {
      return NextResponse.json(
        { error: 'Template ID and document data are required' },
        { status: 400 }
      );
    }

    // Use Google AI for document generation
    const prompt = `Generate a legal document based on the following template and data:

Template ID: ${templateId}
Document Data: ${JSON.stringify(documentData)}
Output Format: ${outputFormat || 'docx'}
Language: ${language || 'uz'}
Custom Fields: ${JSON.stringify(customFields || {})}

Please generate a professional legal document in ${language || 'Uzbek'} language following the provided template structure. Include all necessary legal clauses and formatting.`;

    const aiResponse = await googleAIService.generateLegalResponse({
      type: 'document-analysis',
      query: prompt,
      context: `Document generation for template: ${templateId}`,
      jurisdiction: 'uzbekistan',
      language: language || 'uz'
    });

    if (!aiResponse.success) {
      console.error('Google AI Error:', aiResponse.error);
      return NextResponse.json(
        { error: 'Hujjat generatsiyasida xatolik yuz berdi' },
        { status: 500 }
      );
    }

    // Save generated document to database
    if (supabase) {
      await supabase
        .from('generated_documents')
        .insert({
          template_id: templateId,
          document_data: documentData,
          generated_content: aiResponse.text,
          output_format: outputFormat || 'docx',
          language: language || 'uz',
          custom_fields: customFields || {},
          created_at: new Date().toISOString()
        });
    }

    return NextResponse.json({
      success: true,
      document: aiResponse.text,
      templateId,
      outputFormat,
      language,
      usage: aiResponse.usage
    });

  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json(
      { error: 'Hujjat generatsiyasida xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
