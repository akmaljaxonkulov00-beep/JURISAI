import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackUsage } from '@/lib/usage-tracking';

export async function POST(request: NextRequest) {
  try {
    const { 
      argument_text, 
      argument_type, 
      context, 
      target_audience, 
      analysis_depth 
    } = await request.json();

    if (!argument_text || !argument_type) {
      return NextResponse.json(
        { error: 'Barcha maydonlar talab qilinadi: argument_text, argument_type' },
        { status: 400 }
      );
    }

    // Generate unique analysis ID
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Mock weakness detection
    const mockWeaknessAnalysis = {
      id: analysisId,
      argument_text: argument_text,
      argument_type: argument_type,
      context: context || 'Umumiy kontekst',
      target_audience: target_audience || 'Umumiy auditoriya',
      analysis_depth: analysis_depth || 'standard',
      analyzed_at: new Date().toISOString(),
      overall_score: Math.floor(Math.random() * 20) + 70, // 70-90
      confidence_level: Math.floor(Math.random() * 15) + 85, // 85-100
      weakness_points: [
        {
          id: 'weak_1',
          type: 'logical_fallacy',
          severity: 'medium',
          description: 'Argumentda mantiqiy xatolik mavjud - sabab va oqibat o\'rtasida to\'g\'ri bog\'lanish yo\'q',
          location: '3-5 qatorlar',
          example: '"Shu sababli, bu xulosa to\'g\'ri" - yetarli asos yo\'q',
          improvement_suggestion: 'Sabab va oqibat o\'rtasida aniq bog\'lanish o\'rnating, qo\'shimcha dalillar keltiring',
          confidence: 0.85
        },
        {
          id: 'weak_2',
          type: 'insufficient_evidence',
          severity: 'high',
          description: 'Argument uchun yetarli dalillar keltirilmagan',
          location: '7-9 qatorlar',
          example: '"Bu aniq shunday deyman\' - hech qanday dalil keltirilmagan',
          improvement_suggestion: 'Qonun hujjatlari, statistik ma\'lumotlar yoki ekspert xulosalarini keltiring',
          confidence: 0.92
        },
        {
          id: 'weak_3',
          type: 'emotional_appeal',
          severity: 'low',
          description: 'Argumentda hissiy murojaat ortiqcha',
          location: '12-13 qatorlar',
          example: '"Bu juda adolatsiz va noto\'g\'ri" - hissiy ifoda',
          improvement_suggestion: 'Hissiy ifodalarni qisqartiring, o\'rniga rasmiy dalillarga e\'tibor bering',
          confidence: 0.78
        }
      ],
      strength_points: [
        {
          id: 'strength_1',
          type: 'clear_structure',
          description: 'Argument tuzilishi aniq va oqilona',
          location: 'Butun matn',
          confidence: 0.90
        },
        {
          id: 'strength_2',
          type: 'relevant_topic',
          description: 'Mavzu muhokamasi o\'z vaqtida va tegishli',
          location: '1-2 qatorlar',
          confidence: 0.88
        }
      ],
      detailed_analysis: {
        logical_coherence: {
          score: 75,
          analysis: 'Argument mantiqan qisman izchil, biroq ba\'zi qismlarda bog\'lanish zaif',
          issues: [
            'Sabab-oqibat bog\'lanishining yetishmasligi',
            'Xulosa chiqarishda xatoliklar'
          ],
          recommendations: [
            'Har bir xulosaning oldidan sabablar keltiring',
            'Mantiqiy bog\'lanishlarni mustahkamlang'
          ]
        },
        evidence_quality: {
          score: 68,
          analysis: 'Dalillar sifati past, ko\'p hollarda shaxsiy fikrlarga tayanilgan',
          issues: [
            'Qonuniy asoslar yo\'q',
            'Statistik ma\'lumotlar keltirilmagan',
            'Ekspert fikrlari yo\'q'
          ],
          recommendations: [
            'Qonun hujjatlariga havolalar qo\'shing',
            'Rasmiy statistik ma\'lumotlardan foydalaning',
            'Mustaqil ekspert xulosalarini keltiring'
          ]
        },
        argument_structure: {
          score: 82,
          analysis: 'Argument tuzilishi yaxshi, kirish, asosiy qism va xulosa mavjud',
          strengths: [
            'Aniq kirish qismi',
            'Mantiqiy ketma-ketlik',
            'Xulosa qismi mavjud'
          ],
          recommendations: [
            'Har bir qism o\'rtasida o\'tishlarni yaxshilang',
            'Xulosani asosiy argument bilan bog\'lang'
          ]
        },
        persuasiveness: {
          score: 78,
          analysis: 'Argument ishontirish qobiliyati o\'rtacha',
          issues: [
            'Hissiy ifodalar ko\'p',
            'Rasmiy uslubda emas'
          ],
          recommendations: [
            'Rasmiy uslubni qo\'llang',
            'Hissiy ifodalarni kamaytiring',
            'Qo\'shimcha dalillar keltiring'
          ]
        }
      },
      improvement_suggestions: [
        {
          category: 'Mantiqiy tuzilish',
          priority: 'high',
          suggestions: [
            'Har bir xulosaning oldidan aniq sabablar keltiring',
            'Mantiqiy bog\'lanishlarni mustahkamlang',
            'Xulosa chiqarishda ehtiyot bo\'ling'
          ]
        },
        {
          category: 'Dalillar',
          priority: 'high',
          suggestions: [
            'Qonun hujjatlariga havolalar qo\'shing',
            'Rasmiy statistik ma\'lumotlardan foydalaning',
            'Mustaqil ekspert xulosalarini keltiring',
            'Amaliy misollarni keltiring'
          ]
        },
        {
          category: 'Uslub',
          priority: 'medium',
          suggestions: [
            'Rasmiy uslubni qo\'llang',
            'Hissiy ifodalarni kamaytiring',
            'Qisqa va aniq ifodalardan foydalaning'
          ]
        }
      ],
      audience_analysis: {
        target_audience: target_audience || 'Umumiy auditoriya',
        appropriateness: 75,
        analysis: 'Argument berilgan auditoriyaga qisman mos',
        recommendations: [
          'Auditoriya bilim darajasini hisobga oling',
          'Til sathini moslashtiring',
          'Kutishlarni inobatga oling'
        ]
      },
      next_steps: [
        'Dalillarni to\'ldirish',
        'Mantiqiy bog\'lanishlarni mustahkamlash',
        'Uslubni yaxshilash',
        'Xulosani qayta ko\'rib chiqish'
      ]
    };

    // Save analysis to database
    const { data, error } = await supabase
      .from('weakness_analyses')
      .insert([{
        id: analysisId,
        argument_text: argument_text,
        argument_type: argument_type,
        context: context || 'Umumiy kontekst',
        target_audience: target_audience || 'Umumiy auditoriya',
        analysis_depth: analysis_depth || 'standard',
        analysis_data: mockWeaknessAnalysis,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Weakness detection error:', error);
    }

    // Track usage
    await trackUsage('weakness_detection', { 
      analysis_id: analysisId,
      argument_type: argument_type,
      overall_score: mockWeaknessAnalysis.overall_score
    });

    return NextResponse.json(mockWeaknessAnalysis);

  } catch (error) {
    console.error('Weakness detection error:', error);
    return NextResponse.json(
      { error: 'Zaifliklarni aniqlashda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
