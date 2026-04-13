const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

// ==================== CONFIGURACIÓN ====================
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const FIVESIM_API = process.env.FIVESIM_API;

// Validar variables de entorno
if (!TELEGRAM_TOKEN) throw new Error('❌ Error: Faltan TELEGRAM_TOKEN en .env');
if (!SUPABASE_URL) throw new Error('❌ Error: Falta SUPABASE_URL en .env');
if (!SUPABASE_ANON_KEY) throw new Error('❌ Error: Falta SUPABASE_ANON_KEY en .env');

// Inicializar bot y Supabase
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🐣 LittlePay Bot corriendo con Supabase...');

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Obtener todos los usuarios de Supabase
 */
async function getAllUsers(onlyWithCredits = false) {
  try {
    let query = supabase.from('users').select('*');

    if (onlyWithCredits) {
      query = query.gt('credits', 0);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return [];
  }
}

/**
 * Obtener notificaciones no enviadas
 */
async function getUnsentNotifications() {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('sent', false)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return [];
  }
}

/**
 * Marcar notificación como enviada
 */
async function markNotificationAsSent(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        sent: true,
        sent_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marcando notificación como enviada:', error);
    return false;
  }
}

/**
 * Enviar notificación a un usuario
 */
async function sendNotificationToUser(userId, title, message, type = 'info') {
  try {
    const typeEmojis = {
      info: 'ℹ️',
      warning: '⚠️',
      success: '✅',
      error: '❌',
    };

    const emoji = typeEmojis[type] || 'ℹ️';
    const fullMessage = `${emoji} *${title}*\n\n${message}`;

    await bot.sendMessage(userId, fullMessage, { parse_mode: 'Markdown' });
    console.log(`✅ Notificación enviada a usuario ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error enviando notificación a ${userId}:`, error.message);
    return false;
  }
}

/**
 * Procesar y enviar notificaciones pendientes
 */
async function processNotifications() {
  try {
    const notifications = await getUnsentNotifications();

    if (notifications.length === 0) {
      return;
    }

    console.log(`📬 Procesando ${notifications.length} notificación(es) pendiente(s)...`);

    for (const notification of notifications) {
      // Determinar si filtrar por créditos
      const onlyWithCredits = notification.recipient_type === 'users';
      const users = await getAllUsers(onlyWithCredits);

      if (users.length === 0) {
        console.log(`⚠️ No hay usuarios para notificación ID ${notification.id}`);
        await markNotificationAsSent(notification.id);
        continue;
      }

      let sentCount = 0;

      // Enviar a cada usuario
      for (const user of users) {
        const success = await sendNotificationToUser(
          user.user_id,
          notification.title,
          notification.message,
          notification.type
        );

        if (success) sentCount++;

        // Pequeña pausa para no saturar Telegram
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Marcar como enviada
      await markNotificationAsSent(notification.id);
      console.log(`✅ Notificación ID ${notification.id} enviada a ${sentCount}/${users.length} usuarios`);
    }
  } catch (error) {
    console.error('Error procesando notificaciones:', error);
  }
}

// ==================== COMANDOS DEL BOT ====================

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Registrar usuario en Supabase
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!existingUser) {
      await supabase.from('users').insert([
        {
          user_id: userId,
          credits: 0,
          created_at: new Date().toISOString(),
        },
      ]);
      console.log(`👤 Nuevo usuario registrado: ${userId}`);
    }

    const message = `
🎉 *¡Bienvenido a LittlePay!*

Soy un bot que te ayuda a comprar números de teléfono para recibir SMS.

*Comandos disponibles:*
/buy - Comprar un número
/balance - Ver tu saldo
/help - Ayuda
    `;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error en /start:', error);
    await bot.sendMessage(chatId, '❌ Hubo un error. Intenta más tarde.');
  }
});

bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const { data: user } = await supabase
      .from('users')
      .select('credits')
      .eq('user_id', userId)
      .single();

    const credits = user?.credits || 0;
    await bot.sendMessage(
      chatId,
      `💰 *Tu saldo:* $${credits}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error en /balance:', error);
    await bot.sendMessage(chatId, '❌ Error al obtener tu saldo.');
  }
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  const message = `
*📞 LittlePay Bot - Ayuda*

*Comandos:*
/start - Inicia el bot
/balance - Ver tu saldo
/buy - Comprar número
/history - Ver tu historial

¿Necesitas más ayuda? Contacta al administrador.
  `;

  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Manejo de errores
bot.on('polling_error', (error) => {
  console.error('error:', error);
});

bot.on('error', (error) => {
  console.error('error:', error);
});

// ==================== TAREA DE NOTIFICACIONES ====================

// Procesar notificaciones cada 30 segundos
setInterval(processNotifications, 30000);

// Procesar una vez al iniciar
processNotifications();

console.log('✅ Sistema de notificaciones iniciado (cada 30 segundos)');