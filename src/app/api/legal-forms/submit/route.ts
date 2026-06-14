import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackUsage } from '@/lib/usage-tracking';

export async function POST(request: NextRequest) {
  try {
    const { 
      template_id, 
      template_name, 
      form_data, 
      category 
    } = await request.json();

    if (!template_id || !template_name || !form_data) {
      return NextResponse.json(
        { error: 'Barcha maydonlar talab qilinadi: template_id, template_name, form_data' },
        { status: 400 }
      );
    }

    // Generate unique submission ID and tracking number
    const submissionId = `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Mock submission processing
    const mockSubmission = {
      id: submissionId,
      template_id: template_id,
      template_name: template_name,
      category: category || 'general',
      form_data: form_data,
      tracking_number: trackingNumber,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      processing_time: '2-3 ish kuni',
      fees: calculateFees(template_id, category),
      required_documents: getRequiredDocuments(template_id),
      next_steps: [
        'Arizani ko\'rib chiqish',
        'Hujjalarni tekshirish',
        'Davlat bojini hisoblash',
        'Rasmiylashtirish'
      ],
      estimated_completion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      submission_method: 'online',
      priority: 'normal'
    };

    // Save submission to database
    const { data, error } = await supabase
      .from('legal_form_submissions')
      .insert([{
        id: submissionId,
        template_id: template_id,
        template_name: template_name,
        category: category || 'general',
        form_data: form_data,
        tracking_number: trackingNumber,
        status: 'pending',
        fees: mockSubmission.fees,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Legal form submission error:', error);
    }

    // Track usage
    await trackUsage('legal_form_submission', { 
      submission_id: submissionId,
      template_id: template_id,
      category: category
    });

    return NextResponse.json({
      success: true,
      id: submissionId,
      tracking_number: trackingNumber,
      status: 'pending',
      message: 'Ariza muvaffaqiyatli qabul qilindi',
      processing_time: mockSubmission.processing_time,
      fees: mockSubmission.fees,
      next_steps: mockSubmission.next_steps,
      estimated_completion: mockSubmission.estimated_completion,
      submitted_at: mockSubmission.submitted_at
    });

  } catch (error) {
    console.error('Legal form submission error:', error);
    return NextResponse.json(
      { error: 'Arizani yuborishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

function calculateFees(templateId: string, category?: string): number {
  // Mock fee calculation based on template type
  const feeMap: Record<string, number> = {
    '1': 250000, // Da'vo arizasi
    '2': 100000, // Ariza
    '3': 500000, // Vasiyatnoma
    '4': 300000, // Shartnoma
    '5': 150000, // Murojaat
    '6': 400000, // Shikoyat
    '7': 200000, // Talabnoma
    '8': 350000  // Boshqa arizalar
  };

  return feeMap[templateId] || 200000;
}

function getRequiredDocuments(templateId: string): string[] {
  // Mock required documents based on template type
  const docMap: Record<string, string[]> = {
    '1': ['Pasport', 'INPS', 'Shartnoma', 'Guohnoma'],
    '2': ['Pasport', 'INPS', 'Tashkilot guvohnomasi'],
    '3': ['Pasport', 'INPS', 'Mulk hujjatlari'],
    '4': ['Pasport', 'INPS', 'Shartnoma', 'Bank ma\'lumotlari'],
    '5': ['Pasport', 'INPS', 'Hujjatlar'],
    '6': ['Pasport', 'INPS', 'Dalillar'],
    '7': ['Pasport', 'INPS', 'Hujjatlar'],
    '8': ['Pasport', 'INPS', 'Qo\'shimcha hujjatlar']
  };

  return docMap[templateId] || ['Pasport', 'INPS'];
}
