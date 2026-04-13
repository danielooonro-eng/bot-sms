import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/auth'
import { successResponse, errorResponse, badRequest } from '@/lib/api-utils'

// Hardcoded admin credentials for now
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'danielooonro@gmail.com'
// For demo: password hash for "dansms@r"
// In production, store this securely in database
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$YourHashedPasswordHere'

// For demo purposes, we'll accept the plaintext password
const DEMO_PASSWORD = 'dansms@r'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(badRequest('Email and password required'), { status: 400 })
    }

    // Validate credentials
    if (email !== ADMIN_EMAIL) {
      return NextResponse.json(errorResponse('Invalid credentials'), { status: 401 })
    }

    // For demo: simple password check
    if (password !== DEMO_PASSWORD) {
      return NextResponse.json(errorResponse('Invalid credentials'), { status: 401 })
    }

    // Create session token
    const token = createSession(email)

    // Create response
    const response = NextResponse.json(
      successResponse({ email, token }, 'Login successful'),
      { status: 200 }
    )

    // Set secure cookie
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
