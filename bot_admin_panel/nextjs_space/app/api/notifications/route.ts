import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validar datos
function validateNotification(data: any) {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== 'string') {
    errors.push('Título es requerido y debe ser texto');
  } else if (data.title.trim().length === 0) {
    errors.push('Título no puede estar vacío');
  } else if (data.title.length > 255) {
    errors.push('Título no puede exceder 255 caracteres');
  }

  if (!data.message || typeof data.message !== 'string') {
    errors.push('Mensaje es requerido y debe ser texto');
  } else if (data.message.trim().length === 0) {
    errors.push('Mensaje no puede estar vacío');
  } else if (data.message.length > 5000) {
    errors.push('Mensaje no puede exceder 5000 caracteres');
  }

  if (data.type && !['info', 'warning', 'success', 'error'].includes(data.type)) {
    errors.push('Tipo de notificación inválido');
  }

  if (data.recipient_type && !['all', 'admins', 'users'].includes(data.recipient_type)) {
    errors.push('Tipo de destinatario inválido');
  }

  return errors;
}

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
      { success: false, error: 'Error al cargar notificaciones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar
    const errors = validateNotification(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors[0], errors },
        { status: 400 }
      );
    }

    const { title, message, type = 'info', recipient_type = 'all', user_ids = null } = body;

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
      { success: false, error: 'Error al enviar notificación' },
      { status: 500 }
    );
  }
}