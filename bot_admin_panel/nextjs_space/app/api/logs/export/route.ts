import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('created_at', end.toISOString());
    }

    const { data, error } = await query.limit(10000);

    if (error) throw error;

    const logs = data || [];

    if (format === 'json') {
      return new NextResponse(JSON.stringify(logs, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="logs_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // CSV format (default)
    const headers = ['ID', 'User ID', 'Acción', 'Servicio', 'Estado', 'Fecha'];
    const rows = logs.map((log: any) => [
      log.id,
      log.user_id || 'N/A',
      log.action || 'N/A',
      log.service || 'N/A',
      log.status || 'N/A',
      new Date(log.created_at).toLocaleString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map((cell: any) => `"${cell}"`).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="logs_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting logs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al exportar logs' },
      { status: 500 }
    );
  }
}