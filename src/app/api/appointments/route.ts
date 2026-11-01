import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/db/platform-db'
import { requireUser, getUserRole } from '@/lib/server-auth'
import { sanitizeInput } from '@/lib/api-security'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { role } = await getUserRole(auth.user.id, auth.user.email)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    let appointments
    if (role === 'admin') {
      appointments = await platformDb.getAppointments({ status })
    } else if (role === 'advocate') {
      appointments = await platformDb.getAppointments({ advocateId: auth.user.id, status })
    } else {
      appointments = await platformDb.getAppointments({ citizenId: auth.user.id, status })
    }

    return NextResponse.json({ success: true, data: appointments })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Uchrashuvlarni olishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const {
      advocateId,
      serviceTitle,
      format,
      appointmentDate,
      appointmentTime,
      amount,
      notes,
      citizenPhone,
    } = body

    if (!advocateId || !appointmentDate || !appointmentTime || !serviceTitle) {
      return NextResponse.json(
        {
          success: false,
          error: 'Advokat, xizmat nomi, sana va vaqt kiritilishi majburiy',
        },
        { status: 400 }
      )
    }

    // Backend availability / double-booking check
    const isAvailable = await platformDb.checkAppointmentAvailability(
      advocateId,
      appointmentDate,
      appointmentTime
    )

    if (!isAvailable) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tanlangan vaqt oralig‘i allaqachon band qilingan. Iltimos, boshqa vaqtni tanlang.',
        },
        { status: 409 }
      )
    }

    const advocate = await platformDb.getAdvocateById(advocateId)
    const advocateName = advocate?.full_name || 'Advokat'

    const appointment = await platformDb.createAppointment({
      citizen_id: auth.user.id,
      citizen_name: auth.user.email ? auth.user.email.split('@')[0] : 'Fuqaro',
      citizen_phone: citizenPhone || undefined,
      advocate_id: advocateId,
      advocate_name: advocateName,
      service_title: sanitizeInput(serviceTitle),
      format: format === 'offline' ? 'offline' : 'online',
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      status: 'pending',
      amount: Number(amount) || 150000,
      payment_status: 'pending',
      payment_method: 'click',
      notes: notes ? sanitizeInput(notes) : undefined,
    })

    return NextResponse.json({
      success: true,
      data: appointment,
      message: 'Konsultatsiya muvaffaqiyatli band qilindi',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Band qilishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

// Update appointment (confirm, reschedule, cancel)
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { id, status, cancellationReason, appointmentDate, appointmentTime } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Identifikator va yangi holat kiritilishi shart' },
        { status: 400 }
      )
    }

    const existing = await platformDb.getAppointments({})
    const target = existing.find(a => a.id === id)

    if (!target) {
      return NextResponse.json({ success: false, error: 'Konsultatsiya topilmadi' }, { status: 404 })
    }

    const { role } = await getUserRole(auth.user.id, auth.user.email)
    const isCitizen = target.citizen_id === auth.user.id
    const isAdvocate = target.advocate_id === auth.user.id
    const isAdmin = role === 'admin'

    if (!isCitizen && !isAdvocate && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Ushbu uchrashuvni boshqarish huquqiga ega emassiz' },
        { status: 403 }
      )
    }

    const updates: Partial<any> = { status }
    if (cancellationReason) {
      updates.cancellation_reason = sanitizeInput(cancellationReason)
    }
    if (appointmentDate) updates.appointment_date = appointmentDate
    if (appointmentTime) updates.appointment_time = appointmentTime

    const updated = await platformDb.updateAppointment(id, updates)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Uchrashuvni yangilashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
