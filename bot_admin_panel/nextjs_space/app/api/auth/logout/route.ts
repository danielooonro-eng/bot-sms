import { NextRequest, NextResponse } from 'next/server'
import { successResponse } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      successResponse(null, 'Logout successful'),
      { status: 200 }
    )

    response.cookies.delete('session')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
