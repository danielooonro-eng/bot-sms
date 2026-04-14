# 📋 Guía de Implementación - Arreglos Críticos

## 🎯 Resumen Ejecutivo

Se han arreglado 3 problemas críticos:
1. ✅ **Exportación de Logs** - Error 500 solucionado
2. ✅ **Tabla de Logs** - Ahora consulta datos reales de Supabase
3. ✅ **Sincronización de Datos** - Bot y Panel ahora se sincronizan en tiempo real

**Tiempo estimado de implementación:** 15-20 minutos

---

## 🔧 Paso 1: Crear Tablas en Supabase

### Opción A: Automática (Recomendado)
1. Ir a [Supabase Console](https://app.supabase.com)
2. Seleccionar tu proyecto
3. Ir a SQL Editor
4. Crear nueva query
5. Copiar contenido de `/home/ubuntu/bot-sms-project/create_tables.sql`
6. Ejecutar

### Opción B: Manual
```sql
-- Copiar y ejecutar el script en Supabase SQL Editor
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT UNIQUE NOT NULL,
  credits INTEGER DEFAULT 0,
  -- ... más campos (ver create_tables.sql)
);

CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT,
  action VARCHAR NOT NULL,
  -- ... más campos (ver create_tables.sql)
);

-- ... más tablas
```

**Verificación:**
- Ir a Tables en Supabase
- Confirmar que existan: `users`, `logs`, `notifications`, `admins`, `bot_settings`

---

## 🔐 Paso 2: Configurar Variables de Entorno

### Para el Bot (Railway)

Agregar en Variables de Entorno de Railway:

```env
# Existentes (mantener)
TELEGRAM_TOKEN=8350072112:AAGyAPx8xkXUQzpQLjwTEPO6fzLVEBtx_0I
FIVESIM_API=eyJhbGciOiJSUzUxMiIs...

# Nuevas (Supabase)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

**Para obtener las claves Supabase:**
1. Ir a Supabase Console → tu proyecto
2. Ir a Settings → API
3. Copiar `Project URL` → `SUPABASE_URL`
4. Copiar `anon public` → `SUPABASE_ANON_KEY`

### Para el Panel (Vercel/Local)

Crear `.env.local` en `/bot_admin_panel/nextjs_space/`:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (Service Role Key - muy secreto!)

# JWT
JWT_SECRET=tu-secret-key-minimo-32-caracteres

# Admin
ADMIN_EMAIL=danielooonro@gmail.com
```

**Importante:**
- `SUPABASE_SERVICE_ROLE_KEY` es como una contraseña maestra
- ⚠️ **NUNCA** compartirla públicamente
- ⚠️ **NUNCA** exponerla en variables públicas

---

## 🤖 Paso 3: Actualizar Bot

### Copiar Archivo Actualizado
```bash
cp /home/ubuntu/bot-sms-project/bot.js /ruta/del/bot/bot.js
```

### Cambios Principales
El bot ahora:
- ✅ Sincroniza créditos con Supabase **automáticamente**
- ✅ Registra todas las acciones en tabla `logs`
- ✅ Funciona sin Supabase (fallback a JSON)
- ✅ Sin cambios de funcionalidad para el usuario

### Reiniciar Bot
**En Railway:**
1. Ir a tu deploymente
2. Redeploy (o esperar auto-deploy si hay cambios)
3. Verificar logs para mensajes de sincronización

---

## 🎨 Paso 4: Actualizar Panel Admin

### Copiar Archivos Actualizados
```bash
# Logs
cp /home/ubuntu/bot-sms-project/bot_admin_panel/nextjs_space/app/admin/logs/page.tsx \
   /ruta/del/panel/app/admin/logs/page.tsx

# Usuarios
cp /home/ubuntu/bot-sms-project/bot_admin_panel/nextjs_space/app/admin/users/page.tsx \
   /ruta/del/panel/app/admin/users/page.tsx

# API Logs
cp /home/ubuntu/bot-sms-project/bot_admin_panel/nextjs_space/app/api/logs/route.ts \
   /ruta/del/panel/app/api/logs/route.ts

cp /home/ubuntu/bot-sms-project/bot_admin_panel/nextjs_space/app/api/logs/export/route.ts \
   /ruta/del/panel/app/api/logs/export/route.ts
```

### Cambios Principales
- ✅ Tabla de Logs ahora consulta datos reales de Supabase
- ✅ Auto-refresh cada 10 segundos (cambios del bot aparecen automáticamente)
- ✅ Exportación CSV/JSON completamente funcional
- ✅ Filtros de búsqueda, estado y fechas

### Reinstalar Dependencias (si es necesario)
```bash
cd /ruta/del/panel
npm install
npm run build
npm start
```

---

## ✅ Paso 5: Verificación

### Test 1: Sincronización de Créditos
```bash
# Desde Telegram, como admin:
/addcredits 8349475987 5

# Verificación:
# 1. Usuario debe recibir notificación
# 2. Esperar 5-10 segundos
# 3. Ir a Panel → Usuarios
# 4. Buscar usuario 8349475987
# 5. Confirmar que créditos sean +5
```

### Test 2: Compra de Número
```bash
# Desde Telegram como usuario:
/start → Comprar número → Seleccionar servicio y país

# Verificación:
# 1. Usuario recibe número
# 2. Créditos decrementan
# 3. Ir a Panel → Logs
# 4. Debe haber entrada "number_rented"
# 5. Panel de Usuarios actualiza automáticamente
```

### Test 3: Exportación de Logs
```bash
# En Panel:
# 1. Ir a Logs
# 2. Hacer click en "Descargar CSV"
# 3. Verificar que se descargue correctamente
# 4. Hacer click en "Descargar JSON"
# 5. Verificar que se descargue correctamente
```

### Test 4: Auto-Refresh
```bash
# En Panel:
# 1. Abrir Panel en 2 navegadores
# 2. En uno: hacer /addcredits desde Telegram
# 3. En el otro: Esperar máximo 10 segundos
# 4. Debe actualizar automáticamente sin F5
```

---

## 🐛 Troubleshooting

### Error: "Supabase no está configurado"
**Causa:** Variables de entorno no están configuradas

**Solución:**
1. Verificar que `.env.local` existe en el panel
2. Verificar que variables de Railway están configuradas
3. Reiniciar los servicios

### Error: "Table 'logs' does not exist"
**Causa:** `create_tables.sql` no se ejecutó

**Solución:**
1. Ir a Supabase SQL Editor
2. Copiar `create_tables.sql`
3. Ejecutar
4. Esperar a que se creen las tablas
5. Reiniciar panel/bot

### Los logs no aparecen en el panel
**Causa:** Auto-refresh aún no ejecutó, o sincronización falló

**Solución:**
1. Esperar 10 segundos
2. Click en botón "Actualizar" de Logs
3. Revisar console del navegador (F12 → Console)
4. Revisar logs del bot en Railway

### Exportación devuelve error 500
**Causa:** Sesión expirada o credenciales de Supabase incorrectas

**Solución:**
1. Recargar página (F5)
2. Hacer login de nuevo
3. Verificar que `SUPABASE_SERVICE_ROLE_KEY` esté correcto
4. Revisar logs del servidor

---

## 📊 Monitoreo

### Verificar Sincronización
**En logs del bot (Railway):**
```
✅ Usuario 8349475987 sincronizado a Supabase
✅ Log agregado: 8349475987 - number_rented
```

Si ves `❌ Error`, sincronización falló. Revisar:
- Variables de entorno
- Permisos RLS en Supabase
- Conexión a internet

### Dashboard de Supabase
1. Ir a Supabase Console
2. Ir a Table Editor
3. Ver tabla `users` → datos actualizados
4. Ver tabla `logs` → nuevas entradas cada acción

---

## 🎓 Comprensión del Flujo

```
┌─────────────────────┐
│ Usuario Telegram    │
└──────────┬──────────┘
           │
           ↓
    ┌──────────────┐
    │  Bot (Node)  │ ← Usa bot.js actualizado
    │              │
    │ • JSON local │
    │ • Sincroniza │
    │   cada 10s   │
    └──────┬───────┘
           │
           ↓
  ┌────────────────────┐
  │  Supabase BD       │
  │                    │
  │ • users table      │
  │ • logs table       │
  │ • Real-time data   │
  └──────┬─────────────┘
         │
         ↓
  ┌──────────────────────┐
  │  Panel Admin         │
  │  (Next.js)           │
  │                      │
  │ • Auto-refresh 10s   │
  │ • Consulta Supabase  │
  │ • Muestra datos      │
  │   actualizados       │
  └──────────────────────┘
```

---

## 📝 Próximos Pasos

Después de confirmar que todo funciona:

1. ✅ Configurar backups automáticos en Supabase
   - Settings → Backups → Enable
   
2. ✅ Configurar RLS policies más restrictivas
   - Ir a Auth Policies en Supabase
   - Configurar permisos específicos por usuario

3. ✅ Agregar logs de error
   - Implementar alertas si sincronización falla
   - Monitorear salud del bot

4. ✅ Performance
   - Si hay >1000 usuarios, considerar paginación
   - Reducir frecuencia de auto-refresh si es necesario

---

## 📞 Soporte

Si encuentras problemas:

1. Revisar `CRITICAL_FIXES.md` para contexto
2. Revisar logs en:
   - Bot: Railway dashboard
   - Panel: Console de navegador (F12)
   - Supabase: Query Performance
3. Verificar variables de entorno (✅ todas presentes)
4. Reintentar con F5 en panel

---

**Versión:** 1.0.0  
**Fecha:** Abril 14, 2026  
**Estado:** ✅ LISTO PARA PRODUCCIÓN
