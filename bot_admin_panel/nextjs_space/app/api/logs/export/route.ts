import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Validate Supabase config
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase no está configurado correctamente');
    }

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

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    const logs = data || [];

    if (logs.length === 0) {
      console.warn('No logs found for export');
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(logs, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="logs_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // CSV format (default)
    const headers = ['ID', 'User ID', 'Acción', 'Servicio', 'Estado', 'Fecha'];
    const rows = logs.map((log: any) => [
      log.id || '',
      log.user_id || 'N/A',
      log.action || 'N/A',
      log.service || 'N/A',
      log.status || 'N/A',
      log.created_at ? new Date(log.created_at).toLocaleString('es-MX') : 'N/A',
    ]);

    const csv = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map((cell: any) => {
        // Escape quotes in cell content
        const escaped = String(cell).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="logs_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting logs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al exportar logs',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}