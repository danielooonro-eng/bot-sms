// =====================================
// BOT TELEGRAM + 5SIM PRO FINAL (FIX PHONE + ADMIN) + NOTIFICACIONES
// =====================================

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

const API_KEY = process.env.FIVESIM_API;
const BASE_URL = 'https://5sim.net/v1/user';

// 🔥 TU ID FIJO
const ADMIN_ID = 8349475987;

// Ruta de la imagen de bienvenida (colócala junto al bot.js con el nombre welcome.png)
const WELCOME_IMAGE = path.join(__dirname, 'welcome.png');

// =============================
// INICIALIZACIÓN SUPABASE
// =============================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// =============================
// PERSISTENCIA EN SUPABASE + FALLBACK JSON
// =============================
const DB_PATH = path.join(__dirname, 'users.json');

// ⚠️ CRÍTICO: Carga SOLO desde JSON como fallback (NUNCA para reemplazar Supabase)
function loadUsersFromJSON() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const obj = JSON.parse(raw);
      console.log('📄 Usuarios cargados desde JSON (FALLBACK)');
      return new Map(Object.entries(obj).map(([k, v]) => [parseInt(k), v]));
    }
  } catch (err) {
    console.error('Error cargando users.json:', err.message);
  }
  return new Map();
}

function saveUsers() {
  try {
    const obj = {};
    for (const [k, v] of users.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(obj, null, 2), 'utf8');
  } catch (err) {
    console.error('Error guardando users.json:', err.message);
  }
}

// 🔥 NUEVO: Cargar usuarios DESDE SUPABASE (fuente primaria)
async function loadUsersFromSupabase() {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase no está configurado, usando fallback JSON');
      return loadUsersFromJSON();
    }

    console.log('🔄 Cargando usuarios desde Supabase...');
    
    const { data, error } = await supabase
      .from('users')
      .select('user_id, credits, order_id, service, has_photo');

    if (error) {
      console.error('❌ Error cargando usuarios de Supabase:', error.message);
      console.log('📄 Usando fallback JSON');
      return loadUsersFromJSON();
    }

    if (!data || data.length === 0) {
      console.log('📭 No hay usuarios en Supabase aún');
      return new Map();
    }

    // Convertir datos de Supabase al formato local
    const usersMap = new Map();
    for (const row of data) {
      usersMap.set(row.user_id, {
        credits: row.credits || 0,
        orderId: row.order_id || null,
        history: [], // La historia se guarda en logs, no en users
        service: row.service || null,
        hasPhoto: row.has_photo || false,
        messageId: null // Esto es temporal, no se guarda
      });
    }

    console.log(`✅ Cargados ${usersMap.size} usuarios desde Supabase`);
    return usersMap;

  } catch (err) {
    console.error('❌ Exception cargando usuarios de Supabase:', err.message);
    console.log('📄 Usando fallback JSON');
    return loadUsersFromJSON();
  }
}

// Async functions para Supabase (se ejecutan en background sin bloquear)
async function syncUserToSupabase(userId, userData) {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase no está configurado, usando solo JSON');
      return false;
    }

    const { data, error } = await supabase
      .from('users')
      .upsert({
        user_id: userId,
        credits: userData.credits || 0,
        order_id: userData.orderId || null,
        service: userData.service || null,
        has_photo: userData.hasPhoto || false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select();

    if (error) {
      console.error(`❌ Error sincronizando usuario ${userId}:`, error.message);
      return false;
    }
    
    console.log(`✅ Usuario ${userId} sincronizado a Supabase`);
    return true;
  } catch (err) {
    console.error(`❌ Exception sincronizando usuario ${userId}:`, err.message);
    return false;
  }
}

async function addLogEntry(userId, action, service = null, status = 'success') {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return false;
    }

    const { error } = await supabase
      .from('logs')
      .insert({
        user_id: userId,
        action,
        service,
        status,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error(`❌ Error agregando log:`, error.message);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error(`❌ Exception agregando log:`, err.message);
    return false;
  }
}

// Variable global para almacenar usuarios
let users = new Map();

