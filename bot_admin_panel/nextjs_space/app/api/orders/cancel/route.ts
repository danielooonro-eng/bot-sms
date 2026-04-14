import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const fivesimApi = process.env.FIVESIM_API

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json(
        { success: false, error: 'Server misconfigured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch user and their active order
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, credits, service, order_id')
      .eq('user_id', user_id.toString())
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (!userData.order_id) {
      return NextResponse.json(
        { success: false, error: 'No active order for this user' },
        { status: 400 }
      )
    }

    const orderId = userData.order_id
    const service = userData.service

    // Try to cancel the order in 5sim API
    let cancelledIn5sim = false
    if (fivesimApi) {
      try {
        await axios.get(`https://5sim.net/v1/user/cancel/${orderId}`, {
          headers: { Authorization: `Bearer ${fivesimApi}` }
        })
        cancelledIn5sim = true
        console.log(`✅ Order ${orderId} cancelled in 5sim for user ${user_id}`)
      } catch (err: any) {
        console.error(`❌ Failed to cancel order ${orderId} in 5sim:`, err.message)
        // Continue anyway to clean up database
      }
    }

    // Refund the credit to the user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        credits: userData.credits + 1,
        order_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user_id.toString())

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      )
    }

    // Add log entry
    const adminEmail = session?.email || 'admin'
    const { error: logError } = await supabase
      .from('logs')
      .insert({
        user_id: user_id.toString(),
        action: 'order_cancelled_by_admin',
        service: service,
        status: 'success',
        metadata: {
          order_id: orderId,
          cancelled_by: adminEmail,
          cancelled_in_5sim: cancelledIn5sim,
        },
        admin_id: session?.id || null,
      })

    if (logError) {
      console.error('Error adding log:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Order cancelled successfully',
        data: {
          user_id,
          order_id: orderId,
          credited_back: 1,
          cancelled_in_5sim: cancelledIn5sim,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in POST /api/orders/cancel:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
