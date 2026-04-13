import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { successResponse } from '@/lib/api-utils'

interface Activity {
  id: string
  user: string
  action: string
  timestamp: string
  service?: string
  amount?: number
}

export async function GET(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    // TODO: Fetch from Supabase
    // For now, return mock data based on users.json
    const activities: Activity[] = [
      {
        id: '1',
        user: 'User 8349475987',
        action: 'Rentó número',
        timestamp: 'Hace 2h',
        service: 'Google',
        amount: 8,
      },
      {
        id: '2',
        user: 'User 8349475987',
        action: 'Recibió código SMS',
        timestamp: 'Hace 2h',
        service: 'Google',
      },
      {
        id: '3',
        user: 'User 8349475987',
        action: 'Rentó número',
        timestamp: 'Hace 5h',
        service: 'Uber',
        amount: 10,
      },
    ].slice(0, limit)

    return NextResponse.json(
      successResponse(activities, 'Activities retrieved successfully')
    )
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
