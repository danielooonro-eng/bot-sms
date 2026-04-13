// =====================================
// BOT TELEGRAM + 5SIM PRO FINAL (FIX PHONE + ADMIN) + SUPABASE
// =====================================

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// =====================================
// INICIALIZAR BOT Y SUPABASE
// =====================================
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

const API_KEY = process.env.FIVESIM_API;
const BASE_URL = 'https://5sim.net/v1/user';

// 🔥 TU ID FIJO
const ADMIN_ID = 8349475987;

// Ruta de la imagen de bienvenida
const WELCOME_IMAGE = path.join(__dirname, 'welcome.png');

// =====================================
// CONEXIÓN A SUPABASE
// =====================================
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Error: Faltan SUPABASE_URL o SUPABASE_ANON_KEY en .env');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// =====================================
// FUNCIONES DE BD
// =====================================

/**
 * Obtiene un usuario de la BD. Si no existe, lo crea.
 */
async function getUser(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', id)
    .single();

  // Usuario no existe, crear uno nuevo
  if (error && error.code === 'PGRST116') {
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          user_id: id,
          credits: 0,
          order_id: null,
          service: null,
          history: [],
          message_id: null,
          has_photo: false
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creando usuario:', createError);
      return null;
    }
    return newUser;
  }

  if (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }

  return data;
}

/**
 * Actualiza un usuario en la BD
 */
async function updateUser(id, updates) {
  const { error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', id);

  if (error) {
    console.error('Error actualizando usuario:', error);
  }
}

/**
 * Agrega un evento al historial del usuario
 */
async function addHistory(id, event) {
  const user = await getUser(id);
  if (!user) return;

  const newHistory = [...(user.history || []), event];
  await updateUser(id, { history: newHistory });
}

// =====================================
// SERVICIOS Y PRECIOS
// =====================================
const SERVICES = {
  amazon:     { emoji: '🛒', countries: ['usa'] },
  telegram:   { emoji: '✈️', countries: ['usa'] },
  whatsapp:   { emoji: '💬', countries: ['canada', 'indonesia'] },
  google:     { emoji: '🔍', countries: ['mexico', 'usa', 'indonesia'] },
  aliexpress: { emoji: '🛍️', countries: ['mexico', 'usa', 'canada'] },
  shein:      { emoji: '👗', countries: ['england', 'usa'] },
  uber:       { emoji: '🚗', countries: ['mexico', 'usa'] }
};

const PRICES = {
  amazon:     { usa: 8 },
  telegram:   { usa: 15 },
  whatsapp:   { canada: 12, indonesia: 10 },
  google:     { mexico: 8, usa: 10, indonesia: 6 },
  aliexpress: { mexico: 10, usa: 8, canada: 8 },
  shein:      { england: 10, usa: 8 },
  uber:       { mexico: 10, usa: 8 }
};

const COUNTRY_FLAGS = {
  usa:       '🇺🇸 USA',
  mexico:    '🇲🇽 México',
  canada:    '🇨🇦 Canadá',
  indonesia: '🇮🇩 Indonesia',
  england:   '🇬🇧 England'
};

const OPERATORS = {
  telegram:   { usa: 'virtual63' },
  aliexpress: { usa: 'virtual51' },
  shein:      { england: 'virtual60', usa: 'virtual8' },
  uber:       { usa: 'virtual63' }
};

// =============================
// LIMPIAR ÓRDENES AL ARRANCAR
// =============================
async function cancelPendingOrders() {
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .not('order_id', 'is', null);

  if (error) {
    console.error('Error consultando órdenes pendientes:', error);
    return;
  }

  let cancelled = 0;
  for (const user of users || []) {
    try {
      await axios.get(`${BASE_URL}/cancel/${user.order_id}`, {
        headers: { Authorization: `Bearer ${API_KEY}` }
      });
      user.credits++;
      await addHistory(user.user_id, '+1 crédito (cancelado al reiniciar bot)');
      await updateUser(user.user_id, { 
        credits: user.credits,
        order_id: null,
        message_id: null
      });
      console.log(`Orden ${user.order_id} del usuario ${user.user_id} cancelada`);
      cancelled++;
    } catch (err) {
      console.log(`No se pudo cancelar orden ${user.order_id} del usuario ${user.user_id}`);
    }
  }
  console.log(`Órdenes pendientes canceladas al arrancar: ${cancelled}`);
}

cancelPendingOrders();

// =============================
// COMANDO /start
// =============================
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await getUser(chatId);
  const firstName = msg.from.first_name || 'Usuario';

  const caption =
    `👋 ¡Hola, *${firstName}*! Bienvenido a *LittlePay* 🐣\n\n` +
    `💰 Créditos disponibles: *${user?.credits || 0}*\n\n` +
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
async function sendProfile(chatId) {
  const user = await getUser(chatId);
  if (!user) return;

  const historyText = user.history && user.history.length > 0
    ? user.history.slice(-5).map(h => `  ▸ ${h}`).join('\n')
    : '  _Sin movimientos aún_';

  const text =
    `👤 *Tu Perfil*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🆔 ID: \`${chatId}\`\n` +
    `💰 Créditos: *${user.credits}*\n` +
    `📦 Orden activa: ${user.order_id ? `\`${user.order_id}\`` : '_Ninguna_'}\n\n` +
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
// ADMIN: AGREGAR CRÉDITOS
// =============================
bot.onText(/\/addcredits (\d+) (\d+)/, async (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return;

  const userId = parseInt(match[1]);
  const amount = parseInt(match[2]);

  const user = await getUser(userId);
  if (!user) return;

  user.credits += amount;
  await updateUser(userId, { credits: user.credits });
  await addHistory(userId, `+${amount} créditos (admin)`);

  bot.sendMessage(msg.chat.id, `✅ *${amount} créditos* agregados al usuario \`${userId}\``, { parse_mode: 'Markdown' });
  bot.sendMessage(userId, `🎉 Recibiste *${amount} créditos* en LittlePay 🐣`, { parse_mode: 'Markdown' });
});

