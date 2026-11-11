import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email va parol kiritilishi shart' }, { status: 400 })
    }

    // Authenticate user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: "Email yoki parol noto'g'ri" }, { status: 401 })
    }

    // Check if user is a lawyer or advocate in advocate_profiles
    let lawyerInfo: any = null

    const { data: lawyerData } = await supabase
      .from('lawyers')
      .select('id, first_name, last_name, email, specialization, experience, status')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (lawyerData) {
      if (lawyerData.status !== 'approved') {
        await supabase.auth.signOut()
        return NextResponse.json(
          { error: "Advokat profili hali tasdiqlanmagan. Iltimos, admin bilan bog'laning." },
          { status: 403 }
        )
      }
      lawyerInfo = {
        id: lawyerData.id,
        firstName: lawyerData.first_name,
        lastName: lawyerData.last_name,
        email: lawyerData.email,
        specialization: lawyerData.specialization,
        experience: lawyerData.experience,
        status: lawyerData.status,
      }
      await supabase
        .from('lawyers')
        .update({ last_login: new Date().toISOString() })
        .eq('id', lawyerData.id)
    } else {
      // Check unified advocate_profiles table
      const { data: advData } = await supabase
        .from('advocate_profiles')
        .select('*')
        .or(`user_id.eq.${authData.user.id},email.eq.${email}`)
        .maybeSingle()

      if (!advData) {
        await supabase.auth.signOut()
        return NextResponse.json({ error: 'Bu hisob uchun advokat profili topilmadi' }, { status: 403 })
      }

      if (advData.verification_status !== 'approved') {
        await supabase.auth.signOut()
        return NextResponse.json(
          { error: "Advokat profili hali tasdiqlanmagan (holat: " + advData.verification_status + "). Admin tasdiqlashini kuting." },
          { status: 403 }
        )
      }

      lawyerInfo = {
        id: advData.id,
        firstName: advData.full_name?.split(' ')[0] || advData.full_name,
        lastName: advData.full_name?.split(' ').slice(1).join(' ') || '',
        email: advData.email,
        specialization: advData.specializations || [],
        experience: advData.experience_years || 0,
        status: advData.verification_status,
      }
    }

    const response = NextResponse.json({
      success: true,
      lawyer: lawyerInfo,
      redirectTo: '/advocate',
    })

    // Set auth cookies for session consistency
    response.cookies.set('juristiv_auth', '1', { path: '/', maxAge: 60 * 60 * 24 * 7 })
    response.cookies.set('juristiv_role', 'advocate', { path: '/', maxAge: 60 * 60 * 24 * 7 })
    return response
  } catch (error) {
    console.error('Lawyer login error:', error)
    return NextResponse.json(
      { error: "Server xatosi. Iltimos, qayta urinib ko'ring." },
      { status: 500 }
    )
  }
}
