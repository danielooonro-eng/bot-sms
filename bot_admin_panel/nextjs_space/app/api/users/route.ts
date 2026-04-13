import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { successResponse } from '@/lib/api-utils'
import { BotUser } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'

    // TODO: Fetch from Supabase
    // For now, return mock data
    const users: BotUser[] = [
      {
        id: '1',
        telegram_id: 8349475987,
        first_name: 'Usuario',
        credits: 46,
        blocked: false,
        created_at: new Date('2024-01-15'),
        last_activity: new Date('2024-04-10'),
        rented_numbers: Array(26).fill(null).map((_, i) => ({
          id: `rent-${i}`,
          user_id: '1',
          phone_number: '+1234567890',
          service: 'google',
          country: 'usa',
          price: 8,
          rented_at: new Date(),
          is_active: false,
        })),
        transactions: [],
      },
    ]

    // Filter by status
    const filtered = status === 'all' 
      ? users
      : status === 'active'
        ? users.filter(u => !u.blocked)
        : users.filter(u => u.blocked)

    return NextResponse.json(
      successResponse(filtered, 'Users retrieved successfully')
    )
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
