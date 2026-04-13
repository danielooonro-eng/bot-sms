import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Intenta obtener de la tabla logs (actividades)
    const { data, error, count } = await supabase
      .from('logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      count: count || 0,
      offset,
      limit,
    });
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    
    // Si no existe la tabla logs, retornar datos vacíos pero sin error
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      offset: 0,
      limit: 10,
    });
  }
}