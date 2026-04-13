/**
 * 🔄 Script de Migración: users.json → Supabase
 * Este script trasporta todos los datos de users.json a la tabla 'users' en Supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Validar variables de entorno
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

// Inicializar cliente de Supabase (usar service_role_key para migración)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Ruta del archivo users.json (puede estar en el mismo directorio o en uploads)
const dbPaths = [
  path.join(__dirname, 'users.json'),
  path.join(__dirname, 'Uploads', 'users.json'),
  '/home/ubuntu/Uploads/users.json'
];

let usersData = null;
let dbPath = null;

// Intentar cargar users.json
for (const p of dbPaths) {
  if (fs.existsSync(p)) {
    dbPath = p;
    const raw = fs.readFileSync(p, 'utf8');
    usersData = JSON.parse(raw);
    console.log(`✅ Archivo users.json encontrado en: ${p}`);
    break;
  }
}

if (!usersData) {
  console.error('❌ No se encontró users.json. Verifica la ruta.');
  process.exit(1);
}

// Convertir datos al formato esperado por Supabase
const usersToInsert = Object.entries(usersData).map(([userId, userData]) => ({
  user_id: parseInt(userId),
  credits: userData.credits || 0,
  order_id: userData.orderId || null,
  service: userData.service || null,
  history: userData.history || [],
  message_id: userData.messageId || null,
  has_photo: userData.hasPhoto || false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}));

const migrate = async () => {
  try {
    console.log(`\n📊 Iniciando migración de ${usersToInsert.length} usuario(s)...\n`);

    // Verificar si la tabla existe
    const { data: tableCheck, error: checkError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (checkError) {
      console.error('❌ Error: No se puede acceder a la tabla "users". ¿Existe?');
      console.error('Detalles:', checkError.message);
      process.exit(1);
    }

    // Limpiar datos existentes (opcional - comentar si quieres preservar datos)
    // console.log('🗑️  Limpiando datos existentes...');
    // const { error: deleteError } = await supabase.from('users').delete().neq('user_id', -1);
    // if (deleteError) console.warn('⚠️  Advertencia al limpiar:', deleteError.message);

    // Insertar datos
    const { data, error } = await supabase
      .from('users')
      .upsert(usersToInsert, { onConflict: 'user_id' });

    if (error) {
      console.error('❌ Error durante la migración:');
      console.error('Código:', error.code);
      console.error('Mensaje:', error.message);
      console.error('Detalles:', error.details);
      process.exit(1);
    }

    console.log(`✅ Migración completada exitosamente!`);
    console.log(`📝 ${usersToInsert.length} usuario(s) insertado(s)/actualizado(s)\n`);

    // Verificar datos insertados
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('*');

    if (!verifyError && verifyData) {
      console.log(`📋 Usuarios en Supabase: ${verifyData.length}`);
      console.log('\n📌 Primeros registros:');
      verifyData.slice(0, 2).forEach(user => {
        console.log(`   - ID: ${user.user_id}, Créditos: ${user.credits}, Historia: ${user.history.length} eventos`);
      });
    }

    console.log('\n✨ La migración está lista. Puedes ejecutar: npm start');
  } catch (err) {
    console.error('❌ Error inesperado:', err.message);
    process.exit(1);
  }
};

migrate();