// Función para limpiar órdenes activas al arrancar
// ⚠️ CRÍTICO: SOLO cancela órdenes pendientes en 5sim, NO sincroniza desde JSON
async function cancelPendingOrders() {
  let cancelled = 0;
  console.log('🔍 Revisando órdenes pendientes...');
  
  for (const [id, user] of users.entries()) {
    if (user.orderId) {
      try {
        console.log(`⏳ Cancelando orden ${user.orderId} del usuario ${id}...`);
        await axios.get(`${BASE_URL}/cancel/${user.orderId}`, {
          headers: { Authorization: `Bearer ${process.env.FIVESIM_API}` }
        });
        user.credits++;
        user.history = user.history || [];
        user.history.push('+1 crédito (cancelado al reiniciar bot)');
        console.log(`✅ Orden ${user.orderId} cancelada, crédito devuelto a usuario ${id}`);
        cancelled++;
        
        // Sincronizar en background sin await
        syncUserToSupabase(id, user).catch(err => {
          console.error(`Error en sync:`, err.message);
        });
      } catch {
        console.log(`⚠️ No se pudo cancelar orden ${user.orderId} del usuario ${id} en 5sim`);
      }
      user.orderId = null;
      user.messageId = null;
    }
  }
  if (cancelled > 0) saveUsers();
  console.log(`✅ Revisión de órdenes completada: ${cancelled} canceladas`);
}

// 🔥 INICIO ASINCRÓNICO - CARGA DESDE SUPABASE PRIMERO
async function initializeBot() {
  console.log('🚀 Inicializando bot...');
  
  // Cargar usuarios DESDE SUPABASE (fuente primaria)
  users = await loadUsersFromSupabase();
  
  // Cancelar órdenes pendientes (no sincroniza datos, solo limpia 5sim)
  await cancelPendingOrders();
  
  console.log('✅ Bot inicializado correctamente');
  console.log(`📊 ${users.size} usuarios en memoria`);
}

// Ejecutar inicialización
initializeBot().catch(err => {
  console.error('❌ Error fatal inicializando bot:', err.message);
  process.exit(1);
});

function getUser(id) {
  if (!users.has(id)) {
    users.set(id, {
      credits: 0,
      orderId: null,
      history: [],
      service: null,
      hasPhoto: false
    });
    saveUsers();
    
    // Sincronizar en background sin bloquear
    syncUserToSupabase(id, users.get(id)).catch(err => {
      console.error(`Error en sync inicial:`, err.message);
    });
  }
  return users.get(id);
}

// Función helper para actualizar después de sincroniación
function updateAndSyncUser(id, callback) {
  const user = getUser(id);
  callback(user);
  saveUsers();
  
  // Sincronizar en background
  syncUserToSupabase(id, user).catch(err => {
    console.error(`Error sincronizando ${id}:`, err.message);
  });
  
  return user;
}

const SERVICES = {
  amazon:    { emoji: '🛒', countries: ['usa'] },
  telegram:  { emoji: '✈️', countries: ['usa'] },
  whatsapp:  { emoji: '💬', countries: ['canada', 'indonesia'] },
  google:    { emoji: '🔍', countries: ['mexico', 'usa', 'indonesia'] },
  aliexpress:{ emoji: '🛍️', countries: ['mexico', 'usa', 'canada'] },
  shein:     { emoji: '👗', countries: ['england', 'usa'] },
  uber:      { emoji: '🚗', countries: ['mexico', 'usa'] }
};

const PRICES = {
  amazon:    { usa: 8 },
  telegram:  { usa: 15 },
  whatsapp:  { canada: 12, indonesia: 10 },
  google:    { mexico: 8, usa: 10, indonesia: 6 },
  aliexpress:{ mexico: 10, usa: 8, canada: 8 },
  shein:     { england: 10, usa: 8 },
  uber:      { mexico: 10, usa: 8 }
};

const COUNTRY_FLAGS = {
  usa:       '🇺🇸 USA',
  mexico:    '🇲🇽 México',
  canada:    '🇨🇦 Canadá',
  indonesia: '🇮🇩 Indonesia',
  england:   '🇬🇧 England'
};

// Operadores específicos por servicio y país (el resto usa 'any')
const OPERATORS = {
  telegram:  { usa: 'virtual63' },
  aliexpress:{ usa: 'virtual51' },
  shein:     { england: 'virtual60', usa: 'virtual8' },
  uber:      { usa: 'virtual63' }
};

// =============================
// FUNCIONES DE NOTIFICACIONES (NUEVO)
// =============================

/**
 * Obtiene todas las notificaciones no enviadas (sent=false)
 */
