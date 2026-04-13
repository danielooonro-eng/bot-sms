# 🐣 LittlePay Bot - Migración a Supabase

Este proyecto contiene la migración exitosa del bot de Telegram **LittlePay** de almacenamiento JSON local a **Supabase PostgreSQL**.

## 📦 Archivos del Proyecto

### Archivos Principales
- **`bot.js`** - Bot de Telegram con integración Supabase (migrado)
- **`migracion.js`** - Script para migrar datos de users.json a Supabase
- **`package.json`** - Dependencias actualizadas (incluye @supabase/supabase-js)
- **`.env`** - Variables de entorno (Telegram, 5Sim, Supabase)
- **`welcome.png`** - Imagen de bienvenida del bot
- **`SETUP.md`** - Guía completa de configuración de Supabase (⭐ LEER PRIMERO)
- **`README.md`** - Este archivo

## 🚀 Inicio Rápido

1. **Leer SETUP.md** → Instrucciones detalladas para configurar Supabase
2. **Crear tabla en Supabase** → Ejecutar script SQL proporcionado
3. **Instalar dependencias** → `npm install`
4. **Migrar datos** → `npm run migrate` (si tienes users.json antiguo)
5. **Ejecutar bot** → `npm start`

## ✨ Cambios Principales

### ✅ Lo que cambió
| Aspecto | Antes | Ahora |
|--------|-------|-------|
| **Almacenamiento** | Archivo JSON local | Base de datos Supabase |
| **Persistencia** | Sistema de archivos | PostgreSQL en la nube |
| **Escalabilidad** | Limitada a un servidor | Escalable a miles de usuarios |
| **Acceso** | Solo local | Acceso remoto desde cualquier lugar |
| **Dependencia** | Lectura/escritura a disco | API REST/realtime de Supabase |

### ❌ Lo que NO cambió
- ✓ Toda la lógica del bot permanece igual
- ✓ Mismo flujo de usuario
- ✓ Mismos servicios y precios
- ✓ Misma funcionalidad de admin
- ✓ Sistema de SMS y órdenes idéntico

## 📊 Estructura de Datos

### Tabla `users` en Supabase
```
users
├── id (PRIMARY KEY)
├── user_id (UNIQUE) ← ID de Telegram
├── credits (INT) ← Créditos disponibles
├── order_id (TEXT) ← ID de orden activa
├── service (VARCHAR) ← Servicio seleccionado
├── history (TEXT[]) ← Array de eventos
├── message_id (BIGINT) ← Para editar mensajes
├── has_photo (BOOLEAN) ← Si tiene foto
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## 🔄 Flujo de Migración

```
users.json (archivo local)
    ↓
migracion.js (lee y transforma)
    ↓
Supabase API (conecta con credentials)
    ↓
Table users (inserta/actualiza registros)
```

## 📝 Funciones Principales

### En `bot.js`

#### Nuevas funciones asincrónicas (Supabase):
```javascript
// Obtener usuario (crea si no existe)
await getUser(userId)

// Actualizar usuario
await updateUser(userId, { credits: 10, ... })

// Agregar evento al historial
await addHistory(userId, "evento")
```

#### Funciones sin cambios:
- Comandos de bot (`/start`, `/perfil`, `/addcredits`)
- Lógica de compra y cancelación
- Integración con 5sim API
- Sistema de SMS y espera de códigos

## 🛠️ Instalación Completa

```bash
# 1. Clonar o descargar el proyecto
cd /home/ubuntu

# 2. Instalar dependencias
npm install

# 3. Crear tabla en Supabase (ver SETUP.md)
# (Ejecutar script SQL en Supabase console)

# 4. Configurar .env con credenciales Supabase
# (Editar SUPABASE_URL, SUPABASE_ANON_KEY, etc)

# 5. Migrar datos (si tienes users.json antiguo)
npm run migrate

# 6. Ejecutar bot
npm start
```

## 🔐 Seguridad

### Consideraciones importantes:
1. **Mantén `.env` seguro** - No compartas estos archivos
2. **SERVICE_ROLE_KEY solo para migraciones** - Usa ANON_KEY en producción
3. **Row Level Security** - Configura políticas de acceso en Supabase
4. **Variables de entorno** - Usa secrets en plataformas de hosting

## 📊 Monitoreo

### Verificar datos en Supabase:
1. Ve a Dashboard de Supabase
2. Selecciona "Table Editor"
3. Abre tabla "users"
4. Visualiza todos los registros

### Logs del bot:
El bot imprime logs útiles:
```
✅ Orden cancelada
❌ Error al obtener número
[SMS Check] orderId=123 status=received
```

## 🐛 Solución de Problemas

### Error: "Cannot connect to Supabase"
→ Verifica SUPABASE_URL y SUPABASE_ANON_KEY en .env

### Error: "Table 'users' not found"
→ Ejecuta el script SQL para crear la tabla (ver SETUP.md)

### Migracion no funciona
→ Verifica que users.json exista y esté en el mismo directorio

### Bot no responde
→ Comprueba que TELEGRAM_TOKEN sea válido en .env

## 📚 Referencias

- **Supabase Docs**: https://supabase.com/docs
- **Node.js Telegram Bot**: https://github.com/yagop/node-telegram-bot-api
- **5sim API**: https://5sim.net/en/api/documentation
- **Guía SETUP**: Ver `SETUP.md` (guía completa de 6 pasos)

## ✅ Verificación Post-Instalación

Después de instalar, verifica que:
- [ ] `npm install` ejecutó sin errores
- [ ] `.env` tiene todas las variables de Supabase
- [ ] Tabla `users` existe en Supabase
- [ ] `npm run migrate` completó exitosamente (si aplica)
- [ ] `npm start` muestra: "🐣 LittlePay Bot corriendo con Supabase..."
- [ ] Puedes enviar `/start` al bot en Telegram

## 🎯 Próximos Pasos

1. **Configurar Supabase** (5 minutos) → Sigue SETUP.md
2. **Instalar dependencias** (2 minutos) → `npm install`
3. **Ejecutar migraciones** (1 minuto) → `npm run migrate`
4. **Probar bot** → Envía `/start` en Telegram
5. **Monitorear** → Revisa logs y datos en Supabase

---

**¡Migración completada exitosamente! 🎉** Tu bot ahora usa Supabase PostgreSQL en la nube.
