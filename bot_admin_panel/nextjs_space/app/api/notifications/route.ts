import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { successResponse } from '@/lib/api-utils'
import { Notification } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')

    // TODO: Fetch from Supabase
    // For now, return mock data
    const notifications: Notification[] = [
      {
        id: '1',
        recipient_id: '8349475987',
        message: 'Tu cuenta ha recibido 50 créditos gratis',
        title: 'Créditos gratis',
        is_sent: true,
        sent_at: new Date('2024-04-10T12:00:00'),
        created_at: new Date('2024-04-10T12:00:00'),
        created_by: 'admin',
      },
    ].slice(0, limit)

    return NextResponse.json(
      successResponse(notifications, 'Notifications retrieved successfully')
    )
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
