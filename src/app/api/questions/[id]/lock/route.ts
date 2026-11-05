import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { lockQuestionForStudent } from '@/lib/law-student-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    const result = await lockQuestionForStudent(id, auth.user.id)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 409 }) // Conflict
    }

    return NextResponse.json({
      success: true,
      message: 'Savol siz uchun 20 daqiqaga muvaffaqiyatli qulflandi',
      lockExpiresAt: result.lockExpiresAt,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
