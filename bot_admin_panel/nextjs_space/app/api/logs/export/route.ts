import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'

    // TODO: Fetch logs from Supabase and export
    // For now, return mock data

    const mockLogs = [
      {
        id: '1',
        action: 'number_rented',
        user_id: '8349475987',
        admin_id: 'system',
        description: 'Usuario rentó número para Google (USA)',
        created_at: '2024-04-10T12:30:00Z',
      },
    ]

    if (format === 'json') {
      return new NextResponse(JSON.stringify(mockLogs, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="logs.json"',
        },
      })
    } else if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(mockLogs[0])
      const rows = mockLogs.map((log) =>
        headers.map((header) => {
          const value = (log as any)[header]
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value
        })
      )

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.join(','))
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="logs.csv"',
        },
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Error exporting logs:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
