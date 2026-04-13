import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params
    const body = await request.json()
    const { blocked } = body

    if (typeof blocked !== 'boolean') {
      return NextResponse.json(
        errorResponse('Invalid blocked value'),
        { status: 400 }
      )
    }

    // TODO: Update user in Supabase
    // For now, just return success

    return NextResponse.json(
      successResponse(
        { userId, blocked },
        `User ${blocked ? 'blocked' : 'unblocked'} successfully`
      )
    )
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