async function getUnsentNotifications() {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('sent', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error obteniendo notificaciones:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error en getUnsentNotifications:', err);
    return [];
  }
}

/**
 * Obtiene todos los usuarios de Supabase (tabla users)
 * Retorna array de user_id para enviar notificaciones
 */
async function getAllUsers() {
  try {
    console.log('🔍 Obteniendo usuarios de Supabase...');
    
    const { data, error } = await supabase
      .from('users')
      .select('user_id');

    if (error) {
      console.error('❌ Error obteniendo usuarios de Supabase:', error.message);
      console.error('   Detalles:', JSON.stringify(error, null, 2));
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No hay usuarios en la tabla users de Supabase');
      return [];
    }

    // Extraer user_id de cada registro y convertir a número
    const userIds = data
      .map(record => record.user_id)
      .filter(id => id !== null && id !== undefined)
      .map(id => parseInt(id) || id);

    console.log(`✅ Se obtuvieron ${userIds.length} usuarios de Supabase`);
    return userIds;

  } catch (err) {
    console.error('❌ Excepción en getAllUsers:');
    console.error('   Mensaje:', err.message || 'N/A');
    console.error('   Stack:', err.stack || 'N/A');
    return [];
  }
}

/**
 * Marca una notificación como enviada
 * MEJORADA: Logging detallado de errores y validación de actualización
 */
async function markNotificationAsSent(notificationId) {
  try {
    // Validar parámetro
    if (!notificationId) {
      console.error('❌ markNotificationAsSent: notificationId no proporcionado');
      return false;
    }

    console.log(`📍 Intentando marcar notificación ${notificationId} como enviada...`);

    const { data, error, status, statusText } = await supabase
      .from('notifications')
      .update({
        sent: true,
        sent_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    // Si hay error, loguear COMPLETAMENTE para debugging
    if (error) {
      console.error(`❌ Error en UPDATE para notificación ${notificationId}:`);
      console.error('   Código:', error.code || 'N/A');
      console.error('   Mensaje:', error.message || 'N/A');
      console.error('   Detalles:', JSON.stringify(error, null, 2));
      console.error(`   Status HTTP: ${status || 'N/A'} - ${statusText || 'N/A'}`);
      
      // Posibles causas:
      if (error.message?.includes('row level security')) {
        console.error('   ⚠️ POSIBLE CAUSA: Row Level Security (RLS) habilitado');
        console.error('   Solución: Revisa las políticas RLS en Supabase');
      }
      if (error.message?.includes('permission')) {
        console.error('   ⚠️ POSIBLE CAUSA: Permisos insuficientes con ANON_KEY');
        console.error('   Solución: Configura RLS correctamente para permitir UPDATE');
      }
      
      return false;
    }

    // Verificar que el UPDATE realmente cambió algo
    if (!data || data.length === 0) {
      console.warn(`⚠️ UPDATE ejecutado pero no cambió registros (notificationId: ${notificationId})`);
      console.warn('   Posible causa: El ID no existe o ya estaba marcado como enviado');
      return false;
    }

    console.log(`✅ Notificación ${notificationId} marcada como enviada exitosamente`);
    console.log(`   Datos actualizados:`, JSON.stringify(data[0], null, 2));
    
    return true;

  } catch (err) {
    console.error(`❌ Excepción en markNotificationAsSent para ID ${notificationId}:`);
    console.error('   Error:', err.message || 'N/A');
    console.error('   Stack:', err.stack || 'N/A');
    console.error('   Objeto completo:', JSON.stringify(err, null, 2));
    return false;
  }
}

/**
 * Envía una notificación a un usuario específico
 */
async function sendNotificationToUser(userId, notification) {
  try {
    let caption = `📬 *Notificación*\n━━━━━━━━━━━━\n`;

    if (notification.title) {
      caption += `*${notification.title}*\n`;
    }

    if (notification.message) {
      caption += `${notification.message}`;
    }

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏠 Ir al inicio', callback_data: 'start' }]
        ]
      },
      parse_mode: 'Markdown'
    };

    // Intentar enviar el mensaje
    await bot.sendMessage(userId, caption, keyboard);
    console.log(`✅ Notificación enviada al usuario ${userId}`);
    return true;
  } catch (err) {
    console.error(`❌ Error enviando notificación al usuario ${userId}:`, err.message);
    return false;
  }
}

