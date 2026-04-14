import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json(
        { success: false, error: 'Server misconfigured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch users with active orders (order_id is not null)
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, credits, service, order_id, updated_at')
      .neq('order_id', null)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    // Map the data to include elapsed time
    const ordersWithTime = (users || []).map((user) => {
      const createdAt = new Date(user.updated_at)
      const now = new Date()
      const elapsedSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000)
      
      // Convert seconds to human-readable format
      let elapsedTime = ''
      if (elapsedSeconds < 60) {
        elapsedTime = `${elapsedSeconds}s`
      } else if (elapsedSeconds < 3600) {
        const minutes = Math.floor(elapsedSeconds / 60)
        elapsedTime = `${minutes}m`
      } else {
        const hours = Math.floor(elapsedSeconds / 3600)
        const minutes = Math.floor((elapsedSeconds % 3600) / 60)
        elapsedTime = `${hours}h ${minutes}m`
      }

      return {
        user_id: user.user_id,
        credits: user.credits,
        service: user.service || 'N/A',
        order_id: user.order_id,
        elapsed_time: elapsedTime,
        elapsed_seconds: elapsedSeconds,
        created_at: user.updated_at,
      }
    })

    return NextResponse.json(
      { success: true, data: ordersWithTime },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/orders:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
