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

// Inicializar
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🐣 LittlePay Bot corriendo con Supabase...');

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Obtener usuario de Supabase
 */
async function getUser(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
}

/**
 * Registrar nuevo usuario
 */
async function registerUser(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          user_id: userId,
          credits: 0,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    console.log(`👤 Nuevo usuario registrado: ${userId}`);
    return data;
  } catch (error) {
    console.error('Error registrando usuario:', error);
    return null;
  }
}

/**
 * Obtener todos los usuarios para notificaciones
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
    const { data, error } = await supabase
      .from('notifications')
      .update({
        sent: true,
        sent_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select();

    if (error) {
      console.error(`❌ Error marcando notificación ${notificationId}:`, error);
      return false;
    }

    console.log(`✅ Notificación ${notificationId} marcada como enviada`);
    return true;
  } catch (error) {
    console.error('Error en markNotificationAsSent:', error);
    return false;
  }
}

/**
 * Enviar notificación a usuario
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

        // Pausa para no saturar Telegram
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // Marcar como enviada DESPUÉS de enviar a todos
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
  const firstName = msg.from.first_name || 'Usuario';

  try {
    // Registrar o obtener usuario
    let user = await getUser(userId);
    if (!user) {
      user = await registerUser(userId);
    }

    const message = `
🎉 *¡Bienvenido a LittlePay, ${firstName}!*

Soy tu bot asistente para comprar números de teléfono y recibir SMS de forma rápida y segura.

💰 *Tu saldo actual:* $${user?.credits || 0}

¿Qué quieres hacer?
    `;

    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📱 Comprar Número', callback_data: 'buy_number' },
            { text: '💰 Ver Saldo', callback_data: 'check_balance' },
          ],
          [
            { text: '📜 Historial', callback_data: 'view_history' },
            { text: '❓ Ayuda', callback_data: 'help' },
          ],
        ],
      },
      parse_mode: 'Markdown',
    };

    await bot.sendMessage(chatId, message, options);
  } catch (error) {
    console.error('Error en /start:', error);
    await bot.sendMessage(
      chatId,
      '❌ Hubo un error. Por favor, intenta más tarde.'
    );
  }
});

bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    let user = await getUser(userId);
    if (!user) {
      user = await registerUser(userId);
    }

    const message = `
💰 *Tu Saldo*

Balance disponible: *$${user?.credits || 0}*

¿Quieres comprar más créditos?
    `;

    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ Comprar Créditos', callback_data: 'buy_credits' }],
          [{ text: '🔙 Volver al Menú', callback_data: 'back_menu' }],
        ],
      },
      parse_mode: 'Markdown',
    };

    await bot.sendMessage(chatId, message, options);
  } catch (error) {
    console.error('Error en /balance:', error);
    await bot.sendMessage(chatId, '❌ Error al obtener tu saldo.');
  }
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  const message = `
❓ *Ayuda - LittlePay*

*📚 Guía de uso:*

1️⃣ *Comprar Número*
   Selecciona el país y servicio que necesitas

2️⃣ *Recibir SMS*
   El código llegará directamente a tu bot

3️⃣ *Ver Historial*
   Consulta todos tus números y mensajes

4️⃣ *Soporte*
   Si tienes problemas, contacta al administrador

*Comandos disponibles:*
/start - Menú principal
/balance - Ver saldo
/help - Esta ayuda
    `;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Volver al Menú', callback_data: 'back_menu' }],
      ],
    },
    parse_mode: 'Markdown',
  };

  await bot.sendMessage(chatId, message, options);
});

// ==================== BOTONES INLINE ====================

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const action = query.data;

  try {
    switch (action) {
      case 'check_balance': {
        const user = await getUser(userId);
        const message = `
💰 *Tu Saldo Actual*

Balance: *$${user?.credits || 0}*
Teléfonos activos: *${0}*

¿Quieres hacer algo más?
        `;

        const options = {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📱 Comprar Número', callback_data: 'buy_number' }],
              [{ text: '🔙 Volver', callback_data: 'back_menu' }],
            ],
          },
          parse_mode: 'Markdown',
        };

        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: query.message.message_id,
          ...options,
        });
        break;
      }

      case 'buy_number': {
        const message = `
📱 *Comprar Número*

Selecciona el país:
        `;

        const options = {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🇲🇽 México', callback_data: 'country_mx' },
                { text: '🇺🇸 USA', callback_data: 'country_us' },
              ],
              [
                { text: '🇪🇸 España', callback_data: 'country_es' },
                { text: '🇦🇷 Argentina', callback_data: 'country_ar' },
              ],
              [{ text: '🔙 Volver', callback_data: 'back_menu' }],
            ],
          },
          parse_mode: 'Markdown',
        };

        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: query.message.message_id,
          ...options,
        });
        break;
      }

      case 'view_history': {
        const message = `
📜 *Tu Historial*

No tienes números activos aún.

Compra tu primer número para empezar.
        `;

        const options = {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📱 Comprar Número', callback_data: 'buy_number' }],
              [{ text: '🔙 Volver', callback_data: 'back_menu' }],
            ],
          },
          parse_mode: 'Markdown',
        };

        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: query.message.message_id,
          ...options,
        });
        break;
      }

      case 'help': {
        const message = `
❓ *Ayuda y Soporte*

*Preguntas frecuentes:*

🔸 ¿Cómo compro un número?
   Ve a Comprar Número y selecciona el país

🔸 ¿Cuánto cuesta?
   Desde $1 USD por número

🔸 ¿Los números son reutilizables?
   No, cada número es de un solo uso

¿Necesitas más ayuda?
Contacta al administrador.
        `;

        const options = {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Volver', callback_data: 'back_menu' }],
            ],
          },
          parse_mode: 'Markdown',
        };

        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: query.message.message_id,
          ...options,
        });
        break;
      }

      case 'back_menu': {
        const user = await getUser(userId);
        const message = `
🎉 *Menú Principal*

💰 *Tu saldo:* $${user?.credits || 0}

¿Qué quieres hacer?
        `;

        const options = {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📱 Comprar', callback_data: 'buy_number' },
                { text: '💰 Saldo', callback_data: 'check_balance' },
              ],
              [
                { text: '📜 Historial', callback_data: 'view_history' },
                { text: '❓ Ayuda', callback_data: 'help' },
              ],
            ],
          },
          parse_mode: 'Markdown',
        };

        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: query.message.message_id,
          ...options,
        });
        break;
      }

      default:
        // Responder otros botones
        await bot.answerCallbackQuery(query.id, {
          text: '⏳ Función en desarrollo...',
          show_alert: false,
        });
    }

    // Responder callback
    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Error en callback_query:', error);
    await bot.answerCallbackQuery(query.id, {
      text: '❌ Error al procesar tu solicitud',
      show_alert: true,
    });
  }
});

// ==================== MANEJO DE ERRORES ====================

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