/**
 * Procesa todas las notificaciones pendientes
 * MEJORADA: Mejor logging y manejo de errores
 */
async function processNotifications() {
  try {
    const notifications = await getUnsentNotifications();

    if (notifications.length === 0) {
      return;
    }

    console.log(`\n📨 ════════════════════════════════════════`);
    console.log(`📨 Procesando ${notifications.length} notificación(es) pendiente(s)...`);
    console.log(`📨 ════════════════════════════════════════\n`);

    for (const notification of notifications) {
      console.log(`\n📬 Notificación ID: ${notification.id}`);
      console.log(`   Tipo: ${notification.recipient_type}`);
      console.log(`   Título: ${notification.title || '(sin título)'}`);
      console.log(`   Creada: ${notification.created_at}`);
      
      let recipientIds = [];

      // Determinar a quién enviar según recipient_type
      if (notification.recipient_type === 'all') {
        // Enviar a todos los usuarios de Supabase
        recipientIds = await getAllUsers();
        console.log(`   Enviando a: TODOS LOS USUARIOS (${recipientIds.length} usuarios)`);
      } else if (notification.recipient_type === 'admin') {
        // Enviar solo al admin
        recipientIds = [ADMIN_ID];
        console.log(`   Enviando a: ADMIN (${ADMIN_ID})`);
      } else if (notification.recipient_type === 'specific' && notification.user_ids) {
        // Enviar a usuarios específicos (si user_ids es un array o string)
        if (Array.isArray(notification.user_ids)) {
          recipientIds = notification.user_ids;
        } else if (typeof notification.user_ids === 'string') {
          try {
            recipientIds = JSON.parse(notification.user_ids);
            if (!Array.isArray(recipientIds)) {
              recipientIds = [recipientIds];
            }
          } catch {
            // Si no es JSON válido, intentar parsearlo como ID único
            recipientIds = [parseInt(notification.user_ids)];
          }
        }
        console.log(`   Enviando a: USUARIOS ESPECÍFICOS (${recipientIds.length} usuarios)`);
      }

      // Enviar a cada recipiente
      let successCount = 0;
      let failCount = 0;
      
      for (const userId of recipientIds) {
        const sent = await sendNotificationToUser(userId, notification);
        if (sent) {
          successCount++;
        } else {
          failCount++;
          console.warn(`      ⚠️ No se pudo enviar a usuario ${userId}`);
        }
      }

      console.log(`   Resultado envío: ✅ ${successCount} exitoso(s), ❌ ${failCount} fallido(s)`);

      // Marcar notificación como enviada
      console.log(`   Marcando como enviada en BD...`);
      const marked = await markNotificationAsSent(notification.id);
      if (!marked) {
        console.error(`   ❌ FALLO al marcar notificación ${notification.id} como enviada`);
        console.error(`      Revisar logs arriba para ver el error específico`);
      }
    }

    console.log(`\n📨 ════════════════════════════════════════`);
    console.log(`📨 Ciclo de procesamiento completado`);
    console.log(`📨 ════════════════════════════════════════\n`);

  } catch (err) {
    console.error('\n❌ Error fatal en processNotifications:');
    console.error('   Mensaje:', err.message || 'N/A');
    console.error('   Stack:', err.stack || 'N/A');
  }
}

// =============================
// START
// =============================
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = getUser(chatId);
  const firstName = msg.from.first_name || 'Usuario';

  const caption =
    `👋 ¡Hola, *${firstName}*! Bienvenido a *LittlePay* 🐣\n\n` +
    `💰 Créditos disponibles: *${user.credits}*\n\n` +
    `_Selecciona una opción para continuar:_`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📱  Comprar número', callback_data: 'buy' }],
        [{ text: '👤  Mi perfil',      callback_data: 'perfil' }]
      ]
    },
    parse_mode: 'Markdown'
  };

  if (fs.existsSync(WELCOME_IMAGE)) {
    bot.sendPhoto(chatId, WELCOME_IMAGE, { caption, ...keyboard });
  } else {
    bot.sendMessage(chatId, caption, keyboard);
  }
});

