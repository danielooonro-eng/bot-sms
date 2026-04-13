import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, type = 'info', recipient_type = 'all', user_ids = null } = body;

    // Validaciones
    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Título y mensaje son requeridos' },
        { status: 400 }
      );
    }

    if (title.trim().length === 0 || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Título y mensaje no pueden estar vacíos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          title: title.trim(),
          message: message.trim(),
          type,
          recipient_type,
          user_ids,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        message: 'Notificación enviada correctamente',
        data: data?.[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al enviar notificación' },
      { status: 500 }
    );
  }
}