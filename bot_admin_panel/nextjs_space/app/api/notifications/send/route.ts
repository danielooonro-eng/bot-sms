import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { successResponse, badRequest } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipient_id, title, message, send_to_all } = body

    if (!message || !message.trim()) {
      return NextResponse.json(badRequest('Message is required'), { status: 400 })
    }

    if (!send_to_all && !recipient_id) {
      return NextResponse.json(
        badRequest('Provide recipient_id or set send_to_all to true'),
        { status: 400 }
      )
    }

    // TODO: Save notification to database and send via Telegram bot
    // For now, just return success

    return NextResponse.json(
      successResponse(
        {
          id: Math.random().toString(36).substr(2, 9),
          recipient_id,
          title,
          message,
          is_sent: true,
          created_at: new Date(),
        },
        'Notification sent successfully'
      )
    )
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