// =============================
// PERFIL
// =============================
function sendProfile(chatId) {
  const user = getUser(chatId);

  const historyText = user.history.length > 0
    ? user.history.slice(-5).map(h => `  ▸ ${h}`).join('\n')
    : '  _Sin movimientos aún_';

  const text =
    `👤 *Tu Perfil*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🆔 ID: \`${chatId}\`\n` +
    `💰 Créditos: *${user.credits}*\n` +
    `📦 Orden activa: ${user.orderId ? `\`${user.orderId}\`` : '_Ninguna_'}\n\n` +
    `📜 *Últimos movimientos:*\n${historyText}`;

  bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🏠  Inicio', callback_data: 'start' }]
      ]
    }
  });
}

bot.onText(/\/perfil/, (msg) => sendProfile(msg.chat.id));

// =============================
// ADMIN CREDITOS
// =============================
bot.onText(/\/addcredits (\d+) (\d+)/, (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return;

  const userId = parseInt(match[1]);
  const amount = parseInt(match[2]);

  updateAndSyncUser(userId, (user) => {
    user.credits += amount;
    user.history = user.history || [];
    user.history.push(`+${amount} créditos (admin)`);
  });
  
  // Agregar log
  addLogEntry(userId, 'credits_added', 'admin', 'success');

  bot.sendMessage(msg.chat.id, `✅ *${amount} créditos* agregados al usuario \`${userId}\``, { parse_mode: 'Markdown' });
  bot.sendMessage(userId, `🎉 Recibiste *${amount} créditos* en LittlePay 🐣`, { parse_mode: 'Markdown' });
});

// =============================
// HELPERS PARA EDITAR MENSAJES
// =============================

// Edita el mensaje actual (texto o caption si tiene foto)
async function editMsg(query, text, reply_markup) {
  const msg = query.message;
  const opts = { parse_mode: 'Markdown', reply_markup };

  try {
    if (msg.photo || msg.document) {
      await bot.editMessageCaption(text, {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        ...opts
      });
    } else {
      await bot.editMessageText(text, {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        ...opts
      });
    }
  } catch (e) {
    // Mensaje borrado o no encontrado — ignorar
  }
}

