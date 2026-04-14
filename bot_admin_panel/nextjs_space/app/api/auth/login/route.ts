import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/auth'
import { successResponse, errorResponse, badRequest } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        badRequest('Email and password required'),
        { status: 400 }
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

    // Query admins table for user with matching email
    const { data: adminData, error: queryError } = await supabase
      .from('admins')
      .select('id, email, name, password_hash, role')
      .eq('email', email.toLowerCase())
      .single()

    if (queryError || !adminData) {
      console.log('Admin not found:', email)
      return NextResponse.json(
        errorResponse('Admin no encontrado'),
        { status: 401 }
      )
    }

    // Compare password using bcryptjs
    const passwordMatch = await bcrypt.compare(password, adminData.password_hash)

    if (!passwordMatch) {
      console.log('Invalid password for admin:', email)
      return NextResponse.json(
        errorResponse('Contraseña incorrecta'),
        { status: 401 }
      )
    }

    // Create session token with user info
    const token = createSession(adminData.email)

    // Create response with success
    const response = NextResponse.json(
      successResponse(
        {
          email: adminData.email,
          name: adminData.name,
          role: adminData.role,
          id: adminData.id
        },
        'Login successful'
      ),
      { status: 200 }
    )

    // Set secure httpOnly cookie
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    )
  }
}
