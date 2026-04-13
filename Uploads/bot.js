// =====================================
// BOT TELEGRAM + 5SIM PRO FINAL (FIX PHONE + ADMIN)
// =====================================

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

const API_KEY = process.env.FIVESIM_API;
const BASE_URL = 'https://5sim.net/v1/user';

// 🔥 TU ID FIJO
const ADMIN_ID = 8349475987;

// Ruta de la imagen de bienvenida (colócala junto al bot.js con el nombre welcome.png)
const WELCOME_IMAGE = path.join(__dirname, 'welcome.png');

// =============================
// PERSISTENCIA EN ARCHIVO JSON
// =============================
const DB_PATH = path.join(__dirname, 'users.json');

function loadUsers() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const obj = JSON.parse(raw);
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

const users = loadUsers();

// Limpiar órdenes activas al arrancar (por si el bot se apagó con una en curso)
async function cancelPendingOrders() {
  let cancelled = 0;
  for (const [id, user] of users.entries()) {
    if (user.orderId) {
      try {
        await axios.get(`${BASE_URL}/cancel/${user.orderId}`, {
          headers: { Authorization: `Bearer ${process.env.FIVESIM_API}` }
        });
        user.credits++;
        user.history.push('+1 crédito (cancelado al reiniciar bot)');
        console.log(`Orden ${user.orderId} del usuario ${id} cancelada`);
        cancelled++;
      } catch {
        console.log(`No se pudo cancelar orden ${user.orderId} del usuario ${id} en 5sim`);
      }
      user.orderId = null;
      user.messageId = null;
    }
  }
  if (cancelled > 0) saveUsers();
  console.log(`Ordenes pendientes canceladas al arrancar: ${cancelled}`);
}

cancelPendingOrders();

function getUser(id) {
  if (!users.has(id)) {
    users.set(id, {
      credits: 0,
      orderId: null,
      history: [],
      service: null
    });
    saveUsers();
  }
  return users.get(id);
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

  const user = getUser(userId);
  user.credits += amount;
  user.history.push(`+${amount} créditos (admin)`);
  saveUsers();

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
      user.orderId = order.id;
      user.messageId = query.message.message_id;
      user.hasPhoto = !!(query.message.photo || query.message.document);
      user.credits--;
      user.history.push(`-1 crédito | ${user.service} (${country}) $${price}`);
      saveUsers();

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
    if (!user.orderId) return;

    try {
      await axios.get(`${BASE_URL}/cancel/${user.orderId}`, {
        headers: { Authorization: `Bearer ${API_KEY}` }
      });

      user.credits++;
      user.history.push('+1 crédito (cancelado)');
      user.orderId = null;
      saveUsers();

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
    if (!user.messageId) return;

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
    } catch (e) {
      // Mensaje borrado o ya editado — ignorar silenciosamente
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
      const res = await axios.get(`${BASE_URL}/check/${orderId}`, {
        headers: { Authorization: `Bearer ${API_KEY}` }
      });

      const data = res.data;

      // LOG para depuración — ver qué devuelve 5sim
      console.log(`[SMS Check] orderId=${orderId} status=${data.status} sms=${JSON.stringify(data.sms)}`);

      if (data.sms && data.sms.length > 0) {
        const sms = data.sms[0];
        // 5sim puede devolver el código en .code o dentro del texto en .text
        const code = sms.code || extractCode(sms.text) || sms.text || 'No detectado';
        console.log(`[SMS] Código extraído: ${code} | raw:`, sms);

        user.history.push(`Código: ${code}`);
        user.orderId = null;
        user.messageId = null;
        saveUsers();
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
          user.history.push('+1 crédito (timeout 20min)');
        } catch { /* si falla la cancelación en 5sim, no devolver crédito */ }

        user.orderId = null;
        user.messageId = null;
        saveUsers();

        await editSmsMsg(
          `⌛ *Tiempo agotado (20 min)*\n\nNo se recibió ningún código. La orden fue cancelada y tu crédito fue devuelto.`,
          [[{ text: '🏠  Inicio', callback_data: 'start' }]]
        );
      }

    } catch (err) {
      // Error en el check — no cortar el intervalo, reintentar en el siguiente ciclo
      console.log(`[SMS Check ERROR] orderId=${orderId}`, err?.response?.data || err.message);
    }
  }, 5000);
}

console.log('🐣 LittlePay Bot corriendo...');

// .env
// TELEGRAM_TOKEN=TU_TOKEN
// FIVESIM_API=TU_API_KEY