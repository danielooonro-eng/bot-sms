import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookies
    const token = request.cookies.get('session')?.value

    if (!token) {
      return NextResponse.json(
        errorResponse('No session found'),
        { status: 401 }
      )
    }

    // Verify and decode JWT
    const session = verifySession(token)

    if (!session) {
      return NextResponse.json(
        errorResponse('Invalid or expired session'),
        { status: 401 }
      )
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      console.error('Missing Supabase credentials')
      return NextResponse.json(
        errorResponse('Internal server error'),
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Query admins table to get full user info
    const { data: adminData, error: queryError } = await supabase
      .from('admins')
      .select('id, email, name, role')
      .eq('email', session.email)
      .single()

    if (queryError || !adminData) {
      console.log('Admin not found for email:', session.email)
      return NextResponse.json(
        errorResponse('User not found'),
        { status: 404 }
      )
    }

    // Return user info
    return NextResponse.json(
      successResponse({
        email: adminData.email,
        name: adminData.name,
        role: adminData.role,
        id: adminData.id
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    )
  }
}