// =============================
// BOTONES
// =============================
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const user = getUser(chatId);

  bot.answerCallbackQuery(query.id);

  // ── INICIO ──
  if (data === 'start') {
    const firstName = query.from.first_name || 'Usuario';
    const text =
      `👋 ¡Hola, *${firstName}*! Bienvenido a *LittlePay* 🐣\n\n` +
      `💰 Créditos disponibles: *${user.credits}*\n\n` +
      `_Selecciona una opción para continuar:_`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📱  Comprar número', callback_data: 'buy' }],
        [{ text: '👤  Mi perfil',      callback_data: 'perfil' }]
      ]
    };

    return editMsg(query, text, keyboard);
  }

  // ── PERFIL ──
  if (data === 'perfil') {
    const historyText = user.history.length > 0
      ? user.history.slice(-5).map(h => `  ▸ ${h}`).join('\n')
      : '  _Sin movimientos aún_';

    const text =
      `👤 *Tu Perfil*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🆔 ID: \`${chatId}\`\n` +
      `💰 Créditos: *${user.credits}*\n` +
      `📦 Orden activa: ${user.orderId ? `\`${user.orderId}\`` : '_Ninguna_'}\n\n` +
      `📜 *Últimos movimientos:*\n${historyText}`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🏠  Inicio', callback_data: 'start' }]
      ]
    };

    return editMsg(query, text, keyboard);
  }

  // ── COMPRAR ──
  if (data === 'buy') {
    if (user.credits <= 0) {
      return editMsg(query,
        `❌ *Sin créditos*\n\nContacta al administrador para recargar tu cuenta.`,
        { inline_keyboard: [[{ text: '🏠  Inicio', callback_data: 'start' }]] }
      );
    }

    const serviceButtons = Object.entries(SERVICES).map(([key, val]) => ([
      { text: `${val.emoji}  ${key.charAt(0).toUpperCase() + key.slice(1)}`, callback_data: `service_${key}` }
    ]));
    // Agrupar botones de 2 en 2 para mejor visual
    const groupedServiceButtons = [];
    for (let i = 0; i < serviceButtons.length; i += 2) {
      groupedServiceButtons.push([...serviceButtons[i], ...(serviceButtons[i+1] || [])]);
    }

    return editMsg(query,
      `🛍️ *Selecciona el servicio*\n\n_¿Para qué plataforma necesitas el número?_`,
      {
        inline_keyboard: [
          ...groupedServiceButtons,
          [{ text: '🔙  Volver', callback_data: 'start' }]
        ]
      }
    );
  }

  // ── SELECCIÓN DE SERVICIO ──
  if (data.startsWith('service_')) {
    const service = data.split('_')[1];
    user.service = service;
    saveUsers();

    const { emoji, countries } = SERVICES[service];
    const servicePrices = PRICES[service] || {};
    const countryButtons = countries.map(c => ([
      { text: `${COUNTRY_FLAGS[c] || c.toUpperCase()} — $${servicePrices[c] || '?'}`, callback_data: `country_${c}` }
    ]));

    return editMsg(query,
      `${emoji} *${service.charAt(0).toUpperCase() + service.slice(1)}*\n\n🌍 _Selecciona el país del número:_`,
      {
        inline_keyboard: [
          ...countryButtons,
          [{ text: '🔙  Volver', callback_data: 'buy' }]
        ]
      }
    );
  }

  // ── COMPRA DE NÚMERO ──
  if (data.startsWith('country_')) {
    const country = data.split('_')[1];

    // Bloquear si ya hay una orden en proceso
    if (user.orderId) {
      return editMsg(query,
        `⚠️ *Ya tienes una orden en proceso*\n\nEspera a recibir el código o cancela la orden actual antes de comprar otro número.`,
        { inline_keyboard: [[{ text: '🏠  Inicio', callback_data: 'start' }]] }
      );
    }

     try {
       // 🔥 DEBUG: Validar que API_KEY existe
       if (!API_KEY) {
         console.error('❌ ERROR CRÍTICO: API_KEY (FIVESIM_API) no está configurada en .env');
         return editMsg(query,
           `❌ *Error de configuración*\n\nLa API de 5sim no está configurada. Contacta al administrador.`,
           { inline_keyboard: [[{ text: '🏠  Inicio', callback_data: 'start' }]] }
         );
       }

       const operator = (OPERATORS[user.service]?.[country]) || 'any';
       const url = `${BASE_URL}/buy/activation/${country}/${operator}/${user.service}`;
       
       // 🔥 DEBUG: Loguear parámetros antes de hacer la solicitud
       console.log(`\n🛒 ━━━ COMPRANDO NÚMERO ━━━`);
       console.log(`   Service: ${user.service}`);
       console.log(`   Country: ${country}`);
       console.log(`   Operator: ${operator}`);
       console.log(`   URL: ${url}`);
       console.log(`   API Key present: ${API_KEY ? '✅ SÍ' : '❌ NO'}`);

       const res = await axios.get(url, {
         headers: { Authorization: `Bearer ${API_KEY}` }
       });

       // 🔥 DEBUG: Loguear respuesta exitosa
       console.log(`✅ Respuesta 5sim exitosa:`, JSON.stringify(res.data, null, 2));

       const order = res.data;
       const phone = order.phone || order.number || null;

       if (!phone) {
         console.warn(`⚠️ Sin teléfono en respuesta de 5sim: ${JSON.stringify(order)}`);
         return editMsg(query,
           `❌ No hay números disponibles para *${COUNTRY_FLAGS[country] || country}* en este momento.`,
           { inline_keyboard: [[{ text: '🔙  Volver', callback_data: 'buy' }]] }
         );
       }

       const price = (PRICES[user.service] || {})[country] || '?';
       user.orderId = order.id;
       user.messageId = query.message.message_id;
       user.hasPhoto = !!(query.message.photo || query.message.document);
       user.credits--;
       user.history = user.history || [];
       user.history.push(`-1 crédito | ${user.service} (${country}) $${price}`);
       saveUsers();
       
       // Sincronizar con Supabase en background
       syncUserToSupabase(chatId, user).catch(err => {
         console.error('Error sincronizando compra:', err.message);
       });
       addLogEntry(chatId, 'number_rented', user.service, 'success');

       await editMsg(query,
         `✅ *Número asignado*\n` +
         `━━━━━━━━━━━━━━━━━━\n` +
         `📱 Número: \`${phone}\`\n` +
         `🌍 País: ${COUNTRY_FLAGS[country] || country}\n` +
         `💵 Precio: *$${price}*\n` +
         `💰 Créditos restantes: *${user.credits}*\n\n` +
         `⏳ _Esperando el código SMS..._`,
         {
           inline_keyboard: [
             [{ text: '❌  Cancelar y devolver crédito', callback_data: 'cancel' }]
           ]
         }
       );

       waitForSMS(chatId, order.id);

     } catch (err) {
       // 🔥 DEBUG: Loguear error completo con detalles
       console.error(`\n❌ ━━━ ERROR AL COMPRAR NÚMERO ━━━`);
       console.error(`   Service: ${user.service}`);
       console.error(`   Country: ${country}`);
       console.error(`   Status HTTP: ${err.response?.status || err.code || 'N/A'}`);
       console.error(`   Mensaje error: ${err.response?.data?.message || err.message}`);
       console.error(`   Data completa:`, JSON.stringify(err.response?.data || err, null, 2));
       
       const errorMessage = err.response?.data?.message || err.message || 'Servicio no disponible';
       editMsg(query,
         `⚠️ *Error al obtener número*\n\n_${errorMessage}_`,
         { inline_keyboard: [[{ text: '🔙  Volver', callback_data: 'buy' }]] }
       );
     }
  }

  // ── CANCELAR ──
  if (data === 'cancel') {
    if (!user.orderId) return;

    try {
      await axios.get(`${BASE_URL}/cancel/${user.orderId}`, {
        headers: { Authorization: `Bearer ${API_KEY}` }
      });

      user.credits++;
      user.history = user.history || [];
      user.history.push('+1 crédito (cancelado)');
      user.orderId = null;
      saveUsers();
      
      // Sincronizar con Supabase
      syncUserToSupabase(chatId, user).catch(err => {
        console.error('Error sincronizando cancelación:', err.message);
      });
      addLogEntry(chatId, 'order_cancelled', null, 'success');

      editMsg(query,
        `🔄 *Orden cancelada*\n\nTu crédito ha sido devuelto. Créditos actuales: *${user.credits}*`,
        { inline_keyboard: [[{ text: '🏠  Inicio', callback_data: 'start' }]] }
      );
    } catch {
      editMsg(query,
        `⚠️ Error al cancelar la orden. Intenta de nuevo.`,
        { inline_keyboard: [[{ text: '🏠  Inicio', callback_data: 'start' }]] }
      );
    }
  }
});

