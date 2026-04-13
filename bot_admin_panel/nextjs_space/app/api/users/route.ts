import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validar usuario
function validateUser(data: any) {
  const errors: string[] = [];

  if (!data.user_id) {
    errors.push('User ID es requerido');
  } else if (!Number.isInteger(Number(data.user_id))) {
    errors.push('User ID debe ser un número');
  } else if (Number(data.user_id) < 1) {
    errors.push('User ID debe ser un número positivo');
  }

  if (data.credits !== undefined) {
    if (!Number.isInteger(Number(data.credits))) {
      errors.push('Créditos debe ser un número entero');
    }
  }

  if (data.service && typeof data.service !== 'string') {
    errors.push('Servicio debe ser texto');
  }

  return errors;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`user_id.ilike.%${search}%,service.ilike.%${search}%`);
    }

    const { data, error } = await query.limit(limit);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar usuarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar
    const errors = validateUser(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors[0], errors },
        { status: 400 }
      );
    }

    const { user_id, credits = 0, service = null } = body;

    // Verificar si usuario ya existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', Number(user_id))
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: `Usuario con ID ${user_id} ya existe` },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          user_id: Number(user_id),
          credits: Number(credits),
          service,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        message: 'Usuario creado correctamente',
        data: data?.[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}