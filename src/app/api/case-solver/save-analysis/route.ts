import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackUsage } from '@/lib/usage-tracking';

export async function POST(request: NextRequest) {
  try {
    const { 
      case_title, 
      case_category, 
      case_difficulty, 
      irac_analysis, 
      total_score,
      completed_at 
    } = await request.json();

    if (!case_title || !irac_analysis) {
      return NextResponse.json(
        { error: 'Barcha maydonlar talab qilinadi: case_title, irac_analysis' },
        { status: 400 }
      );
    }

    // Generate unique analysis ID
    const analysisId = `irac_analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Mock analysis processing
    const mockAnalysis = {
      id: analysisId,
      case_title: case_title,
      case_category: case_category || 'general',
      case_difficulty: case_difficulty || 'medium',
      irac_analysis: irac_analysis,
      total_score: total_score || 75,
      grade: getGrade(total_score || 75),
      feedback: generateFeedback(total_score || 75, irac_analysis),
      suggestions: generateSuggestions(irac_analysis),
      strengths: identifyStrengths(irac_analysis),
      weaknesses: identifyWeaknesses(irac_analysis),
      processing_time: '2.5 soniya',
      completed_at: completed_at || new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Save analysis to database
    const { data, error } = await supabase
      .from('irac_analyses')
      .insert([{
        id: analysisId,
        case_title: case_title,
        case_category: case_category || 'general',
        case_difficulty: case_difficulty || 'medium',
        irac_analysis: irac_analysis,
        total_score: total_score || 75,
        grade: mockAnalysis.grade,
        feedback: mockAnalysis.feedback,
        suggestions: mockAnalysis.suggestions,
        strengths: mockAnalysis.strengths,
        weaknesses: mockAnalysis.weaknesses,
        completed_at: completed_at || new Date().toISOString(),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('IRAC analysis save error:', error);
    }

    // Track usage
    await trackUsage('irac_analysis_save', { 
      analysis_id: analysisId,
      total_score: total_score || 75,
      case_category: case_category
    });

    return NextResponse.json({
      success: true,
      id: analysisId,
      total_score: mockAnalysis.total_score,
      grade: mockAnalysis.grade,
      feedback: mockAnalysis.feedback,
      suggestions: mockAnalysis.suggestions,
      strengths: mockAnalysis.strengths,
      weaknesses: mockAnalysis.weaknesses,
      processing_time: mockAnalysis.processing_time,
      message: 'IRAC tahlili muvaffaqiyatli saqlandi',
      saved_at: mockAnalysis.created_at
    });

  } catch (error) {
    console.error('IRAC analysis save error:', error);
    return NextResponse.json(
      { error: 'IRAC tahlilini saqlashda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

function getGrade(score: number): string {
  if (score >= 90) return 'A+ (A\'lo)';
  if (score >= 85) return 'A (Yaxshi)';
  if (score >= 80) return 'B+ (Yaxshi)';
  if (score >= 75) return 'B (Qoniqarli)';
  if (score >= 70) return 'C+ (O\'rtacha)';
  if (score >= 65) return 'C (O\'rtacha)';
  if (score >= 60) return 'D (Qoniqarsiz)';
  return 'F (Qayta urinish kerak)';
}

function generateFeedback(score: number, analysis: any): string {
  const feedbacks = {
    high: [
      'A\'lo ishladingiz! IRAC metodikasini to\'liq qo\'lladingiz.',
      'Mukammal tahlil! Barcha bosqichlar to\'g\'ri bajarilgan.',
      'Ajoyib natija! Huquqiy tahlilingiz juda yuqori saviyyada.'
    ],
    medium: [
      'Yaxshi ish, lekin yaxshilash mumkin. IRAC bosqichlariga diqqat bering.',
      'Qoniqarli natija. Ba\'zi bosqichlar kuchaytirilishi kerak.',
      'Yaxshi boshlangan, lekin to\'ldirish kerak bo\'lgan joylar bor.'
    ],
    low: [
      'Qayta urinib ko\'ring. IRAC metodikasini to\'g\'ri qo\'llashingiz kerak.',
      'Yaxshilash uchun ko\'p ish kerak. Barcha bosqichlarni tekshiring.',
      'IRAC metodikasini chuqurroq o\'rganing va qayta urining.'
    ]
  };

  let category: 'high' | 'medium' | 'low';
  if (score >= 80) category = 'high';
  else if (score >= 60) category = 'medium';
  else category = 'low';

  const categoryFeedbacks = feedbacks[category];
  return categoryFeedbacks[Math.floor(Math.random() * categoryFeedbacks.length)];
}

function generateSuggestions(analysis: any): string[] {
  const suggestions = [];
  
  if (!analysis.issue || analysis.issue.length < 50) {
    suggestions.push('Issue bosqichini batafsilroq yozing - asosiy huquqiy muammoni aniq belgilang');
  }
  
  if (!analysis.rule || !analysis.rule.includes('modda')) {
    suggestions.push('Rule bosqichiga tegishli qonun moddasini va kodeksni ko\'rsating');
  }
  
  if (!analysis.application || !analysis.application.includes('chunki')) {
    suggestions.push('Application bosqichida qonunni faktlarga bog\'lang - "chunki" so\'zidan foydalaning');
  }
  
  if (!analysis.conclusion || analysis.conclusion.length < 30) {
    suggestions.push('Conclusion bosqichini kuchaytiring - aniq xulosa chiqaring');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Ajoyib ish! IRAC metodikasini to\'liq qo\'lladingiz.');
  }
  
  return suggestions;
}

function identifyStrengths(analysis: any): string[] {
  const strengths = [];
  
  if (analysis.issue && analysis.issue.length > 100) {
    strengths.push('Issue bosqichi batafsil va aniq yozilgan');
  }
  
  if (analysis.rule && analysis.rule.includes('modda')) {
    strengths.push('Qonun havolalari to\'g\'ri keltirilgan');
  }
  
  if (analysis.application && analysis.application.includes('chunki')) {
    strengths.push('Qonunni faktlarga to\'g\'ri bog\'langan');
  }
  
  if (analysis.conclusion && analysis.conclusion.includes('shu sababga ko\'ra')) {
    strengths.push('Xulosa mantiqan asoslangan');
  }
  
  if (strengths.length === 0) {
    strengths.push('IRAC metodikasiga urinib ko\'rilgan');
  }
  
  return strengths;
}

function identifyWeaknesses(analysis: any): string[] {
  const weaknesses = [];
  
  if (!analysis.issue || analysis.issue.length < 30) {
    weaknesses.push('Issue juda qisqa va noaniq');
  }
  
  if (!analysis.rule || !analysis.rule.includes('modda')) {
    weaknesses.push('Qonun havolasi yo\'q yoki noto\'g\'ri');
  }
  
  if (!analysis.application || analysis.application.length < 50) {
    weaknesses.push('Application bosqichi zaif');
  }
  
  if (!analysis.conclusion || analysis.conclusion.length < 20) {
    weaknesses.push('Conclusion yetarli emas');
  }
  
  if (weaknesses.length === 0) {
    weaknesses.push('Hech qanday aniq zaiflik topilmadi');
  }
  
  return weaknesses;
}
