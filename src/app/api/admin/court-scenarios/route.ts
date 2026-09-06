import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import {
  listAllScenarios,
  createScenario,
  updateScenario,
  deleteScenario,
} from '@/lib/court/scenario-db'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const scenarios = await listAllScenarios({ includeInactive: true })
    return NextResponse.json({ success: true, scenarios })
  } catch (err: any) {
    console.error('admin court-scenarios GET error:', err)
    return NextResponse.json(
      { error: err.message || 'Ssenariylarni olishda xatolik' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { scenario } = body

    if (!scenario || !scenario.title) {
      return NextResponse.json({ error: 'Ssenariy nomi kiritilishi shart' }, { status: 400 })
    }

    const res = await createScenario(scenario)
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, scenario: res.scenario })
  } catch (err: any) {
    console.error('admin court-scenarios POST error:', err)
    return NextResponse.json(
      { error: err.message || 'Ssenariy yaratishda xatolik' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { scenarioId, updates } = body

    if (!scenarioId || !updates) {
      return NextResponse.json({ error: 'scenarioId va updates talab qilinadi' }, { status: 400 })
    }

    const res = await updateScenario(scenarioId, updates)
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('admin court-scenarios PUT error:', err)
    return NextResponse.json(
      { error: err.message || 'Ssenariy yangilashda xatolik' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const scenarioId = searchParams.get('id')

    if (!scenarioId) {
      return NextResponse.json({ error: 'Ssenariy ID si talab qilinadi' }, { status: 400 })
    }

    const res = await deleteScenario(scenarioId)
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('admin court-scenarios DELETE error:', err)
    return NextResponse.json(
      { error: err.message || 'Ssenariy o‘chirishda xatolik' },
      { status: 500 }
    )
  }
}
