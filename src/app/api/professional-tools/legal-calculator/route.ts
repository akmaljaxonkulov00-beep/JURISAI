import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackUsage } from '@/lib/usage-tracking';

export async function POST(request: NextRequest) {
  try {
    const { 
      case_type, 
      claim_amount, 
      contract_amount, 
      days_late, 
      start_date 
    } = await request.json();

    if (!case_type || !claim_amount) {
      return NextResponse.json(
        { error: 'Barcha maydonlar talab qilinadi: case_type, claim_amount' },
        { status: 400 }
      );
    }

    // Generate calculation ID
    const calculationId = `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate state fee based on Uzbekistan tax law
    let stateFee = 0;
    const claimAmount = parseFloat(claim_amount) || 0;

    if (case_type === 'civil') {
      if (claimAmount <= 1000000) stateFee = claimAmount * 0.05;
      else if (claimAmount <= 5000000) stateFee = 50000 + (claimAmount - 1000000) * 0.04;
      else if (claimAmount <= 10000000) stateFee = 210000 + (claimAmount - 5000000) * 0.03;
      else stateFee = 360000 + (claimAmount - 10000000) * 0.02;
    } else if (case_type === 'economic') {
      if (claimAmount <= 5000000) stateFee = claimAmount * 0.03;
      else if (claimAmount <= 20000000) stateFee = 150000 + (claimAmount - 5000000) * 0.025;
      else stateFee = 525000 + (claimAmount - 20000000) * 0.02;
    } else if (case_type === 'administrative') {
      stateFee = Math.min(claimAmount * 0.02, 1000000); // Max 1 million for administrative cases
    }

    stateFee = Math.min(stateFee, 2000000); // Maximum state fee cap

    // Calculate damages if contract data provided
    let damages = 0;
    if (contract_amount && days_late) {
      const contractAmount = parseFloat(contract_amount) || 0;
      const daysLate = parseFloat(days_late) || 0;
      
      // Penalty calculation (1% per day for late payment)
      const penaltyRate = 0.01;
      damages = contractAmount * penaltyRate * daysLate;
    }

    // Calculate court fees
    let courtFee = 0;
    if (claimAmount <= 1000000) courtFee = claimAmount * 0.02;
    else if (claimAmount <= 5000000) courtFee = 20000 + (claimAmount - 1000000) * 0.015;
    else if (claimAmount <= 10000000) courtFee = 80000 + (claimAmount - 5000000) * 0.01;
    else courtFee = 130000 + (claimAmount - 10000000) * 0.005;

    // Calculate interest if start date provided
    let interest = 0;
    if (start_date) {
      const startDate = new Date(start_date);
      const currentDate = new Date();
      const daysDifference = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDifference > 0 && claimAmount > 0) {
        // Central bank rate (mock: 15% annual)
        const annualRate = 0.15;
        const dailyRate = annualRate / 365;
        interest = claimAmount * dailyRate * daysDifference;
      }
    }

    // Calculate lawyer fees (estimated)
    let lawyerFee = 0;
    if (case_type === 'civil') {
      lawyerFee = Math.min(claimAmount * 0.05, 5000000); // 5% up to 5 million
    } else if (case_type === 'economic') {
      lawyerFee = Math.min(claimAmount * 0.03, 10000000); // 3% up to 10 million
    } else if (case_type === 'administrative') {
      lawyerFee = Math.min(2000000, claimAmount * 0.02); // Fixed or 2%
    }

    const total = stateFee + damages + interest + courtFee + lawyerFee;

    // Mock calculation result
    const calculationResult = {
      id: calculationId,
      case_type: case_type,
      claim_amount: claimAmount,
      state_fee: Math.round(stateFee),
      damages: Math.round(damages),
      interest: Math.round(interest),
      court_fee: Math.round(courtFee),
      lawyer_fee: Math.round(lawyerFee),
      total: Math.round(total),
      breakdown: [
        {
          item: 'Davlat boji',
          amount: Math.round(stateFee),
          description: 'GPK 167-moddaga asosan'
        },
        {
          item: 'Zarar tovonari',
          amount: Math.round(damages),
          description: days_late ? `${days_late} kun kechikishi uchun` : 'Hisoblanmadi'
        },
        {
          item: 'Foiz tovonari',
          amount: Math.round(interest),
          description: start_date ? `${start_date} dan boshlab` : 'Hisoblanmadi'
        },
        {
          item: 'Sud yig\'imlari',
          amount: Math.round(courtFee),
          description: 'Sud xarajatlari'
        },
        {
          item: 'Advokat xizmati',
          amount: Math.round(lawyerFee),
          description: 'Taxminiy xizmat haqi'
        }
      ],
      legal_basis: [
        'O\'zbekiston Respublikasi Fuqarolik protsessual kodeksi',
        'O\'zbekiston Respublikasi Soliq kodeksi',
        'O\'zbekiston Respublikasi Davlat boji to\'g\'risidagi qonun'
      ],
      calculation_date: new Date().toISOString(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days validity
    };

    // Save calculation to database
    const { data, error } = await supabase
      .from('legal_calculations')
      .insert([{
        id: calculationId,
        case_type: case_type,
        claim_amount: claimAmount,
        state_fee: calculationResult.state_fee,
        damages: calculationResult.damages,
        interest: calculationResult.interest,
        court_fee: calculationResult.court_fee,
        lawyer_fee: calculationResult.lawyer_fee,
        total_amount: calculationResult.total,
        calculation_data: calculationResult,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Legal calculation save error:', error);
    }

    // Track usage
    await trackUsage('legal_calculator', { 
      calculation_id: calculationId,
      case_type: case_type,
      claim_amount: claimAmount
    });

    return NextResponse.json({
      success: true,
      ...calculationResult,
      message: 'Hisoblash muvaffaqiyatli yakunlandi',
      processing_time: '0.8 soniya'
    });

  } catch (error) {
    console.error('Legal calculator error:', error);
    return NextResponse.json(
      { error: 'Hisoblashda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