// =============================
// EXTRAER CÓDIGO DEL TEXTO DEL SMS
// =============================
// Intenta sacar un código numérico del texto completo del SMS
function extractCode(text) {
  if (!text) return null;
  // Busca secuencias de 4-8 dígitos (cubre la mayoría de OTPs)
  const match = text.match(/\b(\d{4,8})\b/);
  return match ? match[1] : null;
}

// =============================
// ESPERAR SMS
// =============================
async function waitForSMS(chatId, orderId) {
  let attempts = 0;

  // Edita el mensaje guardado en user, ignorando errores si fue borrado
  async function editSmsMsg(text, keyboard) {
    const user = getUser(chatId);
    if (!user.messageId) {
      console.log(`[waitForSMS] No hay messageId para editar (chatId=${chatId})`);
      return false;
    }

    const opts = {
      chat_id: chatId,
      message_id: user.messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    };

    try {
      if (user.hasPhoto) {
        await bot.editMessageCaption(text, opts);
      } else {
        await bot.editMessageText(text, opts);
      }
      console.log(`[waitForSMS] Mensaje actualizado correctamente (chatId=${chatId}, messageId=${user.messageId})`);
      return true;
    } catch (e) {
      console.error(`[waitForSMS] Error al editar mensaje (chatId=${chatId}, messageId=${user.messageId}):`, e.message);
      return false;
    }
  }

  const interval = setInterval(async () => {
    const user = getUser(chatId);

    // Si la orden fue cancelada manualmente, detener
    if (!user.orderId) {
      clearInterval(interval);
      return;
    }

     try {
       // 🔥 DEBUG: Validar API_KEY antes de hacer solicitud
       if (!API_KEY) {
         console.error('❌ ERROR: API_KEY no configurada en waitForSMS');
         return;
       }

       const res = await axios.get(`${BASE_URL}/check/${orderId}`, {
         headers: { Authorization: `Bearer ${API_KEY}` }
       });

       const data = res.data;

       // 🔥 DEBUG: LOG detallado para depuración — ver qué devuelve 5sim
       console.log(`\n✅ [SMS Check] orderId=${orderId}`);
       console.log(`   Status: ${data.status}`);
       console.log(`   SMS recibido: ${data.sms && data.sms.length > 0 ? '✅ SÍ' : '⏳ ESPERANDO'}`);
       if (data.sms && data.sms.length > 0) {
         console.log(`   SMS data:`, JSON.stringify(data.sms[0], null, 2));
       }

        if (data.sms && data.sms.length > 0) {
          const sms = data.sms[0];
          // 5sim puede devolver el código en .code o dentro del texto en .text
          const code = sms.code || extractCode(sms.text) || sms.text || 'No detectado';
          console.log(`[SMS] Código extraído: ${code} | raw:`, sms);
          console.log(`[waitForSMS] Código detectado. Iniciando envío a Telegram (chatId=${chatId}, orderId=${orderId})`);

          clearInterval(interval);

          const successText =
            `🎉 *¡Código recibido!*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `🔐 Código: \`${code}\``;

          let notified = await editSmsMsg(
            successText,
            [[{ text: '🏠  Inicio', callback_data: 'start' }]]
          );

          if (!notified) {
            try {
              console.log(`[waitForSMS] Fallback a bot.sendMessage para chatId=${chatId}`);
              await bot.sendMessage(chatId, `✅ Código recibido: ${code}`, {
                reply_markup: { inline_keyboard: [[{ text: '🏠  Inicio', callback_data: 'start' }]] }
              });
              notified = true;
              console.log(`[waitForSMS] Código enviado con bot.sendMessage (chatId=${chatId})`);
            } catch (sendErr) {
              console.error(`[waitForSMS] Error enviando código con sendMessage (chatId=${chatId}):`, sendErr.message);
            }
          }

          user.history = user.history || [];
          user.history.push(`Código: ${code}`);
          user.orderId = null;
          user.messageId = null;
          saveUsers();

          // Sincronizar con Supabase
          syncUserToSupabase(chatId, user).catch(err => {
            console.error('Error sincronizando SMS:', err.message);
          });
          addLogEntry(chatId, 'sms_received', null, notified ? 'success' : 'error');

          return;
        }

        attempts++;

        // Timeout: 5 minutos (300 intentos x 1 seg)
        if (attempts >= 300) {
          clearInterval(interval);

          try {
            await axios.get(`${BASE_URL}/cancel/${orderId}`, {
              headers: { Authorization: `Bearer ${API_KEY}` }
            });
            user.credits++;
            user.history.push('+1 crédito (timeout 5min)');
            
            // Sincronizar cancelación por timeout con Supabase
            syncUserToSupabase(chatId, user).catch(err => {
              console.error('Error sincronizando timeout:', err.message);
            });
            addLogEntry(chatId, 'order_timeout_cancelled', user.service, 'success');
          } catch (err) { 
            console.error(`Error cancelando orden ${orderId} en 5sim:`, err.message);
            addLogEntry(chatId, 'order_timeout_cancel_failed', user.service, 'error');
          }

          user.orderId = null;
          user.messageId = null;
          saveUsers();

          await editSmsMsg(
            `⌛ *Tiempo agotado (5 min)*\n\nNo se recibió ningún código. La orden fue cancelada y tu crédito fue devuelto.`,
            [[{ text: '🏠  Inicio', callback_data: 'start' }]]
          );
        }

     } catch (err) {
       // 🔥 DEBUG: Loguear errores de 5sim con detalles completos
       console.error(`\n❌ [SMS Check ERROR] orderId=${orderId}`);
       console.error(`   Status HTTP: ${err.response?.status || err.code || 'N/A'}`);
       console.error(`   Mensaje: ${err.response?.data?.message || err.message}`);
       console.error(`   Data completa:`, JSON.stringify(err.response?.data || err, null, 2));
       // Error en el check — no cortar el intervalo, reintentar en el siguiente ciclo
     }
  }, 1000);
}

// =============================
// INICIO DEL BOT
// =============================
console.log('🐣 LittlePay Bot corriendo...');
console.log('📨 Sistema de notificaciones activado - Revisando cada 30 segundos');

// Iniciar el procesamiento de notificaciones cada 30 segundos
setInterval(processNotifications, 30000);

// Ejecutar la primera vez inmediatamente
processNotifications();

// .env
// TELEGRAM_TOKEN=TU_TOKEN
// FIVESIM_API=TU_API_KEY
// SUPABASE_URL=TU_SUPABASE_URL
// SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY