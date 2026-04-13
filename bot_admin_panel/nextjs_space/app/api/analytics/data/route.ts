import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { successResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '30d'

    // TODO: Fetch from Supabase
    // For now, return mock data
    const data = {
      countries: [
        { name: 'USA', value: 15 },
        { name: 'México', value: 8 },
        { name: 'Canadá', value: 2 },
        { name: 'Indonesia', value: 1 },
      ],
      services: [
        { name: 'Google', value: 8 },
        { name: 'Telegram', value: 4 },
        { name: 'Amazon', value: 3 },
        { name: 'Uber', value: 6 },
        { name: 'WhatsApp', value: 2 },
        { name: 'Otros', value: 3 },
      ],
      revenue: [
        { name: 'Día 1', revenue: 50 },
        { name: 'Día 2', revenue: 45 },
        { name: 'Día 3', revenue: 65 },
        { name: 'Día 4', revenue: 40 },
        { name: 'Día 5', revenue: 75 },
        { name: 'Día 6', revenue: 60 },
        { name: 'Día 7', revenue: 70 },
      ],
      activity: [
        { name: 'Día 1', users: 1 },
        { name: 'Día 2', users: 0 },
        { name: 'Día 3', users: 0 },
        { name: 'Día 4', users: 0 },
        { name: 'Día 5', users: 0 },
        { name: 'Día 6', users: 0 },
        { name: 'Día 7', users: 0 },
      ],
    }

    return NextResponse.json(
      successResponse(data, 'Analytics data retrieved successfully')
    )
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
