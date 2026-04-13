import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id, email, name, role, created_at, updated_at')
      .eq('id', parseInt(params.id))
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Administrador no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching admin:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar administrador' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const adminId = parseInt(params.id);

    // Prevent changing owner role
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('role')
      .eq('id', adminId)
      .single();

    if (existingAdmin?.role === 'owner') {
      return NextResponse.json(
        { success: false, error: 'No se puede modificar el Owner' },
        { status: 403 }
      );
    }

    const updateData: any = {};

    if (body.name) updateData.name = body.name.trim();
    if (body.role && ['admin', 'helper'].includes(body.role)) updateData.role = body.role;
    if (body.password) {
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(body.password, saltRounds);
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('admins')
      .update(updateData)
      .eq('id', adminId)
      .select('id, email, name, role, created_at, updated_at');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Administrador actualizado correctamente',
      data: data?.[0],
    });
  } catch (error: any) {
    console.error('Error updating admin:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar administrador' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminId = parseInt(params.id);

    // Prevent deleting owner
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('role')
      .eq('id', adminId)
      .single();

    if (existingAdmin?.role === 'owner') {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar el Owner' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', adminId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Administrador eliminado correctamente',
    });
  } catch (error: any) {
    console.error('Error deleting admin:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar administrador' },
      { status: 500 }
    );
  }
}
