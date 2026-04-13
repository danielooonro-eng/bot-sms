import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/auth'
import { badRequest, errorResponse, successResponse } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { newPassword } = body

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        badRequest('Password must be at least 8 characters'),
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // TODO: Update password in database
    // For demo, just return success

    return NextResponse.json(
      successResponse({ updated: true }, 'Password updated successfully')
    )
  } catch (error) {
    console.error('Error updating password:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
