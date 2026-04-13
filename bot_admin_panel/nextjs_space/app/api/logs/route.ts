import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { successResponse } from '@/lib/api-utils'
import { AuditLog } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // TODO: Fetch from Supabase
    // For now, return mock data
    const logs: AuditLog[] = [
      {
        id: '1',
        action: 'number_rented',
        user_id: '8349475987',
        admin_id: 'system',
        description: 'Usuario rentó número para Google (USA)',
        metadata: { service: 'google', country: 'usa', price: 8 },
        created_at: new Date('2024-04-10T12:30:00'),
      },
      {
        id: '2',
        action: 'user_created',
        user_id: '8349475987',
        admin_id: 'system',
        description: 'Nuevo usuario registrado',
        metadata: { telegram_id: 8349475987 },
        created_at: new Date('2024-01-15T10:00:00'),
      },
    ]

    const filtered = action === 'all' ? logs : logs.filter(l => l.action === action)

    return NextResponse.json(
      successResponse(filtered, 'Logs retrieved successfully')
    )
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
