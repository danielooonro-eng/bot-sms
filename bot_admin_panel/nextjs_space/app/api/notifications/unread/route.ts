import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('sent', false);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: count || 0,
    });
  } catch (error: any) {
    console.error('Error fetching unread notifications count:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar notificaciones', count: 0 },
      { status: 500 }
    );
  }
}