// =============================
// HELPERS PARA EDITAR MENSAJES
// =============================
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
  const user = await getUser(chatId);
  if (!user) return;

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
    const historyText = user.history && user.history.length > 0
      ? user.history.slice(-5).map(h => `  ▸ ${h}`).join('\n')
      : '  _Sin movimientos aún_';

    const text =
      `👤 *Tu Perfil*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🆔 ID: \`${chatId}\`\n` +
      `💰 Créditos: *${user.credits}*\n` +
      `📦 Orden activa: ${user.order_id ? `\`${user.order_id}\`` : '_Ninguna_'}\n\n` +
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
    await updateUser(chatId, { service });

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
    if (user.order_id) {
      return editMsg(query,
        `⚠️ *Ya tienes una orden en proceso*\n\nEspera a recibir el código o cancela la orden actual antes de comprar otro número.`,
        { inline_keyboard: [[{ text: '🏠  Inicio', callback_data: 'start' }]] }
      );
    }

    try {
      const operator = (OPERATORS[user.service]?.[country]) || 'any';
      const res = await axios.get(
        `${BASE_URL}/buy/activation/${country}/${operator}/${user.service}`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      );

      const order = res.data;
      const phone = order.phone || order.number || null;

      if (!phone) {
        return editMsg(query,
          `❌ No hay números disponibles para *${COUNTRY_FLAGS[country] || country}* en este momento.`,
          { inline_keyboard: [[{ text: '🔙  Volver', callback_data: 'buy' }]] }
        );
      }

      const price = (PRICES[user.service] || {})[country] || '?';
      const messageId = query.message.message_id;
      const hasPhoto = !!(query.message.photo || query.message.document);

      user.credits--;
      await updateUser(chatId, {
        order_id: order.id,
        message_id: messageId,
        has_photo: hasPhoto,
        credits: user.credits
      });
      await addHistory(chatId, `-1 crédito | ${user.service} (${country}) $${price}`);

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
      editMsg(query,
        `⚠️ *Error al obtener número*\n\n_${err.response?.data?.message || 'Servicio no disponible'}_`,
        { inline_keyboard: [[{ text: '🔙  Volver', callback_data: 'buy' }]] }
      );
    }
  }

  // ── CANCELAR ──
  if (data === 'cancel') {
    if (!user.order_id) return;

    try {
      await axios.get(`${BASE_URL}/cancel/${user.order_id}`, {
        headers: { Authorization: `Bearer ${API_KEY}` }
      });

      user.credits++;
      await updateUser(chatId, {
        credits: user.credits,
        order_id: null,
        message_id: null
      });
      await addHistory(chatId, '+1 crédito (cancelado)');

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
// EXTRAER CÓDIGO DEL SMS
// =============================
function extractCode(text) {
  if (!text) return null;
  const match = text.match(/\b(\d{4,8})\b/);
  return match ? match[1] : null;
}

// =============================
// ESPERAR SMS
// =============================
async function waitForSMS(chatId, orderId) {
  let attempts = 0;

  async function editSmsMsg(text, keyboard) {
    const user = await getUser(chatId);
    if (!user || !user.message_id) return;

    const opts = {
      chat_id: chatId,
      message_id: user.message_id,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    };

    try {
      if (user.has_photo) {
        await bot.editMessageCaption(text, opts);
      } else {
        await bot.editMessageText(text, opts);
      }
    } catch (e) {
      // Mensaje borrado o ya editado — ignorar
    }
  }

  const interval = setInterval(async () => {
    const user = await getUser(chatId);
    if (!user) return;

    // Si la orden fue cancelada, detener
    if (!user.order_id) {
      clearInterval(interval);
      return;
    }

    try {
      const res = await axios.get(`${BASE_URL}/check/${orderId}`, {
        headers: { Authorization: `Bearer ${API_KEY}` }
      });

      const data = res.data;
      console.log(`[SMS Check] orderId=${orderId} status=${data.status} sms=${JSON.stringify(data.sms)}`);

      if (data.sms && data.sms.length > 0) {
        const sms = data.sms[0];
        const code = sms.code || extractCode(sms.text) || sms.text || 'No detectado';
        console.log(`[SMS] Código extraído: ${code} | raw:`, sms);

        await addHistory(chatId, `Código: ${code}`);
        await updateUser(chatId, {
          order_id: null,
          message_id: null
        });
        clearInterval(interval);

        await editSmsMsg(
          `🎉 *¡Código recibido!*\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `🔐 Código: \`${code}\``,
          [[{ text: '🏠  Inicio', callback_data: 'start' }]]
        );
        return;
      }

      attempts++;

      // Timeout: 20 minutos (240 intentos x 5 seg)
      if (attempts >= 240) {
        clearInterval(interval);

        try {
          await axios.get(`${BASE_URL}/cancel/${orderId}`, {
            headers: { Authorization: `Bearer ${API_KEY}` }
          });
          user.credits++;
          await updateUser(chatId, { credits: user.credits });
          await addHistory(chatId, '+1 crédito (timeout 20min)');
        } catch { /* si falla la cancelación */ }

        await updateUser(chatId, {
          order_id: null,
          message_id: null
        });

        await editSmsMsg(
          `⌛ *Tiempo agotado (20 min)*\n\nNo se recibió ningún código. La orden fue cancelada y tu crédito fue devuelto.`,
          [[{ text: '🏠  Inicio', callback_data: 'start' }]]
        );
      }

    } catch (err) {
      console.log(`[SMS Check ERROR] orderId=${orderId}`, err?.response?.data || err.message);
    }
  }, 5000);
}

console.log('🐣 LittlePay Bot corriendo con Supabase...');
