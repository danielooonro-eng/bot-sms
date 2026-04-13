import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { successResponse } from '@/lib/api-utils'
import { DashboardMetrics } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '7d'

    // TODO: Fetch from Supabase based on period
    // For now, return mock data
    const metrics: DashboardMetrics = {
      total_users: 1,
      active_users_7d: 1,
      active_users_30d: 1,
      total_rented_numbers: 26,
      total_revenue: 216, // 26 rentals based on users.json
      growth_rate: 12.5,
    }

    return NextResponse.json(
      successResponse(metrics, 'Metrics retrieved successfully')
    )
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
