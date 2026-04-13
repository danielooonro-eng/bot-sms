import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function validateAdmin(data: any) {
  const errors: string[] = [];

  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email es requerido y debe ser texto');
  } else if (!data.email.includes('@')) {
    errors.push('Email no es válido');
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push('Nombre es requerido y debe ser texto');
  } else if (data.name.trim().length === 0) {
    errors.push('Nombre no puede estar vacío');
  }

  if (data.password && typeof data.password !== 'string') {
    errors.push('Contraseña debe ser texto');
  } else if (data.password && data.password.length < 8) {
    errors.push('Contraseña debe tener al menos 8 caracteres');
  }

  if (!data.role || !['owner', 'admin', 'helper'].includes(data.role)) {
    errors.push('Rol debe ser owner, admin o helper');
  }

  return errors;
}

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id, email, name, role, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar administradores' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate
    const errors = validateAdmin(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors[0], errors },
        { status: 400 }
      );
    }

    const { email, name, password, role } = body;

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create admin
    const { data, error } = await supabase
      .from('admins')
      .insert([
        {
          email: email.toLowerCase(),
          name: name.trim(),
          password_hash: passwordHash,
          role,
          created_at: new Date().toISOString(),
        },
      ])
      .select('id, email, name, role, created_at, updated_at');

    if (error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { success: false, error: 'El email ya existe', errors: ['Email duplicado'] },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Administrador creado correctamente',
        data: data?.[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear administrador' },
      { status: 500 }
    );
  }
}
